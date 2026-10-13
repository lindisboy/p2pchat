# Briar and mobile platform feasibility

Research date: 12 October 2026. This is a source review for planning, not a runtime test or security audit.

## Recommendation

Start with Android. Use Briar's separation of transport, synchronization, and application policy as an architectural reference. Validate three separate capabilities before choosing how much Briar code to reuse: nearby contact messaging, forwarding encrypted envelopes through strangers who have opted in, and publishing explicitly public messages through an internet gateway. Briar establishes the first capability; the second and third require their own design and validation.

An installation is not an available relay. A participating phone needs consent, enabled radios, sufficient storage and power, OS permission, and a working app process. No route exists when the participating network is partitioned; messages must remain queued with an honest delivery status.

## Evidence snapshots

The following read-only reference checkouts are outside the p2pchat repository:

| Repository | Commit | Local directory |
| --- | --- | --- |
| [Briar source](https://code.briarproject.org/briar/briar) | `d03d6fcd776349ec6c8b7d22035e9bb04aa1787c` | `<reference-root>/briar` |
| [Briar specifications](https://code.briarproject.org/briar/briar-spec) | `623b8b29b491cca8e7eb109c4738b68d6bd0b28d` | `<reference-root>/briar-spec` |

Source paths below are relative to these checkouts. Version pinning matters: the inspected messaging specification is simpler than the present app, so implementation and tests must settle production behavior.

## Protocols and the relay boundary

[BSP](https://code.briarproject.org/briar/briar-spec/-/blob/623b8b29b491cca8e7eb109c4738b68d6bd0b28d/protocols/BSP.md) organizes immutable messages into group-scoped graphs. Devices synchronize groups they share with peers; each application client decides validity, sharing, and deletion. A group member need not be a direct peer of every other member. This supports delayed propagation along an eligible sharing graph. It does not imply that any nearby installation carries every message. The inspected version limits each message body to 32 KiB, so a video archive would require a separate chunking and retention design.

[BTP version 4](https://code.briarproject.org/briar/briar-spec/-/blob/623b8b29b491cca8e7eb109c4738b68d6bd0b28d/protocols/BTP.md) supplies authenticated, encrypted peer streams with forward secrecy over heterogeneous transports. Its specification explicitly excludes anonymity, unlinkability, and unobservability. Peer traffic can use Tor as an underlying transport. In particular, encryption does not hide nearby radio activity or protect plaintext on a compromised phone.

The [Messaging Client](https://code.briarproject.org/briar/briar-spec/-/blob/623b8b29b491cca8e7eb109c4738b68d6bd0b28d/clients/Messaging-Client.md) has one group for each contact pair. The [Forum Client](https://code.briarproject.org/briar/briar-spec/-/blob/623b8b29b491cca8e7eb109c4738b68d6bd0b28d/clients/Forum-Client.md) propagates posts within shared forums and authenticates authors with signatures. A forum recipient can read a post. Transport encryption between participants is not equivalent to an opaque end-to-end encrypted envelope carried by an untrusted stranger.

Consequently, extending the network to stranger relays changes Briar's trust and abuse assumptions. Specify recipient encryption above relay transport, bounded envelope sizes, duplicate suppression, expiry, congestion control, retry limits, and storage quotas. Public broadcasts need explicit publication scope and gateway authorization; arrival at an online phone must never make a private conversation public. Rate limits must resist identity churn rather than assuming one installed app equals one person. These are proposed requirements, not capabilities verified in either app.

Briar's [overview](https://briarproject.org/how-it-works/) describes local Bluetooth/Wi-Fi synchronization and Tor when internet connectivity is available. It also links Briar Mailbox for peers online at different times. A Mailbox is not evidence of an open stranger-relay mesh. The published threat model assumes limits on the adversary's social connections; removing those limits requires a new threat model.

## Offline installation sharing

Briar implements a useful Android pattern in `briar-android/src/main/java/org/briarproject/briar/android/hotspot/`:

- `HotspotViewModel.java` starts a Wi-Fi P2P hotspot, starts the local web server after hotspot setup, and stops both on cleanup.
- `WebServerManager.java` selects a local address for the download URL.
- `WebServer.java` serves a localized HTML installation page and streams `Context.getPackageCodePath()` as an APK, using NanoHTTPD on port 9999.
- `FallbackFragment.java` offers a file export route; `src/main/assets/hotspot.html` supplies the download page.

[Source directory at the inspected commit](https://code.briarproject.org/briar/briar/-/tree/d03d6fcd776349ec6c8b7d22035e9bb04aa1787c/briar-android/src/main/java/org/briarproject/briar/android/hotspot).

For p2pchat, package a standalone signed APK suitable for offline transfer. Test fresh installation and updates without internet, including Android's explicit installation permission. Preserve release signing continuity, publish reproducible build instructions, distribute source with releases, and design a trust bootstrap for the first APK. A hash delivered beside an APK by the same unknown sender does not authenticate its origin. Prefer a release key or fingerprint obtained through an independent trusted channel. This review establishes the source mechanism, not a tested transplant or first-install authenticity solution.

## Android and iOS constraints

Briar's inspected Android Bluetooth adapter uses `listenUsingInsecureRfcommWithServiceRecord` and `createInsecureRfcommSocketToServiceRecord` in `bramble-android/.../plugin/bluetooth/AndroidBluetoothPlugin.java`. This is Bluetooth Classic RFCOMM, not evidence that Briar provides a ready-made cross-platform BLE implementation. The transport's name does not establish application insecurity: BTP supplies protection above it.

For Android, Google's [background BLE guidance](https://developer.android.com/develop/connectivity/bluetooth/ble/background) permits background connections but states that process death closes them. Long-running communication can require a foreground service, with launch restrictions from Android 12. Filtered scans with PendingIntent can wake a process; associated-device APIs have different limits. Briar itself calls `startForeground()` in `briar-android/.../android/BriarService.java`. Test target Android versions and real devices from relevant vendors, with screen lock, power saving, permission revocation, process death, and reboot. Consent should distinguish active relay service from merely having the app installed.

Apple's [Core Bluetooth background guide](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html) describes limited event-driven background work, slower discovery, reduced advertising, and process termination. Background peripheral service UUIDs move into an overflow area discoverable by iOS devices explicitly scanning for them. That is a material Android/iOS discovery constraint. The guide is archived and must be checked against current SDK behavior on physical phones before promising reliability.

Apple's current [Multipeer Connectivity overview](https://developer.apple.com/documentation/multipeerconnectivity) states that backgrounding stops browsing and advertising and disconnects sessions. Resumption requires reestablishing sessions. xtool can help build and sign an iOS app; it does not relax these OS policies. Do not promise Android-style offline APK redistribution or perpetual iOS relaying. Treat iOS background participation and distribution as separate feasibility milestones.

## Reuse, inspiration, interoperability

| Approach | Implication |
| --- | --- |
| Reuse Briar implementation | Audit copied code and dependencies, retain notices, and satisfy GPL distribution obligations. Evaluate Bramble's integration cost before selecting it. |
| Use Briar as architectural inspiration | Implement separately documented p2pchat protocols and tests. Do not describe the result as inheriting Briar's audit or security properties. |
| Interoperate with Briar | Match identity, key agreement, transports, synchronization, client formats, and versioning; prove compatibility with test vectors and real peers. Reading BSP/BTP is insufficient. Keep this outside the initial release commitment. |

The inspected [Briar LICENSE.txt](https://code.briarproject.org/briar/briar/-/blob/d03d6fcd776349ec6c8b7d22035e9bb04aa1787c/LICENSE.txt) grants GPL version 3 or later. Distribution of a combined derivative requires the corresponding license and source obligations, including those in sections 5 and 6. Review copied files individually because vendored components can have different licenses. The [specification license](https://code.briarproject.org/briar/briar-spec/-/blob/623b8b29b491cca8e7eb109c4738b68d6bd0b28d/LICENSE) is CC BY-SA 4.0. Cite specifications and track copied documentation separately from source code. Confirm project license compatibility before importing Briar implementation.

## Reverse Engineer Anything

Reviewed the [README](https://github.com/sgunin/ReverseEngineerAnything) and [skill source](https://github.com/sgunin/ReverseEngineerAnything/blob/main/skills/reverse-engineer-anything/SKILL.md) as research material. The repository identifies itself as a fork of `morluto/rea`. Its skill specifically excludes ordinary analysis of complete source repositories. Its useful methodology is to follow a feature from entry point through state changes, keep a finding ledger, and distinguish static observations from runtime evidence. These practices inform this report; no REA executable or MCP configuration was installed.

Reserve REA for a later question about a particular shipped APK or behavior that source analysis cannot settle. Record artifact hash, release version, observed behavior, and uncertainty. It should complement source inspection and reproducible builds rather than replace them.

## Experiments required before architecture commitment

1. Run an Android nearby-messaging prototype on multiple physical phones; record delivery, reconnection, battery use, and permission behavior.
2. Use three phones with only the last online to demonstrate delayed, deduplicated public broadcast forwarding. Keep a parallel private message private.
3. Demonstrate loss, retries, expired packets, full queues, an untrusted relay, process restart, and a disconnected topology.
4. Demonstrate Wi-Fi transfer of a signed release APK and an offline update while preserving app data.
5. Test Android/iOS BLE discovery in both central/peripheral roles and all foreground/background combinations before choosing a shared transport.
6. Evaluate future LoRa adapters as a constrained transport for small envelopes. Do not assume video replication fits radio capacity; measure the chosen hardware and regional configuration separately.

None of these experiments was run in this research pass. No conclusion here establishes freedom from vulnerabilities or resistance to every surveillance technique.

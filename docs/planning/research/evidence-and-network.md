# Evidence preservation and relay network

Research date: 12 October 2026. Status: proposed architecture, not an implemented or audited security claim. Numbers below are proposed acceptance targets, not measured results.

## Recommended boundaries

Build an Android-first, delay-tolerant messaging system with separate permissions for nearby relaying, internet forwarding, and evidence storage. Each installation can volunteer to relay when its operating system and radio permit. Installation alone cannot guarantee participation. A message can reach the internet only if a sequence of participating devices eventually carries it to a working gateway before its expiry.

Keep four distinct data classes:

| Class | Readers | Transport and storage policy |
| --- | --- | --- |
| Private conversation | Verified participants | End-to-end encrypted; short-lived relay copies; no public indexing |
| Public broadcast | Anyone after publication | Signed by a channel key; explicit publication action; duplicate suppression and expiry |
| Evidence original | Owner and chosen custodians | Encrypted archive; independent retention and recovery policy; no automatic publication |
| Evidence publication copy | Anyone after publication | Reviewed, redacted derivative; separate metadata; explicit publication action |

An open-source relay network does not require every object to be public. Public broadcasts cannot promise confidentiality after publication. Delivery acknowledgments, signature verification, and factual verification must have different UI labels.

## Mobile execution and consent

Android imposes background work and foreground-service launch restrictions. A user-initiated relay session should use the applicable supported service type and a visible notification with a stop action. WorkManager is appropriate for deferred jobs, not an assurance of continuous discovery. Measure behavior on inexpensive phones and vendor battery managers rather than assuming stock Android results generalize. [Android Bluetooth background guidance](https://developer.android.com/develop/connectivity/bluetooth/ble/background), [foreground services](https://developer.android.com/develop/background-work/services/fgs).

iOS supports specific Bluetooth background modes but can suspend or terminate apps. Current Apple documentation also describes additional Core Bluetooth privileges when an iOS 26 app starts a Live Activity before backgrounding. This deserves a feasibility experiment, not a promise of Android-equivalent relaying. User force-quit remains a restoration constraint. [Core Bluetooth](https://developer.apple.com/documentation/corebluetooth), [background execution](https://developer.apple.com/documentation/Xcode/configuring-background-execution-modes), [restoration conditions](https://developer.apple.com/documentation/technotes/tn3115-bluetooth-state-restoration-app-relaunch-rules).

Proposed consent copy, to test and translate with users:

> Help nearby people pass messages?
>
> Your phone can temporarily store and pass encrypted messages for other people using p2pchat. This uses Bluetooth or Wi-Fi, battery, and some storage. Private messages stay encrypted while your phone carries them. Nearby observers may still detect that your phone is using the network.
>
> Relaying can continue while you use other apps when your phone allows it. You can stop at any time from the relay notification or Settings. Messages already copied to other phones may remain there.
>
> **Allow nearby relaying** / **Not now**

Ask separately before internet forwarding, with Wi-Fi-only as a candidate default and a visible mobile-data budget. Explain that forwarding connects the phone to gateway services, exposing connection information to those services and the network provider. Ask separately before storing evidence for others, with an explicit storage allowance and retention period. Refusal must not block ordinary direct messaging. Do not call the evidence store anonymous or promise that an encrypted device cannot expose its owner.

## Candidate network design

1. Use established, reviewed cryptographic protocols and libraries for authenticated conversations. Pairing by QR code should confirm identity keys locally without requiring a phone number. A public channel uses a separate signing identity; a storage node identity must not automatically become the author's identity. Protocol/library selection remains an architecture decision after checking asynchronous delivery, group membership changes, licensing, and mobile support.
2. Separate transport adapters from message semantics. BLE discovers nearby peers and carries small transfers; negotiated local Wi-Fi carries larger transfers where supported. LoRa and an internet gateway implement the same bounded delivery interface with different capabilities. Do not assume Android Wi-Fi Direct, Apple peer-to-peer Wi-Fi, and BLE are interchangeable.
3. Store and forward opaque envelopes with version, bounded length, expiration, random object identifier, transport class, and only the routing information strictly needed. Keep sender/recipient identities and evidence metadata inside encrypted content where feasible. Routing, inventory exchange, repeated ciphertext, packet sizes, contact timing, and radio presence can still link activity; document what each relay learns.
4. Use bounded replication, resumable transfer, receipt verification, and duplicate caches. Evaluate controlled replication against epidemic flooding in a simulator before choosing routing. An attacker can reset mutable hop counters or ignore expiry, so quotas and authenticated admission remain necessary. Expiration is a local resource rule, not remote erasure.
5. Introduce local per-peer byte, object, CPU, and queue limits before allocating large buffers or verifying expensive signatures. Bound decompression, fragment count, nesting, and incomplete transfers. Isolate attachment decoding. Distinguish unknown peers from verified contacts, and preserve capacity for the latter during floods.
6. Treat relay and gateway acknowledgments as scoped claims. A relay receipt means one relay accepted a bundle; a gateway receipt means one gateway accepted publication; recipient acknowledgment means the intended endpoint received it. Never turn these into an unconditional delivered/read claim. A gateway can discard or delay data, so retries may use independently operated gateways.
7. Keep gateways as a narrow object-publication and synchronization protocol. They must not provide arbitrary URLs, arbitrary TCP forwarding, or an open HTTP proxy. Validate schemas and size limits; disable external side effects triggered by untrusted message contents. Publish only objects whose authors selected the public class.
8. Use signed public channel sequences, explicit key changes, and local subscription/block controls. A signature binds content to a key, not a real person's identity or truth. Avoid a single global public feed at launch; publisher trust and moderation need a separate design. Open identity creation makes Sybil attacks possible, and a quota keyed only to an identity is insufficient.

Private group removal is particularly difficult during network partitions. The specification must say when a removal takes effect, how stale members learn the new epoch, and what happens to pending messages. Historical copies and keys already held by a removed member cannot be recalled. Security testing must include rollback and concurrent membership changes.

## Evidence pipeline

Capture or import the original bytes into an encrypted local archive before making a sharing copy. Preserve source filename, embedded metadata, import/capture distinction, original file ordering where relevant, and an early cryptographic digest. Add a signed manifest containing provenance, collection method, consent/access policy, known clock uncertainty, and software version. Save custody and processing events as append-only records. Imported files cannot retrospectively acquire a trustworthy capture history. These decisions follow WITNESS guidance on originals, fixity, and custody. [WITNESS video-as-evidence guide](https://archiving.witness.org/archive-guide/resources/video-as-evidence/).

Location capture needs its own informed choice. Store sensitive coordinates and witness identities encrypted, never in the public index. Record unavailable metadata honestly; do not fabricate missing coordinates or timestamps. Device time and GPS can be wrong or manipulated. An offline signature proves control of a key and integrity of the signed bytes; it does not prove the event occurred at the claimed place or time. A later timestamp can establish an upper bound on when a digest existed, not the recording time.

Evaluate ProofMode bundle import/export and its open-source components before creating a new provenance format. Its tools combine media, metadata, and signatures and expose verification workflows. Dependency, license, privacy, and offline behavior require review before integration. [ProofMode overview](https://proofmode.org/about), [verification procedure](https://proofmode.org/verify/).

Generate public copies through a separate redaction workflow: remove exposed metadata, blur identifiable people where appropriate, review audio and spoken identifiers, and allow a human to approve the result. Preserve a private processing record connecting derivative and original. Do not overwrite the original. Automated face detection cannot guarantee that a publication copy is safe. The Berkeley Protocol provides investigation and preservation practices; it does not certify an app or guarantee admissibility in an Indian court. [Berkeley Human Rights Center](https://humanrights.berkeley.edu/projects/developing-the-berkeley-protocol-on-digital-open-source-investigations/), [UN publication record](https://digitallibrary.un.org/record/3973652?ln=en).

Avoid a public searchable database of raw forensic originals. Use encrypted manifests and capability-scoped access to originals; maintain an independently published catalog of approved derivatives. A takedown-resistant archive and a public moderation policy solve different problems. Preserve contested evidence privately without obliging every public feed or volunteer device to display or host it.

## Distributed storage and key custody

Start with whole encrypted replicas held by explicitly enrolled custodians; add erasure coding only after recovery and repair work reliably. Encrypt before handing objects to storage peers. Use independent random content keys per evidence item, authenticated chunks, and an authenticated manifest binding chunk order, lengths, and full-file digest. Use reviewed streaming/container formats where possible. Never derive encryption keys from plaintext hashes: predictable plaintext would expose sensitive content.

Wrap an item's key for selected recipients. Storage volunteers need ciphertext, not decryption keys. Define whether recovery belongs solely to the author or also to named custodians; provide an offline recovery export with an explicit explanation of who can decrypt. Optional threshold recovery needs established implementations and operational testing. Keeping every recovery share on devices carried together is not independent custody. Losing all usable keys makes intact replicas unusable.

Candidate archive policy: three verified replicas across three enrolled operators, with a geographically separate custodian where feasible and an offline recovery copy. This is a proposed pilot policy, not a durability guarantee. Ordinary nearby phones often fail together through confiscation, power loss, uninstall, or storage pressure. Count independent operators and failure domains, not self-reported node IDs; ten adversarial node identities are not ten independent archives.

Measure durability through periodic authorized full retrievals and digest checks, followed by repair when availability drops. A signed storage receipt is evidence of a statement, not proof of continued possession. Show users separate states such as saved on this phone, copied to a relay, and verified at two custodians, including when each check occurred. Keep evidence replicas out of the messaging cache eviction policy and allow users to see unmet replication targets.

IPFS is an optional distribution adapter, not the default privacy or persistence layer. Its public DHT exposes provider/content associations, and transport encryption does not make stored content private. Encrypt sensitive content before use and avoid public discovery for originals. [IPFS privacy model](https://docs.ipfs.tech/concepts/privacy-and-encryption/), [privacy guidance](https://docs.ipfs.tech/how-to/privacy-best-practices/).

Pinning keeps selected content from local garbage collection; it does not create permanent or independent storage. If used, run independent custodial nodes with verified retention and recovery rather than depending on one pinning provider. [IPFS persistence](https://docs.ipfs.tech/concepts/persistence/).

Deletion is limited. A user can delete local data and request deletion from cooperative custodians. The system cannot force an unknown recipient to erase a copy. Revoking access prevents future authorized key distribution but cannot retract keys already disclosed. Destroying all controlled key copies may make ciphertext unreadable, but the app cannot promise secure erasure of every historical backup or physical storage cell.

## Future LoRa adapter

Require a compatible external radio connected through a supported phone interface. Ordinary phones cannot acquire a LoRa transceiver through software. Reserve LoRa for short encrypted text, acknowledgments, and compact references; keep video, app installation packages, and bulk archive synchronization on higher-bandwidth links. Account for authentication and fragmentation overhead before defining a text limit. Reject oversized payloads rather than silently truncating them.

Meshtastic offers a candidate radio adapter, but its channel encryption is not a substitute for p2pchat's application protocol. Its documented headers remain visible, the default public channel key is published, and its encryption documentation explicitly describes a lack of forward secrecy. Firmware-version differences matter. Use application-layer protection end to end and test against a pinned firmware version. [Meshtastic encryption](https://meshtastic.org/docs/overview/encryption/).

India deployment requires a device-specific regulatory check. Meshtastic documents an `IN` profile using 865–867 MHz; that software profile is not legal authorization for a particular device or application. Government material describes the wider 865–868 MHz exemption framework with use-dependent power, bandwidth, and duty-cycle conditions. Check the current WPC rules, applicable equipment approval/import requirements, antenna and radiated power, traffic category, and any later amendments with a qualified local specialist before transmitting. Do not derive permission from a firmware setting or treat a license-exempt band as unconstrained. [Meshtastic region settings](https://meshtastic.org/docs/configuration/radio/lora/), [Government of India spectrum announcement](https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=1797179&lang=2&reg=48), [DoT compilation listing G.S.R. 853(E)](https://www.dot.gov.in/static/uploads/2025/07/84f33f09e137fa81930f44bcd5f2d238.pdf). The compilation was discoverable in search, but its full PDF exceeded the browser retrieval limit in this research pass; its full conditions remain a deployment prerequisite.

Radio range and throughput must be measured at the actual site and permitted settings. More hops and retries consume shared airtime. Radio jamming and a prolonged absence of a path to a gateway remain availability limits.

## Proposed validation gates

These are initial acceptance criteria to approve or revise after prototyping. None has been executed here.

| Gate | Reproducible check | Proposed passing criterion |
| --- | --- | --- |
| Consent | Fresh install, refuse all relay options; then toggle each separately | No third-party forwarding before consent; private messaging still works; stop cancels new third-party transfers within 5 seconds |
| Background reality | Eight-hour locked-screen runs on at least six Android models across three vendors; iOS feasibility run separately | Publish delivery, wake-up, battery, thermal, and process-death results per model; no untested always-on claim |
| Delayed path | Three phones, no simultaneous end-to-end path, restart middle relay between contacts | 100/100 small valid bundles arrive exactly once in the UI when scheduled contacts occur before expiry |
| Honest delivery | Drop relays/gateways at each acknowledgment stage | No message advances beyond the receipt it actually has |
| Malicious input | Malformed, replayed, oversized, reordered, and fragmented packets plus parser fuzzing | Reject unauthenticated/tampered objects; no crash or unbounded allocation; queues remain within configured caps |
| Flood resistance | Simulator with 100 nodes and 20 malicious nodes, including identity churn | Report honest delivery and resource use against baseline; all configured storage/CPU/traffic budgets enforced; remaining Sybil limitations explicit |
| Evidence fixity | Capture/import/export 100 fixture files, restart during transfers, flip bytes and metadata | Every valid original restores byte-for-byte; every tampered authenticated object is rejected; missing provenance remains marked missing |
| Archive recovery | Three independent test custodians; remove author phone and any one custodian | Recover all pilot objects using authorized recovery material and verify full-file digests; unauthorized peer cannot decrypt |
| Privacy exposure | Packet captures, application logs, backup artifacts, public gateway requests | No plaintext private content, original coordinates, or evidence keys; documented residual size/timing/provider metadata |
| Publication separation | Send original into archive, then publish approved derivative | Public readers receive only approved derivative/metadata; original never becomes publicly indexed automatically |
| Removal and expiry | Leave/revoke private group while partitioned; replay stale state; expire relay objects | Behavior matches specified epochs and expiry; no claim of retroactive erasure |
| LoRa | Two real radios, pinned firmware, permitted settings, negotiated payload limits | Authenticated messages survive loss/retry; oversized media rejected; measured airtime stays within verified applicable limits |

## Decisions still needed

- Which platforms and Android versions form the first supported release, and which real devices are available for tests?
- Is the initial relay network open to strangers, invitation-based, or both with separate resource limits?
- Who operates the first independent archive custodians and gateways, and who funds retention, restores data, and receives abuse reports?
- Who can recover an evidence item's key if its author loses the phone? What retention policy does the author choose?
- Which established private-group protocol and library support the required offline behavior with an acceptable license?
- What qualifies a public publisher for trusted display, and how are compromised publisher keys and false reports handled?
- Which radio hardware and precise use case will undergo India-specific approval and compliance review?

Writing review: PASS for sourced factual claims, clearly labeled proposed targets, and explicit limits on privacy, durability, evidence authenticity, and deletion. This document delivers architecture research only; app build, accessibility, and interactive design gates are not applicable here.

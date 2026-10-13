# p2pchat

Peer-to-peer messaging over Bluetooth Low Energy, with encrypted direct and group messages, passphrase channels, and public broadcasts. With nearby relay enabled, phones carry queued packets between nearby devices without requiring an internet connection or an account.

p2pchat is in early development and has not had an independent security audit. Encryption does not hide radio activity, protect a compromised phone, or stop a recipient from copying a message.

## Current implementation

- A teal-led brand theme with supporting clay, ochre, slate and plum, supplied artwork, and bundled OFL fonts.
- Separate private, broadcast, and forum screens with English, Hindi, Bengali, Marathi, Telugu, and Tamil catalogs.
- Direct messages and group fan-out use individually sealed ciphertexts. Channels use a passphrase-derived key. Public broadcasts are readable by anyone running the app.
- Nearby relay is off by default, separately consented, and saved on the device. Direct messaging works with relay off. Internet forwarding is unavailable.
- BLE discovery and framing use local Kotlin and Swift modules. Routing, deduplication, expiry, and message handling run in TypeScript.
- SQLCipher storage and SecureStore key handling, including migration of the earlier plaintext database.
- An access PIN gate, decoy PIN behavior, prekey persistence, and in-memory secret clearing. Decoy behavior is not a guarantee of forensic erasure.
- A 600-packet receive budget per connected-peer session, bounded concurrent processing, and a 50 MB encoded envelope-cache budget.

These are source-level capabilities. Native storage protection, locked-screen relay survival, and cross-platform radio behavior require device verification. See the [threat model](docs/THREAT-MODEL.md) and [phase 2 implementation record](docs/planning/phase-2.md) and [phase 3 progress](docs/planning/phase-3.md).

## Message visibility

| Mode | Who can read it |
| --- | --- |
| Direct | The intended contact |
| Closed group | Each selected member receives an independently encrypted copy |
| Channel | Anyone holding the passphrase, including someone who acquires it later |
| Public broadcast | Anyone running the app, including hostile participants |

Contact safety numbers need verification through a trusted channel. Channels have no administrator or member removal; replace a compromised passphrase with a new channel. Group membership is currently local to each sender.

Signed and one-time prekeys support direct/group messages, but the construction is custom and is not a Double Ratchet. See [forward-secrecy limits](docs/FORWARD-SECRECY.md).

## Development

The project uses Expo SDK 57 and React Native 0.86. Read the [versioned Expo documentation](https://docs.expo.dev/versions/v57.0.0/) before changing native integration.

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run i18n:check
```

Expo Go cannot load the local BLE module. Build a development client on a machine with the appropriate Android or iOS toolchain:

```bash
npx expo run:android --device
npx expo run:ios --device
```

Use `npm run doctor` to inspect the local toolchain. iOS signing uses your own `APPLE_TEAM_ID` or a gitignored `signing.local.json`; do not commit signing credentials.

## Source layout

```text
src/app/                  Expo Router screens
src/components/           shared interface components
src/i18n/                 application translations
src/lib/crypto-core.ts    message sealing and identity primitives
src/lib/crypto.ts         device secret storage
src/lib/db.ts             SQLCipher database and migration
src/lib/mesh.ts           message handling and store-and-forward routing
src/lib/protocol.ts       wire encoding, padding, and expiry
src/lib/transport.ts      transport interface and BLE adapter
src/trust/                broadcast trust model
modules/ble-mesh/         Android and iOS BLE modules
locales/                  native permission translations
```

## Verification and remaining work

Host tests cover cryptography, protocol parsing, routing, replay handling, admission limits, storage semantics, access PIN behavior, and trust logic. They do not establish that two physical phones discover one another or relay reliably in the background.

For device testing, disable internet connectivity, re-enable Bluetooth, exchange contact codes, compare safety numbers, and test direct delivery. Then test three-phone delayed forwarding, reconnection, expiry, and process restart. Record device and OS conditions without publishing personal device identifiers.

Android foreground-service relay, iOS restoration, native SQLCipher verification, Sybil resistance, and independent protocol review remain open. Internet messaging, evidence custody, offline app sharing, and LoRa integration are planned rather than shipped. The [roadmap](docs/planning/plan.md) tracks this work.

The proposed [internet transport](docs/planning/online-messaging.md) carries end-to-end encrypted contact messages over Tor onion connections. Public internet gateways remain separate and must reject private ciphertext. Tor is not implemented in the app yet.

## Compatibility

The app name, URL scheme, package name, and native bundle identifiers now use p2pchat. New contact codes use `p2pchat:`; older codes remain readable. Internal storage keys and cryptographic domain labels retain their existing values to avoid silently changing identities, ciphertext compatibility, or stored secrets.

The new native application identifier installs separately from the earlier app. It does not automatically inherit the earlier app's sandbox or keychain data, and changing the display name does not migrate that data.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes. Report vulnerabilities through the private route in [SECURITY.md](SECURITY.md), rather than a public issue. This repository's source and issue tracker are at [lindisboy/p2pchat](https://github.com/lindisboy/p2pchat).

## License

[MIT](LICENSE). Retain the copyright and permission notices when distributing copies or substantial portions of the software. The original copyright notice remains alongside the p2pchat contributors' notice.

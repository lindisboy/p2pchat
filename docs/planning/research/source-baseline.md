# Initial source baseline

Inspected upstream commit `17ceee644d1467737d1b352d0e6e7340c58a0031` for p2pchat planning on 12 October 2026. This is a focused architecture review, not a completed security audit. References below are repository-relative `file:line` locations at that commit. “Verified” means observed in source unless a runtime check is explicitly named. No phone-to-phone behavior was verified.

## What exists

The app uses Expo SDK 57, React Native 0.86 and React 19.2, with Expo Router screens, a TypeScript mesh engine and a local Expo native BLE module (`package.json:5`, `src/lib/transport.ts:28`). Direct contacts, passphrase channels, local fan-out groups and a public channel have separate send paths (`src/lib/app-state.tsx:227`, `src/lib/mesh.ts:340`, `src/lib/mesh.ts:372`, `src/lib/mesh.ts:395`).

The receive path is native BLE payload event → transport emitter → mesh ingestion → envelope parser → duplicate checks → trial decryption → local message storage → forwarding. Mesh start binds transport callbacks and starts the radio (`src/lib/mesh.ts:198`); `ingest` rejects malformed or expired envelopes (`src/lib/mesh.ts:553`); `handleSealed` processes and forwards accepted ciphertext (`src/lib/mesh.ts:574`). The production store is Expo SQLite; a separate in-memory implementation supports host tests (`src/lib/db.ts:9`, `src/lib/store.ts:12`).

| Component | Verified behavior | Reuse assessment |
|---|---|---|
| Transport interface | Start, stop, send and peer/payload events; native BLE or unavailable stub (`src/lib/transport.ts:28`, `src/lib/transport.ts:252`) | Useful seam for new transports. Multiple simultaneous transports and gateway routing still need design. |
| BLE native modules | Kotlin Android GATT and Swift CoreBluetooth; shared service UUID and chunk framing (`modules/ble-mesh/android/src/main/java/expo/modules/blemesh/BleMeshModule.kt:76`, `modules/ble-mesh/ios/BleMeshModule.swift:42`) | Substantial code to test before replacing. Device interoperability and background delivery remain unverified. |
| Store-and-forward | Inventory/request reconciliation and live forwarding (`src/lib/mesh.ts:784`, `src/lib/mesh.ts:794`, `src/lib/mesh.ts:808`) | A working source-level starting point for delay-tolerant messaging; not an internet gateway implementation. |
| Contact introduction | Seed-derived identity, signed receive-key bundles, safety-number comparison (`src/lib/crypto-core.ts:118`, `src/lib/crypto-core.ts:203`, `src/lib/prekeys.ts:155`) | Preserve usability concepts; crypto protocol requires independent review. |
| Localization | English, Hindi, Bengali, Marathi, Telugu and Tamil catalogs (`app.json:11`) | Reuse catalog structure; translated consent requires comprehension testing. |

## Cryptographic and storage boundaries

**Verified construction:** direct message sealing uses fresh ephemeral X25519, HKDF-SHA256, XChaCha20-Poly1305, and an Ed25519 signature inside the ciphertext (`src/lib/crypto-core.ts:233`). Opening tries locally retained agreement secrets followed by the long-term X25519 secret and verifies the sender signature (`src/lib/crypto-core.ts:273`). This is a custom message-sealing protocol built with established primitives, not a demonstrated implementation of Signal's Double Ratchet or Briar's protocol.

Recipient targeting chooses an available one-time prekey, otherwise a signed prekey, otherwise the long-term key (`src/lib/prekeys.ts:298`). The reusable QR bundle intentionally contains a signed prekey and no one-time keys (`src/lib/prekeys.ts:148`). Successful open removes an OTK from the in-memory map and calls a persistence callback (`src/lib/mesh.ts:599`, `src/lib/prekeys.ts:140`, `src/lib/app-state.tsx:168`). The callback starts asynchronous persistence; `saveLocalPrekeys` deletes then reinserts the key tables (`src/lib/db.ts:694`). Crash consistency, overlapping saves, physical deletion and memory zeroization are open audit questions. Removing a map entry is not evidence of forensic erasure.

**Verified local storage:** SQLite is opened as `protestchat.db`, with WAL and foreign keys, and no database encryption key in this initialization (`src/lib/db.ts:58`). Decrypted message text is inserted as text (`src/lib/db.ts:335`); channels have a key field (`src/lib/db.ts:128`); receive-key and OTK secrets are stored as base64 (`src/lib/db.ts:178`, `src/lib/db.ts:694`). The identity seed separately uses Expo SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` when created (`src/lib/crypto.ts:30`). Android backups are disabled (`app.json:48`). These facts describe application-level persistence; they do not establish what an attacker can extract from a particular locked phone or the protection offered by that phone's filesystem encryption.

**Public means public:** the broadcast channel uses a deterministic, well-known key (`src/lib/crypto-core.ts:621`). Its content has no confidentiality from someone who runs or inspects the app. Passphrase channel keys use scrypt (`src/lib/crypto-core.ts:600`). Neither path establishes forward secrecy. Privacy copy must distinguish public publishing from private messages.

**Groups are local fan-out lists:** outgoing group messages are separately sealed to each member, but the receive path files identity-opened messages under the sender; there is no shared authenticated group roster in that path (`src/lib/mesh.ts:395`, `src/lib/mesh.ts:629`, `src/lib/mesh.ts:764`; local group tables at `src/lib/db.ts:136`). Treat synchronized group conversation semantics and membership changes as unfinished requirements.

## Relay limits and consent

Defaults are six hours and six hops (`src/lib/protocol.ts:277`). Decode rejects TTL above seven days and clamps max hops to six (`src/lib/protocol.ts:111`); local storage limits expiry to six hours after first sight (`src/lib/db.ts:445`). Ciphertext-hash and envelope-ID ledgers precede trial decryption, and forwarding increments hop count (`src/lib/mesh.ts:583`, `src/lib/mesh.ts:695`). Inventory offers/request handling cap each batch at 200 IDs and serving at 600 per peer session (`src/lib/mesh.ts:48`, `src/lib/mesh.ts:68`, `src/lib/mesh.ts:790`, `src/lib/mesh.ts:818`). Native iOS frames have a 32,768-byte message limit, four assemblies per peer and a 30-second assembly timeout (`modules/ble-mesh/ios/BleMeshModule.swift:52`).

A hard global cache byte quota, global peer quota and aggregate ingress budget were **not found in the inspected admission/storage paths**. Time retention and per-session serving limits do not establish those limits. Query result limits are not storage limits. Load, reconnection churn, clock skew and exhaustion testing are required before crowd-scale claims.

The existing permission gate starts the radio when Bluetooth status is ready (`src/components/radio-access-gate.tsx:83`), and received ciphertext is carried/forwarded regardless of whether the local user can decrypt it (`src/lib/mesh.ts:688`). A distinct, persisted, revocable “relay for others” consent was **not found** in these paths. Public internet publishing and evidence hosting consent are also new work, separate from Bluetooth permission.

## Background lifecycle and radio visibility

The iOS configuration has Bluetooth permission strings but no `UIBackgroundModes` entry (`app.json:19`); CoreBluetooth manager options do not supply restoration identifiers (`modules/ble-mesh/ios/BleMeshModule.swift:460`). The Android module manifest declares BLE/location permissions and BLE hardware, with no foreground service declaration (`modules/ble-mesh/android/src/main/AndroidManifest.xml:1`). The native module tears down on destruction (`modules/ble-mesh/android/src/main/java/expo/modules/blemesh/BleMeshModule.kt:402`). TypeScript expiry and key maintenance use timers plus foreground events (`src/lib/app-state.tsx:192`, `src/lib/mesh.ts:258`). Continuous background JS processing, locked-screen relay and relaunch recovery are **not established**.

An identifier rotation implementation does not establish invisibility. Both platforms use a fixed BLE service UUID; iOS advertises that UUID and a tag in the local name (`modules/ble-mesh/ios/BleMeshModule.swift:43`, `modules/ble-mesh/ios/BleMeshModule.swift:549`). OS permission copy currently says “Nothing about you is broadcast” (`app.json:22`). That wording exceeds what these source facts establish and needs revision before release.

## Requested features not implemented in the inspected paths

Internet gateway transports, LoRa adapters, evidence capture and chunk replication, forensic manifests, durable replication receipts, and offline APK sharing were not found in the inspected transport, mesh, schema and app paths. The transport factory chooses BLE or an unavailable stub (`src/lib/transport.ts:252`); message bodies and storage center on text/receipts (`src/lib/protocol.ts:200`, `src/lib/db.ts:86`). The six-hour chat retention policy (`src/lib/store.ts:49`) is unsuitable as the retention policy for the proposed long-lived evidence archive. Evidence storage needs a separate consent, key, quota and retention model.

The trust engine has its own source/tests, but no imports of that engine were found in `src/lib` or `src/app`; do not count its tests as proof of production enforcement.

## Verification record

Initial `npm test` on Node 26.11.1, before dependencies were present, reported 33 passing tests and six failed test-file loads because `@noble/ciphers` / `@noble/curves` could not be resolved. This was an environment failure, not a demonstrated behavioral failure.

Dependency lock inspection: lockfile version 3, 922 package entries, resolved package hosts limited to `registry.npmjs.org`; one declared install script (`unrs-resolver`). Dependency installation uses `npm ci --ignore-scripts --no-audit --no-fund`; scripts are intentionally disabled. Final post-install check results are recorded below when available.

No Android/iOS native build, emulator run, physical-device test, radio measurement, fuzzing campaign, forensic extraction or independent cryptographic audit was performed. Existing CI configuration specifies lint, type checks and tests, but its presence does not establish that the inspected commit passed remotely (`.github/workflows/android-preview.yml:41`).

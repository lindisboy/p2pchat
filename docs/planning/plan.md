# p2pchat Master Architecture and Implementation Plan

Document version: 1.0.0
Date: 12 October 2026
Repository: `lindisboy/p2pchat`
Target Platforms: Android (Primary / Expo SDK 57 default target API 36), iOS (Secondary / iOS 17+ via xtool / Swift CoreBluetooth), Hardware LoRa nodes (Auxiliary bridge)

---

## 1. Executive Summary & Mission Constraints

`p2pchat` is an open-source, decentralized, delay-tolerant mesh communication and human rights evidence preservation system designed for environments experiencing total internet blackouts, active telecommunication shutdowns, network tampering, and hostile surveillance.

The system addresses three operational requirements:
1. **Offline Peer-to-Peer Messaging**: Ephemeral, end-to-end encrypted direct messaging and localized group coordination over Bluetooth Low Energy (BLE) and local Wi-Fi without internet connectivity or cellular infrastructure.
2. **Store-and-Forward Crowd Relaying & Internet Egress**: Delay-tolerant opportunistic packet routing where participating devices carry encrypted bundles across physical protest spaces until an internet-connected gateway node is reached for public dissemination.
3. **Tamper-Evident Forensic Evidence Custody**: Decentralized, encrypted chunk replication of state violence documentation with cryptographically bound sensor provenance (sensor fixity, timestamps, camera integrity) adhering to WITNESS and Berkeley Protocol standards, isolating raw forensic originals from redacted public copies.

### Non-Negotiable Operational Invariants
- **No Blanket Security Guarantees**: Cryptographic encryption provides confidentiality and data authenticity under mathematical assumptions; it cannot eliminate radio-frequency (RF) physical detectability, device seizure exploitation, or side-channel leakage.
- **Strict Data Class Isolation**: End-to-end encrypted private messages and unredacted evidence originals must NEVER egress to public channels or internet gateways. Only explicitly designated public broadcasts and user-approved redacted derivatives are eligible for gateway forwarding.
- **Explicit, Granular Consent**: Background relaying, internet gateway forwarding, and evidence chunk hosting require separate, plain-language opt-in agreements. Turning off relaying immediately halts forwarding without degrading local private messaging.
- **Zero Slop UI and Visual Integrity**: The user interface contains zero emojis, zero synthetic/AI-generated illustrations, and zero conversational fluff. All visual iconography uses vetted open-source vector glyphs (Lucide/Feather). All typography and color schemes prioritize high-contrast emergency visibility.
- **OpSec and Identity Sanitation**: Public ownership and Git history remain visible under the `lindisboy` handle. Minimize additional identity and hardware metadata. All builds must be reproducible, with compiler timestamps normalized, host filesystem paths scrubbed, and zero telemetry or remote error reporting dependencies.

---

## 2. Threat Model & Adversary Capabilities

The system operates against an advanced state adversary equipped with legal authority, signals intelligence (SIGINT), physical enforcement personnel, and control over telecommunications infrastructure.

```
       ADVERSARY VECTORS                   SECURITY BOUNDARIES IN P2PCHAT
+--------------------------------+       +------------------------------------+
| 1. Cellular/ISP Blackout       | ----> | Multi-Transport Offline Mesh       |
|    Total internet shutdown     |       | BLE + Wi-Fi Direct + LoRa Bridge   |
+--------------------------------+       +------------------------------------+
| 2. IMSI Catchers & RF Sniffers | ----> | BLE MAC/Payload Hash Rotation      |
|    Triangulation & packet log  |       | Minimal static broadcast beacons   |
+--------------------------------+       +------------------------------------+
| 3. Physical Device Seizure     | ----> | SQLCipher DB + Keystore Keying     |
|    Cellebrite, GrayKey, search |       | Zeroized RAM + Panic Duress Wipe   |
+--------------------------------+       +------------------------------------+
| 4. Sybil Nodes & Flood Attacks | ----> | Ingress Quotas, Priority Queuing   |
|    Mesh disruption & resource  |       | Hash Deduplication, Hop Clamping   |
+--------------------------------+       +------------------------------------+
| 5. Evidence Censorship         | ----> | P2P Multi-Custodian Replication    |
|    Cloud takedowns, scrubbing  |       | ProofMode Sensor Fixity Trees      |
+--------------------------------+       +------------------------------------+
```

### Threat Agents & Vectors
1. **Network Provider & State SIGINT**:
   - Capabilities: Complete shutdown of 4G/5G mobile data; DNS poisoning; Deep Packet Inspection (DPI); cell tower IMSI catchers tracking active mobile baseband connections.
   - Mitigation: Baseband independence. Radios operate in ad-hoc peer mode (BLE / Wi-Fi Direct). Public gateway synchronization uses Tor onion transport or domain-fronted HTTPS once connectivity is intermittently encountered.
2. **Local RF Surveillance & Triangulation**:
   - Capabilities: SDR-based spectrum scanners monitoring 2.4 GHz ISM bands to track protester density and map active Bluetooth devices via static identifiers.
   - Mitigation: Periodic BLE peripheral MAC address rotation; randomized advertisement intervals; elimination of stable device nicknames from broadcast advertisement packets; non-deterministic inventory packet ordering.
3. **Physical Seizure & Forensic Extraction**:
   - Capabilities: Confiscation of unlocked or forced-biometric devices; forensic imaging tools (Cellebrite, GrayKey, adb extraction).
   - Mitigation: Replace plain SQLite with SQLCipher full-database encryption. Store a random database key with `expo-secure-store`, which uses Android Keystore-backed encrypted preferences and the iOS Keychain. Do not claim Secure Enclave storage or biometric gating unless the native implementation verifies it. Wipe owned key buffers at defined lifecycle points. A duress wipe deletes the wrapping key and database files; flash storage may retain inaccessible blocks because the app cannot promise physical overwrite.
4. **Malicious Mesh Participants & Sybil Flooding**:
   - Capabilities: Adversarial devices participating in the mesh to drop packets (blackhole attack), flood the network with junk packets to exhaust storage/battery (denial-of-service), or alter message transit headers.
   - Mitigation: Cryptographic envelope signatures; strict envelope size limits (32 KiB cap for messaging); global storage caps (50 MB default relay cache); strict rate limiting per discovered peer connection; hop-count clamping (maximum 6 hops); cryptographically enforced TTL (maximum 6 hours).

---

## 3. Cryptographic and Storage Architecture

### Initial source baseline vulnerabilities
An inspection of `src/lib/db.ts` and `src/lib/crypto-core.ts` reveals key security gaps that must be remediated in Phase 1:
- The local database is initialized as unencrypted SQLite (`protestchat.db`). Plaintext messages and base64 private keys reside unencrypted on flash memory.
- Prekey replenishment executes non-atomic `DELETE` and `INSERT` operations (`src/lib/db.ts:694`), exposing keys to crash inconsistency.
- Groups operate as unauthenticated client-side fan-out lists without shared cryptographic group state or forward-secret epoch transitions.
- Public channel encryption uses a static, well-known symmetric key derived from a hardcoded string, lacking authenticity guarantees.

### Target Cryptographic Architecture

```
+-----------------------------------------------------------------------------+
|                          APPLICATION DATA LAYER                             |
|  +---------------------+   +---------------------+   +-------------------+  |
|  | Private Chat (E2EE) |   |  Public Broadcast   |   | Forensic Archive  |  |
|  | Double Ratchet D-H  |   |  Ed25519 Signed     |   | BLAKE3 Hash Tree  |  |
|  +---------------------+   +---------------------+   +-------------------+  |
+-----------------------------------------------------------------------------+
|                        CRYPTOGRAPHIC ENGINE LAYER                           |
|  - Key Agreement: X25519 Diffie-Hellman                                     |
|  - Symmetric Encryption: XChaCha20-Poly1305 (256-bit key, 192-bit nonce)    |
|  - Digital Signatures: Ed25519 (EdDSA)                                      |
|  - Key Derivation: HKDF-SHA256 & Argon2id                                   |
|  - Ratchet State: Double Ratchet with per-message keys & forward secrecy     |
+-----------------------------------------------------------------------------+
|                         STORAGE ENCRYPTION LAYER                            |
|  - Engine: `expo-sqlite` compiled with its `useSQLCipher` config plugin     |
|  - Key Material: 256-bit random key stored by `expo-secure-store`            |
|  - Memory Sanitation: overwrite app-owned buffers at defined lifecycle ends |
+-----------------------------------------------------------------------------+
```

### Storage Protection Specifications
1. **Database Migration to SQLCipher**:
   - Enable SQLCipher through the Expo SDK 57 `expo-sqlite` config plugin (`useSQLCipher: true`). Expo documents the required native rebuild and `PRAGMA key` call. SQLCipher is unavailable in Expo Go. See [Expo SDK 57 SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/).
   - Generate a 256-bit random database key and store it with `expo-secure-store`. Expo uses Android Keystore-backed encrypted preferences and iOS Keychain storage. `requireAuthentication` prompts at key access and is separate from the app PIN gate. See [Expo SDK 57 SecureStore](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/).
   - Preserve existing plaintext installs with SQLCipher's `sqlcipher_export` into a separate encrypted database. Verify the encrypted copy before deleting the source database and its sidecars. WAL mode is allowed for normal use. A wipe deletes the database key first, then database files; it does not promise physical block overwriting.
2. **Key Lifecycle & Memory Zeroization**:
   - Ephemeral X25519 session keys and ratchet state must be held in `Uint8Array` buffers and overwritten with `.fill(0)` when operations finish or state is discarded. Do not claim wiping on garbage collection; JavaScript has no deterministic finalizer for this.
   - Discarded one-time prekeys (OTKs) must be wiped from memory immediately upon ratchet initialization and securely deleted from SQLCipher within a single atomic transaction.
3. **Duress Wipe Protocol**:
   - A dedicated duress PIN setting and an app unlock gate. The gate must run before identity or database secrets load. When the decoy PIN is entered, delete the database key and identity keys, remove database files and sidecars, clear in-memory secrets, then show a generic closed state. Do not claim reliable process exit on iOS or physical flash overwrite. The existing settings wipe is not a duress gate.

---

## 4. Multi-Transport & Store-and-Forward Mesh Engine

### Transport Layer Abstraction
All physical and network interfaces implement the unified `ITransportAdapter` interface:

```typescript
export interface ITransportAdapter {
  readonly id: TransportType; // 'ble' | 'wifi-direct' | 'lora' | 'gateway'
  readonly mtu: number;
  readonly isAvailable: boolean;

  start(): Promise<void>;
  stop(): Promise<void>;
  broadcast(packet: Uint8Array): Promise<void>;
  sendToPeer(peerId: string, packet: Uint8Array): Promise<boolean>;

  onPeerDiscovered(callback: (peer: PeerInfo) => void): void;
  onPacketReceived(callback: (peerId: string, packet: Uint8Array) => void): void;
}
```

```
                     +-----------------------------------+
                     |       ROUTING & MESH ENGINE       |
                     |   Store-and-Forward Delay Queue   |
                     |   Deduplication Hash Ledger       |
                     +-----------------+-----------------+
                                       |
        +------------------+-----------+-----------+------------------+
        |                  |                       |                  |
+-------v--------+  +------v---------+     +-------v--------+  +------v--------+
| BLE Transport  |  | Wi-Fi Direct   |     | LoRa Bridge    |  | Internet Sync |
| GATT Central/  |  | High-Bandwidth |     | Long-Range Low |  | Tor / HTTPS   |
| Peripheral     |  | Local Chunks   |     | Bandwidth      |  | Gateway Sync  |
+----------------+  +----------------+     +----------------+  +---------------+
```

### Transport Mechanisms
1. **Bluetooth Low Energy (BLE)**:
   - Android: Dual-mode GATT server (Peripheral) and GATT client (Central) executing in an Android Foreground Service with a persistent notification.
   - iOS: CoreBluetooth Central and Peripheral roles configured with restoration identifiers. Bounded background advertising using 128-bit Service UUIDs.
   - Framing: BLE MTU negotiation (up to 512 bytes) with 16-byte chunk headers supporting packet reassembly up to the 32 KiB envelope cap.
2. **Wi-Fi Direct / Local Hotspot**:
   - Negotiated high-bandwidth transport for forensic evidence chunk distribution and offline APK sharing.
   - Initiated on-demand when two paired peers identify pending chunk payloads exceeding BLE throughput.
3. **Hardware LoRa Bridge (Auxiliary)**:
   - External transceiver interface (e.g., LilyGO T-Echo, Heltec V3 running Meshtastic firmware or dedicated p2pchat firmware) connected via Bluetooth Serial (SPP) or USB-OTG.
   - Payload format: Compact binary envelopes (<= 200 bytes) containing emergency distress alerts, short text broadcasts, and cryptographic hash manifests.
   - Spectrum Compliance (India): Bound to 865–867 MHz license-exempt band, transmitting strictly within permitted Effective Isotropic Radiated Power (EIRP) limits and regulatory duty cycles (G.S.R. 853(E)).
4. **Internet Gateway Synchronization**:
   - When an active node detects legitimate cellular or Wi-Fi internet access:
     a. Checks user consent for internet forwarding.
     b. Connects to configured Tor Onion services or resilient HTTPS gateway rendezvous endpoints.
     c. Pushes queued public broadcasts and verified public evidence manifests.
     d. Never transmits private chat ciphertexts.

---

## 5. Store-and-Forward Protocol & Consent Architecture

### Store-and-Forward Envelope Format
Each network payload is encapsulated in a tamper-evident binary envelope:

```
+---------------+---------------+---------------+--------------------+
| Version (1B)  | Class (1B)    | TTL (4B Unix) | Hop Count (1B)     |
+---------------+---------------+---------------+--------------------+
| Envelope ID / BLAKE3 Hash (32B)                                    |
+--------------------------------------------------------------------+
| Destination Identifier (32B) [Zeroed for Public Broadcasts]        |
+--------------------------------------------------------------------+
| Payload Length (2B)           | Encrypted Payload (Var <= 32 KiB)  |
+--------------------------------------------------------------------+
| Authentication Tag / Signature (64B)                               |
+--------------------------------------------------------------------+
```

### Routing Rules & Queue Discipline
1. **Deduplication Ledger**: A circular bloom filter backed by an LRU database of 50,000 BLAKE3 payload hashes prevents processing or relaying duplicate envelopes.
2. **Hop Clamping & Aging**:
   - Max hops = 6. Each forward increments the hop count. Hop count >= 6 triggers envelope drop.
   - Max TTL = 6 hours from origination timestamp. Expired envelopes are dropped immediately from relay memory and database caches.
3. **Ingress Control & Priority Queuing**:
   - Priority 1: Direct messages addressed to local identity.
   - Priority 2: Verified contact messages in transit.
   - Priority 3: Public emergency broadcasts signed by trusted channel keys.
   - Priority 4: Stranger relay transit envelopes (opportunistic store-and-forward).
   - Priority 5: Forensic evidence bulk chunks (Wi-Fi / high-bandwidth only).
4. **Relay Quota Enforcement**:
   - Relay storage strictly capped at user-defined limit (default: 50 MB, configurable up to 500 MB).
   - FIFO eviction applied exclusively to Priority 4 transit envelopes when quota is reached. Priority 1 and local evidence originals are protected from eviction.

### Granular Consent User Experience
Background relaying must never run silently. The user is presented with distinct, plainly worded consent gates:

```
+------------------------------------------------------------------+
|                    [RELAY NETWORK PERMISSION]                    |
|                                                                  |
| Help nearby people pass messages?                                |
|                                                                  |
| Your phone can temporarily store and forward encrypted messages  |
| for other people using p2pchat.                                  |
|                                                                  |
| - Uses Bluetooth, Wi-Fi, battery, and local storage (max 50 MB). |
| - Private messages stay encrypted while in transit.              |
| - Nearby observers can detect that your phone is using radio.    |
|                                                                  |
| You can stop relaying at any time from Settings or the ongoing   |
| notification.                                                    |
|                                                                  |
| [  ALLOW NEARBY RELAY  ]               [     NOT NOW     ]       |
+------------------------------------------------------------------+
```

Persistent Android notification details:
- Title: `p2pchat mesh active`
- Content: `Relaying encrypted messages for nearby peers (Tap to stop)`
- Action: Direct `Stop Relay` button in notification shade.

---

## 6. Forensic Evidence Preservation Pipeline

```
+-----------------------------------------------------------------------------+
|                            INCIDENT CAPTURE                                 |
|  Camera / Audio / Sensor Data Stream                                         |
+--------------------------------------+--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                      SENSOR PROVENANCE & FIXITY ENGINE                      |
|  - Cryptographic Hash: BLAKE3 digest computed on raw frame buffer            |
|  - Metadata Manifest: Sensor telemetry, optical parameters, clock drift    |
|  - Witness Signatures: Ed25519 signature by device identity key              |
+--------------------------------------+--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                           CUSTODY ARCHIVE STORAGE                           |
|  - Ciphertext: Chunked AES-256-GCM encryption with fresh item master key    |
|  - Key Custody: Shamir Secret Sharing (2-of-3 threshold across legal trust)  |
|  - P2P Replication: Chunks distributed to enrolled custodian peers          |
+--------------------------------------+--------------------------------------+
                                       |
                   [ EXPLICIT USER REDACTION & EXPORT ]
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                       REDACTED PUBLIC DISSEMINATION                         |
|  - Facial Blurring / Plate Redaction / Metadata Stripped                     |
|  - Human Verification Gate -> Pushed to Public Mesh Broadcast               |
+-----------------------------------------------------------------------------+
```

### Forensic Standard Compliance
Adheres to the Berkeley Protocol on Digital Open Source Investigations and WITNESS Video as Evidence guidelines:
1. **Raw Original Fixity**:
   - Media bytes are captured directly into an encrypted sandbox directory before any preview rendering or processing.
   - A BLAKE3 hash tree (Merkle tree) is generated with 64 KiB leaf chunks, providing rapid integrity verification and resumable P2P transfer.
2. **Provenance Manifest (`manifest.json`)**:
   - Contains: Original filename, capture timestamp, clock uncertainty interval (+/- milliseconds), hardware model, optical parameters, accelerometer/gyroscope readings at capture, software build git commit hash, and signing public key.
   - Manifest signed with the device's long-term Ed25519 identity key.
3. **Decentralized P2P Custodian Replication**:
   - Large media files are divided into encrypted 256 KiB chunks.
   - Chunks are distributed opportunistically over Wi-Fi Direct to explicitly paired "Evidence Custodian" contacts.
   - Encryption keys are wrapped using public keys of designated human rights legal organizations or split using Shamir's Secret Sharing (2-of-3 threshold) so no single node (including the capturing phone) can be coerced into decrypting the archive without legal custodian quorum.
4. **Air-Gapped Public Redaction Pipeline**:
   - The original raw capture is NEVER published publicly.
   - A local redaction tool allows the user to:
     a. Apply irreversible Gaussian blur over faces, tattoos, and vehicle registration marks.
     b. Strip all EXIF, GPS coordinates, and device serial numbers.
     c. Mask audio pitch to prevent biometric voice identification.
   - The resulting derivative is cryptographically marked as `DERIVATIVE_REDACTED` with a signed reference back to the original manifest hash.

---

## 7. Offline Application Distribution (Briar Pattern)

To resist national app store takedowns and internet-level website domain blocking, `p2pchat` embeds Briar's proven offline APK sharing architecture.

```
+------------------------------------------------------------------------+
|                          OFFLINE SHARE FLOW                            |
|                                                                        |
|  [Donor Phone (Installed)]                 [Recipient Phone (Offline)] |
|                                                                        |
|  1. Opens "Share App Offline"                                          |
|  2. Launches Local Wi-Fi AP +                                          |
|     Embedded HTTP Server (Port 9999)                                   |
|  3. Displays Dynamic QR Code --------> 4. Scans QR Code with Camera    |
|     (Contains SSID, PSK, URL,          5. Connects to Hotspot          |
|      SHA-256 APK Checksum)             6. Downloads signed APK file    |
|                                        7. Verifies Checksum & Installs |
+------------------------------------------------------------------------+
```

### Technical Implementation Details
1. **Hotspot Activation (`LocalHotspotModule`)**:
   - Android native module utilizing `WifiP2pManager` or `startLocalOnlyHotspot` (Android 8.0+).
   - Generates an ephemeral WPA2 Wi-Fi network with randomized SSID (`p2pchat-share-XXXX`) and strong passphrase.
2. **Embedded Micro HTTP Server**:
   - Lightweight embedded HTTP server (NanoHTTPD or embedded Kotlin coroutine server) binding to port 9999.
   - Serves two endpoints:
     - `GET /`: Lightweight, responsive localized HTML page with instructions for installing unknown apps on Android.
     - `GET /download/p2pchat.apk`: Direct binary stream reading from `context.getPackageCodePath()`.
3. **Out-of-Band Authenticity Bootstrap**:
   - The donor's screen displays a high-density QR code encoding:
     `WIFI:S:p2pchat-share-XXXX;T:WPA;P:<password>;;URL:http://192.168.49.1:9999/download/p2pchat.apk;;SHA256:<apk_sha256_hash>`
   - The recipient verifies the SHA-256 hash before running package installation, defeating local hotspot spoofing.

---

## 8. UI/UX Design System & Anti-Slop Discipline

The interface is engineered for crisis conditions: tear gas, bright sunlight, stress, low battery, and high adrenaline.

### Visual & Stylistic Rules
- **Zero Emojis**: Emojis are completely banned across code, UI, microcopy, notifications, and documentation. Status indicators use clean vector iconography or explicit textual badges.
- **Zero AI Illustrations**: No synthetic graphics, decorative 3D characters, or stock marketing imagery. Only human-designed vector symbols from the Lucide icon library.
- **Monochrome & High-Contrast Visual Hierarchy**:
  - Background: Pure Pitch Black (`#000000`) for OLED power savings and night stealth.
  - Surface: Deep Slate (`#121212`, `#1E1E1E`).
  - Primary Text: Stark White (`#FFFFFF`).
  - Secondary Text: Slate Gray (`#A0A0A0`).
  - Accent / Critical State: High-Visibility Safety Amber (`#FFB300`) or Emergency Crimson (`#E53935`).
- **Typography**: Clean, legibility-tested monospace and sans-serif fonts (JetBrains Mono / Inter). Bounded font scaling to support dynamic text sizes without layout breaking.
- **Full Indian Language Localization**: All UI strings, permission explanations, and error messages fully localized and tested for:
  - English (`en`)
  - Hindi (`hi`)
  - Bengali (`bn`)
  - Marathi (`mr`)
  - Telugu (`te`)
  - Tamil (`ta`)

---

## 9. Phased Implementation Roadmap

```
+-----------------------------------------------------------------------------+
|                          PHASED DELIVERY ROADMAP                            |
|                                                                             |
| Phase 1: Cryptographic Core & Storage Hardening (Weeks 1-3)                 |
| [SQLCipher Migration | KeyStore Integration | Prekey Atomic Tx | Memory Zero] |
|                                                                             |
| Phase 2: BLE Mesh Hardening & Background Execution (Weeks 4-6)              |
| [Android Foreground Svc | iOS Background Restoration | Ingress Quotas]      |
|                                                                             |
| Phase 3: Store-and-Forward Mesh & Internet Gateway (Weeks 7-9)              |
| [Delay-Tolerant Routing | Granular Relay Consent | Tor/HTTPS Gateway Sync]  |
|                                                                             |
| Phase 4: Briar-Pattern Offline App Sharing (Weeks 10-11)                    |
| [Local Hotspot Module | Embedded HTTP Server | QR Checksum Bootstrap]       |
|                                                                             |
| Phase 5: Tamper-Evident Forensic Evidence Custody (Weeks 12-14)             |
| [ProofMode Sensor Trees | Multi-Custodian P2P Replication | Redaction Tool] |
|                                                                             |
| Phase 6: LoRa Hardware Bridge & India Regulatory Tuning (Weeks 15-16)       |
| [Meshtastic BLE/Serial | 865-867 MHz EIRP Duty Cycle | Emergency Beacons]    |
|                                                                             |
| Phase 7: Verification, Trail of Bits Audits & Launch (Weeks 17-18)          |
| [Trail of Bits Skills | MASTG Validation | Fuzzing | Reproducible Builds]   |
+-----------------------------------------------------------------------------+
```

### Detailed Phase Work Breakdown

#### Phase 1: Cryptographic Core & Storage Hardening
- **Objective**: Eliminate unencrypted database vulnerabilities and harden key management.
- **Deliverables**:
  1. Enable SQLCipher through `expo-sqlite` and migrate existing plaintext installs without losing records.
  2. Store the database key with `expo-secure-store`; document platform behavior and add an app unlock gate before enabling any user-presence requirement.
  3. Refactor `saveLocalPrekeys` to execute within atomic transactions and overwrite consumed in-memory key buffers.
  4. Add normal and duress PIN setup in `src/app/settings.tsx` and evaluate them at an unlock gate before `AppProvider` loads identity or database secrets.
- **Verification Gate**:
  - Native build check: SQLCipher is present, a wrong key cannot open the database, and an existing plaintext database migrates with all records intact.
  - Prekey check: interrupted writes retain the prior complete prekey set or the new complete set; a consumed OTK is absent from persisted state.
  - Duress wipe check: the keychain entry and database files are removed, the prior encrypted database cannot be opened, and the gate does not load app state first. Do not use heap scans or flash overwrite as proof of secure erasure.

#### Phase 2: BLE Mesh Hardening & Background Execution
- **Current implementation record**: [Phase 2](phase-2.md). Ingress limits and cache admission are implemented; native background services and device verification remain pending.
- **Objective**: Deliver reliable, long-running BLE discovery and robust packet framing.
- **Deliverables**:
  1. Implement Android `BleMeshForegroundService` with ongoing user notification.
  2. Implement CoreBluetooth state restoration identifiers in Swift native module.
  3. Implement strict admission limits: 50 MB encoded envelope-body budget and 600 inbound packets per connected-peer session. Bound concurrent packet processing separately.
  4. Rotate the advertised BLE tag and measure OS-controlled address behavior; use random payload padding. Do not claim app-controlled MAC rotation or unlinkability.
- **Verification Gate**:
  - 8-hour continuous locked-screen test on 4 physical Android devices (Samsung, Xiaomi, Pixel, Motorola) confirming packet relay survival.

#### Phase 3: Store-and-Forward Mesh & Internet Gateway Sync
- **Private internet messaging design**: [End-to-end encryption over Tor onion transport](online-messaging.md). Contact messaging is distinct from public gateway forwarding; there is no automatic direct-internet fallback for private traffic.
- **Objective**: Bridge offline mesh packets to online broadcast gateways.
- **Deliverables**:
  1. Implement delay-tolerant routing engine with BLAKE3 Bloom filter deduplication.
  2. Implement separate permission modal and persistent settings for "Nearby Relay" and "Internet Forwarding".
  3. Build Tor Onion / HTTPS gateway synchronization adapter for signed public broadcasts.
  4. Enforce architectural isolation: reject any attempt to route private ciphertexts to gateways.
- **Verification Gate**:
  - Three-phone delayed forwarding test: Device A (offline) -> Device B (relay/offline) -> Device C (online gateway) -> Gateway server. Device A's public broadcast arrives; private message remains strictly on Device A and B.

#### Phase 4: Briar-Pattern Offline App Sharing
- **Objective**: Phone-to-phone app distribution without internet.
- **Deliverables**:
  1. Create `LocalHotspotModule` in Android native codebase (`modules/offline-share`).
  2. Embed micro HTTP server streaming `getPackageCodePath()` on port 9999.
  3. Build QR code generation UI displaying WPA credentials and SHA-256 APK hash.
- **Verification Gate**:
  - End-to-end air-gapped test: Phone without SIM or Wi-Fi scans donor QR, downloads APK, verifies hash, and completes successful install.

#### Phase 5: Tamper-Evident Forensic Evidence Custody
- **Objective**: Immutable brutality documentation with decentralized P2P replication.
- **Deliverables**:
  1. Implement camera capture pipeline saving raw frames directly to encrypted sandbox.
  2. Build WITNESS/ProofMode-compliant provenance manifest generator.
  3. Implement P2P chunking (256 KiB) and multi-custodian replication engine.
  4. Build on-device face/identifier redaction tool producing signed derivative records.
- **Verification Gate**:
  - Tamper detection test: Flipping a single byte in an evidence chunk invalidates manifest signature and triggers integrity alarm.
  - Custodian recovery test: 2-of-3 custodians reconstruct media when capturing phone is wiped.

#### Phase 6: LoRa Hardware Bridge & India Regulatory Tuning
- **Objective**: Long-range emergency signaling via external radio transceivers.
- **Deliverables**:
  1. Implement `LoRaTransportAdapter` interfacing with Meshtastic devices over BLE SPP and USB serial.
  2. Compact binary envelope format (< 200 bytes) for emergency distress broadcasts.
  3. Frequency locking to 865–867 MHz with strict duty-cycle adherence for Indian WPC compliance.
- **Verification Gate**:
  - Radio transmission test: Envelopes successfully transmitted across 3 km non-line-of-sight test link; RF analyzer confirms transmissions comply with 865–867 MHz band limits.

#### Phase 7: Verification, Trail of Bits Audits & Launch
- **Objective**: Rigorous security validation, fuzzing, and release hardening.
- **Deliverables**:
  1. Run Trail of Bits security skills (`constant-time-analysis`, `zeroize-audit`, `sharp-edges`, `static-analysis`).
  2. Execute OWASP MASTG mobile security verification suite.
  3. Implement reproducible build script (`reproducible-build.sh`) stripping host paths and build timestamps.
  4. Publish verified source and APK under `lindisboy/p2pchat`.
- **Verification Gate**:
  - Clean audit pass across all automated checks; reproducible build checksums match across two independent build machines.

---

## 10. Operational Security & Project Maintainer Hygiene

Minimize additional personal and hardware metadata; public ownership and commit history prevent a guarantee of anonymity:
1. **Git & GitHub Cleanliness**:
   - Maintainer handle remains exclusively `lindisboy`.
   - All commits signed with an anonymous GPG subkey generated specifically for this project.
   - Author name and email set to:
     `git config user.name "lindisboy" && git config user.email "lindisboy@users.noreply.github.com"`
2. **Environment Sanitization**:
   - Zero hardcoded local machine paths (e.g., `<home-directory>`) in code, logs, comments, or build configs.
   - All build scripts must run in isolated containers or pass `--trimpath` / environment scrubbing flags.
3. **Zero Telemetry Guarantee**:
   - No Google Play Services dependencies, no Firebase Crashlytics, no Expo telemetry, no third-party analytics SDKs.
   - Application network traffic must remain 100% silent unless the user explicitly initiates gateway synchronization or peer messaging.

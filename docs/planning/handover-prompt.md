# Handover Brief: p2pchat Master Architecture & Implementation Plan

You are taking over engineering execution for **`p2pchat`** (`lindisboy/p2pchat`).

### 1. Project Context & Current State
- **Workspace**: `<repository-root>`
- **Active Git Branch**: `docs/p2pchat-plan`
- **Commit**: `6657e09` (`docs: add master architecture, threat model, and implementation plan`)
- **Master Plan**: `docs/planning/plan.md`
- **Architecture Research**:
  - `docs/planning/research/source-baseline.md` (Upstream source analysis & vulnerabilities)
  - `docs/planning/research/briar-and-platforms.md` (Briar BTP/BSP reverse engineering, Wi-Fi hotspot sharing)
  - `docs/planning/research/evidence-and-network.md` (Forensic evidence custody, ProofMode/WITNESS fixity, LoRa spec)
- **Test Baseline**: 231 tests passing (`npm test`, 82 test suites, zero failures).

---

### 2. Core Constraints & Non-Negotiables
1. **Maintainer Anonymity**:
   - Maintainer handle remains `lindisboy`.
   - Never leak local machine paths, hardware serials, personal emails, or real names into commits, code, logs, or APK/IPA build outputs.
   - Clean, reproducible builds without telemetry, trackers, or Google Play dependencies.
2. **Zero Slop UI & Copy Discipline**:
   - **Zero Emojis**: Emojis are strictly banned across UI, notifications, errors, microcopy, and docs. Use text badges or vetted vector glyphs.
   - **Zero AI-Generated Art**: No synthetic illustrations or decorative filler. Only human-designed vector icons (Lucide / Feather).
   - **Crisis-Mode Design**: High contrast, OLED pitch black (`#000000`), clear typographic hierarchy, distraction-free.
   - **Plain, Direct Language**: Zero AI pleasantries, no false guarantees of "invincibility". Honest consent prompts explaining exact radio and battery trade-offs.
   - **Multi-Language Support**: Preserve and expand catalogs for English, Hindi, Bengali, Marathi, Telugu, Tamil.

---

### 3. Immediate Action Plan (Phase 1 Execution)
Phase 1 focuses on **Cryptographic Core & Storage Hardening**:
1. **Migrate Local Database to SQLCipher**:
   - Upstream stores unencrypted SQLite (`src/lib/db.ts`).
   - Replace with SQLCipher via `op-sqlite` or native binding.
   - Key derivation: 256-bit AES master key generated from hardware-backed keystore (Android Keystore / iOS Secure Enclave).
2. **Atomic Prekey Transactions & Zeroization**:
   - Refactor `saveLocalPrekeys` in `src/lib/db.ts` to be fully atomic (ACID) to prevent crash corruption.
   - Implement explicit memory zeroization (`.fill(0)`) on consumed one-time prekeys and ephemeral ratchet buffers.
3. **Duress Panic Wipe Protocol**:
   - Add decoy PIN trigger in `src/app/settings.tsx` and auth gate.
   - Entering decoy PIN immediately overwrites database master keys, truncates database WAL files, purges keystore aliases, and exits cleanly.

Please inspect `docs/planning/plan.md` to begin implementing Phase 1 tasks.

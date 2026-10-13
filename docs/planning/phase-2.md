# Phase 2 implementation record

Started 13 October 2026. This phase covers BLE admission and background execution. Internet messaging has a separate [design](online-messaging.md).

## Implemented in this increment

- Each connected peer has a 600-packet receive budget. Control, duplicate, malformed, and oversized packets consume it. Repeated connection callbacks do not reset it; disconnect or peer loss does. Packets from unknown sessions are dropped.
- At most 8 packet handlers run concurrently per peer. Excess arrivals are dropped and still consume the session budget. They are not put in an unbounded queue.
- Base64 inputs over 40,000 characters are dropped before allocation. The wire decoder also rejects decoded envelopes over 30,000 bytes.
- The envelope cache admits at most 50,000,000 bytes of base64 bodies across received and locally originated mail. SQLite checks capacity and inserts in one statement, preventing overlapping arrivals from exceeding the budget. Expired envelopes are deleted before admission. Duplicate IDs cannot replace rows or extend their first-sight retention.
- A full cache preserves existing mail and refuses new carry entries. Local decryption/delivery can still happen; refused entries are not forwarded. A rejected outgoing envelope marks its message failed and raises an error. Group fan-out can partially succeed before a refusal, so failure does not prove that no member received it.
- Padding uses fresh random bytes inside the existing encrypted size buckets. This preserves wire compatibility. Random padding does not hide timing, bucket size, or group fan-out.

The byte limit bounds envelope bodies, not SQLite file size, WAL, decrypted messages, indexes, or the 7-day dedup ledgers. A legacy cache already over the limit refuses new entries until expiry frees capacity; it is not silently truncated. The admission query sums row lengths, so its latency needs measurement on a populated phone database.

Per-session quotas limit one encounter. A peer that reconnects or changes identifiers gets a new budget. Sybil resistance, global time-based CPU/traffic budgets, and bounded dedup storage remain open. Native framing runs before JS admission, so these changes do not replace native fragment and connection limits.

## Remaining phase 2 work

1. Android foreground service with an ongoing notification, explicit relay consent, and stop action. BLE callbacks and durable packet handling need an ownership model that survives Activity recreation. Keeping a process alive alone does not prove JS mesh survival. Android documents foreground services as an option for long-lived BLE connections, with restrictions on starting them from the background. See [Android BLE background guidance](https://developer.android.com/develop/connectivity/bluetooth/ble/background).
2. iOS CoreBluetooth state restoration for central and peripheral managers, plus restored connection/service handling. Adding restoration identifiers alone does not reconnect the restored native state to the JS engine. Background BLE operation has restricted scanning/advertising and limited execution time; it is not an 8-hour continuous JS relay guarantee. See [Apple background processing](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html).
3. Measure advertised-tag rotation and address behavior with a BLE sniffer. Apps cannot promise that rotating an advertisement rotates the OS-controlled link-layer MAC or makes a device untrackable.
4. Test quotas and recovery on native SQLCipher builds, including expiry, low disk space, database failures, and oversized native packets.
5. Run the roadmap's 8-hour locked-screen test across Samsung, Xiaomi, Pixel, and Motorola phones. Record delivery, reconnects, permission loss, battery use, and process death. Test iOS separately, including suspension, restoration, force quit, and locked key access.

## Evidence

Automated tests exercise the production admission SQL using Node SQLite, memory-store parity, hostile ingress, session reset, concurrent work, full-cache send failure, local delivery at capacity, and padding compatibility. These are host checks. Native SQLCipher behavior, background execution, RF metadata, and the long-running device gate are not tested by them.

Host validation on 13 October 2026: `npm test` passed 255/255 tests; `npm run typecheck`, `npm run lint`, and `git diff --check` passed. Existing checkout changes were included in those checks.

Documentation delivery check:

- R-02 PASS: both new documents contain no em or en dashes; checked with `rg`.
- R-17/R-18 PASS: test counts come from the runner; no testimonials or invented statistics are included.
- R-23/R-24 PASS: no visual assets or navigation were created; document links point to saved files or retrieved official sources.
- R-36/R-38 PASS: implemented behavior, proposed transport, and untested native behavior are distinguished explicitly. Security claims cite Briar, Tor, Android, or Apple guidance.
- Purpose, liveliness, and UI craftsmanship checks: not applicable to this backend/documentation increment. No visual layout or controls changed.

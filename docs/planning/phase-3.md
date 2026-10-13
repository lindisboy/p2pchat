# Phase 3 progress: brand UI and nearby relay consent

This increment implements the brand UI overhaul and the nearby-relay consent portion of phase 3. It does not complete the phase 3 gateway milestone.

## Implemented

- The shared native theme resolves the brand kit’s DTCG tokens, including light and dark palettes. Teal remains the action color; supporting colors identify conversation types. Anton and Inter are bundled with their OFL licenses.
- The app header, permission screen, launcher and splash use the supplied speech artwork. The supplied texture is used in the settings masthead and permission screen.
- People can browse saved content and settings without enabling Bluetooth. Sending still depends on the real transport state.
- Nearby relay starts off. Settings asks for consent before enabling it and saves the choice in SecureStore. Enabling Bluetooth does not grant relay consent.
- With relay off, incoming ciphertext is still opened for local delivery, but it is not retained or forwarded as other people’s mail. Locally originated messages remain queued and can be reconciled with nearby peers.
- Turning relay off excludes previously carried foreign envelopes from inventories and request responses. Existing cached envelopes expire under the existing retention policy. Already submitted radio sends cannot be recalled.
- Native builds map builder home paths out of compiler diagnostics. The Android artifact workflow rejects APKs that retain the builder’s home or checkout path.
- Panic wipe revokes relay consent as well as clearing the existing identity and message state.

## Remaining

Internet forwarding is unavailable in settings and there is no new internet transport in this release. Private internet messaging should use per-device Tor onion services, with peer addresses bound to contact keys and exchanged through authenticated invites or QR pairing. This does not require the user to provision a central server or supply a gateway address. Integration still requires a native Tor runtime, authenticated connection handling, reconnection and background lifecycle tests. Tor protects connection metadata; application end-to-end encryption remains required, and Tor use itself can be visible to an ISP.

Public broadcast gateways are a separate feature. The current opaque wire envelopes cannot safely be classified as public broadcast versus private ciphertext by a relay. A gateway adapter must accept only authenticated public broadcasts through a separate validated path. It must never export an undifferentiated carry cache.

The existing bounded exact deduplication and store-and-forward implementation remain in use. Bloom reconciliation, gateway authentication, Tor integration, and the three-physical-phone plus server test remain outstanding. Phase 2’s locked-screen/background relay device gate also remains outstanding.

The Android artifact is a standalone preview built with the release variant and the Expo template debug signing key. It is a non-production prerelease; it does not need a Metro server. This is not an independently audited security release.

## Verification

Host tests cover default-off behavior, direct delivery and sending with relay off, turning relay on, withdrawing consent after caching, and rejecting explicit requests for foreign cached packets. The existing multi-node and hostile-input tests continue to run with relay consent explicitly enabled in their fixtures.

Token checks pass all 12 required light/dark contrast pairs. The six-language localization audit passes. Native runtime and build evidence is recorded in the release validation document after inspecting the final APK.

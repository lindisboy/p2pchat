/**
 * Wire constants for the ble-mesh transport.
 *
 * These values are duplicated verbatim in `ios/BleMeshModule.swift` and
 * `android/.../BleMeshModule.kt`. They are the interoperability contract between
 * an iPhone and an Android phone standing next to each other, so a change here
 * that is not made in both native files silently produces two meshes that cannot
 * see each other. Change all three or none.
 */

/**
 * Primary GATT service. Invented for this project — a random 128-bit UUID, not
 * derived from anything, because a service UUID is broadcast in the clear to
 * every radio in range and must therefore carry no information about the user.
 *
 * It IS a stable identifier of "this device is running p2pchat", and that is
 * unavoidable: a mesh peer has to be findable by other mesh peers. See the
 * rotating-identifier note below for what we can and cannot hide.
 */
export const SERVICE_UUID = '7B3C1A80-9F42-4E17-9A6D-2C5E8B1F0D31';

/** Peer -> us. WRITE / WRITE_NO_RESPONSE. Written by a central into our server. */
export const INBOUND_CHARACTERISTIC_UUID = '7B3C1A81-9F42-4E17-9A6D-2C5E8B1F0D31';

/** Us -> peer. NOTIFY. Pushed by our server to a subscribed central. */
export const OUTBOUND_CHARACTERISTIC_UUID = '7B3C1A82-9F42-4E17-9A6D-2C5E8B1F0D31';

// ---------------------------------------------------------------------------
// Framing
// ---------------------------------------------------------------------------

/**
 * Chunk header, 8 bytes, big-endian:
 *
 *   0      version   (0x01)
 *   1      type      (0x00 DATA, 0x01 HELLO)
 *   2..3   messageId uint16 — per-link, per-direction, wraps
 *   4..5   chunkIndex uint16
 *   6..7   chunkCount uint16
 *   8..    payload
 *
 * Deliberately fixed-width and dumb. There is no length field (the ATT layer
 * already delivers exact-length writes), no checksum (a corrupted chunk produces
 * a payload that fails Poly1305 two layers up, and a checksum here would only
 * make a failure look like a different failure) and no retransmission (the mesh
 * above is epidemic — the same envelope arrives again from someone else).
 */
export const FRAME_HEADER_LEN = 8;
export const FRAME_VERSION = 0x01;
export const FRAME_TYPE_DATA = 0x00;
export const FRAME_TYPE_HELLO = 0x01;

/**
 * Hard cap on a reassembled payload. `MAX_ENVELOPE_LEN` in `src/lib/protocol.ts`
 * is 30_000; this sits just above it so the transport is never the layer that
 * rejects a legal envelope, while still being a bound a hostile peer cannot
 * grow.
 */
export const MAX_MESSAGE_BYTES = 32_768;

/**
 * Concurrent partial inbound messages tolerated per peer. Four is generous for
 * an honest peer (which sends one envelope at a time per link) and cheap for a
 * hostile one: 4 x 32 KiB is the entire memory a peer can pin, and the oldest
 * assembly is evicted rather than the newest rejected, so a flooder cannot lock
 * out the legitimate transfer that was already in progress.
 */
export const MAX_ASSEMBLIES_PER_PEER = 4;

/**
 * A partial message older than this is dropped. Without it, a peer that opens
 * thousands of messages and never finishes them exhausts memory for free — the
 * classic reassembly DoS. 30s is far longer than a 30 KB transfer needs even at
 * the 20-byte MTU floor.
 */
export const ASSEMBLY_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Rotating identifiers
// ---------------------------------------------------------------------------

/**
 * How often the advertised ephemeral tag is regenerated.
 *
 * A stable BLE identifier is a tracking beacon: an observer with a handful of
 * cheap receivers around a protest can log "device X was at gate 4 at 14:02 and
 * at the metro at 14:40" without breaking any cryptography. This is open problem
 * #2 in docs/THREAT-MODEL.md and one of the two reasons we left Nearby, which
 * gave us no control over its endpoint id at all.
 *
 * 15 minutes matches the Apple/Google exposure-notification rolling-proximity
 * interval, which solved a near-identical problem, and matches the interval at
 * which iOS rotates its own resolvable private address — rotating faster than
 * the link-layer address buys nothing, because the address is then the stronger
 * identifier.
 */
export const DEFAULT_ROTATION_MS = 15 * 60 * 1000;

/**
 * Bytes of CSPRNG output in an ephemeral tag. 8 bytes = 64 bits, which is the
 * value carried in the in-band HELLO frame and the authoritative one used for
 * link deduplication.
 */
export const EPHEMERAL_TAG_BYTES = 8;

/**
 * Bytes of the tag published in the *advertisement*, as a hint only.
 *
 * A BLE advertisement is 31 bytes total and a 128-bit service UUID already
 * spends 18 of them. Four bytes hex-encoded (8 characters) fits inside what is
 * left on iOS, where the only field CoreBluetooth lets an app control is the
 * local name; the full 8 bytes would overflow and be silently truncated by the
 * OS, which is a far worse failure than deliberately publishing fewer.
 *
 * A 32-bit hint collides occasionally in a large crowd. That is fine because it
 * is never used to decide identity — only to notice "this peer has rotated" and
 * to skip re-connecting to something we already hold a link to. The 64-bit HELLO
 * tag is what deduplication actually keys on.
 */
export const ADVERTISED_TAG_BYTES = 4;

/**
 * A link that has not sent its HELLO within this window is torn down. An
 * un-HELLO'd link cannot be deduplicated and cannot be addressed, so keeping it
 * open only holds a GATT connection slot (Android gives you about seven).
 */
export const HELLO_TIMEOUT_MS = 10_000;

/**
 * No advertisement seen for this long => emit `onPeerLost`. CoreBluetooth has no
 * "lost" callback at all and Android's scanner has no reliable one either, so
 * loss is inferred from silence on both platforms.
 */
export const PEER_STALE_MS = 30_000;

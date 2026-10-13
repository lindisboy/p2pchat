# Internet messaging and ISP visibility

Design proposal, 13 October 2026. Internet transport is not implemented. The app currently selects BLE or an unavailable transport in `src/lib/transport.ts`.

## Recommended architecture

Keep application-level end-to-end encryption and carry those ciphertexts over Tor v3 onion connections. Prefer authenticated contact-to-contact synchronization. Queue mail when a contact is absent; evaluate an optional encrypted mailbox later for contacts who are never online together. A mailbox is a separate trust boundary, not a public broadcast gateway.

[Briar](https://briarproject.org/how-it-works/) uses end-to-end encrypted device synchronization, Tor when internet is available, and local transports when it is not. Briar Mailbox supports asynchronous delivery. This is an architecture reference; the current app does not implement Briar's protocol or inherit its security properties.

Proposed path:

```text
sender encrypts for verified contact
  -> native Tor client
  -> Tor onion rendezvous
  -> recipient's authenticated onion endpoint
  -> recipient decrypts locally
```

[Onion services](https://community.torproject.org/onion-services/overview/) conceal the service's IP address and provide encrypted, authenticated connections. Onion-to-onion delivery does not use a public internet exit relay. Application encryption remains necessary so ciphertext can safely be queued or stored outside the recipient device. An onion address authenticates an endpoint; it does not by itself prove that the endpoint belongs to the contact whose identity was verified.

## Encryption work before online delivery

The current prototype seals messages with X25519, HKDF-SHA256, XChaCha20-Poly1305, and an internal Ed25519 sender signature. Signed prekeys and one-time prekeys support direct/group delivery; fallback to a long-term recipient key remains possible. This is a custom construction, not a reviewed ratcheting messaging protocol. Tor does not repair its forward-secrecy limitations or add post-compromise recovery. See [forward secrecy](../FORWARD-SECRECY.md).

Before shipping private online messaging:

1. Select and review a maintained end-to-end messaging protocol/library with authenticated session setup, ratcheting, replay protection, and durable state. Evaluate native Android/iOS integration and license compatibility before importing code. Do not build a new ratchet from primitives.
2. Bind the contact's onion endpoint to its verified signing identity through a signed endpoint record exchanged inside an authenticated introduction/session. Authenticate the peer on connection as well; a public signature alone permits replay and stale endpoint substitution. Define expiry, rotation, revocation, and key-change handling before freezing the wire format.
3. Keep control traffic, endpoint updates, receipts, and prekey replenishment on the authenticated encrypted path. Do not publish contact identities or a searchable contact directory.
4. Design offline/online dedup and protocol migration together. A captured packet arriving through either path must not trigger duplicate delivery or reset key state.

## What an ISP can observe

| Path | Message content | Destination/contact metadata | Remaining visibility |
|---|---|---|---|
| Direct internet connection with application encryption | Ciphertext | Destination IP remains visible; DNS may reveal a hostname | Timing, volume, endpoints |
| Application encryption over Tor onion transport | Ciphertext | Intended recipient IP is concealed from the sender's ISP | Entry-relay connection, timing, volume; Tor use is often recognizable |
| Tor with a bridge and pluggable transport | Ciphertext | Same onion routing protections | Bridge/proxy connection, timing, volume; recognition is harder, not impossible |

[Tor's pluggable transports](https://support.torproject.org/tor-browser/circumvention/unblocking-tor/) help bypass blocking and disguise Tor traffic. obfs4, WebTunnel, and Snowflake are candidates to evaluate against the selected native backend; their presence in Tor Browser does not establish availability in this app. Bridge distribution is itself a metadata and availability concern.

Tor cannot promise that a strong observer sees no communication relationships. [Tor's entry-guard explanation](https://support.torproject.org/about-tor/how-tor-works/entry-guards/) describes correlation of traffic volume and timing when an adversary observes both ends. Compromised phones and intended recipients can read plaintext. Public broadcasts remain readable by anyone with the app regardless of transport encryption.

## Transport rules

- Internet messaging is off until the user enables it. Nearby relay, private online messaging, and public internet forwarding have separate persisted consent.
- Private online messaging uses a dedicated native Tor adapter. React Native `fetch` does not become Tor-routed by assigning a `.onion` URL; the backend must explicitly route sockets and name resolution through Tor.
- If Tor bootstrap, onion authentication, or the proxy fails, retain queued mail. Never retry private traffic through direct TCP, HTTPS, WebSocket, or local DNS.
- Tor-off stops online sockets and retries. No direct analytics, crash uploads, contact lookup, remote images, or push-registration traffic is added to the private messaging path.
- Public gateway forwarding remains a separate adapter that accepts only explicitly public, authenticated broadcasts. Generic opaque sealed envelopes cannot be classified as public from their outer type. Do not infer eligibility from ciphertext or upload the entire carry cache.
- Do not flood the full BLE inventory across contact onion connections. Define scoped, authenticated sync with bounded queues, expiry, retries, and stream isolation. Consider traffic shaping only with measured privacy and battery tradeoffs; random payload padding alone is insufficient.

The existing phase 3 public gateway must never receive private ciphertext. The user's request for private internet messaging adds a distinct contact transport; it does not remove that gateway boundary.

## Prototype and release gates

Prototype Android first with a native Tor backend supporting v3 client connections and onion hosting. Establish two-device delivery and peer authentication before adding mailboxes. Then validate bridge support and iOS lifecycle feasibility; do not expose online mode as supported on a platform without a working backend.

Capture traffic on an authorized test network. Check for direct recipient connections, local `.onion` DNS requests, background downloads, and connection leaks during bootstrap failure, restarts, network changes, and Tor shutdown. Test replay, stale endpoint records, key substitution, queue overflow, offline/online duplicate delivery, and interrupted crypto-state persistence. Repeat against signed release builds. Keep online mode unavailable until these checks pass and the protocol has independent review.

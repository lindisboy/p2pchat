import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { it } from 'node:test';

import { toBase64 } from '../bytes';
import { ADMIT_ENVELOPE_SQL, MAX_CARRY_BYTES } from '../envelope-cache';
import { EnvelopeType, encodeEnvelope } from '../protocol';
import type { Envelope } from '../protocol';
import { createMemoryStore } from '../store';

const envelope = (n: number): Envelope => ({
  version: 1, type: EnvelopeType.Sealed, id: new Uint8Array(16).fill(n),
  createdAt: 1_800_000, ttlSeconds: 300, hopCount: 0, maxHops: 6,
  payload: new Uint8Array(100),
});

it('uses the production SQL to admit exactly at capacity and refuse the next arrival', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`CREATE TABLE envelopes (
      id TEXT PRIMARY KEY NOT NULL, raw TEXT NOT NULL, created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL, hop_count INTEGER NOT NULL, is_ours INTEGER NOT NULL
    )`);
    const admit = db.prepare(ADMIT_ENVELOPE_SQL);
    const raw = toBase64(encodeEnvelope(envelope(1)));
    const run = (id: string, body = raw, isOurs = 0) => admit.run(
      id, body, 1_800_000, 2_100_000, 0, isOurs, body, MAX_CARRY_BYTES,
    );
    // Model a legacy installation already close to the limit.
    db.prepare('INSERT INTO envelopes VALUES (?, ?, ?, ?, ?, ?)').run(
      'existing-outbound', 'A'.repeat(MAX_CARRY_BYTES - raw.length), 0, 2_100_000, 0, 1,
    );
    assert.equal(run('last-slot').changes, 1);
    assert.equal(run('over-limit').changes, 0);
    assert.equal(run('outbound-over-limit', raw, 1).changes, 0);
    assert.equal(run('last-slot', 'different').changes, 0);
    assert.equal(db.prepare('SELECT SUM(length(raw)) AS size FROM envelopes').get()?.size,
      MAX_CARRY_BYTES);
    assert.equal(db.prepare('SELECT raw FROM envelopes WHERE id = ?').get('last-slot')?.raw, raw);
    db.prepare('DELETE FROM envelopes WHERE id = ?').run('last-slot');
    assert.equal(run('after-expiry').changes, 1);
  } finally {
    db.close();
  }
});

it('memory admission matches capacity, duplicate and expiry semantics', async () => {
  let now = 1_800_000;
  const size = toBase64(encodeEnvelope(envelope(1))).length;
  const store = createMemoryStore(() => now, size);
  assert.equal(await store.storeEnvelope(envelope(1), true), true);
  assert.equal(await store.storeEnvelope(envelope(2)), false);
  assert.equal(await store.storeEnvelope(envelope(1)), false);
  assert.equal(store.envelopes[0].isOurs, true);
  now += 300_000;
  assert.equal(await store.storeEnvelope({ ...envelope(2), createdAt: now }), true);
  assert.equal(store.envelopes.length, 1);
});

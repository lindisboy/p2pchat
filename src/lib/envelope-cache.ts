/** Budget for base64 envelope bodies, including locally originated envelopes. */
export const MAX_CARRY_BYTES = 50_000_000;

// Admission and the size check must be one statement: concurrent arrivals must
// not both reserve the same remaining space. Existing rows are never evicted.
export const ADMIT_ENVELOPE_SQL = `
  INSERT INTO envelopes (id, raw, created_at, expires_at, hop_count, is_ours)
  SELECT ?, ?, ?, ?, ?, ?
  WHERE COALESCE((SELECT SUM(length(raw)) FROM envelopes), 0) + length(?) <= ?
  ON CONFLICT(id) DO NOTHING
`;

import { decodeContactCode } from './contact-code';
export { CONTACT_CODE_PREFIX } from './contact-code';

export const MAX_CONTACT_NAME_LENGTH = 32;

/** Accepts either the raw public id or the exact QR/paste representation. */
export function publicIdFromContactCode(raw: string): string | null {
  const value = raw.trim();
  return decodeContactCode(value)?.identity.publicId ?? null;
}

/** Names are local aliases. Empty aliases are rejected instead of becoming indistinguishable. */
export function cleanContactName(raw: string): string | null {
  const value = Array.from(raw.trim()).slice(0, MAX_CONTACT_NAME_LENGTH).join('');
  return value || null;
}

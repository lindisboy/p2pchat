import 'react-native-get-random-values';

import * as SecureStore from 'expo-secure-store';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

import { equalBytes, fromBase64, toBase64, toUtf8 } from './bytes';

const CREDENTIALS_KEY = 'protestchat.access-pins.v1';
const FAILED_ATTEMPTS_KEY = 'protestchat.access-pin.failures.v1';
const LOCK_UNTIL_KEY = 'protestchat.access-pin.lock-until.v1';
const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30_000;
const PIN_KDF_ITERATIONS = 250_000;

type LegacyPinDigest = { salt: string; digest: string };
type LegacyPinCredentials = { version: 1; normal: LegacyPinDigest; decoy: LegacyPinDigest };
type PinCredentials = {
  version: 2;
  salt: string;
  normal: { digest: string };
  decoy: { digest: string };
};
type StoredPinCredentials = LegacyPinCredentials | PinCredentials;
type PinMatches = { normal: boolean; decoy: boolean };

export type PinResult = 'normal' | 'decoy' | 'invalid' | 'locked';

export function isValidAccessPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export async function hasAccessPin(): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  // A malformed record must keep the gate closed instead of failing open.
  return raw !== null;
}

export async function saveAccessPins(normalPin: string, decoyPin: string): Promise<void> {
  if (!isValidAccessPin(normalPin) || !isValidAccessPin(decoyPin)) {
    throw new Error(`PINs must each contain ${PIN_LENGTH} digits.`);
  }
  if (normalPin === decoyPin) throw new Error('The two PINs must be different.');

  const salt = crypto.getRandomValues(new Uint8Array(16));
  try {
    const credentials: PinCredentials = {
      version: 2,
      salt: toBase64(salt),
      normal: { digest: await digestPin(normalPin, salt) },
      decoy: { digest: await digestPin(decoyPin, salt) },
    };
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } finally {
    salt.fill(0);
  }
  await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(LOCK_UNTIL_KEY).catch(() => {});
}

export async function verifyAccessPin(pin: string): Promise<PinResult> {
  if (!isValidAccessPin(pin)) return 'invalid';
  const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  if (!raw) return 'invalid';

  let credentials: StoredPinCredentials;
  try {
    credentials = JSON.parse(raw) as StoredPinCredentials;
    if (credentials.version !== 1 && credentials.version !== 2) return 'invalid';
  } catch {
    return 'invalid';
  }

  const matches = await matchCredentials(pin, credentials);
  if (matches.decoy) return 'decoy';

  const lockUntil = Number((await SecureStore.getItemAsync(LOCK_UNTIL_KEY)) ?? 0);
  if (Number.isFinite(lockUntil) && lockUntil > 0) {
    if (Date.now() < lockUntil) return 'locked';
    await SecureStore.deleteItemAsync(LOCK_UNTIL_KEY).catch(() => {});
  }

  if (matches.normal) {
    await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(LOCK_UNTIL_KEY).catch(() => {});
    return 'normal';
  }

  const failures = Number((await SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY)) ?? 0) + 1;
  if (failures >= MAX_ATTEMPTS) {
    await SecureStore.setItemAsync(LOCK_UNTIL_KEY, String(Date.now() + LOCK_DURATION_MS), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY).catch(() => {});
  } else {
    await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, String(failures), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  return 'invalid';
}

export async function clearAccessPins(): Promise<void> {
  await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY);
  await SecureStore.deleteItemAsync(LOCK_UNTIL_KEY);
  // Delete credentials last so failed cleanup keeps the gate configured.
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
}

async function digestPin(pin: string, salt: Uint8Array): Promise<string> {
  const pinBytes = toUtf8(pin);
  let digest: Uint8Array | undefined;
  try {
    digest = await pbkdf2Async(sha256, pinBytes, salt, {
      c: PIN_KDF_ITERATIONS,
      dkLen: 32,
    });
    return toBase64(digest);
  } finally {
    pinBytes.fill(0);
    digest?.fill(0);
  }
}

async function matchCredentials(
  pin: string,
  credentials: StoredPinCredentials,
): Promise<PinMatches> {
  if (credentials.version === 1) {
    const decoy = matchesLegacyPin(pin, credentials.decoy);
    const normal = matchesLegacyPin(pin, credentials.normal);
    return { normal, decoy };
  }

  let salt: Uint8Array | undefined;
  let expectedNormal: Uint8Array | undefined;
  let expectedDecoy: Uint8Array | undefined;
  let actual: Uint8Array | undefined;
  let pinBytes: Uint8Array | undefined;
  try {
    salt = fromBase64(credentials.salt);
    expectedNormal = fromBase64(credentials.normal.digest);
    expectedDecoy = fromBase64(credentials.decoy.digest);
    if (salt.length !== 16 || expectedNormal.length !== 32 || expectedDecoy.length !== 32) {
      return { normal: false, decoy: false };
    }
    pinBytes = toUtf8(pin);
    actual = await pbkdf2Async(sha256, pinBytes, salt, {
      c: PIN_KDF_ITERATIONS,
      dkLen: 32,
    });
    return {
      normal: equalBytes(actual, expectedNormal),
      decoy: equalBytes(actual, expectedDecoy),
    };
  } catch {
    return { normal: false, decoy: false };
  } finally {
    salt?.fill(0);
    expectedNormal?.fill(0);
    expectedDecoy?.fill(0);
    actual?.fill(0);
    pinBytes?.fill(0);
  }
}

function matchesLegacyPin(pin: string, stored: LegacyPinDigest): boolean {
  let salt: Uint8Array | undefined;
  let expected: Uint8Array | undefined;
  let pinBytes: Uint8Array | undefined;
  let material: Uint8Array | undefined;
  let actual: Uint8Array | undefined;
  try {
    salt = fromBase64(stored.salt);
    expected = fromBase64(stored.digest);
    pinBytes = toUtf8(pin);
    if (salt.length !== 16 || expected.length !== 32) return false;
    material = concatBytes(salt, pinBytes);
    actual = sha256(material);
    return equalBytes(actual, expected);
  } catch {
    return false;
  } finally {
    salt?.fill(0);
    expected?.fill(0);
    pinBytes?.fill(0);
    material?.fill(0);
    actual?.fill(0);
  }
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

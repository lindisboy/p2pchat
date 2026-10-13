/**
 * Device-bound identity storage.
 *
 * All the actual cryptography lives in crypto-core.ts, which has no React
 * Native imports and is covered by `npm test`. This file is only the part that
 * cannot run off-device: the keystore.
 */

// Must be first. @noble reaches for crypto.getRandomValues at call time, and
// Hermes does not provide it.
import 'react-native-get-random-values';

import * as SecureStore from 'expo-secure-store';

import { fromBase64, toBase64 } from './bytes';
import type { Identity } from './crypto-core';
import { identityFromSeed } from './crypto-core';

export * from './crypto-core';

const SEED_KEY = 'protestchat.identity.seed.v1';

/**
 * Loads the device identity, creating one on first run.
 *
 * WHEN_UNLOCKED_THIS_DEVICE_ONLY is deliberate: the seed must not ride an
 * iCloud/Google backup off the phone, and it must be unreadable while the
 * device is locked.
 */
export async function loadOrCreateIdentity(): Promise<Identity> {
  const existing = await SecureStore.getItemAsync(SEED_KEY);
  if (existing) {
    const seed = fromBase64(existing);
    try {
      return identityFromSeed(seed);
    } finally {
      seed.fill(0);
    }
  }

  const seed = crypto.getRandomValues(new Uint8Array(32));
  try {
    await SecureStore.setItemAsync(SEED_KEY, toBase64(seed), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return identityFromSeed(seed);
  } finally {
    seed.fill(0);
  }
}

/** Destroys the identity. Callers must also drop any in-memory copy. */
export async function destroyIdentity(): Promise<void> {
  await SecureStore.deleteItemAsync(SEED_KEY);
}

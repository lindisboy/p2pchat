const store = new Map<string, string>();

export const AFTER_FIRST_UNLOCK = 1;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 2;
export const ALWAYS = 3;
export const ALWAYS_THIS_DEVICE_ONLY = 4;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 5;
export const WHEN_UNLOCKED = 6;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 7;

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}

export async function getItemAsync(key: string): Promise<string | null> {
  return store.has(key) ? store.get(key)! : null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  store.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  store.delete(key);
}

export function __resetStore(): void {
  store.clear();
}

export function __dumpStore(): Map<string, string> {
  return new Map(store);
}

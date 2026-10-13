/**
 * Lets `node --test` resolve the extensionless relative imports that Metro
 * accepts natively (`./bytes` -> `./bytes.ts`).
 *
 * The alternative was writing `.ts` extensions throughout src/lib purely to
 * satisfy the test runner, which would put test-runner concerns into the
 * shipping source. This keeps that cost in one file nobody has to read.
 */

import { registerHooks } from 'node:module';

const mockSecureStore = new URL(
  '../src/lib/__tests__/mocks/expo-secure-store.ts',
  import.meta.url,
).href;
const mockRandomValues = new URL(
  '../src/lib/__tests__/mocks/react-native-get-random-values.ts',
  import.meta.url,
).href;

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'expo-secure-store') {
      return next(mockSecureStore, context);
    }
    if (specifier === 'react-native-get-random-values') {
      return next(mockRandomValues, context);
    }
    if (specifier.startsWith('.')) {
      for (const candidate of [`${specifier}.ts`, `${specifier}.tsx`, `${specifier}/index.ts`]) {
        try {
          return next(candidate, context);
        } catch {
          // fall through and try the next extension
        }
      }
    }
    return next(specifier, context);
  },
});

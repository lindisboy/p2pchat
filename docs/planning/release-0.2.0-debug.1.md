# p2pchat 0.2.0 debug preview validation

This preview applies the supplied P2PCHAT brand kit and adds persisted, default-off nearby-relay consent. It is a partial phase 3 increment. Private Tor transport, public broadcast gateways, Bloom reconciliation, the three-phone gateway test and phase 2's physical background-relay gate remain outstanding.

## Artifact

- Android package: `com.anonymous.p2pchat`, version `0.2.0`, version code `2`.
- Standalone release variant, signed with the Expo template debug key. No Metro server is required. This is a non-production prerelease.
- Minimum Android SDK 24, target SDK 36; universal APK includes arm64-v8a, armeabi-v7a, x86 and x86_64.
- APK SHA-256: `f991fe663b07f4be6b2505cabb663cdd062540ad514c8700133ec338f02dfb7e` (162,375,628 bytes).
- APK signature verification and the whole-archive builder-path check pass. The metadata gate also rejects a deliberately contaminated negative fixture. No independent security audit is claimed.

## Automated checks

- Host tests: 260 passed, 89 suites, zero failures or skipped tests. New consent tests exercise direct local delivery with relay off, foreign cache exclusion, explicit request rejection and re-enabling relay.
- TypeScript app and test projects: passed.
- ESLint: passed.
- Localization: all six language catalogs and 18 native permission entries pass the audit.
- Brand tokens: 131 tokens across two JSON files; all aliases resolve and all 12 required light/dark semantic contrast pairs pass. Interactive action-state pairs are recorded in the kit's contrast report.

## Android runtime checks

The final APK was installed on an Android 14 / API 34 headless emulator at 320 by 640 dp. Checks cover permission-screen scrolling, browsing without Bluetooth, conversation tabs, settings, light/dark themes, large text, Hindi fallback, relay consent and preference persistence across an app restart. Screenshots in `docs/preview/0.2.0-debug.1` show actual native rendering without invented messages.

Android recreates the activity when the system theme changes, then resynchronizes React Native appearance. This resets the current navigation and permission-screen admission; saved messages and the relay preference remain persisted. Permission-screen scrolling at 130% text size stays below the system bar.

These checks verify UI and saved consent, not real BLE exchange. No physical-phone radio, locked-screen survival, iOS runtime or Tor connection test was performed for this preview.

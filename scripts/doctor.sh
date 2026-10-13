#!/usr/bin/env bash
# Checks whether this machine can actually build the app, and says precisely
# what to do about anything missing.
#
# Exists because the two most common blockers — Xcode's command-line tools
# pointing at the wrong directory, and Android Studio never having downloaded
# its SDK — both fail with errors that do not name the fix.

set -uo pipefail

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; FAILED=1; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
fix()  { printf '      → %s\n' "$1"; }

FAILED=0
echo
echo "p2pchat build doctor"
echo

# ---------------------------------------------------------------- iOS --------
echo "iOS"
if [ ! -d /Applications/Xcode.app ]; then
  bad "Xcode is not installed"
  fix "Install it from the App Store"
else
  ok "Xcode is installed"

  DEV_DIR="$(xcode-select -p 2>/dev/null)"
  if [[ "$DEV_DIR" != *"Xcode.app"* ]]; then
    bad "xcode-select points at: ${DEV_DIR:-nothing}"
    fix "sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  else
    ok "xcode-select points at Xcode"
  fi

  if ! xcodebuild -version >/dev/null 2>&1; then
    bad "xcodebuild cannot run (licence not accepted?)"
    fix "sudo xcodebuild -license accept"
  else
    ok "xcodebuild works — $(xcodebuild -version | head -1)"
  fi

  if command -v pod >/dev/null 2>&1; then
    ok "CocoaPods $(pod --version 2>/dev/null)"
  else
    bad "CocoaPods is missing"
    fix "brew install cocoapods"
  fi
fi

# ------------------------------------------------------------ Android --------
echo
echo "Android"
if [ ! -d "/Applications/Android Studio.app" ]; then
  bad "Android Studio is not installed"
else
  ok "Android Studio is installed"
fi

SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [ ! -d "$SDK" ]; then
  bad "Android SDK not found at $SDK"
  fix "Open Android Studio once and let its setup wizard download the SDK"
else
  ok "Android SDK at $SDK"
  [ -d "$SDK/platform-tools" ] && ok "platform-tools present" \
    || { bad "platform-tools missing"; fix "Android Studio → SDK Manager → SDK Tools"; }
fi

JBR="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
if [ -x "$JBR/bin/java" ]; then
  ok "JDK available (bundled with Android Studio)"
elif command -v java >/dev/null 2>&1; then
  ok "JDK on PATH — $(java -version 2>&1 | head -1)"
else
  bad "No JDK"
  fix "Install Android Studio, which bundles one"
fi

# ------------------------------------------------------------- devices -------
echo
echo "Devices"
if [ -x "$SDK/platform-tools/adb" ]; then
  COUNT=$("$SDK/platform-tools/adb" devices 2>/dev/null | grep -cw device || true)
  [ "$COUNT" -gt 0 ] && ok "$COUNT Android device(s) connected" \
    || warn "No Android device. Plug one in, enable USB debugging, accept the prompt."
else
  warn "adb unavailable — cannot check for Android devices"
fi

if command -v xcrun >/dev/null 2>&1 && xcrun xctrace list devices >/dev/null 2>&1; then
  IOS=$(xcrun xctrace list devices 2>/dev/null | grep -c "^[^=]*([0-9.]*) (" || true)
  [ "${IOS:-0}" -gt 0 ] && ok "iOS device(s)/simulator(s) visible" \
    || warn "No iPhone visible. Plug one in and tap Trust."
else
  warn "Cannot list iOS devices yet (fix xcode-select first)"
fi

# --------------------------------------------------------------- note --------
echo
if [ "$FAILED" -eq 1 ]; then
  echo "Fix the ✗ items above, then run this again."
else
  echo "Ready. Next:  npm run android   or   npm run ios"
fi
echo
echo "Reminder: the mesh CANNOT be tested in a simulator or emulator — neither"
echo "has a real Bluetooth radio. Two physical phones are required."
echo
exit 0

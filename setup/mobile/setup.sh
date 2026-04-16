#!/bin/bash
# setup/mobile/setup.sh — mobile dev environment setup
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "MOBILE SETUP"
info "Expo (React Native) — Android-first, local builds."
info "Develop via Expo Go (QR code) or build + install via ADB."
warn "Requires Android SDK. iOS: optional (macOS + Xcode only)."
echo ""

prompt_input "Set up mobile dev environment? (s=skip)" _CONFIRM || {
  skip "Skipping mobile setup."
  write_state "mobile" "skipped" "user skipped"
  exit 0
}

# 1. Expo CLI
info "Checking Expo CLI..."
if npx expo --version > /dev/null 2>&1; then
  success "Expo CLI: $(npx expo --version)"
else
  info "Installing Expo CLI..."
  npm install -g expo-cli && success "Expo CLI installed" || warn "Expo CLI install failed"
fi

# 2. Android SDK
echo ""
info "Checking Android SDK..."
if [ -n "${ANDROID_HOME:-}" ] && [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
  success "Android SDK: $ANDROID_HOME"
else
  warn "Android SDK not found."
  echo ""
  arrow "Download Android Studio: https://developer.android.com/studio"
  arrow "Install, open → SDK Manager → install: Android SDK Platform 34 + Build-Tools"
  arrow "Copy SDK path (shown in SDK Manager top bar)"
  echo ""
  prompt_input "Paste Android SDK path (s=skip)" ANDROID_HOME_INPUT || {
    skip "Skipping Android SDK config."
    ANDROID_HOME_INPUT=""
  }
  if [ -n "$ANDROID_HOME_INPUT" ]; then
    ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
    {
      echo ""
      echo "# Android SDK"
      echo "ANDROID_HOME=$ANDROID_HOME_INPUT"
      echo "PATH=\$ANDROID_HOME/platform-tools:\$PATH"
    } >> "$ENV_FILE"
    success "ANDROID_HOME written to .env.local"
    export ANDROID_HOME="$ANDROID_HOME_INPUT"
  fi
fi

# 3. ADB device check
echo ""
info "ADB device check..."
if command -v adb > /dev/null 2>&1; then
  DEVICES=$(adb devices 2>/dev/null | grep -v "List of devices" | grep -v "^$" | wc -l | tr -d ' ')
  if [ "$DEVICES" -gt 0 ]; then
    success "Device(s) found: $DEVICES"
    adb devices | grep -v "List of devices" | grep -v "^$"
  else
    warn "No device connected."
    info "Connect Android device via USB + enable USB Debugging."
    info "Check later: adb devices"
  fi
else
  warn "adb not in PATH. Set ANDROID_HOME first."
fi

# 4. Expo Go guidance
echo ""
info "Expo Go for fastest iteration:"
arrow "Android: https://play.google.com/store/apps/details?id=host.exp.exponent"
arrow "iOS:     https://apps.apple.com/app/expo-go/id982107779"
info "Then: just mobile-dev → scan QR → live reload on device"

# 5. Xcode (macOS only, optional)
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo ""
  if xcode-select -p > /dev/null 2>&1; then
    success "Xcode: $(xcode-select -p)"
  else
    skip "Xcode not found — iOS builds unavailable. Android unaffected."
  fi
fi

# 6. Write project.yaml
write_yaml "mobile" "true"
write_yaml "mobile_platform" "android"

echo ""
success "Mobile setup complete."
write_state "mobile" "ok"

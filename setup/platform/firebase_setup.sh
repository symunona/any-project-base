#!/bin/bash
# setup/platform/firebase_setup.sh — Firebase + FCM setup
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

PUSH=$(read_yaml "push_notifications")
if [ "$PUSH" != "firebase" ]; then
  info "push_notifications is not 'firebase' in project.yaml — Firebase not needed."
  info "To enable: set 'push_notifications: firebase' in project.yaml, then re-run: just setup-firebase"
  write_state "firebase" "skipped" "push_notifications!=firebase"
  exit 0
fi

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
[ -f "$ENV_FILE" ] || touch "$ENV_FILE"

set_env() {
  local key=$1 value=$2
  [ -z "$value" ] && return
  grep -q "^${key}=.\+" "$ENV_FILE" 2>/dev/null && return
  sed -i "/^${key}=$/d" "$ENV_FILE" 2>/dev/null || true
  echo "${key}=${value}" >> "$ENV_FILE"
  success "$key"
}

header "FIREBASE + FCM"
info "Firebase Cloud Messaging: push notifications for mobile app."
warn "Without this: push notifications disabled."
echo ""

# ── Try Firebase CLI path first ───────────────────────
USE_CLI=0
if command -v firebase &>/dev/null; then
  info "Firebase CLI found."
  if firebase projects:list &>/dev/null 2>&1; then
    info "Already authenticated."
    USE_CLI=1
  else
    arrow "Not logged in. Run: firebase login"
    arrow "(or press s to enter keys manually)"
    prompt_input "Press Enter after 'firebase login' completes" _dummy || USE_CLI=0
    if firebase projects:list &>/dev/null 2>&1; then USE_CLI=1; fi
  fi
fi

if [ "$USE_CLI" = "1" ]; then
  echo ""
  info "Your Firebase projects:"
  firebase projects:list 2>/dev/null | head -20
  echo ""

  prompt_input "Firebase Project ID (from list above)" FIREBASE_PROJECT_ID || USE_CLI=0
fi

if [ "$USE_CLI" = "1" ] && [ -n "${FIREBASE_PROJECT_ID:-}" ]; then
  echo ""
  info "Fetching SDK config via Firebase CLI..."

  # Get web app SDK config (uses first web app found)
  SDK_RAW=$(firebase apps:sdkconfig WEB --project "$FIREBASE_PROJECT_ID" 2>/dev/null || true)

  if [ -n "$SDK_RAW" ]; then
    parse_sdk_val() { echo "$SDK_RAW" | grep "$1" | sed "s/.*['\"]\\([^'\"]*\\)['\"].*/\\1/" | tail -1; }

    set_env "VITE_FIREBASE_PROJECT_ID"          "$FIREBASE_PROJECT_ID"
    set_env "VITE_FIREBASE_AUTH_DOMAIN"         "${FIREBASE_PROJECT_ID}.firebaseapp.com"
    set_env "VITE_FIREBASE_API_KEY"             "$(parse_sdk_val 'apiKey')"
    set_env "VITE_FIREBASE_MESSAGING_SENDER_ID" "$(parse_sdk_val 'messagingSenderId')"
    set_env "VITE_FIREBASE_APP_ID"              "$(parse_sdk_val 'appId')"
    success "SDK config populated from CLI."
  else
    warn "No web app found in project '$FIREBASE_PROJECT_ID'."
    info "Create one at: Firebase Console → Project Settings → Your apps → Add app → Web"
    USE_CLI=0
  fi

  echo ""
  info "Service account: download manually from Firebase Console."
  arrow "Firebase Console → Project Settings → Service accounts → Generate new private key"
  prompt_input "Path to downloaded service account JSON" FIREBASE_SA_PATH || FIREBASE_SA_PATH=""
  if [ -n "$FIREBASE_SA_PATH" ] && [ -f "$FIREBASE_SA_PATH" ]; then
    set_env "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SA_PATH"
  fi
fi

# ── Manual fallback ───────────────────────────────────
if [ "$USE_CLI" = "0" ]; then
  echo ""
  info "Manual setup:"
  arrow "Firebase Console → Project settings → Service accounts → Generate new private key"
  echo ""
  prompt_input "Path to Firebase service account JSON" FIREBASE_SA_PATH || {
    skip "Skipping Firebase. Push notifications disabled."
    write_state "firebase" "skipped" "push notifications disabled"
    exit 0
  }

  if [ ! -f "$FIREBASE_SA_PATH" ]; then
    fail "File not found: $FIREBASE_SA_PATH"
    write_state "firebase" "fail" "service account file not found"
    exit 1
  fi

  FIREBASE_PROJECT_ID=$(node -e "const j=require('$FIREBASE_SA_PATH'); console.log(j.project_id||'')" 2>/dev/null)
  if [ -z "$FIREBASE_PROJECT_ID" ]; then
    fail "Could not read project_id from service account JSON."
    write_state "firebase" "fail" "invalid JSON"
    exit 1
  fi

  set_env "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SA_PATH"
  set_env "VITE_FIREBASE_PROJECT_ID"      "$FIREBASE_PROJECT_ID"
  set_env "VITE_FIREBASE_AUTH_DOMAIN"     "${FIREBASE_PROJECT_ID}.firebaseapp.com"

  prompt_input "Firebase Web API Key (Project settings → General → Your apps)" FIREBASE_API_KEY || FIREBASE_API_KEY=""
  set_env "VITE_FIREBASE_API_KEY" "$FIREBASE_API_KEY"
fi

# ── VAPID key — always manual ─────────────────────────
echo ""
info "VAPID key (required for web push):"
arrow "Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Generate key pair"
prompt_input "VAPID key" VAPID_KEY || VAPID_KEY=""
set_env "VITE_FIREBASE_VAPID_KEY" "$VAPID_KEY"

# ── Finalise ──────────────────────────────────────────
write_yaml "push_notifications" "firebase"
FINAL_PID=${FIREBASE_PROJECT_ID:-unknown}
success "Firebase configured. Project: $FINAL_PID"
write_state "firebase" "ok" "$FINAL_PID"

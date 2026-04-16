#!/bin/bash
# setup/platform/firebase_setup.sh — Firebase + FCM setup
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

header "FIREBASE + FCM"
info "Firebase Cloud Messaging: push notifications for mobile app."
warn "Without this: push notifications disabled."
echo ""

arrow "Go to https://console.firebase.google.com"
arrow "Create project (or use existing)"
arrow "Project settings → Service accounts → Generate new private key → download JSON"
arrow "Project settings → Cloud Messaging → Server key (or V1 API)"
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

# Extract project ID
FIREBASE_PROJECT_ID=$(node -e "const j=require('$FIREBASE_SA_PATH'); console.log(j.project_id||'')" 2>/dev/null)
if [ -z "$FIREBASE_PROJECT_ID" ]; then
  fail "Could not read project_id from service account JSON."
  write_state "firebase" "fail" "invalid JSON"
  exit 1
fi

prompt_input "Firebase Web API Key (from Project settings → General)" FIREBASE_API_KEY || FIREBASE_API_KEY=""

ENV_FILE="$(cd "$SETUP_DIR/.." && pwd)/.env.local"
{
  echo ""
  echo "# Firebase"
  echo "FIREBASE_SERVICE_ACCOUNT_PATH=$FIREBASE_SA_PATH"
  echo "FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
  [ -n "$FIREBASE_API_KEY" ] && echo "VITE_FIREBASE_API_KEY=$FIREBASE_API_KEY"
} >> "$ENV_FILE"

write_yaml "push_notifications" "fcm"
success "Firebase configured. Project: $FIREBASE_PROJECT_ID"
write_state "firebase" "ok" "$FIREBASE_PROJECT_ID"

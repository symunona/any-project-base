#!/bin/bash
# setup/branding/apply-branding.sh
# Propagates branding/ → all targets (CSS vars, manifests, app.json, logos, email templates)
set -euo pipefail
SETUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "$SETUP_DIR/.." && pwd)"
source "$SETUP_DIR/lib/ui.sh"
source "$SETUP_DIR/lib/yaml.sh"

BRANDING_DIR="$ROOT_DIR/branding"
COLORS_FILE="$BRANDING_DIR/colors.yaml"

header "APPLY BRANDING"

if [ ! -f "$COLORS_FILE" ]; then
  fail "branding/colors.yaml not found. Run: just setup-branding"
  exit 1
fi

read_color() {
  grep "^$1:" "$COLORS_FILE" | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"' | tr -d "'" | tr -d '[:space:]'
}

PRIMARY=$(read_color "primary")
SECONDARY=$(read_color "secondary")
ACCENT=$(read_color "accent")
SUCCESS_COLOR=$(read_color "success")
DANGER=$(read_color "danger")
APP_NAME=$(read_yaml "display_name")
APP_NAME=${APP_NAME:-"App"}

[ -z "$PRIMARY" ] && { fail "palette.js missing 'primary'. Regenerate: just setup branding"; exit 1; }

# Read previous brand colors from project.yaml before overwriting them
PREV_PRIMARY=$(grep '^ *primary:' "$ROOT_DIR/project.yaml" 2>/dev/null | grep -oE '#[0-9a-fA-F]{6}' | head -1 || true)
PREV_DANGER=$(grep '^ *danger:' "$ROOT_DIR/project.yaml" 2>/dev/null | grep -oE '#[0-9a-fA-F]{6}' | head -1 || true)
PREV_PRIMARY="${PREV_PRIMARY:-#4f46e5}"
PREV_DANGER="${PREV_DANGER:-#dc2626}"
# Original hex values baked into the seeding migration
EMAIL_SEED_PRIMARY="#4f46e5"
EMAIL_SEED_DANGER="#dc2626"

info "Primary:   $PRIMARY"
info "Secondary: $SECONDARY"
info "Accent:    $ACCENT"
echo ""

# ── Update commons/styles/globals.css ──────────────────────────────────────
CSS_FILE="$ROOT_DIR/commons/styles/globals.css"
if [ -f "$CSS_FILE" ]; then
  sed -i \
    -e "s|--color-primary: .*;|--color-primary: $PRIMARY;|" \
    -e "s|--color-secondary: .*;|--color-secondary: $SECONDARY;|" \
    -e "s|--color-accent: .*;|--color-accent: $ACCENT;|" \
    -e "s|--color-success: .*;|--color-success: $SUCCESS_COLOR;|" \
    -e "s|--color-danger: .*;|--color-danger: $DANGER;|" \
    "$CSS_FILE"
  success "commons/styles/globals.css updated"
fi

# ── Update landing/styles/globals.css ──────────────────────────────────────
LANDING_CSS="$ROOT_DIR/landing/styles/globals.css"
if [ -f "$LANDING_CSS" ]; then
  sed -i \
    -e "s|--color-primary: .*;|--color-primary: $PRIMARY;|" \
    -e "s|--color-secondary: .*;|--color-secondary: $SECONDARY;|" \
    -e "s|--color-accent: .*;|--color-accent: $ACCENT;|" \
    -e "s|--color-success: .*;|--color-success: $SUCCESS_COLOR;|" \
    -e "s|--color-danger: .*;|--color-danger: $DANGER;|" \
    "$LANDING_CSS"
  success "landing/styles/globals.css updated"
fi

# ── Copy logos ──────────────────────────────────────────────────────────────
for logo in logo-large.svg logo-small.svg logo-favicon.svg; do
  for dir in client-portal/public admin-portal/public landing/public; do
    if [ -f "$BRANDING_DIR/$logo" ] && [ -d "$ROOT_DIR/$dir" ]; then
      cp "$BRANDING_DIR/$logo" "$ROOT_DIR/$dir/$logo"
    fi
  done
done

# Copy favicon.svg (referenced by index.html in each portal)
if [ -f "$BRANDING_DIR/logo-favicon.svg" ]; then
  for dir in client-portal/public admin-portal/public; do
    [ -d "$ROOT_DIR/$dir" ] && cp "$BRANDING_DIR/logo-favicon.svg" "$ROOT_DIR/$dir/favicon.svg"
  done
  # Landing uses assets/favicon.svg directly (no public/ dir)
  [ -f "$ROOT_DIR/landing/assets/favicon.svg" ] && cp "$BRANDING_DIR/logo-favicon.svg" "$ROOT_DIR/landing/assets/favicon.svg"
fi
success "Logos copied to portal public/ dirs"

# ── Inline logo-mark in landing/index.html ──────────────────────────────────
LANDING_HTML="$ROOT_DIR/landing/index.html"
LOGO_MARK="$BRANDING_DIR/logo-small.svg"
if [ -f "$LANDING_HTML" ] && [ -f "$LOGO_MARK" ]; then
  SVG_CONTENT=$(cat "$LOGO_MARK")
  python3 - <<PYEOF
import re, sys
html = open('$LANDING_HTML').read()
inner = open('$LOGO_MARK').read().strip()
# Wrap with size attrs matching nav usage, preserve markers
replacement = '<!-- LOGO-MARK-START -->\n      ' + \
  re.sub(r'^<svg', '<svg width="48" height="48"', inner, count=1) + \
  '\n      <!-- LOGO-MARK-END -->'
html = re.sub(
  r'<!-- LOGO-MARK-START -->.*?<!-- LOGO-MARK-END -->',
  replacement, html, flags=re.DOTALL)
open('$LANDING_HTML', 'w').write(html)
PYEOF
  success "landing/index.html inline logo-mark updated"
fi

# ── Update client-portal/public/manifest.json ──────────────────────────────
MANIFEST="$ROOT_DIR/client-portal/public/manifest.json"
if [ -f "$MANIFEST" ]; then
  node -e "
const fs = require('fs');
const m = JSON.parse(fs.readFileSync('$MANIFEST','utf8'));
m.name = '$APP_NAME';
m.short_name = '$APP_NAME';
m.theme_color = '$PRIMARY';
m.background_color = '$PRIMARY';
fs.writeFileSync('$MANIFEST', JSON.stringify(m, null, 2));
"
  success "client-portal/public/manifest.json updated"
fi

# ── Update mobile-app/app.json branding fields ─────────────────────────────
APP_JSON="$ROOT_DIR/mobile-app/app.json"
if [ -f "$APP_JSON" ]; then
  node -e "
const fs = require('fs');
const a = JSON.parse(fs.readFileSync('$APP_JSON','utf8'));
a.expo.name = '$APP_NAME';
a.expo.primaryColor = '$PRIMARY';
a.expo.splash = { ...a.expo.splash, backgroundColor: '$PRIMARY' };
if (a.expo.android) a.expo.android.navigationBarColor = '$PRIMARY';
fs.writeFileSync('$APP_JSON', JSON.stringify(a, null, 2));
"
  success "mobile-app/app.json branding fields updated"
fi

# ── Update email template migration SQL ────────────────────────────────────
EMAIL_SQL="$ROOT_DIR/supabase/migrations/20260429000001_email_templates_v2.sql"
if [ -f "$EMAIL_SQL" ]; then
  [ "$PREV_PRIMARY" != "$PRIMARY" ] && sed -i "s/${PREV_PRIMARY}/${PRIMARY}/g" "$EMAIL_SQL"
  [ "$EMAIL_SEED_PRIMARY" != "$PRIMARY" ] && sed -i "s/${EMAIL_SEED_PRIMARY}/${PRIMARY}/g" "$EMAIL_SQL"
  [ "$PREV_DANGER" != "$DANGER" ] && sed -i "s/${PREV_DANGER}/${DANGER}/g" "$EMAIL_SQL"
  [ "$EMAIL_SEED_DANGER" != "$DANGER" ] && sed -i "s/${EMAIL_SEED_DANGER}/${DANGER}/g" "$EMAIL_SQL"
  success "Email template migration SQL updated"
fi

# ── Update email templates in DB (if Supabase running) ─────────────────────
DB_URL=$(supabase status 2>/dev/null | grep "DB URL" | awk '{print $NF}' || true)
if [ -n "$DB_URL" ]; then
  if psql "$DB_URL" -q 2>/dev/null <<SQL
UPDATE public.email_templates
  SET body_html = replace(replace(body_html, '${PREV_PRIMARY}', '${PRIMARY}'), '${EMAIL_SEED_PRIMARY}', '${PRIMARY}')
  WHERE body_html IS NOT NULL;
UPDATE public.email_templates
  SET body_html = replace(replace(body_html, '${PREV_DANGER}', '${DANGER}'), '${EMAIL_SEED_DANGER}', '${DANGER}')
  WHERE body_html IS NOT NULL;
SQL
  then
    success "Email templates updated in DB"
  else
    warn "DB update failed — re-run after fixing DB connection"
  fi
else
  warn "Supabase not running — email templates NOT updated in DB. Re-run after: just start"
fi

# ── Update project.yaml theme_colors ───────────────────────────────────────
PROJ_YAML="$ROOT_DIR/project.yaml"
if [ -f "$PROJ_YAML" ]; then
  sed -i \
    -e "s|^  primary:.*|  primary:   \"$PRIMARY\"|" \
    -e "s|^  secondary:.*|  secondary: \"$SECONDARY\"|" \
    -e "s|^  accent:.*|  accent:    \"$ACCENT\"|" \
    -e "s|^  success:.*|  success:   \"$SUCCESS_COLOR\"|" \
    -e "s|^  danger:.*|  danger:    \"$DANGER\"|" \
    "$PROJ_YAML"
  success "project.yaml theme_colors updated"
fi

# ── Update branding/colors.yaml ────────────────────────────────────────────
cat > "$BRANDING_DIR/colors.yaml" <<EOF
# Branding colors — generated by apply-branding.sh
primary:   $PRIMARY
secondary: $SECONDARY
accent:    $ACCENT
success:   $SUCCESS_COLOR
danger:    $DANGER
EOF
success "branding/colors.yaml updated"

echo ""
success "Branding applied to all targets."
info "Rebuild to see changes: just build"

#!/bin/bash
# setup/checks/supply_chain_autofix.sh
# Auto-fix patchable vulnerabilities from pnpm audit.
#
# Strategy:
#   direct deps  — bump version in package.json to patched minimum (non-major only)
#   transitive   — add/update pnpm.overrides in package.json
#
# Always runs `pnpm install` at the end to apply changes.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
source "$(dirname "${BASH_SOURCE[0]}")/../lib/ui.sh"

header "SECURITY AUTOFIX"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

info "Running pnpm audit..."
pnpm audit --json > "$TMP/audit.json" 2>/dev/null || true

python3 - "$TMP/audit.json" package.json "$TMP/report.txt" <<'PYEOF'
import json, re, sys

def parse_version(v):
    m = re.search(r"(\d+)\.(\d+)\.(\d+)", str(v))
    return tuple(int(x) for x in m.groups()) if m else None

with open(sys.argv[1]) as f:
    audit = json.load(f)
with open(sys.argv[2]) as f:
    pkg = json.load(f)

vulns = audit.get("metadata", {}).get("vulnerabilities", {})
if sum(vulns.values()) == 0:
    open(sys.argv[3], "w").write("CLEAN\n")
    sys.exit(0)

direct_all = {
    **pkg.get("dependencies", {}),
    **pkg.get("devDependencies", {}),
}
pnpm_section = pkg.setdefault("pnpm", {})
overrides    = pnpm_section.setdefault("overrides", {})

fixed_direct     = []
fixed_transitive = []
skipped          = []

seen = set()
for adv in audit.get("advisories", {}).values():
    module   = adv.get("module_name", "")
    patched  = adv.get("patched_versions", "")
    severity = adv.get("severity", "")

    if module in seen:
        continue
    seen.add(module)

    safe_ver = parse_version(patched)
    if not safe_ver:
        skipped.append((module, severity, f"no parseable fix in: {patched!r}"))
        continue

    safe_str = ".".join(str(x) for x in safe_ver)

    if module in direct_all:
        current_raw = re.sub(r"^[\^~>=<\s]+", "", direct_all[module])
        cur_ver = parse_version(current_raw)
        if not cur_ver:
            skipped.append((module, severity, f"unparseable current: {direct_all[module]!r}"))
            continue
        if cur_ver[0] != safe_ver[0]:
            skipped.append((module, severity, f"major bump {current_raw} → {safe_str} — fix manually"))
            continue
        if cur_ver >= safe_ver:
            continue  # already safe

        for section in ("dependencies", "devDependencies"):
            if module in pkg.get(section, {}):
                pkg[section][module] = safe_str
        fixed_direct.append((module, severity, f"{current_raw} → {safe_str}"))

    else:
        existing = overrides.get(module, "")
        ex_ver   = parse_version(existing)
        if ex_ver and ex_ver >= safe_ver:
            continue  # already pinned safely
        overrides[module] = f">={safe_str}"
        fixed_transitive.append((module, severity, f"pnpm.overrides → >={safe_str}"))

# Write updated package.json
with open(sys.argv[2], "w") as f:
    json.dump(pkg, f, indent=2)
    f.write("\n")

# Write human-readable report to tmp file
lines = []
if fixed_direct:
    lines.append("DIRECT")
    for m, sev, note in fixed_direct:
        lines.append(f"  [{sev.upper():8}] {m}: {note}")
if fixed_transitive:
    lines.append("TRANSITIVE")
    for m, sev, note in fixed_transitive:
        lines.append(f"  [{sev.upper():8}] {m}: {note}")
if skipped:
    lines.append("SKIPPED (need manual fix)")
    for m, sev, note in skipped:
        lines.append(f"  [{sev.upper():8}] {m}: {note}")
if not lines:
    lines.append("Nothing to fix — all known vulnerabilities lack patches or are already resolved.")

open(sys.argv[3], "w").write("\n".join(lines) + "\n")
PYEOF

# Print report
cat "$TMP/report.txt"
echo ""

if grep -q "^DIRECT\|^TRANSITIVE" "$TMP/report.txt"; then
  info "Applying changes via pnpm install..."
  pnpm install 2>&1 | grep -E "^\+" || true
  echo ""
  success "Done. Run 'just security-audit' to verify remaining issues."
else
  success "No automatic fixes applied."
fi

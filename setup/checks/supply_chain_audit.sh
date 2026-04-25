#!/bin/bash
# setup/checks/supply_chain_audit.sh
# Clean summary of pnpm audit + glassworm-hunter scan.
# Output: OK | WARN <n moderate/low> | FAIL <n high/critical>
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# ── pnpm audit ────────────────────────────────────────────────────────────────

pnpm audit --json > "$TMP/audit.json" 2>/dev/null || true

python3 - "$TMP/audit.json" <<'PYEOF'
import json, sys

try:
    with open(sys.argv[1]) as f:
        data = json.load(f)
except Exception:
    print("FAIL could not parse pnpm audit output")
    sys.exit(0)

vulns    = data.get("metadata", {}).get("vulnerabilities", {})
critical = vulns.get("critical", 0)
high     = vulns.get("high", 0)
moderate = vulns.get("moderate", 0)
low      = vulns.get("low", 0)
total    = critical + high + moderate + low

if total == 0:
    print("OK no vulnerabilities")
    sys.exit(0)

parts = []
if critical: parts.append(f"{critical} critical")
if high:     parts.append(f"{high} high")
if moderate: parts.append(f"{moderate} moderate")
if low:      parts.append(f"{low} low")

level = "FAIL" if (critical + high) > 0 else "WARN"
print(f"{level} {', '.join(parts)}")

for adv in data.get("advisories", {}).values():
    sev = adv.get("severity", "")
    if sev not in ("high", "critical"):
        continue
    pkg   = adv.get("module_name", "?")
    title = adv.get("title", "")[:60]
    fix   = adv.get("patched_versions", "none")
    paths = [f.get("paths", ["?"])[0] for f in adv.get("findings", [])]
    via   = paths[0].split(">")[0] if paths else "?"
    print(f"  [{sev.upper():8}] {pkg} — {title}")
    print(f"             fix: {fix}  via: {via}")
PYEOF

# ── glassworm ─────────────────────────────────────────────────────────────────

glassworm-hunter scan --npm-scan --format json > "$TMP/gw.json" 2>/dev/null || true

python3 - "$TMP/gw.json" <<'PYEOF'
import json, sys

try:
    with open(sys.argv[1]) as f:
        data = json.load(f)
except Exception:
    print("  glassworm: could not parse output")
    sys.exit(0)

summary  = data.get("summary", {})
total    = summary.get("total_findings", 0)
critical = summary.get("critical", 0)
high     = summary.get("high", 0)
scanned  = summary.get("files_scanned", 0)

if total == 0:
    print(f"  glassworm: clean ({scanned} files scanned)")
    sys.exit(0)

print(f"  glassworm: {total} findings — {critical} critical, {high} high ({scanned} files)")
for f in data.get("findings", []):
    sev  = f.get("severity", "?")
    rule = f.get("rule_id", "?")
    path = f.get("file", "?")
    print(f"  [{sev.upper():8}] {rule}  {path}")
PYEOF

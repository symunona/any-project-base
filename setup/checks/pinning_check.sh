#!/bin/bash
# setup/checks/pinning_check.sh
# All dependencies in package.json files must be exact (no ^ or ~).
# Exception: peerDependencies (floating ranges acceptable there).
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

FAIL=0

while IFS= read -r -d '' pkgjson; do
  [[ "$pkgjson" == *node_modules* ]] && continue

  # ^ is always a FAIL (allows breaking changes).
  # ~ on expo* packages is WARN only — Expo SDK convention; patch bumps guaranteed compatible.
  # ~ on non-expo packages is a FAIL.
  OUTPUT=$(python3 - "$pkgjson" <<'EOF'
import json, sys
with open(sys.argv[1]) as f:
    pkg = json.load(f)
fails = []
warns = []
for section in ('dependencies', 'devDependencies', 'optionalDependencies'):
    for name, ver in pkg.get(section, {}).items():
        if not isinstance(ver, str) or not ver:
            continue
        if ver[0] == '^':
            fails.append(f"FAIL {section}.{name}: {ver}  (^ allows breaking changes)")
        elif ver[0] == '~':
            if name.startswith('expo') or name.startswith('@expo'):
                warns.append(f"WARN {section}.{name}: {ver}  (Expo convention - acceptable)")
            else:
                fails.append(f"FAIL {section}.{name}: {ver}  (~ allows patch drift)")
for line in warns + fails:
    print(line)
EOF
)
  relpath=$(realpath --relative-to="$ROOT_DIR" "$pkgjson")
  FAIL_LINES=$(echo "$OUTPUT" | grep '^FAIL' || true)
  WARN_LINES=$(echo "$OUTPUT" | grep '^WARN' || true)
  if [ -n "$WARN_LINES" ]; then
    echo "WARN $relpath Expo ~ pins (acceptable): $(echo "$WARN_LINES" | wc -l | tr -d ' ') package(s)"
  fi
  if [ -n "$FAIL_LINES" ]; then
    echo "FAIL unpinned deps in $relpath:"
    echo "$FAIL_LINES"
    FAIL=1
  fi
done < <(find "$ROOT_DIR" -name "package.json" -not -path "*/node_modules/*" -print0)

if [ "$FAIL" -eq 1 ]; then exit 1; fi
echo "OK"

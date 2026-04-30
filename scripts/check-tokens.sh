#!/usr/bin/env bash
# Token discipline gate: hex codes, font-family strings, lavender overuse.
# Runs against src/. Exits non-zero on violation.
#
# Allowlists:
#   - src/styles/             : token source + base CSS.
#   - src/app/globals.css     : Tailwind base + font fallback chain.
#   - src/generated/          : Prisma client.
#   - src/emails/             : email HTML can't reference CSS variables.
#   - **/*.test.tsx           : tests may inspect literal class strings.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAIL=0

# Build an allowlist filter from .tokencheck-allowlist (if present).
ALLOWLIST_FILE="scripts/.tokencheck-allowlist"
ALLOW_GREP=""
if [ -f "$ALLOWLIST_FILE" ]; then
  ALLOW_PATTERNS=$(grep -vE '^(#|$)' "$ALLOWLIST_FILE" | sed 's/[][\.^$*+?(){}|/]/\\&/g')
  if [ -n "$ALLOW_PATTERNS" ]; then
    ALLOW_GREP=$(echo "$ALLOW_PATTERNS" | sed 's/^/^/;s/$/:/' | tr '\n' '|' | sed 's/|$//')
  fi
fi

apply_allowlist() {
  if [ -n "$ALLOW_GREP" ]; then
    grep -vE "$ALLOW_GREP"
  else
    cat
  fi
}

# 1. Hex colors in source (excluding allowlisted dirs/files)
HEX_HITS=$(grep -RnE --include='*.ts' --include='*.tsx' --include='*.css' \
  --exclude-dir='generated' \
  --exclude-dir='emails' \
  '#[0-9a-fA-F]{3,8}\b' src/ 2>/dev/null \
  | grep -v '^src/styles/' \
  | grep -v '^src/app/globals.css:' \
  | apply_allowlist \
  || true)
if [ -n "$HEX_HITS" ]; then
  echo "❌ Hex codes found in src/ (use tokens):"
  echo "$HEX_HITS"
  FAIL=1
fi

# 2. font-family strings outside tokens / base CSS / emails
FF_HITS=$(grep -RnE --include='*.ts' --include='*.tsx' --include='*.css' \
  --exclude-dir='generated' \
  --exclude-dir='emails' \
  'font-family[[:space:]]*:' src/ 2>/dev/null \
  | grep -v '^src/styles/' \
  | grep -v '^src/app/globals.css:' \
  | apply_allowlist \
  || true)
if [ -n "$FF_HITS" ]; then
  echo "❌ font-family: strings found (use --font-* CSS variables):"
  echo "$FF_HITS"
  FAIL=1
fi

# 3. Lavender count cap per file. EditorialShell is the primitive that defines
#    the underline pattern, so its budget is higher. Other files cap at 5.
LAV_OFFENDERS=$(grep -RlE --include='*.tsx' --include='*.ts' \
  --exclude-dir='generated' \
  'sl-lavender|--accent[^-]' src/components/brand src/app 2>/dev/null \
  | while read -r f; do
      n=$(grep -cE 'sl-lavender|--accent[^-]' "$f" 2>/dev/null || echo 0)
      cap=6
      case "$f" in
        */components/brand/EditorialShell.tsx) cap=8 ;;
      esac
      if [ "$n" -gt "$cap" ]; then
        echo "$f: $n hits (cap $cap)"
      fi
    done)
if [ -n "$LAV_OFFENDERS" ]; then
  echo "❌ Lavender overuse (per-file cap exceeded):"
  echo "$LAV_OFFENDERS"
  FAIL=1
fi

if [ "$FAIL" -eq 0 ]; then
  echo "✅ token discipline OK"
fi

exit "$FAIL"

#!/bin/bash
# Builds pintar-e-local.tar.gz: the frozen runner at 68ebe2fd, with the synthetic material, plus the two local
# scripts and the instructions from this folder. Usage: bash build-package.sh <empty-output-dir>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../../.." && pwd)"; OUT="$1"
mkdir -p "$OUT/pintar-e-local"
git -C "$REPO" archive 68ebe2fda37c03016ddca36d9668418865f8d587 docs/completion-4.1/c3-eval docs/onboarding/konten-sintetis | tar -x -C "$OUT/pintar-e-local"
cp "$HERE/jalankan-e.sh" "$HERE/periksa-kunci.mjs" "$HERE/INSTRUCTIONS.md" "$OUT/pintar-e-local/"
chmod +x "$OUT/pintar-e-local/jalankan-e.sh"
echo 68ebe2fda37c03016ddca36d9668418865f8d587 > "$OUT/pintar-e-local/SOURCE-COMMIT"
( cd "$OUT/pintar-e-local" && find . -type f ! -name SHA256SUMS | LC_ALL=C sort | xargs shasum -a 256 > SHA256SUMS )
( cd "$OUT" && tar --format=ustar -czf pintar-e-local.tar.gz pintar-e-local && shasum -a 256 pintar-e-local.tar.gz )

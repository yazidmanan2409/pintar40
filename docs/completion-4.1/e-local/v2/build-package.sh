#!/bin/bash
# Builds pintar-e-local-v2.tar.gz: the v2 runner (claude/e-runner-v2 at the commit below), with the synthetic material,
# plus this folder's script and instructions, the key check and nilai-juri.mjs (for the slots-only step on the Mac).
# Usage: bash build-package.sh <empty-output-dir>
set -euo pipefail
SRC=99a9ea1556f2f783e440225ca49b6db343ac3a6b
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../../../.." && pwd)"; OUT="$1"; P="$OUT/pintar-e-local-v2"
mkdir -p "$P"
git -C "$REPO" archive "$SRC" docs/completion-4.1/c3-eval docs/onboarding/konten-sintetis | tar -x -C "$P"
cp "$HERE/jalankan-e.sh" "$HERE/INSTRUCTIONS.md" "$P/"
cp "$HERE/../periksa-kunci.mjs" "$HERE/../nilai-juri.mjs" "$P/"
chmod +x "$P/jalankan-e.sh"
echo "$SRC" > "$P/SOURCE-COMMIT"
( cd "$P" && find . -type f ! -name SHA256SUMS | LC_ALL=C sort | xargs shasum -a 256 > SHA256SUMS )
( cd "$OUT" && tar --format=ustar -czf pintar-e-local-v2.tar.gz pintar-e-local-v2 && shasum -a 256 pintar-e-local-v2.tar.gz )

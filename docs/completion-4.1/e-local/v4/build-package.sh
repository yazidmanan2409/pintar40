#!/bin/bash
# Builds pintar-e-local-v4.tar.gz: the v4 (OpenAI streaming) runner (claude/e-runner-v2 at the commit below), with the synthetic material,
# plus this folder's script and instructions, the key check and nilai-juri.mjs (for the slots-only step on the Mac).
# Usage: bash build-package.sh <empty-output-dir>
set -euo pipefail
SRC=86658dcba9e01646693e51acaaeb78ea9d18d113
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../../../.." && pwd)"; OUT="$1"; P="$OUT/pintar-e-local-v4"
mkdir -p "$P"
git -C "$REPO" archive "$SRC" docs/completion-4.1/c3-eval docs/onboarding/konten-sintetis | tar -x -C "$P"
cp "$HERE/jalankan-e.sh" "$HERE/INSTRUCTIONS.md" "$HERE/latihan-mock.mjs" "$P/"
cp "$HERE/../periksa-kunci.mjs" "$HERE/../nilai-juri.mjs" "$P/"
chmod +x "$P/jalankan-e.sh"
echo "$SRC" > "$P/SOURCE-COMMIT"
( cd "$P" && find . -type f ! -name SHA256SUMS | LC_ALL=C sort | xargs shasum -a 256 > SHA256SUMS )
( cd "$OUT" && tar --format=ustar -czf pintar-e-local-v4.tar.gz pintar-e-local-v4 && shasum -a 256 pintar-e-local-v4.tar.gz )

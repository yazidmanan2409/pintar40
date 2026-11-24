#!/usr/bin/env bash
# Ruling 79's audit (ruling 99, W1): keep a journey's capture run in the branch, for readers who cannot download CI
# artifacts (Daisy's visual pass). Copies each walk's screens, ARIA snapshots, langkah.json, LABEL.txt and the
# journey's RINGKASAN.txt from audit-out/perjalanan/ into audit/79/tangkapan/<sha>/<journey>/. Synthetic data only.
#
#   audit/79/simpan-tangkapan.sh <sha> <journey> [<journey> …]     e.g.  … da220028 j2
#   (a journey's branches, <journey>-cabang-*, go with it)
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SHA="${1:?the sha the captures were taken on}"; shift
[ "$#" -gt 0 ] || { echo "simpan-tangkapan: name at least one journey"; exit 2; }
SRC="$REPO/audit-out/perjalanan"
for jn in "$@"; do
  dst="$REPO/audit/79/tangkapan/$SHA/$jn"
  rm -rf "$dst"; mkdir -p "$dst"
  n=0
  for d in "$SRC/$jn" "$SRC/$jn"-cabang-*; do
    [ -d "$d" ] || continue
    base="$(basename "$d")"
    for walk in "$d"/*/; do
      [ -d "$walk" ] || continue
      w="$(basename "$walk")"
      t="$dst/$base/$w"; mkdir -p "$t"
      find "$walk" -maxdepth 1 -type f \( -name '*.png' -o -name '*.aria.yml' -o -name 'langkah.json' -o -name 'LABEL.txt' -o -name '*.pdf' \) -exec cp {} "$t/" \;
      n=$((n + 1))
    done
    [ -f "$d/RINGKASAN.txt" ] && cp "$d/RINGKASAN.txt" "$dst/$base.RINGKASAN.txt"
  done
  echo "simpan-tangkapan: $jn → audit/79/tangkapan/$SHA/$jn ($n walk(s), $(du -sh "$dst" | cut -f1))"
done

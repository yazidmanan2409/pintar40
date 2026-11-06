#!/usr/bin/env bash
# THE AUDITED COMMIT AND THE PROMOTED COMMIT ARE THE SAME CODE (6 Nov: a journey run audited an older main).
#
#   scripts/release/kandidat-sama.sh <audited SHA> <promoted SHA>
#
# The audited SHA is the one audit-journeys.yml recorded (its job summary, and audit-out/AUDITED_SHA in each job's
# artifact). The promoted SHA is what main points at after the merge. A merge commit is a different commit with the
# same content, so the two are the same code when they are equal, or when their trees are identical. Anything else is
# NOT the code that was audited, and the script exits 1. It reads the repository only; it changes nothing.
set -euo pipefail
diaudit="${1:?the audited commit SHA}"; dipromosi="${2:?the promoted commit SHA}"
for s in "$diaudit" "$dipromosi"; do
  [[ "$s" =~ ^[0-9a-f]{40}$ ]] || { echo "not a full 40-character commit SHA: $s" >&2; exit 2; }
  git cat-file -e "$s^{commit}" 2>/dev/null || { echo "no such commit here (fetch it first): $s" >&2; exit 2; }
done
pohon_a="$(git rev-parse "$diaudit^{tree}")"; pohon_p="$(git rev-parse "$dipromosi^{tree}")"
if [ "$diaudit" = "$dipromosi" ] || [ "$pohon_a" = "$pohon_p" ]; then
  echo "SAME: promoted $dipromosi carries exactly the audited $diaudit (tree $pohon_p)"
  exit 0
fi
echo "DIFFERENT: promoted $dipromosi (tree $pohon_p) is not the audited $diaudit (tree $pohon_a)" >&2
git diff --stat "$diaudit" "$dipromosi" >&2 || true
exit 1

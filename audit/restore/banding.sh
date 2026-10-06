#!/usr/bin/env bash
# #150, the restore rehearsal: staging's facts against the restored copy's, by name only (never a value).
#   banding.sh <staging after the backup> <staging before it> <the copy>
# A table counts as restored when the copy matches staging after the backup (or before it, had it moved meanwhile).
set +e -uo pipefail
export LC_ALL=C
S="$1"; B="$2"; P="$3"
awk -F'|' 'FNR==NR && $1=="T" {s[$2]=$3"|"$4; next} FILENAME==ARGV[2] && $1=="T" {b[$2]=$3"|"$4; next}
           FILENAME==ARGV[3] && $1=="T" {p[$2]=$3"|"$4}
           END { same=0; diff=0; miss=0; moved=0; for (t in s) { if (s[t]!=b[t]) moved++;
                   if (!(t in p)) { miss++; print "MISSING  " t " (staging rows " substr(s[t], 1, index(s[t], "|") - 1) ")" }
                   else if (p[t]==s[t] || p[t]==b[t]) same++;
                   else { diff++; split(s[t], a, "|"); split(p[t], c, "|"); print "DIFFERS  " t " rows staging " a[1] ", restored " c[1] } }
                 extra=0; for (t in p) if (!(t in s)) { extra++; print "EXTRA    " t " (only in the copy)" }
                 print "tables: " length(s) " on staging, " same " restored identically, " diff " differ, " miss " missing, " extra " only in the copy; " moved " moved on staging during the backup" }' \
  "$S" "$B" "$P" | sort
echo "facts, staging -> restored copy:"
join -t'|' -j1 <(grep '^F|' "$S" | cut -d'|' -f2- | sort) <(grep '^F|' "$P" | cut -d'|' -f2- | sort) | \
  awk -F'|' '{ print ($2==$3 ? "same     " : "CHANGED  ") $1 ": " $2 ($2==$3 ? "" : "  ->  " $3) }'
# per function: definition, owner, and who may execute it (anon/authenticated/PUBLIC)
awk -F'|' 'FNR==NR && $1=="P" {d[$2]=$3; o[$2]=$4; x[$2]=$5; next} $1=="P" {
             if (!($2 in d)) { print "FUNCTION only in the copy: " $2; next }
             seen[$2]=1
             if (d[$2]!=$3) { nd++; if (nd<=12) print "FUNCTION definition differs: " $2 }
             if (o[$2]!=$4) { no++; if (no<=12) print "FUNCTION owner differs: " $2 " (" o[$2] " -> " $4 ")" }
             if (x[$2]!=$5) { nx++; print "FUNCTION who may execute differs: " $2 " (anon/authenticated/PUBLIC " x[$2] " -> " $5 ")" } }
           END { for (f in d) if (!(f in seen)) { nm++; print "FUNCTION missing in the copy: " f }
                 print "functions: " length(d) " on staging; definitions differing " nd+0 ", owners differing " no+0 ", execute rights differing " nx+0 ", missing " nm+0 }' \
  "$S" "$P"
# per table: what anon and authenticated may do
awk -F'|' 'FNR==NR && $1=="G" {g[$2]=$3; next} $1=="G" { seen[$2]=1; if (g[$2]!=$3) { n++; print "TABLE rights differ: " $2 " (" g[$2] " -> " $3 ")" } }
           END { for (t in g) if (!(t in seen)) m++; print "table rights (anon, authenticated): " length(g) " on staging; differing " n+0 ", missing " m+0 }' \
  "$S" "$P"
exit 0

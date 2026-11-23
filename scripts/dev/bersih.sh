#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# BERSIH: safe cleanup of what the test harness itself left behind (ruling 83, P-2; I-5).
#
# WHAT IT MAY REMOVE: only a direct child of the temp folder ($TMPDIR, default /tmp) whose name the harness's own
# code creates. The names are read from the harness's source each time this runs, not from a list kept by hand:
# every `mkdtempSync(join(tmpdir(), "<prefix>"))` and `join(tmpdir(), \`<name-${…}>\`)` under selftest/ and
# scripts/dev/. So a name no harness file creates is never a candidate. Today that is the selftest scratch
# (dr150-*, dr-s09-*, kandidat-*, bob07-*, pgbin-* …), the plants' and the build-identity check's scratch, the
# red-case runner's private clones (pintar-redcase-<pid>, git worktrees of this checkout), and the app runner's fetch
# logs (pintar-selftest-fetch-<pid>.log). The checkout's own build (.next) is never touched.
#
# WHAT IT NEVER REMOVES, whatever its name:
#   - anything inside this checkout, and any path that contains this checkout;
#   - a candidate that holds a docs/ or z-evidence/ folder (for a clone: holds any CHANGED or UNTRACKED file under
#     docs/ or z-evidence/), because it may hold evidence not yet copied out. It is kept and named;
#   - a candidate younger than the age limit (BERSIH_UMUR_MENIT, default 30), or with any file modified within it;
#   - a candidate a running process has as its working folder or holds a file open in;
#   - a symlink, or a candidate owned by another user.
#
#   scripts/dev/bersih.sh            DRY RUN (the default): prints what it would remove, and what it keeps and why
#   scripts/dev/bersih.sh --hapus    removes the candidates it printed (clones via `git worktree remove`)
#
# The last line is `bersih: <n> removed|would be removed, <size>; <k> kept`.
#
# SCOPE (N-3): this is for a single-user sandbox, the builder's or a session container, where the temp folder holds
# only this user's runs. It still checks ownership, but it is not designed for a shared multi-user host.
# Also kept (N-1, N-2): a name the harness creates whose literal prefix is shorter than 4 characters is refused as a
# pattern, and a clone whose HEAD no branch or tag reaches (it may hold the only copy of a commit).
# ---------------------------------------------------------------------------
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
TMP="$(cd "${TMPDIR:-/tmp}" && pwd -P)"
UMUR="${BERSIH_UMUR_MENIT:-30}"
ACT=0
for a in "$@"; do
  case "$a" in
    --hapus) ACT=1 ;;
    --coba) ACT=0 ;;
    -h|--help) sed -n '2,27p' "$0"; exit 0 ;;
    *) echo "bersih: unknown argument $a" >&2; exit 2 ;;
  esac
done

case "$TMP" in
  /|/home|/home/*|/root|/usr*|/etc*|/var|/opt*) echo "bersih: refusing: the temp folder resolves to $TMP"; exit 2 ;;
esac
case "$REPO/" in "$TMP"/*) echo "bersih: refusing: the checkout $REPO is inside the temp folder $TMP"; exit 2 ;; esac

# ---- the names the harness creates, from its own source ----------------------------------------------------------
MIN_PREFIX=4   # N-1: a harness name shorter than this would match too much; it is refused, not used
patterns() {
  local raw
  # mkdtemp: "<prefix>" + exactly six [A-Za-z0-9]
  while IFS= read -r raw; do
    if [ "${#raw}" -lt "$MIN_PREFIX" ]; then echo "bersih: refusing the harness prefix «$raw» (shorter than $MIN_PREFIX characters)" >&2; continue; fi
    printf '%s[A-Za-z0-9]{6}\n' "${raw//./\\.}"
  done < <(grep -rhoE 'mkdtempSync\(join\(tmpdir\(\), "[A-Za-z0-9._-]+"' "$REPO/selftest" "$REPO/scripts/dev" 2>/dev/null | sed -E 's/.*"([^"]+)"$/\1/' | sort -u)
  # template names: join(tmpdir(), `<text${expr}text>`), each ${…} a run of digits (a pid)
  while IFS= read -r raw; do
    local lit="${raw%%\$\{*}"
    if [ "${#lit}" -lt "$MIN_PREFIX" ]; then echo "bersih: refusing the harness name «$raw» (a literal start shorter than $MIN_PREFIX characters)" >&2; continue; fi
    raw="${raw//./\\.}"; printf '%s\n' "$(sed -E 's/\$\{[^}]*\}/[0-9]+/g' <<< "$raw")"
  done < <(grep -rhoE 'join\(tmpdir\(\), `[A-Za-z0-9._${}-]+`' "$REPO/selftest" "$REPO/scripts/dev" 2>/dev/null | sed -E 's/.*`([^`]+)`$/\1/' | sort -u)
}
mapfile -t PATS < <(patterns)
[ "${#PATS[@]}" -gt 0 ] || { echo "bersih: refusing: no harness names found in the source (wrong checkout?)"; exit 2; }
RE="^($(IFS='|'; echo "${PATS[*]}"))\$"

# ---- in use? ----------------------------------------------------------------------------------------------------
OPEN="$(for p in /proc/[0-9]*; do readlink "$p/cwd"; for f in "$p"/fd/*; do readlink "$f"; done; done 2>/dev/null | sort -u)"
dipakai() { # <path>: a running process has its cwd inside it, or an open file inside it (read once, at the start)
  printf '%s\n' "$OPEN" | grep -qxF -e "$1" && return 0
  printf '%s\n' "$OPEN" | grep -qF -e "$1/"
}

removed=0; kept=0; bytes=0
cutoff="$(date -d "-$UMUR minutes" +%s)"
keep() { kept=$((kept + 1)); echo "  keep    $1  ($2)"; }

shopt -s nullglob dotglob
for path in "$TMP"/*; do
  name="${path##*/}"
  [[ "$name" =~ $RE ]] || continue
  if [ -L "$path" ]; then keep "$path" "a symlink"; continue; fi
  real="$(realpath -e "$path" 2>/dev/null)" || continue
  case "$real/" in "$REPO"/*) keep "$path" "inside the checkout"; continue ;; esac
  case "$REPO/" in "$real"/*) keep "$path" "contains the checkout"; continue ;; esac
  [ "$(stat -c %u "$real")" = "$(id -u)" ] || { keep "$path" "owned by another user"; continue; }
  if [ "$(stat -c %Y "$real")" -gt "$cutoff" ] || [ -n "$(find "$real" -newermt "@$cutoff" -print -quit 2>/dev/null)" ]; then
    keep "$path" "modified within the last $UMUR min"; continue
  fi
  if dipakai "$real"; then keep "$path" "in use by a running process"; continue; fi
  clone=0
  if [ -d "$real" ] && [ -e "$real/.git" ]; then
    clone=1
    # N-2: a clone whose HEAD no ref reaches holds commits that exist nowhere else
    if [ -z "$(GIT_OPTIONAL_LOCKS=0 git -C "$real" for-each-ref --contains HEAD --count=1 2>/dev/null)" ]; then
      keep "$path" "a clone whose HEAD ($(git -C "$real" rev-parse --short HEAD 2>/dev/null)) no branch or tag reaches"; continue
    fi
    changed="$(GIT_OPTIONAL_LOCKS=0 git -C "$real" status --porcelain --untracked-files=all -- docs z-evidence ':(glob)**/z-evidence/**' 2>/dev/null | head -3)"
    if [ -n "$changed" ]; then keep "$path" "a clone with changed or untracked evidence: $(echo "$changed" | head -1 | cut -c4-)"; continue; fi
  elif [ -d "$real" ]; then
    ev="$(find "$real" \( -name docs -o -name z-evidence \) -print -quit 2>/dev/null)"
    [ -n "$ev" ] && { keep "$path" "holds ${ev#"$real"/}"; continue; }
  fi
  size="$(du -sb "$real" 2>/dev/null | cut -f1)"; size="${size:-0}"
  if [ "$ACT" = 1 ]; then
    if [ "$clone" = 1 ]; then
      git -C "$REPO" worktree remove --force "$real" >/dev/null 2>&1 || rm -rf -- "$real"
    else
      rm -rf -- "$real"
    fi
    if [ -e "$real" ]; then keep "$path" "removal failed"; continue; fi
    echo "  removed $path  ($(numfmt --to=iec "$size"))"
  else
    echo "  would remove $path  ($(numfmt --to=iec "$size"))"
  fi
  removed=$((removed + 1)); bytes=$((bytes + size))
done
[ "$ACT" = 1 ] && git -C "$REPO" worktree prune 2>/dev/null
echo "bersih: $removed $([ "$ACT" = 1 ] && echo removed || echo 'would be removed'), $(numfmt --to=iec "$bytes"); $kept kept"

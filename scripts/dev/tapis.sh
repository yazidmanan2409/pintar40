# shellcheck shell=bash
# TAPIS: strip keys and secrets from text before it is written to any log (ruling 83, Sharon's S-2). Sourced by
# siap.sh and preflight.sh. It reads stdin and writes stdout; `tapis_berkas <file>…` filters files in place.
# It covers the CLI's JSON, env and table forms (any field, name or label containing key, secret, jwt, token or
# password, in any case), any JWT,
# any sb_secret_/sb_publishable_ key, the local stack's default JWT secret wherever it appears, and the user and
# password of any URL (postgres://postgres:postgres@… and the like; Sharon's addendum, 3).
TAPIS_PERL='
  s/("[A-Za-z0-9_]*(?:KEY|SECRET|JWT|TOKEN|PASSWORD)[A-Za-z0-9_]*"\s*:\s*")[^"]*"/$1«redacted»"/gi;
  s/\b([A-Z0-9_]*(?:KEY|SECRET|JWT|TOKEN|PASSWORD)[A-Z0-9_]*\s*[=:]\s*)("?)(?!«)[^\s",}]+/$1$2«redacted»/g;
  s/((?:^|[\s│|])[A-Za-z][A-Za-z0-9_ ]*?(?i:key|secret|jwt|token|password)\s*[:=│|]\s*)(?!«)[^\s",}│|]+/$1«redacted»/g;
  s#\b([a-z][a-z0-9+.-]*://)[^/\s:@"\x27«]*:[^/\s@"\x27]+@#$1«user:password redacted»@#gi;
  s/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/«jwt redacted»/g;
  s/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/«key redacted»/g;
  s/super-secret-jwt-token[A-Za-z0-9_-]*/«jwt secret redacted»/g;
'
tapis() { perl -pe "$TAPIS_PERL"; }
tapis_berkas() { local f; for f in "$@"; do [ -f "$f" ] && [ ! -L "$f" ] && perl -pi -e "$TAPIS_PERL" "$f"; done; return 0; }

#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# GOLDEN DATABASE — build the migrated, seeded world ONCE and clone it.
#
# Replaying 102 migrations and five seed files from an empty database takes
# the better part of a minute, and a work package needs a disposable world
# dozens of times: one per probe, one per plant, one per upgrade rehearsal.
# Paying the full replay each time was a material part of WP6/WP7's wall
# clock.
#
# So: build a GOLDEN database whose name carries a fingerprint of the exact
# migration set, seed set and shape file it was built from, and hand out
# `createdb --template` clones of it. When the migration set changes the
# fingerprint changes, the old golden no longer matches, and a new one is
# built — a stale baseline cannot be handed out silently.
#
# WHAT THIS IS NOT: it is not clean-install evidence. A clone inherits
# whatever the golden holds, including any drift. The authoritative
# fresh-migration verification remains CI's `migrations · clean database +
# seed` job against a real Supabase stack, and `rebuild` here replays from
# empty the same way for a local cross-check.
#
# The golden holds MIGRATIONS AND SEEDS ONLY. The selftest lifecycle files
# (selftest/db/*.sql) are deliberately left out, so editing a suite does not
# invalidate the baseline; the selftest runner loads them into whatever
# database it is pointed at.
#
#   scripts/dev/golden-db.sh ensure           build if missing/stale; print name
#   scripts/dev/golden-db.sh clone <name>     ensure, then clone; print DB URL
#   scripts/dev/golden-db.sh url <name>       print the URL of an existing db
#   scripts/dev/golden-db.sh drop <name>...   drop clones
#   scripts/dev/golden-db.sh status           what exists, and its fingerprint
#   scripts/dev/golden-db.sh rebuild          drop the golden and build it again
#
# Environment:
#   PINTAR_PG              server to build on   (default postgresql://postgres@localhost:55432)
#   PINTAR_GOLDEN_PREFIX   golden name prefix   (default pintar_golden)
# ---------------------------------------------------------------------------
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

PINTAR_PG="${PINTAR_PG:-postgresql://postgres@localhost:55432}"
PINTAR_GOLDEN_PREFIX="${PINTAR_GOLDEN_PREFIX:-pintar_golden}"
SHAPE="scripts/dev/supabase-shape.sql"
SUPABASE_BIN="./node_modules/.bin/supabase"

base="${PINTAR_PG%/}"
db_url() { echo "${base}/$1?sslmode=disable"; }
admin_url="$(db_url postgres)"

say() { printf '%s\n' "$*" >&2; }
die() { say "golden-db: $*"; exit 1; }

# createdb/dropdb take the database to act on as their argument, so the
# maintenance connection has to be spelled out separately on every call.
# Going through psql keeps one connection string for everything.
drop_db()   { psql -q -v ON_ERROR_STOP=1 -c "set client_min_messages = warning" -c "drop database if exists \"$1\" with (force)" "$admin_url" >/dev/null; }
create_db() { psql -q -c "create database \"$1\"${2:+ template \"$2\"}" "$admin_url" >/dev/null; }

# --------------------------------------------------------------- fingerprint
# Every input that decides what a freshly built baseline contains: the
# migration files, the seed files, the seed ORDER declared in config.toml, and
# the local shape file. Names as well as contents, so a renamed or removed
# migration moves the fingerprint too.
fingerprint() {
  {
    for f in supabase/migrations/*.sql; do printf '%s ' "$f"; sha256sum <"$f" | cut -d' ' -f1; done
    for f in supabase/seed/*.sql; do printf '%s ' "$f"; sha256sum <"$f" | cut -d' ' -f1; done
    grep -E '^sql_paths' supabase/config.toml || true
    printf '%s ' "$SHAPE"; sha256sum <"$SHAPE" | cut -d' ' -f1
  } | LC_ALL=C sort | sha256sum | cut -c1-12
}

FP="$(fingerprint)"
GOLDEN="${PINTAR_GOLDEN_PREFIX}_${FP}"

exists() {
  [ "$(psql -Atqc "select 1 from pg_database where datname = '$1'" "$admin_url")" = "1" ]
}

# --------------------------------------------------------------------- build
build_golden() {
  local building="${GOLDEN}_building"
  say "golden-db: building $GOLDEN (fingerprint $FP)"
  drop_db "$building"
  create_db "$building"
  local url; url="$(db_url "$building")"

  # Only on a server that is not already Supabase-shaped. On a real stack
  # auth.users is there and this is skipped, so the shape file can never
  # overwrite a project's own auth schema.
  if [ "$(psql -Atqc "select coalesce(to_regclass('auth.users')::text,'')" "$url")" = "" ]; then
    psql -q -v ON_ERROR_STOP=1 -1 -f "$SHAPE" "$url" >/dev/null
    say "golden-db:   local Supabase shape applied"
  else
    say "golden-db:   auth.users already present — shape file skipped"
  fi

  [ -x "$SUPABASE_BIN" ] || die "$SUPABASE_BIN not found (npm ci first)"
  "$SUPABASE_BIN" migration up --db-url "$url" --include-all >/dev/null
  say "golden-db:   $(ls supabase/migrations/*.sql | wc -l | tr -d ' ') migration(s) applied"

  # The seed order config.toml declares, read from config.toml rather than
  # copied here, so the two cannot drift.
  local seeds
  seeds="$(grep -E '^sql_paths' supabase/config.toml | sed -E 's/^[^=]*=\s*\[//; s/\]\s*$//' | tr ',' '\n' | tr -d '" ' | sed 's#^\./#supabase/#')"
  [ -n "$seeds" ] || die "no sql_paths found in supabase/config.toml"
  for s in $seeds; do
    psql -q -v ON_ERROR_STOP=1 -1 -f "$s" "$url" >/dev/null || die "seed failed: $s"
  done
  say "golden-db:   $(echo "$seeds" | wc -l | tr -d ' ') seed file(s) loaded"

  # The applied history must be exactly the repository's migration set — the
  # same check the clean-room build has always made, kept here because a
  # golden that silently missed a migration would poison every clone.
  local applied repo
  applied="$(psql -Atqc 'select version from supabase_migrations.schema_migrations order by version' "$url")"
  repo="$(ls supabase/migrations/*.sql | sed -E 's#.*/([0-9]{14})_.*#\1#' | LC_ALL=C sort)"
  [ "$applied" = "$repo" ] || die "applied migration history does not match the repository"

  psql -q -v ON_ERROR_STOP=1 -1 "$url" >/dev/null <<SQL
create schema if not exists pintar_dev;
create table pintar_dev.golden (
  fingerprint text primary key,
  migrations  integer not null,
  built_at    timestamptz not null default now()
);
insert into pintar_dev.golden (fingerprint, migrations)
values ('$FP', $(ls supabase/migrations/*.sql | wc -l | tr -d ' '));
comment on schema pintar_dev is 'local development baseline stamp — see scripts/dev/golden-db.sh';
SQL

  drop_db "$GOLDEN"
  psql -q -c "alter database \"$building\" rename to \"$GOLDEN\"" "$admin_url"
  say "golden-db: $GOLDEN ready"
}

ensure() {
  exists "$GOLDEN" || build_golden
  echo "$GOLDEN"
}

# --------------------------------------------------------------------- verbs
case "${1:-}" in
  ensure)
    ensure >/dev/null
    echo "$GOLDEN"
    ;;

  clone)
    name="${2:-}"; [ -n "$name" ] || die "clone needs a database name"
    ensure >/dev/null
    # A template cannot be cloned while anything is connected to it. Nothing
    # should be, so evict rather than fail on a forgotten psql.
    psql -Atqc "select pg_terminate_backend(pid) from pg_stat_activity where datname = '$GOLDEN' and pid <> pg_backend_pid()" "$admin_url" >/dev/null
    drop_db "$name"
    create_db "$name" "$GOLDEN"
    db_url "$name"
    ;;

  url)
    name="${2:-}"; [ -n "$name" ] || die "url needs a database name"
    exists "$name" || die "no such database: $name"
    db_url "$name"
    ;;

  drop)
    shift
    [ "$#" -gt 0 ] || die "drop needs at least one database name"
    for name in "$@"; do
      [ "$name" = "$GOLDEN" ] && die "refusing to drop the golden here — use rebuild"
      drop_db "$name"
      say "golden-db: dropped $name"
    done
    ;;

  status)
    echo "repository fingerprint : $FP"
    echo "golden database        : $GOLDEN $(exists "$GOLDEN" && echo '(present)' || echo '(NOT BUILT)')"
    echo "server                 : $base"
    if exists "$GOLDEN"; then
      psql -Atqc 'select $$built from $$ || migrations || $$ migration(s), built $$ || built_at from pintar_dev.golden' "$(db_url "$GOLDEN")" | sed 's/^/golden stamp           : /'
    fi
    psql -Atqc "select datname from pg_database where datname like '${PINTAR_GOLDEN_PREFIX}%' order by 1" "$admin_url" | sed 's/^/present                : /'
    ;;

  rebuild)
    drop_db "$GOLDEN"
    build_golden
    echo "$GOLDEN"
    ;;

  *)
    sed -n '/^#   scripts/,/^#   scripts.*rebuild/p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac

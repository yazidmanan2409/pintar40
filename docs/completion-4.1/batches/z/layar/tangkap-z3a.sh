#!/bin/bash
# Z3-A captures: a fresh local stack, a production build of this tree on :3999, the capture script, then a reset so
# the local-only persona passwords and states written for the shots do not outlive the run.
#   bash docs/completion-4.1/batches/z/layar/tangkap-z3a.sh <stack.env>
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
ENV_FILE="${1:?stack env file (supabase status -o env)}"
val() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'; }
svc="$(val SERVICE_ROLE_KEY)"; [ -n "$svc" ] || svc="$(val SECRET_KEY)"
anon="$(val ANON_KEY)"; [ -n "$anon" ] || anon="$(val PUBLISHABLE_KEY)"
export NEXT_PUBLIC_SUPABASE_URL="$(val API_URL)" NEXT_PUBLIC_SUPABASE_ANON_KEY="$anon" NEXT_PUBLIC_APP_URL=http://127.0.0.1:3999
export SUPABASE_SERVICE_ROLE_KEY="$svc" SUPABASE_DB_URL="$(val DB_URL)" DATABASE_URL="$(val DB_URL)"
export CARD_PEPPER=synthetic-card-pepper-fable01-32plus CARD_EMAIL_DOMAIN=cards.synthetic.pintar.test CERT_SECRET_KEY_V1=synthetic-certificate-key-fable04-32plus
export PINTAR_BUILD_SHA="$(git rev-parse HEAD)" NEXT_TELEMETRY_DISABLED=1
npx --no-install supabase db reset --local >/dev/null
npx --no-install next build >/tmp/tangkap-z3a-build.log 2>&1 || { tail -30 /tmp/tangkap-z3a-build.log; exit 1; }
npx --no-install next start -p 3999 >/tmp/tangkap-z3a-start.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true; npx --no-install supabase db reset --local >/dev/null 2>&1 || true' EXIT
for i in $(seq 1 60); do curl -sf -o /dev/null http://127.0.0.1:3999/masuk && break; sleep 1; done
PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/tangkap-z3a.ts

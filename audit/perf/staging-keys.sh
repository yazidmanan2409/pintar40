#!/usr/bin/env bash
# STAGING ONLY. Staging's database URL checked (never printed) and its API keys read (masked) into $GITHUB_ENV:
# SERVICE_KEY, ANON_KEY, SUPABASE_URL. Production's keys are never read. Shared by perf-l1.yml's jobs.
set -euo pipefail
: "${STAGING_SUPABASE_PROJECT_REF:?}" "${PRODUCTION_SUPABASE_PROJECT_REF:?}" "${STAGING_SUPABASE_DB_URL:?}" "${STAGING_SUPABASE_ACCESS_TOKEN:?}"
[ "$STAGING_SUPABASE_PROJECT_REF" != "$PRODUCTION_SUPABASE_PROJECT_REF" ]
case "$STAGING_SUPABASE_DB_URL" in *"$PRODUCTION_SUPABASE_PROJECT_REF"*) echo "::error::the database URL names production"; exit 1;; esac
case "$STAGING_SUPABASE_DB_URL" in *"$STAGING_SUPABASE_PROJECT_REF"*) echo "the database URL names staging's project";; *) echo "::error::the database URL does not name staging's project"; exit 1;; esac
python3 - <<'PY' >> "$GITHUB_ENV"
import json, os, sys, urllib.request
ref = os.environ['STAGING_SUPABASE_PROJECT_REF']
req = urllib.request.Request(f'https://api.supabase.com/v1/projects/{ref}/api-keys?reveal=true',
                             headers={'Authorization': 'Bearer ' + os.environ['STAGING_SUPABASE_ACCESS_TOKEN']})
keys = json.load(urllib.request.urlopen(req, timeout=30))
for name, var in (('service_role', 'SERVICE_KEY'), ('anon', 'ANON_KEY')):
    k = next(k['api_key'] for k in keys if k.get('name') == name and (k.get('api_key') or '').startswith('eyJ'))
    print('::add-mask::' + k, file=sys.stderr, flush=True)
    print(f'{var}={k}')
print(f'SUPABASE_URL=https://{ref}.supabase.co')
PY

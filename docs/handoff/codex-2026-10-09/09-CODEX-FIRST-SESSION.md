# 09 · Codex first session

The goal of the first session is to **establish your own access and independently verify the handoff**, without changing any environment. It is not a rebuild. Nothing below changes staging or production.

## 0. Ground rules carried over

These rules are on record; the decision IDs are in `docs/coordination/DECISIONS.md`.

- **Production is not touched.** Releases are a deliberate, owner-approved step (D-004). Production runs 5b5b68d.
- **Never commit or edit the request files** `.github/vercel-request.txt`, `.github/deploy-request.txt` or `.github/staging-*-request.txt`. They trigger environment actions (05).
- **Never commit `supabase/config.toml` changes.** Local job scripts modify it temporarily.
- **main** receives either a CI-proven commit (E1) or a commit changing only CI-skipped documents (D-133(g)). A push to main that touches anything else starts a full CI run, which costs allowance.
- **The CI allowance is the owner's.** 108 of 1,900 minutes remain (D-136(d)). Do not dispatch CI or the journeys without the owner extending it.
- **Approved decisions are implementation authority** (D-135). Escalate to the owner only under D-135(b): name the new decision, why existing approvals do not cover it, why you cannot decide it, and what work continues meanwhile.
- **S23q/CR-52 is an unresolved governed exception** (D-123). Never report the journey suite as fully green.
- **Words come only from `src/lib/hle.ts`.** Approved terminology is Terminology v1 (D-134). Never invent a protected educational or institutional term.

## 1. Access you must establish yourself

Claude's authenticated sessions **do not transfer**. 05 lists every variable name.

1. **GitHub:** read access to `yazidmanan2409/pintar40`, write access to a working branch, and Actions read access for run evidence.
2. **Supabase:**
   - the CLI;
   - an access token for staging (`keijhmdtsgrfvnvocfvk`), read-only queries first;
   - production (`trtlvibiybwixfumjrrx`) only with the owner's explicit permission.
3. **Vercel:** a read token for project `pintar40-staging`, to see deployments. The production project is the owner's.
4. **Local stack:** Docker, the Supabase CLI and Node.js (no version pinned in `package.json`; CI uses Node 22 (`NODE_VERSION`) via `actions/setup-node` in `.github/workflows/ci.yml`). Chromium for Playwright. Firefox and WebKit too, if you want to run BD11 locally.

## 2. Verify the state, read-only

```
git clone https://github.com/yazidmanan2409/pintar40 && cd pintar40
git log --oneline -1 origin/main                 # expect 8202139 or later; code = dab5c12
git diff --stat dab5c12 origin/main -- src supabase selftest audit   # expect empty
git log --oneline -1 origin/ux-1/daisy-experience # expect cc96030
ls supabase/migrations | wc -l                    # expect 177
```

Then compare with these runs, using GET reads of the GitHub API:

| Evidence | Run | Expected |
|---|---|---|
| CI | 37775379355 | 18/18 |
| Journeys | 37775382999 | annotations «Crawl A GREEN» and «Journey B tally» = {"PASS":75,"FAIL":1} |
| Environment facts | 37782586725 | staging = dab5c12 with 177 migrations; production 5b5b68d |

Record any difference you find. Do not reconcile it by editing.

## 3. Verify the application locally

These steps run on your machine and cost no CI.

1. `npm ci`, then start the local Supabase stack (`supabase start`) and seed it as the selftest expects (06).
2. Run the full selftest: `npx tsx selftest/run.ts --accept-justified-skips`. The baseline on 8 Oct was 649 passed and 1 failed (PENUTUPAN-M04, fixed in dab5c12). The full suite was **not** re-run on dab5c12 after that fix; only M04 and L4-C01 were run, and they passed. Your full run is the first on this commit.
3. Build and run the crawl (`audit/crawl.mjs`) and the journeys (`audit/journey.mjs`) against a local `next start`. 06 has the invocation. Expect:
   - the crawl GREEN;
   - journeys 74 or 75 PASS and S23q FAIL;
   - BD11 blocked without Firefox and WebKit.
4. Read 02's inventory against the original requirements in `docs/rebuild/` (00-ARCHITECTURE-BASELINE-FREEZE-RECORD and the documents after it), and against the register. Your verification should be independent of the statuses in 02.

## 4. What not to do in the first session

- Do not merge, rebase, squash or delete any branch. History is evidence.
- Do not start the application pass. Its gate is not declared (03 §3).
- Do not rebuild. The codebase passes its own suite. Verify it before changing it.
- Do not re-ask the owner about settled design or terminology (D-135).

## 5. Suggested first engineering items, after verification

These are within established authority (07):
1. **S23q / CR-52**: the bank filter and the key/reason review on Bank Soal.
2. **CR-92**: preselect the browser's own choice.
3. **L4 finding 6**: a bounded role list, keeping journey S24.
4. **CR-41**: named fields for the transfer form.

Prove each locally first, then land it when the owner grants CI allowance.

# Batch 0 · Deliverable 4 · Repository security report (2 Nov 2026)

**Authority:** owner authorisation of 2 Nov, B0-C. D-143 (the repository is public by the owner's choice) is authoritative; this report does not question it.

**This report contains no secret values.** A finding is identified by rule, class, path and a 12-hex sha256 fingerprint (`sidik`). Running `node scripts/guard/sensitive-scan.mjs --history` reproduces every row.

**Boundaries kept:**
- No history rewritten.
- No commit deleted.
- No permission changed.
- No credential rotated.
- No source material removed.
- Visibility untouched.

## 1. Verdict

| Class | Found | Severity | STOP condition? |
|---|---|---|---|
| **Credentials** (private keys, provider tokens, service-role JWTs, DB passwords, assigned secrets) | **0** in the tree or in any reachable commit | — | No |
| **Real-person data** | **1 value**: the owner's own personal address (a `+guru` alias), in 3 tracked files and in history | Low (the owner's own data, published by the owner's choice) | No |
| **Restricted answer-key material** | **43 files in the tree, plus 4 that exist only in history.** All public since D-143 | **High for assessment integrity**, not for system security | No: already known as F-4 and decided by D-143 |
| **Synthetic test passwords** in the harness and seeds | Present by design | None: a read-only check on staging found **0** accounts at the synthetic or bootstrap domains, so they open only a disposable local stack | No |

**No actual credential exposure was found, so no STOP was triggered.** One new fact (§4.2): two files under `audit/fixtures/` are full copies of real chapters. They are now in the F-4 inventory.

## 2. What was scanned

| Item | Value |
|---|---|
| Refs | 25 local and remote branch refs, plus the 2 pull-request refs (`refs/pull/1`, `refs/pull/2`): everything a visitor to the public repository can reach |
| Commits | 1,547 |
| Unique blobs | 6,232 (2,403 distinct paths) |
| Not text-scanned | 4 blobs of 5 MB or more (`media/sd5_matematika_1_audio.m4a` and `…_video.mp4`, two versions each) and binary blobs (images, `.xlsx`). Every `.xlsx` and `.paket.json` is flagged by **path** whatever its bytes, and the workbooks were checked for real items separately (§4.2) |
| Tools | `scripts/guard/sensitive-scan.mjs` (rules in `scripts/guard/rules.mjs`). A second, independent sweep over every blob looked for high-entropy literals assigned to key-like names. An external scanner (gitleaks) could not be downloaded in this environment, so this is the in-repo scanner plus the entropy sweep |
| Time | `--history`: about 31 s; `--tree`: about 2 s |

**Rules applied:**
- private-key headers;
- GitHub, AWS, Supabase (`sb_secret_`, `sbp_`), Stripe live, Slack, Google, Resend and npm tokens;
- JWTs that grant `service_role` or come from a real project (the local stack's `supabase-demo` keys are public by design);
- `postgres://` URLs with an inline password on a non-local host;
- password, secret, token or API key assigned to a literal in env and config files;
- e-mail addresses at non-synthetic domains;
- a plausible 16-digit NIK (valid province code and birth date);
- answer-key packages and workbooks.

## 3. Credentials: zero

**First pass:** 15 non-answer-key hits in the tree. Each was read and classified:
- 13 were test stand-ins or synthetic values, for example `sb_secret_selftest…`, `sbp_standin_token_never_printed…`, `synthetic-certificate-key-…`, `sink-accepts-any`, and a shell default `${…:-/nonexistent}`;
- 1 was a URL with password `pw` at `h.example`;
- 1 was the owner's address (§4.1).

The rules were then tuned so that stand-ins pass while real shapes still fail. SEC-G01 proves both directions.

**Entropy sweep:** 8 candidates, all non-secret:
- 2 invented verification tokens in a review tool (`claude/tools/render-screens/screens.tsx`, historical; the file says «EVERY NAME, NUMBER AND VERIFICATION TOKEN BELOW IS INVENTED»);
- 6 UI copy keys whose names contain «PASSWORD» or «KEY».

**Secret-like file names in history:**
- `.env.example` holds placeholders only.
- `docs/recovery/durable-secrets.json` holds HMAC fingerprints, and at HEAD all are `null`.
- The rest are workflow and design documents.

**Synthetic and bootstrap persona passwords** (`audit/crawl.mjs`, `supabase/seed/*`) exist for the local stack. A read-only count on staging (2 Nov) found **no accounts** at `synthetic.pintar.test`, `bootstrap.pintar.test`, `evaluasi.pintar.test`, `audit.pintar.test` or `cards.synthetic.pintar.test`. The seed refuses production (INV-21).

Staging's own accounts take their passwords from repository secrets. Secret values are never in the repository.

**Rotation needed: none identified.** This does not prove that no credential was ever pasted somewhere else (an issue, a PR comment, a log). Those surfaces are outside a git scan. See §6, recommendation R-5.

## 4. Findings to decide

### 4.1 The owner's personal address · `data-pribadi` · fingerprint `c36e91689fa2`

**Where:**
- `.github/staging-human-request.txt`
- `.github/workflows/staging-human-setup.yml`
- `docs/recovery/JOURNEY-LOG.md`
- earlier commits

**What it is:** the staging human-account request uses it (a `+guru` alias of the owner's own mailbox).

**Status:** it is registered in `scripts/guard/allowlist.json` with its reason, so CI can run. That registration is **not** an approval for any other address.

**Options for the owner:**
- (a) Keep it. It is the owner's own address and the owner chose public.
- (b) Replace it in the three files with a role address at `pintarselalu.com`. History keeps the old value; removing it from history needs a rewrite, which is not authorised and is not recommended for this.

**Recommendation:** (b) in Batch 1, as a two-line change. Changing the staging request file triggers a staging workflow, so it waits for the freeze to lift.

The organisational addresses at `pintarselalu.com` are role or operational addresses, not personal data: `info@`, `noreply@`, `security@`, the Golden School identities, and `admin_gt@`. Being public, they are now known login names on staging. Their passwords are not in the repository.

### 4.2 Answer keys · `kunci-jawaban` · input to the F-4 plan (deliverable 5 §F-4)

| Set | Files | Real? | Evidence |
|---|---|---|---|
| `docs/onboarding/konten/*.paket.json` and `*.xlsx` | 40 (20 chapters) | Real | 603 distinct item stems; 619 correct-answer markers |
| `docs/onboarding/contoh/contoh-buku-kerja-pintar.xlsx` | 1 | Real (SD5 Bab 1) | 27 of its strings are real items |
| **`audit/fixtures/sd5-matematika-bab1.paket.json`, `…bab2.paket.json`** | **2** | **Real: every item matches the real chapter (26/26, 32/32)** | **New in B0-C.** They sat under a «fixtures» path, so a path-based allowance would have hidden them. The guard no longer allows answer keys by directory |
| `content/_uji-internal/strategi-pembelajaran/StrategiPembelajaran-Bab{1,2}.{paket.json,xlsx}` | 4 (**history only**, branch `claude/adoring-feynman-njmjll`) | Internal educator demo (LANA-22/23) | Public through that branch |
| Synthetic fixtures (`audit/fixtures/pd-uji-*`, `selftest/fixtures/bob02/*`, the handoff samples) | 10 | Synthetic | 0 items match real content |
| `docs/onboarding/PINTAR-Isian-Data-Sekolah.xlsx` | 1 | No keys | A data-entry template |

One generic sentence in `supabase/seed/learning_cycle.sql` matches a real objective. It is not an answer key.

## 5. Safeguards added (commit `0fb65bb`)

| Safeguard | What it does | Proven by |
|---|---|---|
| `scripts/guard/sensitive-scan.mjs` + `rules.mjs` + `allowlist.json` | Three modes: `--staged`, `--tree`, `--history`. Never prints a value. A credential is never allowed by path. Every `.paket.json` and `.xlsx` must be declared as `nyata-F4`, `sintetis` or `tanpa-kunci` with a reason | SEC-G01, SEC-G02 |
| `.githooks/pre-commit` | Refuses a commit that adds a finding not allowed. `npm install` installs it (`prepare` sets `core.hooksPath`) | Refused a planted personal address (rc = 1); let the real commit through |
| **SEC-G01** (selftest, static) | 17 planted findings refused by fingerprint, 10 public-on-purpose shapes allowed. Planted values are built at run time, so the test file holds none | **RED** with the allow check disabled, then GREEN |
| **SEC-G02** (selftest, static; runs in CI with every selftest) | The committed tree is clean. Every keyed or workbook file is declared, and none is declared that is no longer tracked. Every registered fingerprint has a reason. The hook is installed | **RED** with an undeclared planted package, then GREEN |

**Limits:**
- A local hook can be bypassed with `--no-verify`. SEC-G02 in CI is the backstop.
- The rules are shape-based. A secret with no recognisable shape, assigned outside a config file, would rely on review.
- The guard does not make public material private again (§F-4).

## 6. Recommendations (owner actions; none performed)

| # | Recommendation | Why now |
|---|---|---|
| **R-1** | **Branch protection on `main`**, set by the owner in GitHub settings before any further merge to `main`. Settings, if this plan is accepted: <br>• require a pull request (no direct push) <br>• require status checks `ci / verdict` (the CI verdict job) <br>• require branches up to date <br>• block force-push and deletion <br>• include administrators <br>• restrict who can push to the owner <br>• require conversation resolution | Public repository; D-143 consequence (a) |
| R-2 | Enable GitHub **secret scanning and push protection** (free on public repositories) | A second, provider-maintained net beside the in-repo guard |
| R-3 | **Protect the `production` and `staging` environments**: required reviewer (the owner); deployment branches limited to `main` | Workflows that touch them can be dispatched from any branch by anyone with write access |
| R-4 | Restrict **Actions on pull requests from forks**: require approval for all outside contributors; never expose secrets to fork PRs (the default; confirm) | Public repositories accept fork PRs |
| R-5 | Owner review of **non-git surfaces** (issues, PR comments, Actions logs, artifacts) for any pasted credential | A git scan cannot see them |
| R-6 | Decide **F-4** (deliverable 5) and **§4.1** | Answer keys are the material risk |
| R-7 | Decide whether branch `claude/adoring-feynman-njmjll` (the internal demo packages) stays published. Deleting a branch is not authorised in Batch 0 and does not un-publish anything already copied | §4.2 |

---

## Erratum (Batch 1, 2 Nov 2026): the answer-key count was too low

§4.2 counted 43 tracked files with real answer keys. **That missed 40 more**, found while mapping F-4's consumers in Batch 1:
- **the 20 generator scripts** `docs/onboarding/konten/*.py` (`sd5_matematika_bab*.py`, `sma10_*.py`, `sma11_*.py`): each holds every item with its key;
- **the 20 misconception maps** `docs/onboarding/konten/*-miskonsepsi.csv`: their `questions` column lists every distractor's letter per item, so the key follows by elimination.

**Why the scan missed them:** the Batch 0 guard recognised keyed material only by file type (`.paket.json`, `.xlsx`) and by `"is_correct": true` inside `.paket.json`.

**Corrected count:** 83 tracked files in the active tree (43 + 40), plus 4 on one branch. The items exposed are the same 619 (`batch-1/F4-EXPOSED-ITEM-INVENTORY.md`). The new files reveal the same keys in other forms; they add no new items.

**Fix:**
- In Batch 1 (F-4), every one of these files is removed from the active tree by a forward commit.
- The guard now recognises keyed **content**, not only file types: correct-answer markers in data files, generator tuples, and misconception maps with a distractor column. Proven red/green in SEC-G01.

No credential finding changes: still 0.

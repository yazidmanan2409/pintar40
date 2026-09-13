# 10 — PINTAR Removed & Rejected Features

*Baseline amendment (2026-09-12): §2 "Anti-patterns PINTAR 4.0 must not
reintroduce" added; NFC card row updated to PARK per OD-6; category
references updated to the BUILD NOW / FOUNDATION NOW / LATER / PARK
scheme.*

Prevents Fable 5.1 from discovering old code/docs and accidentally
resurrecting something that was deliberately left behind.

## 1. Removed / rejected features (historical record)

| Feature | Historical purpose | Why removed/rejected | Replaced by | Recreate in PINTAR 4.0? |
|---|---|---|---|---|
| Legacy `soal`-table question bank (`/asesmen`, `/hasil`, `/sertifikat`) | Original assessment engine for the herbal EBM course, predates the PLP schema | Superseded by the PLP-native model; kept running in parallel only as a stability bridge, never intended as permanent | PLP-native items/item_options/assessment definitions under the one engine (INV-26) | **NO** |
| Legacy SD5 "Pecahan" fraction-pilot bank (same `soal` table) | Thin-slice pilot to prove the PLP concept before full PLP schema existed | Superseded by the 9-chapter PLP-native SD5 curriculum; relationship between the two was never resolved, which is itself the reason to not carry either forward | PLP-native SD5 Math ch1–9 | **NO** — author fresh SD5 content directly in the PLP model |
| `migrations-legacy-warisan-akar/` colliding migration series | A second SMA10 seed series that collided in filename numbering with the canonical series | Numbering collision, required manual interleave instructions to run at all | One linear migration history (doc 16 §2) | **NO** |
| In-memory certificate store (`lib/penyimpanan.ts`-style Map) | Fast to build for an early demo | Doesn't survive restarts or multiple serverless instances; certificates must be durable | Postgres-backed certificates from migration one | **NO** |
| Dummy-data fallback in the briefing pipeline (`getStatusKohortLive()` stub, "Mode Pengujian" banner) | Let the briefing UI be built and demoed before real cohort data existed | Risk of permanently masking whether real data was ever wired in; erodes trust in an evidence-based product | Honest "not enough data yet" empty state | **NO** |
| `NEXT_PUBLIC_GDRIVE_BASE_URL` / `NEXT_PUBLIC_GDRIVE_ROOT_FOLDER_ID` env vars | An earlier asset-hosting approach via Google Drive | Read by nothing in the final tree — dead configuration asserting a contract the app never implemented | Supabase Storage with signed URLs | **NO** |
| Direct-from-browser anon-key storage upload (`lib/plp/storage.ts` client `.upload()`) | Fastest path to a working Studio upload UI | Root dependency that made the C2 storage vulnerability's fix a two-part coordinated change instead of one migration | Server-side signed-upload route, `service_role`-gated | **NO** |
| `~90` dated `delivery-*`/`handoff_*` patch folders as the primary "repo" structure | Organic result of many independent AI-assisted work sessions, each producing its own delivery bundle | Required a manual reconciliation manifest just to know which files were current; enormous archaeology overhead; made the user the middleware between the AI and the repository | One git trunk, real commit history (doc 16 §1) | **NO** |
| Parallel static/legacy exports (`archive/PINTAR-2.0-baked/`, `site-full-2026-07-31/`) | Earlier product iterations kept for historical reference | Not part of the running product; kept only for provenance research | N/A | **NO** |
| Two public certificate-verification URL shapes (`/verify/[hash]` and `/verifikasi/[id]`) coexisting with no redirect | Organic result of a route naming change mid-project without cleaning up the old one | Confusing surface area, printed QR codes pointing at two different implementations | One canonical route (INV-38) | **NO — build exactly one from the start** |
| Provisional, never-classified migrations `0085`–`0088` | Written speculatively ahead of confirmed need | Left in an ambiguous "maybe already applied, maybe not" state with no resolution | N/A — a ground-zero rebuild has no provisional-migration backlog to inherit | **NO** |
| Physical ID-1 credential card with NFC glyph + 3D flip animation | A proposed premium credential-design direction | Never implemented; a print/physical-goods concept, not validated against any real requirement | A4 printable certificate (BUILD NOW) | **NO — PARK (OD-6 resolved as parked; reconsider only by explicit product-owner decision)** |
| Bulk Excel/CSV importer describing itself with parser/validation jargon in end-user copy | Early Studio import UI language | Conflicts with the "offer creation, never configuration" doctrine — exposes internal mechanics as user-facing verbs | Easy Upload / "Create Learning Package" framing with Publish Readiness (doc 04 §1a) | **Recreate the underlying capability, NOT the user-facing framing** |
| Certificate `plp_release_id` stored outside the HMAC payload (rebuild package, pre-baseline design) | Intended to protect the binding from identity-model churn | A binding outside the signature can be swapped without detection | Release id + hash inside the signed payload; identity churn handled by the identity snapshot (INV-05, INV-30) | **NO** |
| Hard-coded 25-second hesitation window | Simple first implementation of the Hesitation Window | Pedagogical timing should be governed configuration, not architecture | Per-definition hesitation window within platform-governed bounds (doc 07) | **NO** (25 s may be a default value, not a constant) |
| Blueprint-configurable pre/post item overlap ("avoid identical items where possible") | Early flexibility for growth measurement | Post-test mastery must not be pre-test memorisation | Zero identical and zero parallel-group overlap (INV-24); anchor designs as a distinct LATER mode | **NO** |

## 2. Anti-patterns PINTAR 4.0 must not reintroduce

These are patterns, not features. Independent audits (doc 16 §5) search
for them explicitly.

| Anti-pattern | Why it is forbidden | Baseline rule that replaces it |
|---|---|---|
| Duplicate assessment engines (learning, Quick Assessment, exam, Mini-PINTAR, paper each with their own) | 3.0's parallel implementations; doctrine verified twice | One engine, many modes — INV-26 |
| Duplicate canonical curriculum banks | The unresolved SD5 question | One canonical PLP; retirement condition for any thin slice (Lesson 5) |
| Client-side answer keys | Invalidates every certificate | INV-01, allow-list sanitizer (doc 07) |
| Public protected storage | C2 root cause | INV-15, INV-36 |
| Hardcoded passwords / credentials | Lesson 8 | Seed guard (INV-21); secrets in the deployment system only (doc 16) |
| Production dummy fallbacks | Lesson 6 | Honest empty states |
| Anonymous privileged uploads | Lesson 7 | Server-gated signed upload only (INV-15) |
| In-memory state masquerading as durable state | Lesson 9 | Postgres from the first migration; durable client outbox for responses (INV-28) |
| Fail-open security | Lesson 11 | Fail-closed tests on every authorization primitive |
| Patch-folder migrations; undocumented manual SQL | Lessons 4, 12 | One trunk, canonical ordered migrations, no manual production writes (doc 16 §1–2) |
| AI direct publication | Doctrine: AI has no pedagogical authority | INV-32; human `CAN_PUBLISH` only |
| Fake psychometric data | Doctrine: accountable measurement | Empirical fields honestly empty; separate predicted vs empirical (doc 02) |
| Security enforced only by hidden UI | Doctrine: boundaries at the data layer | INV-37; doc 05 tested at DB and API layers |
| Learner telemetry changing academic score | Assistance must never penalize help-seeking | INV-11 |
| Public-demo evidence contaminating official evidence; synthetic users contaminating real analytics | Trust in evidence | Structural eligibility — INV-20, INV-33 |
| Automatic cheating verdicts | Human authority required for integrity decisions | Review signals only; `CAN_REVIEW_INTEGRITY` human decision (doc 05) |
| Autonomous pedagogical decisions (item "too easy", curriculum "wrong", auto content edits) | PINTAR observes, highlights; educators decide | Question Health lifecycle requires human review (doc 04 §9) |
| Vendor-specific AI concepts in the canonical domain model | Vendor neutrality | AI Provider Gateway; provider = provenance only (INV-32) |
| Prompt-based secrecy ("do not reveal the answer") as a security control | AI obedience is not a boundary | INV-31 |
| Silent reassignment of learners to a corrected release; silent rewriting of history | Historical integrity | Release-correction policy, audited moves (doc 08) |
| Repeated patching at the same failing gate | 3.0's late large audit | Stop-patch-loop rule (doc 16 §7) |
| The user as middleware (copying SQL, relaying patches between AI and repo) | Lesson 12 | GitHub as source of truth; deployment traceable to source (doc 16 §1) |

If Fable 5.1 encounters any of the above referenced in an old document or
old code sample during the rebuild, treat it as historical record only —
never as a spec to satisfy.

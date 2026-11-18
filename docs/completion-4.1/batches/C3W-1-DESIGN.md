# C3w-1 · AI-assisted question drafting, built to the local stub · the pre-build design

Bob, Chief Architect, 18 November 2026. **DRAFT for Sharon's and Daisy's pre-build review** (`PLAN-A3-C3W-Z.md` §3.4).
**It adds no scope.** It gathers what is already decided into one buildable page, and names the objects, codes and red-first
tests before the build. The governing sources are:
- THE PLAN §5.6 (D1–D11, E, F);
- Addendum 1 R-3;
- rulings 38–42;
- `C3W-PAID-ADDON-ASSESSMENT.md` (S-1 to S-8);
- Sharon's `C3W-R3-DESIGN.md` (`claude/gracious-lamport-0m1qjr`).

Where this page and a source differ, the source wins and this page is corrected.

**C3w-1 is not acceptance of C3w** (owner, 16 Nov). It makes no external call, spends nothing, holds no key and bypasses no
provider gate. The provider is a **local stub** behind the one interface (D8). Until C3w-2, every school's entitlement is
absent, so the feature shows «belum tersedia» everywhere outside the test harness (D7, S-7).

**Starts:** after A3 closes (merge order C2w, then A3). Second Eye builds; this page is its starting point. Second Eye
restates it as the batch's own page before the build.

## 1 · Entry conditions (PLAN §3.3–3.4), and where each stands

| Condition | State, 18 Nov |
|---|---|
| A3 closed | A3 candidate `e6e28e52`; its preservation pair is drafted (`a3-evidence/preservation-A3.sql`) |
| C1w and B1 verified | Merged and promoted to staging (282). Re-verified at Z |
| Studio journeys green | Green on C2w's candidate (audit-journeys 44216105919). Re-run on A3's head |
| Daisy's Studio consistency findings applied | **Asked of Daisy, 18 Nov:** which findings, and whether each is applied on main |
| R-3 as a checkable design, including decision 3 (the common-names rule) | Sharon's `C3W-R3-DESIGN.md` (13 Nov): five controls, R3-01 to R3-07. **Decision 3 goes to the owner at this review only if no rule both protects learners and keeps ordinary text usable** |
| S-1 to S-8 as tables, codes and tests, with Sharon's points | §3 to §5 below. **For Sharon** |
| Daisy's words for every state, the period-neutral limit sentence, the teacher's next step | **Asked of Daisy, 18 Nov** (`C3W-1-WORDS.md` on `ux-1/daisy-experience`) |

## 2 · The flow (D1), unchanged

The flow has five steps:
1. The author chooses «Buat draf soal dengan AI» on a draft package.
2. The author confirms the source rights (D10), then gives a lesson of the package or a pasted excerpt, the objective
   and a count.
3. The server, in this order:
   - (a) refuses unless the school's entitlement allows it (S-6: checked here only);
   - (b) runs R-3's check on the final excerpt; a match refuses, and nothing is reserved (Sharon Q4);
   - (c) reserves the attempt (S-3);
   - (d) calls the provider (in C3w-1, the stub);
   - (e) validates the whole response against `item-schema.json` and the single-key rule;
   - (f) in one transaction, writes the drafts through `tambah_soal_draf`, with their provenance rows, and settles the
     attempt.
4. Each generated draft is accepted, edited or deleted by an educator. Submitting for review refuses until every one is.
5. The draft then goes through the existing content check, second-person review, release and publication, unchanged.

## 3 · Database objects (one migration, vendor-free names, INV-32)

| Object | Purpose | Notes |
|---|---|---|
| `ai_opsi` (S-8) | The registry of qualified options | Neutral key; display name; `model_ident`, `harga_dasar` (price basis, jsonb) as values; `status` QUALIFIED, SUSPENDED or WITHDRAWN; `plafon_biaya` (the per-provider ceiling, S-2/§9.1); `henti_keras_terverifikasi` (the provider-side hard stop is a mandatory qualification field, Sharon 16 Nov; it must be true for QUALIFIED). **Operator-written only. C3w-1 inserts no row outside tests** |
| `ai_plafon_platform` (S-2) | One platform-wide ceiling | A single row. Absent means refused (D7: an unset limit is never unlimited) |
| `ai_hak_sekolah` (S-1, §9.1) | A school's entitlement | One row per school: `aktif`, `jatah` (the allowance, a neutral amount), `mulai`, `berakhir` (optional), and `opsi` (references `ai_opsi`; must be QUALIFIED at reservation). Operator-written. **The reservation's row lock (S-3)** |
| `ai_batas_pendidik` (D7) | The per-educator limit within the school | Optional row. Absent means the school's limit alone. *For Sharon: keep, or fold into S-1 for 4.1?* |
| `ai_permintaan` (D5, D11) | One row per generation request | School and requester fixed at insert; package; lesson or pasted; `excerpt_sha256` and a bounded reference, **never the text**; the objective; the count asked; `kunci_idempoten` (unique per requester); `hak_sumber_dikonfirmasi_at` (D10; null refuses); the outcome DRAFTED, REFUSED_*, PROVIDER_FAILED or INVALID_OUTPUT |
| `ai_percobaan` (S-3, S-4, S-5) | One row per provider attempt | Request; `opsi` (resolved at reservation, recorded; §9.2); `model_ident` and price basis as values; `dicadangkan` (the reserved worst case); `diselesaikan` (the settled cost); tokens in and out; `keadaan` RESERVED, SETTLED, RELEASED or UNRECONCILED; timestamps. **No key, no text** |
| `ai_asal_soal` (D3) | Provenance, one row per generated question | `item_id` (lineage carries later revisions, as in C2w); request; attempt; `model_ident`; the provider's request id; prompt version; `excerpt_sha256`; requester; instant. **Immutable** (a guard trigger, the pattern of `catatan_peninjau_jaga`). Granted to no learner role (D4) |
| `ai_penerimaan` (D2) | The acceptance fact | `item_id`; ACCEPTED, EDITED or DELETED; by; at. Beside the provenance, never on `items`. *For Sharon: one row per decision (append), or one row per draft (last decision)?* |
| `langkah_konten` (existing, redefined in full) | Submit refuses while any generated draft in the package has no acceptance row | The design states the code and Daisy's sentence. Hiding the button is not the rule (D2) |
| The Studio reader | `ai_asal_soal_baca(p_item)` | Requires `CAN_DRAFT` or `CAN_REVIEW` over the content. Returns the provenance line, and the provider's display name for staff (ruling 40) |
| The R-3 functions | `c3w_bahan`, `c3w_periksa_bahan` (Sharon's control 1 and 2, as named there) | Definer functions with a dedicated owner. The check returns no name, PINTAR ID or person id (R3-06) |
| The reservation, settlement and reconciliation functions | `ai_cadangkan`, `ai_selesaikan`, `ai_lepaskan`, `ai_rekonsiliasi` | Service-level only (the route's server role), never `authenticated` |
| Registry rows | `record_class_registry`, `client_rpc_registry`, `orang_lampiran` (the requester and decider columns, L1-F4) | As C2w did for `catatan_peninjau` |
| Not a metric source | A refusal trigger on `metric_sources` for the new tables | As C2w's `catatan_peninjau_bukan_sumber_metrik` |

**Codes.** One new errcode, **PR220**, with designed `detail` codes, the pattern of A3's `SITTING_NOT_CONTROLLER`:

| Detail code | When |
|---|---|
| `AI_TIDAK_TERSEDIA` | No entitlement, entitlement off, or the option not QUALIFIED (the screen shows «belum tersedia», not an error) |
| `AI_HAK_BERAKHIR` | Entitlement outside `mulai`–`berakhir` |
| `AI_JATAH_HABIS` | The reservation would exceed the school's allowance or the educator's limit |
| `AI_PLAFON` | The reservation would exceed the provider's or the platform's ceiling |
| `AI_HAK_SUMBER` | The source-rights confirmation is missing (D10) |
| `AI_DATA_PRIBADI` | R-3 blocked the excerpt (`REFUSED_PERSONAL_DATA` on the request; no reservation) |
| `AI_GAGAL` | The provider failed after the bounded retries (D11); nothing created |
| `AI_KELUARAN_TIDAK_SAH` | The output failed the schema or the single-key rule; nothing created (D6) |
| `AI_BELUM_DITERIMA` | The submit step: a generated draft in the package has no acceptance |

A repeated submit with the same `kunci_idempoten` returns the first outcome and makes no new attempt (D11). It is not
an error. Daisy owns every sentence.

## 4 · S-3 and S-4 precisely (for Sharon)

1. **Reserve.** In one transaction, `select … from ai_hak_sekolah where sekolah = $1 for update`. Then:
   - check that the option is QUALIFIED;
   - check the window;
   - check the sums: held plus settled, against `jatah`, the educator's limit, the option's ceiling and the platform
     ceiling. "Held" counts RESERVED and UNRECONCILED attempts at their reserved amount; "settled" counts SETTLED
     attempts at their settled amount;
   - insert the attempt as RESERVED at the worst case: max output tokens times the output price, plus the input
     estimate times the input price, from `harga_dasar`.

   Concurrent requests queue on the lock (C3-4). **Lock order:** the entitlement row, then the platform row. The
   platform ceiling is read under `for update` of its single row only when the school passes. *For Sharon: lock the
   platform row on every reservation? It serialises all schools, though cheaply, at one short transaction per call.*
2. **Call**, outside any transaction.
3. **End the attempt.** Each attempt ends in exactly one of three states:
   - **SETTLED** at the reported cost, for a success, an invalid output, or a reported failure with usage. A cost above
     its reservation sets the platform's stop (a flag on the platform row; every reservation refuses with `AI_PLAFON`)
     and is reported;
   - **RELEASED** when the request provably never left: a refusal, or a crash before sending. The server marks
     "sending" on the attempt before the network write, so a crash leaves RESERVED with no "sending" mark, which is
     RELEASED at sweep;
   - **UNRECONCILED** when it may have left with no usage back. The reservation is held, not consumed.
4. **Reconcile.** `ai_rekonsiliasi` settles or releases an UNRECONCILED attempt against the provider's usage records.
   In C3w-1 that is the stub's own record. It is operator-run. A hold older than a fixed age (*value for Sharon*) is
   listed on the operator's reader.
5. **Retries** (D11) are new attempts under the same request, each reserved first. A bounded count, value for Sharon.

## 5 · The stub (C3w-1 only)

- It implements D8's one interface in a `server-only` module. It is selected when no real adapter is configured, which
  is always the case in C3w-1.
- It is deterministic from a seed in the excerpt hash. It can be told, by test fixtures only, to return:
  - valid items;
  - an invalid schema;
  - two correct keys;
  - a failure with usage;
  - a timeout with no usage;
  - a slow reply.
- It counts its calls, so a test proves "zero provider calls".
- **It never opens a socket.** A static test asserts that only the provider module may import a network client (C3-8),
  and that the stub imports none.

## 6 · Acceptance evidence (PLAN §3.5), mapped to red-first tests

| # | Tests (red first; the plant that must turn each red) |
|---|---|
| C3-1 | `langkah_konten` refuses with `AI_BELUM_DITERIMA` while one generated draft lacks acceptance (plant: drop the check). The author cannot approve their own generated draft (the existing two-person rule, re-asserted on a generated draft) |
| C3-2 | Learner roles cannot select `ai_asal_soal`, `ai_permintaan` or `ai_percobaan`. The closed-projection assertion names the tables. A scan of every learner-reachable RPC answer for the provenance keys. The engine's forbidden-key list gains them |
| C3-3 | Each stub failure mode leaves zero `items`, zero provenance and one request row with the outcome (plant: insert before validating). A double submit makes one stub call |
| C3-4 | Two connections reserve at an allowance's edge: exactly one reaches the stub (real connections, in the existing race harness). A crash after "sending" leaves UNRECONCILED (held, not consumed). A crash before it leaves a release. A retry is its own reserved attempt |
| C3-5 | School A's request cannot move school B's sums. Two schools on two options route to their own option and ceiling |
| C3-6 (S-6) | With the entitlement off, expired or exhausted: drafts can be accepted, edited, deleted and submitted; questions can be reviewed, released, published, sat, reported and certified; provenance stays readable to staff |
| C3-7 (R-3) | Sharon's R3-01 to R3-07, unchanged, including R3-04 (a lone given name in prose is allowed) and R3-05 (no disclosure of a learner's existence) |
| C3-8 | Only the provider module imports a network client. No vendor name in any schema name (INV-32 guard). No learner surface carries the mark |
| C3-9 | The workbook and structured-import tests pass unchanged (ruling 41) |
| C3-10 | The cross-batch checkpoint: a generated, accepted, reviewed and published question is sat, reported, key-corrected (C2w's path) and annotated like any other |
| C3-11 | Daisy's screens, every state, at 1280, 390 and 320 px, by keyboard |
| C3-12 | **C3w-2 only:** the supervised staging run |

Plus one test in the pattern of the C2w and A3 restatements: **no existing function body changes** except
`langkah_konten`, which is restated in full with its grants.

## 7 · Out of C3w-1

These wait for C3w-2: any real adapter, key or egress; prices of real providers in the registry; the owner's numerical
limits; the supervised staging run.

These are not in 4.1 at all (rulings 38–41): billing, payment, school-admin purchasing or usage screens, school
self-selection of an option, and a school-facing comparison.

## 8 · Questions for the pre-build review

**For Sharon:**
1. Keep the per-educator limit as its own table, or fold it into S-1 for 4.1 (§3)?
2. Acceptance as an append-only log, or as the last decision per draft (§3)?
3. The platform row's lock on every reservation (§4.1).
4. The hold's flag age and the retry count (§4).
5. The reconciliation design as a whole (S-4 says it is hers).
6. Whether R-3's common-names rule is settled, or goes to the owner (decision 3).

**For Daisy:** every sentence for the codes in §3, the states in `C3W-1-WORDS.md`, and the Studio consistency findings.

**For the owner:** nothing now. Decision 3 comes only if the review cannot settle it. C3w-2's inputs (the qualification,
the limits, the key) come after E.

# C3 blind provider evaluation · the kit (prepared 9 Nov 2026; no paid call made)

This folder implements `../C3-EVALUATION-PLAN.md`. Under the owner's 9 Nov direction it is prepared now. The paid calls
and credentials follow only once the providers' actual terms and access are ready. **Nothing here calls a provider.**

## What is here

| File | Purpose |
|---|---|
| `prompt-v2.md` | The one request, in Indonesian, sent byte-identical to every provider as a single user message. v2 has Daisy's 9 Nov review applied; v1 (`prompt-v1.md`) is kept for the record. Any change makes a new version |
| `item-schema.json` | The output contract (stem, A–D options, key, a misconception per wrong option, objective code, one-line rationale). It is kept to the schema subset every provider's structured output accepts; counts and cross-field rules are checked by the kit |
| `material/bab1.md`, `material/bab2.md` | The frozen material: the synthetic SD Kelas 5 Matematika chapters (F-4), with their objectives (coded B1-T1…B2-T4), known misconceptions and lessons. **No question, option or key from the chapters is sent** |
| `material/MANIFEST.json` | The SHA-256 of each source, material, request, prompt and schema, and of `kit.mjs`, `score.mjs` and `report.mjs` (the frozen set). These are recorded with every draft for provenance |
| `kit.mjs` | `material`, `request`, `validate`, `blind`, `seal-key` and `selftest`. `score` is retired and refuses (use `score.mjs`). Dependency-free; no network |
| `score.mjs` | Scoring under E-DECISION-PACK §4.1–§4.3a (16 Nov): one provider code's judge sheets plus Sharon's flags, checked against the flags file's committed SHA-256. Output: the resolved table, critical count, Q1, Q2 per criterion (Q1 and Q2 PROPOSED, awaiting owner approval), the verdict and flag counts. Input formats are in its header. `node score.mjs --self-test` |
| `report.mjs` | The §4.5 evidence per provider code: cost per attempt, per valid and per accepted draft; tokens, retry and failure rates, response times, rate limits met, cost variability; provenance completeness, including `pack_sha`. Reported **beside** the scores, never inside them. It refuses unless the sealed map matches its committed hash and every code has its final `score.mjs` output. `node report.mjs --self-test` |

`node docs/completion-4.1/c3-eval/kit.mjs selftest` runs the whole pipeline offline, on planted cases:
- material and requests regenerate byte-identical;
- the request carries no key;
- a wrapped response is measured invalid, not repaired;
- per-item defects are caught;
- the reviewer files carry no provider or model name, and the key-check sheet shows no key;
- an item that fails the item schema is not shown to the judges or to Sharon; only that item is voided;
- the SEALED map records 30 slots per code (valid, malformed, missing), which `score.mjs` reads;
- `kit.mjs score` refuses (retired);
- `kit.mjs` and `score.mjs` match their hashes in `MANIFEST.json`.

## The scoring method (E-DECISION-PACK §4.1–§4.3a, amended by the owner 16 Nov)

`score.mjs` applies it, one provider code at a time. Its header documents the input formats. The method:
- **Slots:** always 30 per provider, 15 per chapter. Each slot is one of three kinds:
  - **valid:** shown and judged;
  - **malformed:** the item fails the item schema. It is never shown to the judges or to Sharon, so its format cannot
    unblind, and it scores 0 on every criterion. Only that item is voided, not its draft;
  - **missing:** there is no item at that position. A whole-response failure takes the runner's retry path; if no
    attempt succeeds, its 15 slots are missing.

  `kit.mjs blind` writes the slots into `SEALED/map.json` (`slots`).
- **Judges:**
  - two educators (J1, J2) score every valid item;
  - correctness stands when they agree, unless Sharon has flagged the item. If they disagree, or the item is flagged,
    the third educator (J3) decides;
  - on a 0–2 criterion, a 1-point gap scores the average. A 2-point gap takes the median of J1, J2 and J3.
- **Sharon's flags:** her flags file's SHA-256 is committed before she sees any score. `score.mjs` refuses a file that
  does not match it. A flag is **upheld** when the third educator scores correctness 0.
- **Critical:** a valid item whose resolved correctness is 0. **Accepted:** resolved correctness 1 and resolved review
  burden ≥ 1. 0.5 is not accepted; 1.5 is.
- **Qualify:** critical ≤ 1, Q1 accepted ≥ 24/30, and Q2 each 0–2 criterion's mean ≥ 1.0. Critical items count
  toward Q2 as resolved. Q1 and Q2 are **PROPOSED**, awaiting owner approval. Ruling 40's checks are separate.

The older `kit.mjs score` (a resolver row R, and Sharon's blind check of 0 made an item critical) predates the 16 Nov
amendment. It is retired and refuses with a pointer to `score.mjs`.

The blinding map is revealed last, for the owner.

## Provider requirements (before any paid call)

For each provider:
1. **Terms:** official pricing and binding data terms confirmed by the owner (P1–P3). The terms must cover no training on
   API data and the retention period.
2. **Access:** network egress to that one API host, approved as an environment change (P4).
3. **Key:** one key with a provider-side spend cap, supplied as a network secret, never in the repository or the chat
   (P5).
4. **Model:**
   - the provider's mid-tier general model at standard settings, recorded with its date **before** the run and not
     changed after (for Anthropic, Claude Sonnet 5.5);
   - structured output enforced with `item-schema.json` where the provider offers it, so its absence is visible in the
     validity rate.
5. **Recorded per call:** request id, model, input and output tokens. `usage.json` holds these and the confirmed price.
6. **Budget:**
   - a hard stop in the runner at US$8 per provider, and US$25 in total;
   - at most 3 attempts per chapter;
   - every attempt is kept, and the first valid one is judged.

The runner that makes the calls is written only after P1–P5 hold, against each provider's official SDK documentation.
It is the one part of the kit not prepared yet, because it depends on the actual terms and access.

## Run procedure (once authorized)

```sh
node kit.mjs material && git diff --exit-code material/          # material unchanged since review
# runner: writes runs/<provider>/bab1.json, bab2.json, usage.json (raw responses, unmodified)
node kit.mjs blind runs out                                       # out/reviewer → educators; out/kunci → Sharon only; out/SEALED → nobody (malformed items are in neither)
# Sharon solves out/kunci/lembar-kunci-tanpa-kunci.md and seals her answers BEFORE any full sheet is opened:
node kit.mjs seal-key out jawaban-k.csv                           # one seal only; the kit compares answers with keys
# Sharon commits the SHA-256 of her flags file before she sees any score; educators score J1, J2 (and J3 where sent)
node score.mjs sheets-<code>.json flags.json --flags-sha256 <hex> --json > score-<code>.json   # per code; slots from out/SEALED/map.json
# only once every score is final: open the map against its committed hash (the unblinding step)
node report.mjs --runs runs --map out/SEALED/map.json --map-sha256 <hex> --scores score-A.json,score-B.json
```

**Under the 16 Nov pack (E-DECISION-PACK §4):**
- the runner takes `--pack-sha <40-hex>`, the frozen pack's commit, and records it in every provenance record. A
  `--live` run without a valid value is refused before any request is built;
- `kit.mjs blind` builds what the judges and Sharon receive from an allowlist of item fields (`reviewer/items.json`,
  `kunci/items.json`, and the sheets rendered from them). No model, provider, request or response id, header, usage
  field or timestamp can pass through;
- `node score.mjs <sheets.json> <flags.json> --flags-sha256 <hex>` scores one provider code by the pack's two-judge
  rules. It refuses when the flags file does not match its committed hash.

`runs/` and `out/` hold provider output and judgements. They live outside the repository (in the evaluation's private
folder) until the owner has reviewed them. The results document is then committed as `../C3-EVALUATION-RESULTS.md`.

## Sharon's review (9 Nov), applied

- **Blind key check.**
  - Sharon receives only `out/kunci/`: the stem and the options, with no key, rationale or provider.
  - She records one answer per item and seals it with `seal-key` before any full sheet is opened. A second seal is
    refused.
  - The retired `kit.mjs score` compared her answers with the keys. Under the 16 Nov amendment, her role is blind
    **flags**, committed with their SHA-256 before she sees any score and resolved by the third educator (`score.mjs`).
- **Provenance per run** (`usage.json`): `model`, `model_date`, `endpoint`, `api_version`, `run_at`, `run_by`,
  `generation` (temperature, maximum tokens, system prompt), `data_retention`, `price_per_mtok`, and a `request_id` per
  call.
  - `report.mjs` marks a run whose record is incomplete (including `pack_sha`) and a judged response changed since
    blinding, beside the §4.5 cost figures.
  - Each raw response file is hashed into the sealed map at blind time.
- **Equal schema instructions:** v2 lists the fields in the prompt text itself, so a provider without structured output
  receives the same conditions. Sharon checks that the list matches `item-schema.json` exactly.

## Freeze

The kit is frozen at the commit that adds this line. `material/MANIFEST.json` holds the SHA-256 of the v2 prompt, the
schema, both materials and both requests, and (since 16 Nov, rulings 8 and b) of `kit.mjs`, `score.mjs` and `report.mjs`. A real
run is refused while any of them differs from its hash, and Sharon re-confirms the freeze on the head that records them. Any change after this needs a new version and a new freeze, and no external
evaluation runs on an unfrozen kit.

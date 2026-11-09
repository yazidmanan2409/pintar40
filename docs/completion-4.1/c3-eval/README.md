# C3 blind provider evaluation · the kit (prepared 9 Nov 2026; no paid call made)

This folder implements `../C3-EVALUATION-PLAN.md`. Under the owner's 9 Nov direction it is prepared now. The paid calls
and credentials follow only once the providers' actual terms and access are ready. **Nothing here calls a provider.**

## What is here

| File | Purpose |
|---|---|
| `prompt-v1.md` | The one request, in Indonesian. It is sent byte-identical to every provider as a single user message. Daisy reviews the wording before the run; any change is v2 |
| `item-schema.json` | The output contract (stem, A–D options, key, a misconception per wrong option, objective code, one-line rationale). It is kept to the schema subset every provider's structured output accepts; counts and cross-field rules are checked by the kit |
| `material/bab1.md`, `material/bab2.md` | The frozen material: the synthetic SD Kelas 5 Matematika chapters (F-4), with their objectives (coded B1-T1…B2-T4), known misconceptions and lessons. **No question, option or key from the chapters is sent** |
| `material/MANIFEST.json` | The SHA-256 of each source, material, request, prompt and schema. These are recorded with every draft for provenance |
| `kit.mjs` | `material`, `request`, `validate`, `blind`, `score` and `selftest`. Dependency-free; no network |

`node docs/completion-4.1/c3-eval/kit.mjs selftest` runs the whole pipeline offline, on planted cases:
- material and requests regenerate byte-identical;
- the request carries no key;
- a wrapped response is measured invalid, not repaired;
- per-item defects are caught;
- the reviewer files carry no provider or model name, and the key-check sheet shows no key;
- a provider with two critical keys is not recommended;
- validity and cost are computed;
- scoring refuses an unresolved disagreement or a missing independent key check.

## The scoring method (as `C3-EVALUATION-PLAN.md` §5)

Each item gets three rows in `judgements-template.csv`:
- **J1, J2:** two educators score correctness 0/1, alignment 0–2, distractors 0–2 and language 0–2.
- **R:** a third educator resolves only the criteria where J1 and J2 differ.
- **K:** Sharon's independent key check. She solves the item from `lembar-kunci-tanpa-kunci.md` without seeing the
  key, then records 0/1.

**An item is critical** if the educators' resolved correctness is 0, or Sharon's check is 0. Where the two differ, the
item is listed for the owner.

**The educational score** is correctness + alignment + distractors + language (0–7) per item. A critical item scores
0 for correctness.

**Missing or unrenderable items:**
- They count against validity (out of 30) and contribute no score.
- An item that is invalid but renderable is still judged.
- Validity is measured, never repaired.

**Decision rule:**
- A provider with more than 1 critical key in 30 is not recommended.
- The rest are ranked by educational score, then validity, then billed cost.

The blinding map is revealed last, in `C3-EVALUATION-RESULTS.draft.md`, for the owner.

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
node kit.mjs blind runs out                                       # out/reviewer → judges; out/SEALED → nobody
# judges fill out/reviewer/judgements-template.csv
node kit.mjs score out judgements.csv runs                        # → out/C3-EVALUATION-RESULTS.draft.md
```

`runs/` and `out/` hold provider output and judgements. They live outside the repository (in the evaluation's private
folder) until the owner has reviewed them. The results document is then committed as `../C3-EVALUATION-RESULTS.md`.

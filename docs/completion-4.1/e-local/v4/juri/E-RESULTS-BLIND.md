# E · Results by anonymous code (scored before the map is opened)

23 Nov 2026, by Bob. **The provider map stays sealed:** codes A and B are not yet linked to any provider.

## Inputs, each verified against its committed fingerprint

| Input | SHA-256 |
|---|---|
| J1 (`KEMBALI-J1.md`) | `3676368025a20b2f38ab39d01719d136ca97727198b277379c814dd87e7be137` |
| J2 (`KEMBALI-J2.md`) | `391e8efb3bd19b58a238120ea0a2b220e5650adb2eaa51e269c6656dfdfbec35` |
| J3 (`KEMBALI-J3.md`) | `a881169182692e5c2bc47b99d4d8737b870ba64c388eebcbb3f5a4689a5bbf7c` |
| Flags (`kflag/flags.json`, 0 flags) | `90e753acd601f9649398d98988721f1e2db08d7a361d44006f269b3397ce073f` |
| Slots (extracted by the owner on his Mac with `nilai-juri.mjs slot`; codes and item IDs only) | `7abc074119f2069b6552e6e4f9a690c9fa75e89f8bbc0fcab934898eb530cc1b` |
| `sheets-A.json` / `sheets-B.json` (`nilai-juri.mjs json`, exit 0) | `a06c9fc7…0013` / `287e5ef4…dfd9` |
| The frozen `score.mjs` (`claude/e-runner-v2`, last changed `4f65be88`; self-test 44/0) | `b4718fd7f50af205bdf082942490b10904760e600a2c8bb77bb088241dd48a2b` |

## Results

| Code | Valid slots | Critical (max 1) | Q1 accepted (min 24/30) | Q2 alignment | Q2 distractors | Q2 language | Q2 review burden | Verdict (scoring rules) |
|---|---|---|---|---|---|---|---|---|
| **A** | 30 of 30 | 0 · pass | **29/30** · pass | 2.000 | 1.817 | 1.967 | 1.883 | **QUALIFIES** |
| **B** | 30 of 30 | 0 · pass | **26/30** · pass | 2.000 | 1.733 | 1.850 | 1.667 | **QUALIFIES** |

- The Q2 minimum is 1.0 on each criterion.
- **Not accepted:**
  - A: one question, B2-029 (language and review burden, settled by J3);
  - B: four questions, B2-003, B2-007, B2-008 and B2-026 (each on review burden, three of them also on language; all routed to J3).
- **Every key is correct** by all judges, with 0 flags raised.
- **B1-016's wording note** (both judges' reasons, and Sharon's) stays for the educators. It is not a scoring matter.

**A stale label:** the frozen `score.mjs` still prints Q1 and Q2 as "PROPOSED, awaiting owner approval". They were approved by **ruling 48**. The frozen code is not edited.

## What these results do and do not decide

**The scoring rules only.** The verdict covers §4.3: the critical errors, Q1 and Q2. **Ruling 40's contract, security and operational checks are separate.**

**Next:**
1. The owner opens the map (the provider block), on his Mac.
2. Then the ruling 40 checks.
3. Then the **D-7 decision returns to the owner** (25 Nov, 10:00 UTC). **Nothing is activated automatically.**

## The map opened (23 Nov 2026, after every score was final)

The owner read the map on his Mac. **Its fingerprint matches the committed seal:** `112714f445ffc21731df68db70a0e038e33180e9ba6794cf734ea3a914315e59`. Only the provider block was printed.

| Code | Provider | Accepted (Q1) | Q2: alignment / distractors / language / burden | Scoring verdict |
|---|---|---|---|---|
| **A** | **OpenAI** | 29/30 | 2.000 / 1.817 / 1.967 / 1.883 | Qualifies |
| **B** | **Anthropic** | 26/30 | 2.000 / 1.733 / 1.850 / 1.667 | Qualifies |

**Rank** (for the evidence, not a selection; §4.3): by summed educational score, A is first and B second. Both had 30/30 valid items and 0 critical key errors.

**Ruling 40's other checks are not yet closed for either provider** (E-DECISION-PACK §1):
- **OpenAI:** its terms are not read, which covers training, the eligibility of the educator-only workflow (ruling 44) and synthetic educational text.
- **Both:** the subprocessor lists, G1 and G2, are not read.
- **Both:** the personal-data transfer basis under Indonesian law (PR-1, with counsel).
- **Operational:** run reliability and the cost per accepted draft, reported beside the results (§4.5) from the run records.

**So no provider is commercially qualified yet, and nothing is activated.** The D-7 checkpoint (25 Nov, 10:00 UTC) returns to the owner with these facts.

## Beside the results (§4.5): cost and reliability, from the run records

| | OpenAI (A) | Anthropic (B) |
|---|---|---|
| Cost of the scored run (both chapters) | US$0.151946 (run 3; output costed fail-closed, with reasoning counted twice) | US$0.352268 (run 2; excludes the US$0.129986 void run) |
| Valid items | 30/30 | 30/30 |
| Attempts used | 1 of 1 per chapter | 1 of 1 per chapter |
| **Cost per accepted draft** | **about US$0.0052** (29 accepted) | **about US$0.0135** (26 accepted) |

**Total E spend: US$0.634200 of US$10.**

These are single-run figures for one chapter pair. They are evidence for C3w's limits and later pricing (rulings 38–40), not a forecast.

## Ruling 40 reading, first pass (23 Nov 2026, read-only, official pages only)

**Anthropic: READ** (downloaded page text, quoted verbatim):
- **Commercial Terms:** effective **17 Jun 2025, unchanged.**
  - A.1 still permits use "to power products and services Customer makes available to its own customers and end users".
  - §B: "Anthropic may not train models on Customer Content from Services".
  - No age, minors or education clause.
- **DPA:** effective 24 Feb 2025. **Incorporated automatically** by Commercial Terms §C.
  - Transfers use the EU SCCs (Modules 2 and 3), with UK and Swiss addenda, plus help with transfer impact assessments.
  - **Indonesia is not mentioned.**
- **Usage Policy: CHANGED, effective 12 Nov 2026.** It is newer than the record, and the page also shows 17 Nov 2026.
  1. "Products serving minors, including organizations providing minors with the ability to directly interact with products that incorporate our API(s)…" must follow extra guidelines.
     - **PINTAR's design:** learners never interact with the AI; only adult educators draft, and their drafts go through acceptance. So it should fall outside this clause. **Bob's reading, for counsel to confirm.**
  2. A high-risk category covers "grading an exam or assessment that determines … certification (outside of multiple-choice testing)".
     - **PINTAR's design:** AI does not grade; it drafts multiple-choice items that a qualified educator accepts. That is outside the category.
- **Subprocessor list: NOT READ.** `trust.anthropic.com` is blocked by this session's network.

**OpenAI: NOT READ.** Every OpenAI host (`openai.com`, `cdn.openai.com`, `platform.openai.com`, `developers.openai.com`, `help.openai.com`) is blocked by this session's network.
- Search summaries only, **unverified**:
  - Services Agreement v.010126 (1 Jan 2026);
  - Usage Policies (20 Nov 2026);
  - API retention: abuse-monitoring logs up to 30 days; zero retention by prior approval;
  - an under-18 developer guidance page;
  - a DPA entered by form.
- **None of these count as read.**

**Still open for ruling 40:**
- OpenAI's terms, usage policies, subprocessors and DPA;
- Anthropic's subprocessors;
- the transfer basis under Indonesian law (PR-1, counsel).

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

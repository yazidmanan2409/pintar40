# E · The paid-run request (for the owner's authorisation)

Prepared by Bob, 17 Nov 2026, for the owner's review before **Wednesday 18 Nov, 12:00 WIB (05:00 UTC)**.

**This is a request, not an authorisation.** Nothing in it is done until the owner authorises it. The purchases and the
API calls each need that authorisation.

The rules it runs under are frozen in `E-DECISION-PACK.md` §4, at `ecb0d3c48b3a1ec0623253f3a32097ea5c7b38f4`
(Sharon, `93b934f3`). The caps are ruling 49's.

---

## 1 · Money: purchases and usage, kept apart

**Purchases** are money paid to a provider as prepaid credit. **Usage** is what the evaluation draws from that credit.
The two are different amounts.

### 1a · Purchases (cash paid to the providers)

| # | Provider | Purchase | Why it is needed | Source |
|---|---|---|---|---|
| P1 | OpenAI | **US$5.00 of prepaid credit** | API access at the Build tier requires "$5 in total credit purchases". The balance also stops requests when it runs out (`credit_balance_exhausted`), so it is a second hard ceiling | E-PROVIDER-FACTS §2a and §2d (grade A) |
| P2 | Anthropic | **US$5.00 of prepaid credit, if the console requires a prepaid purchase** | The console's billing is credit-based: "If you run out of credits, you can no longer call the API". **The minimum purchase amount is not in our verified sources.** If the console asks for more than US$5, stop and tell me; do not buy more | E-PROVIDER-FACTS §1d and §6c (stop: A; minimum: not documented) |
| | **Purchases, total** | **US$10.00, before any tax** | | |

- **Tax.** A card purchase may carry tax that the console adds at checkout. Our sources don't cover it. If tax is added,
  the cash total exceeds US$10.00 by that tax, while the usage below is unchanged. **This is yours to accept or refuse at
  checkout.**
- **Unused credit.** Whatever the evaluation does not use stays in each account as credit. The worst case leaves about
  US$4.24 in each. Whether it can be refunded or expires is not in our sources. Treat it as spent.

### 1b · Usage (drawn from those credits by the evaluation)

| | Anthropic | OpenAI | Both |
|---|---|---|---|
| Expected (one attempt per chapter, 2 calls) | up to US$0.255 | up to US$0.255 | up to **US$0.510** |
| **Worst case, every retry used** (6 calls of 12,000 output tokens) | US$0.764 | US$0.764 | **US$1.529** |
| Runner's own cap (refuses before a call could pass it) | US$5 | US$5 | **US$10 total** |
| Console hard limit (set and read back before the run) | US$5 | US$5 | — |
| Prepaid balance (stops requests when empty) | US$5 | US$5 | — |

The figures are at the verified US$2 / US$10 per million tokens (`E-DECISION-PACK.md` §3.2a, offline proof at `--cap-provider 5`).

### 1c · How it fits the approved US$10

- **Purchases** come to US$10.00 (P1 + P2), before tax. That is the cash ceiling, and it equals the approved total.
- **Usage** is bounded **four times** below that:
  - the runner refuses a call that could pass US$5 per provider or US$10 in total;
  - each console's hard limit is US$5;
  - each prepaid balance is US$5;
  - the worst case is US$1.53 in all.
- Nothing can draw more than was bought: a provider stops at zero balance.

---

## 2 · The steps, in order

Each step has its own approval. **Steps 1–5 are done by you, in your own browser and consoles.** I never see, handle or
log a credential.

| # | Step | Who | What I record (no personal or account data) |
|---|---|---|---|
| 1 | **Terms.** Read and accept, or drop the provider: <br>• Anthropic's full sub-processor list (G2), https://trust.anthropic.com/subprocessors, as the complete tab (the overview was read on 17 Nov). <br>• OpenAI's terms were read on 17 Nov (ruling 48, G1). | You | "Terms accepted: Anthropic yes/no, OpenAI yes/no", with the date |
| 2 | **Purchases P1 and P2** (§1a), with the tax shown at checkout. | You | The amounts paid, tax included |
| 3 | **Hard limits, US$5 each.** <br>• **Anthropic:** in a new **dedicated workspace** (the Default workspace cannot carry its own limit), set its spend limit to US$5. Set the organisation limit too, if the console offers it. <br>• **OpenAI:** in a new **project**, turn on "Enforce a hard limit" at US$5. | You | Each limit **as read back** from the console |
| 4 | **Keys.** One key per provider, created **inside that workspace and that project**. Enter each one yourself in the secure form I open, one for `api.anthropic.com` and one for `api.openai.com`. | You | "Key configured: yes", never a value |
| 5 | **Network.** You approve a prompt that adds exactly `api.anthropic.com` and `api.openai.com` to this environment, for the run only. | You | The approval, and later its removal |
| 6 | **Pre-run checks, at no cost:** <br>• the model IDs `claude-sonnet-5-5` and `gpt-6.1-sol`, confirmed through each API's model listing (no generation, so no tokens are used), or on the official model pages; <br>• the second offline dry run, `--real-prices --cap-provider 5 --cap-total 10`; <br>• the self-tests. **Any mismatch stops the run** and comes back to you. | Bob | Outputs, committed (no key, no account data) |
| 7 | **Go: the paid calls.** At most 6 calls per provider, with the runner capped at US$5 / US$10 and `--pack-sha ecb0d3c4…`. The material sent is the synthetic SD Kelas 5 package only. **No real-person data is sent.** | Bob, on your "go" | The ledger, the provenance records and the cost per provider |
| 8 | **After the run:** <br>• You revoke both keys. <br>• I propose removing the two hosts (you approve). <br>• You may leave or lower the console limits. | You and Bob | The revocations and the removal, confirmed |

---

## 3 · From the run to Thursday 19 Nov

| When (WIB) | What | Who |
|---|---|---|
| Wednesday, by 12:00 | Steps 1–5 done, and your "go" for step 7 | You |
| Wednesday afternoon | Steps 6 and 7 (minutes). `kit.mjs blind`: the questions without provider names, a separate key-check sheet, and the sealed map | Bob |
| Wednesday afternoon | **Sharon's blind key check,** sealed with its SHA-256 **before any score exists** | Sharon |
| Wednesday afternoon | A one-page **scoring guide in Indonesian,** taken from the frozen rubric and checked by Daisy | Bob, Daisy |
| Wednesday evening | **The judges' files are handed to you,** to pass to the teachers yourself. The files live outside the repository | Bob → you |
| Thursday 09:00–12:00 | J1 and J2 each score the 60 items alone, without conferring | Judges |
| Thursday 12:00–13:00 | Their sheets are recorded. Bob lists the correctness disagreements and Sharon's flags | Bob |
| Thursday 13:00–15:00 | J3 decides only those items, with both judges' reasons | Judge J3 |
| Thursday, after | `score.mjs` per provider, then the unblinding, then the report | Bob, Sharon |

- **If steps 1–5 slip past Wednesday noon:** the earliest realistic judging day is **Friday 20 Nov.**
- **If the run fails and needs a second attempt:** **Monday 23 Nov.**

The judges' names are held by the owner. They appear in no repository file, ledger or report. Records use J1–J3 only.

---

## 4 · What stops the run

- A provider's terms are not accepted. That provider is dropped, and the other runs alone.
- A purchase above US$5, or a hard limit that does not read back as US$5.
- A model ID or price that does not match.
- Any refusal, or any cost above its reservation. The runner aborts by itself.
- Any request for data or access beyond §2.

---

## 5 · To authorise

A reply in these words, or your own, covering each item:

> "E paid run: AUTHORISED. Purchases P1 (OpenAI US$5) and P2 (Anthropic US$5, if required), with the tax shown at
> checkout. Hard limits US$5 each. Keys entered by me. Network to the two API hosts for the run only. Calls up to the
> runner's caps (US$5 per provider, US$10 total)."

You can authorise the purchases, limits and keys first, and give the "go" for step 7 separately.

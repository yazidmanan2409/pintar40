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

### 2a · Sharon's additions (review `c878038e`, PASS on `3b6f802d`)

- **A1. Sharon's sheet.** It is built only from `blind`'s allowlists: codes, stems, options and keys. It sits at a named
  path. The sealed map is never placed where she can read it. She commits her flags, and their SHA-256, on her own branch.
- **A2. The audit order.** J1's and J2's sheet hashes are committed **before** Bob lists the disagreements and flags for
  J3. The audit then reads, in order:
  1. the flags hash;
  2. the sheet hashes;
  3. J3's list;
  4. the map.
- **A3. The key proof.** The keys are injected by the network proxy, so the environment holds only a dummy, and the
  runner's "key present" check proves nothing. **Step 6's model-listing call is the real proof of authentication. It
  must succeed on both hosts before step 7.** No real key is ever in the environment, and no request header is logged.
- **A4. The network window.** The record shows that the ledger's first and last request times fall inside the network
  approval window (step 5 to step 8).
- **A5. J3 and the flags.** J3 receives Sharon's reason for a flag as a reviewer's note. It weighs no more than a
  judge's reason.

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

---

## 6 · State on 17 Nov (owner's report), and the final authorisation

No account names, organisation names, key names or values are recorded here.

### 6a · What is done (the owner, in the consoles)

| | Anthropic | OpenAI |
|---|---|---|
| Separate place for the evaluation | A dedicated workspace | A dedicated project |
| Credit | **Promotional API credit** (no purchase was needed, so P2 = US$0) | **US$5 prepaid** (P1), auto-reload **off** |
| Provider-side limit | **Workspace monthly spend limit US$5,** as read back by the owner | Not reported yet: the prepaid US$5, with auto-reload off, is a hard ceiling (`credit_balance_exhausted`). See 6b, item 2 |
| Key | Temporary, created in that workspace, held by the owner | Temporary, created in that project, 30-day expiry, restricted to **Responses API write**, held by the owner |
| Price, re-verified | **US$2 / US$10** for Claude Sonnet 5.5, read on platform.claude.com on 17 Nov (Bob) | Not readable from here (developers.openai.com is outside the network). See 6b, item 4 |

**Money now.** Cash paid is **US$5** (OpenAI) plus any tax. Usage is capped at US$5 per provider and US$10 in total by
the runner. Anthropic's ceilings are the runner's US$5 and the workspace's US$5; its promotional balance is larger, so it
is not a ceiling. OpenAI's ceilings are the runner's US$5 and the US$5 balance. Worst-case usage is US$1.53 in all.

### 6b · What is still needed from the owner, before the "go"

1. **Terms.** State that you accept each provider's terms for this run. That includes Anthropic's **full**
   sub-processor list (the Subprocessors tab) and the terms of the promotional credit, if it carries any.
2. **OpenAI hard limit.** If the project offers "Enforce a hard limit", set it to US$5 and read it back. This is
   Sharon's backstop in both consoles. If it is not offered while prepaid credit is in use, say so, and the US$5
   balance with auto-reload off is recorded as that backstop.
3. **OpenAI key permission.** The key is restricted to Responses API write. **The no-cost authentication proof (A3) lists
   models, which needs read access to Models.** Add **Models: Read** to the key, and nothing else. Without it, the
   proof fails with a permission error before any paid call, and the run stops there.
4. **OpenAI price.** Confirm on OpenAI's pricing or model page that `gpt-6.1-sol` is still **US$2 / US$10** per
   million tokens, standard tier.

### 6c · Where the keys are saved, and for how long

- This session runs on your **Default environment**. Every one of your cloud sessions can use it, including Second Eye,
  Sharon, Daisy and Pete if they are on it.
- A key saved through the secure form is injected into every request to its host **from every session on that
  environment**. So another session could call the API with your key while it is saved.
- The provider limits and the balances still bound any such spend, but outside the runner's ledger.
- **Recommendation:** at the go, create **a dedicated personal environment for E only,** and move only this session onto
  it (network only). Save the two keys there, not on Default. That environment allows:
  - the two API hosts (through the saved keys);
  - package registries;
  - the MCP servers, so GitHub still works.

  You approve its creation in the tool's prompt.
- **After the run:** you revoke both keys in the consoles, which makes the saved secrets useless at once. You can then
  delete the secrets, or the whole E environment, in Settings, and this session moves back to Default.
- The keys are entered **only at the go**, not before, so the window in A4 stays as short as possible.

### 6d · The final authorisation (reply when 6b is done)

> "E paid run: GO.
> - Terms accepted for both providers, including Anthropic's full sub-processor list.
> - OpenAI hard limit US$5 read back [or: not offered; prepaid US$5, auto-reload off].
> - OpenAI key has Models: Read added.
> - gpt-6.1-sol confirmed at US$2 / US$10.
> - Create the dedicated E environment and move this session onto it. I will enter both keys in the secure form.
> - Calls up to the runner's caps: US$5 per provider, US$10 total."

**After the go, in order:**
1. Create and move to the E environment (your approval prompt).
2. The two secure key forms (you enter each key).
3. The no-cost listing proof on both hosts. Both must succeed.
4. The second offline dry run and the self-tests.
5. The paid run: at most 6 calls per provider.
6. You revoke both keys; I record the ledger window (A4).
7. The blinding, then Sharon's sealed key check, then the judges' files to you.

### 6e · Owner, 17 Nov about 10:00 UTC; and the run session

- **Terms:** the owner accepts both providers' applicable terms for E.
- **The OpenAI key:** Models: Read added; Responses: Write; every other permission None.
- **OpenAI auto-reload:** off. The owner permits turning it on only if genuinely necessary, within US$10 of total usage.
  **It is not necessary,** since the worst case is US$0.764 per provider. It stays off. No project hard limit was reported,
  so **the US$5 prepaid balance with auto-reload off is the provider-side backstop** (6b, item 2).
- **Judges:** all three confirmed, J1–J3. J3 is named to the owner privately.
- **The environment:** `pintar40-e-evaluation` (personal) was created. **This session cannot change environment while it
  runs,** so the run is done by **a dedicated run session on that environment,** created by Bob. The keys are saved
  there, never on Default.
  - The owner enters both keys in that session's secure forms.
  - It runs the no-cost checks first: the self-tests, the offline dry run, and the model-listing proof on both hosts.
  - It then stops and asks the owner for the go.
  - **The go must be typed by the owner in that session.** A relayed message does not count.
- **Still open, at the go:** the owner confirms `gpt-6.1-sol` at US$2 / US$10 (its page is unreadable from both sessions).
- **The private folder:** the run session sends the owner `runs/` and `out/SEALED` as one archive, and the judges' files
  separately. The owner keeps them. Only Sharon's key-check sheet is committed, on `claude/e-run-kunci` (A1).

---

## 7 · The Anthropic key blocker: cause and options (Bob, 17 Nov, about 11:10 UTC)

### 7a · The cause

The cloud sessions' network proxy lists **`api.anthropic.com` in its bypass list** (`noProxy`), so traffic to that host
never passes through the proxy. A key saved through the secure form, or under the environment's Network secrets, is
injected by the proxy. For this host it can never be applied, so the platform refuses the form before it appears.
`api.openai.com` is not bypassed, and its form would work.

**So, inside a cloud session, the only way to give the runner an Anthropic key is a real key in the process
environment.** That breaks Sharon's A3 ("never a real key in the env") and your rule that the agents never handle a key.

### 7b · The live command, verified (`runner.mjs` at `68ebe2fd`)

- **Prices:** `--live` reads the pinned prices from `prices.json`: US$2 / US$10 for both, grade A, read 16 Nov. Anthropic's
  were re-read on 17 Nov. These are the same figures `--real-prices` uses in the dry run. `--real-prices` together with
  `--live` is **refused** by the runner (line 956), so removing it is correct, not merely allowed.
- **Pack:** `--live` refuses to start without a valid `--pack-sha`, and records it in every ledger and provenance entry.
- **Caps:** `--cap-provider 5 --cap-total 10` can only lower the caps in `prices.json` (8 / 25). The caps are checked
  before every attempt.
- **Frozen set:** `kit.mjs`, `score.mjs` and `report.mjs` must match their SHA-256 in `MANIFEST.json`, or the run refuses.

### 7c · The options

| | Option | Keys | Spending controls | Your effort | Verdict |
|---|---|---|---|---|---|
| **1** | **Both providers run on your own computer** | Typed by you into your own terminal for that one command. Never in any cloud session, file or commit | One ledger with both caps real (US$5 per provider, US$10 total), plus the US$5 workspace limit and the US$5 OpenAI balance | Install Node 22 if needed; about 15 minutes of commands, which I give you exactly | **Recommended** |
| 2 | Anthropic on your computer, OpenAI in the cloud run session | Anthropic: as in 1. OpenAI: the secure form | Two ledgers; the per-provider caps of 5 each still bound the total at 10 | As in 1, plus the cloud key form | Workable, but two runs to reconcile |
| 3 | The Anthropic key as an environment variable in the E environment | Stored in plain text in the environment settings, and readable by the cloud session | Unchanged | Low | **Not recommended:** breaks A3 and your credential rule |
| 4 | Anthropic through another cloud gateway (Bedrock or Vertex) | — | — | — | **No:** different terms, unchecked, and Google is excluded |

### 7d · Why option 1

- **The keys never reach any agent.** You type each key into your own terminal, for one command, and nothing stores it.
- **One run and one ledger** carry both caps. The A4 window is just that command's run time.
- **The sealed map never leaves your computer.** You run the blinding step there too, then send:
  - Sharon only her key-check sheet;
  - the judges their files;
  - the cloud run session (or me) only the blinded folders for scoring.

  The un-blinding stays with you, which is stronger than the plan required.
- The cloud run session is still useful: it rehearses each command offline first, and reads your outputs afterwards.

# E · the paid-run request, reviewed before the owner's cutoff

Sharon, 17 Nov 2026 (09:05 UTC). Read-only.

**What I reviewed:** `docs/completion-4.1/E-PAID-RUN-REQUEST.md` on `claude/bob-41-master-plan` at `3b6f802d648af4548c1bb8685ecf8c8a2e2110b2`, in full (113 lines). It runs under the frozen pack `ecb0d3c4…` and ruling 49's caps.

**The same disclosure as before:** I am an Anthropic model, and Anthropic is one of the two providers.

## What holds now

**The request is sound and meets my conditions. Five additions (A1 to A5), none of which blocks the owner's authorisation.**

- **§1: purchases and usage are kept apart correctly.**
  - **Purchases:** US$10 before tax, equal to the approved total.
  - **Usage** is bounded four times below it: the runner's cap, each console limit, each prepaid balance, and a worst case of US$1.53.
  - **"Anthropic US$5, if required"** is the right way to handle an undocumented minimum. So is its stop rule: if more is asked, stop and report, and buy nothing more.
- **The tax caveat is honest,** and the choice is the owner's at checkout.
- **§2 step 3:**
  - **Anthropic:** a dedicated workspace with its own limit, because the Default cannot hold one, plus the organisation limit if offered;
  - **OpenAI:** a project with a hard limit;
  - **each key created inside that workspace or project,** so the limit binds the key the run uses;
  - **each limit read back.** This is the backstop I asked for.
- **§2 step 6:** the model IDs come from the listing endpoints, which use no tokens, so a wrong ID stops the run before any spend. The dry run at the real caps is redone, and the self-tests are run.
- **§3:** my blind key check is sealed **before any score exists.** It comes after the blinding and before the judges' files leave. The map is opened only after J3 and `score.mjs`.

## The additions

- **A1: where my sheet comes from, and what it holds.**
  - The key-check sheet is produced by `kit.mjs blind`'s allowlists. It holds the item codes, the stems, the options and the keys, with no provider, model, request id or timing.
  - It is placed at a named path I can read. **The sealed map is never placed where I can read it.**
  - I commit my flags file and its SHA-256 on my branch. The commit time is the order proof.
- **A2: the judges' sheets need their own sealed hashes.**
  - When J1's and J2's sheets come back on Thursday, their SHA-256 values are committed **before** Bob lists the disagreements and my flags for J3.
  - **The audit then shows four things in this order:** my flags hash, then the two sheets' hashes, then J3's list, then the map opening. That is my condition 5, order and not only integrity, applied to the judges as well.
- **A3: the "key configured" gate proves nothing when the proxy injects the key.**
  - With proxy-injected credentials, the runner's environment holds a dummy value. So `liveGate`'s "key present" check passes either way.
  - **The real proof is step 6's model-listing call,** which authenticates through the proxy at no cost. Its success, or its 401, is recorded, and the run starts only after a success on both hosts.
  - **The dummy value must never be a real key,** and nothing logs any header.
- **A4: step 8, the network.** The two API hosts are removed after the run, as written. **Also record** that no call reached either host outside the run's window, as the ledger's first and last request times against the approval and the removal.
- **A5: J3 sees my reason, not my identity.**
  - A flagged item reaches J3 with its stated reason, written as a reviewer's note.
  - J3 decides on the item itself, and my flag carries no more weight than either judge's reason.
  - After unblinding, the report lists my flags per provider with J3's outcomes, as ruled.

**Nothing in it is missing for my conditions otherwise. Still no call, key or spend before the owner's authorisation.**

## Addendum, 17 Nov 11:40 UTC: §7 (`9beadef3`), the Anthropic key blocker. Option 1 is accepted.

- **The cause is right.** `api.anthropic.com` bypasses the cloud proxy, so it cannot inject the key. A real key in a cloud process's environment would break A3 and the owner's credential rule.
  - **Option 3 is refused.**
  - **Option 4 is refused:** other terms, unchecked, and Google is excluded.
- **Option 1, both providers on the owner's own computer, is the right choice, and it is stronger than the plan:**
  - the keys never reach any agent;
  - there is one ledger, with both caps real;
  - **the sealed map never leaves the owner.** He runs the blinding, holds the map, and is neither a judge, nor me, nor Daisy.
- **§7b is confirmed as Bob states it:**
  - `--live` uses the pinned prices and refuses `--real-prices`;
  - it requires `--pack-sha`;
  - the caps can only be lowered;
  - the frozen set is checked against MANIFEST.json.

**A1 to A5 under option 1:**
- **A1:** the owner sends me only `out/kunci`, the key-check sheet, by committing it or giving it to Bob. I check that it carries no provider, model or request field before I begin, and I commit my flags and their SHA.
- **A2:** unchanged. The judges' sheet hashes are committed before J3's list.
- **A3 becomes a local check:** before the paid run, a no-cost model listing on each host from the owner's terminal, with its status recorded (200, not 401). There is no dummy key: the real key lives only in that shell, for that command.
- **A4 becomes the command's own window:** the ledger's first and last request times fall inside the one command's run, and the keys are revoked straight after.
- **A5:** unchanged.

**What to add to the owner's command sheet:**
1. **The exact code.**
   - `git fetch`, then `git checkout` of the frozen `claude/e-runner-prep` commit, by full SHA.
   - `git rev-parse HEAD` printed and recorded.
   - `node --version` at 22.x.
   - The runner's own frozen-set check must pass before any key is typed.
2. **Keys typed so that they leave no trace.**
   - `read -rs ANTHROPIC_API_KEY && export ANTHROPIC_API_KEY`, and the same for OpenAI, so they are never on the command line, in shell history or in the process list.
   - Then the one `node runner.mjs --live --pack-sha ecb0d3c48b3a1ec0623253f3a32097ea5c7b38f4 --cap-provider 5 --cap-total 10 …` command.
   - Then `unset ANTHROPIC_API_KEY OPENAI_API_KEY` and close the terminal.
3. **The listing check (A3),** with `curl` reading the key from that variable, never typed inline, and only the HTTP status printed.
4. **Before anything leaves the computer:** a scan of `out/` for key material. For example, grep for `sk-ant-` and `sk-`; it must find nothing. Then confirm that the map file is **not** in the folders sent.
5. **The sealed map's SHA-256** is printed and sent for commit **before** the judges' files go out. The map itself never leaves.
6. **The owner revokes both keys** in the consoles straight after the run, and records the time.
7. **No other secrets on the machine's run path:** run from a clean checkout, with no `.env` holding other credentials in that directory.

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

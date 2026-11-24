# Counsel brief, part 2 (first use) — Sharon's check

**Work:** `docs/completion-4.1/e-local/v4/COUNSEL-BRIEF-PART2-FIRST-USE.md` at `371e3b48` (`claude/bob-41-master-plan`). Read-only.

**Verdict: NOT YET fit to send. Three additions, all small.**
- Part 1 is untouched, and the fee re-confirmation for both parts is first.
- The pilot facts match ruling 57: 10 adults, one school and one class, no children, no certificates.
- Nothing in it is sensitive or real-person data.

## Additions

1. **Say that the AI feature is not active in the pilot.** Part 1 asks about it, so counsel must not read the pilot as using it. One line in §1: "The AI drafting feature in part 1 is not active in the pilot; no data goes to an AI provider."
2. **Name every provider that holds or carries the pilot's personal data, not only the database and the host.** Q4 asks about transfer abroad, so counsel needs the full list:
   - the database (Supabase) and the application host (Vercel);
   - **the email delivery service**, which carries sign-in and notice emails with names and addresses;
   - **the off-site backup storage** (`backup-offsite.yml`, AWS), once PR-5 is switched on.

   Each with its region, in the data map attachment.
3. **Add one question: breach notification and requests from individuals.**
   - What must be in place before the pilot to meet UU PDP's notification duty after a data breach? Who must be notified, how fast, and by whom: PINTAR or the school?
   - What response times apply to an adult's request to access, correct or delete their data? PINTAR already offers account closure and a deletion request (`minta_akun`), so counsel can say whether that process is enough.

**Optional:** in Q3, say that the backups are encrypted, and how long they are kept, if the retention proposal states it.

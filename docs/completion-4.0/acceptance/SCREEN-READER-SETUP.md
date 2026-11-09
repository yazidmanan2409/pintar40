# Screen-reader sessions for the Reporting Quality Gate: setup (9 Nov 2026)

**What this is for.** The owner will not waive a real screen-reader check: a person using NVDA and TalkBack must hear the
reports as this gate changed them. Automated checks (axe, the accessibility-tree snapshot in the walk) do **not** replace
it. This page prepares the local report world for that person. The steps to run are `SCREEN-READER-SCRIPT.md` **S5, S6
and S9**; staging is not authorised for this gate, so the sessions run on a local copy.

**Candidate.** Run on the exact commit the matrix names as the code candidate (`REPORTING-ACCEPTANCE-MATRIX.md`, header;
`abce834d` at the time of writing) and record it in the session file.

**Holds no password.** Every account is synthetic and generated per run; its password is written only to a file outside
the repository (below). Nothing from a session may be committed except the session notes.

---

## 1 · People

| Role | Who | Needed for |
|---|---|---|
| **Tester** | A person who uses a screen reader regularly: ideally a daily NVDA user on Windows and a daily TalkBack user on Android (one person, or one for each reader). Reads Indonesian; English for S9.8 | Every step: navigating by ear and saying what they heard |
| **Observer** | Anyone who can read the script and write fast; not the tester | Reads each step aloud, writes «Heard» and OK / Issue (A, B or C), asks the comprehension questions in S5.2, S9.1 and S9.7 |
| **Set-up person** | Someone comfortable with a terminal (can be the observer) | §3 once, about an hour the first time, before the session |

A sighted reviewer (Daisy) may sit in, but the verdict is the tester's: what was heard, and whether the task could be done.

## 2 · Equipment

| For | What |
|---|---|
| NVDA | A Windows 10 or 11 laptop, 16 GB of memory or more (the local stack runs Docker), NVDA (current release, default settings, an Indonesian voice if available), Chrome (current), headphones |
| The local stack (same laptop) | WSL2 with Ubuntu, and Docker Desktop using the WSL2 backend; inside Ubuntu: Node 22, Git and the PostgreSQL client (`sudo apt-get install -y postgresql-client`: the fixture calls `psql`). About 15 GB free disk; a copy of the repository at the candidate commit, cloned inside Ubuntu |
| TalkBack | An Android phone, Android 12 or later, TalkBack (current release, Indonesian), Chrome (current) |
| Phone to laptop | A USB cable and Android platform-tools (`adb`) on the laptop, with USB debugging switched on in the phone's developer options |
| Time | About 2 hours per reader for S5, S6 and S9 (S1–S8 in full is a longer session of its own) |

## 3 · Set-up (the set-up person, before the session)

In the laptop's **Ubuntu (WSL2) terminal**, in the repository at the candidate commit (NVDA and Chrome stay on Windows; WSL2 forwards `127.0.0.1` to Windows, so Chrome on Windows reaches the app at `http://127.0.0.1:3999`):

```
git checkout <candidate>
npm ci
npx supabase start
npx supabase db reset
npx supabase status -o env          # gives API_URL, ANON_KEY, SERVICE_ROLE_KEY, DB_URL
```

Export, from that output: `NEXT_PUBLIC_SUPABASE_URL` (API_URL), `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` (DB_URL), and `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3999`. Then:

```
# the report world: classes 5B–5H, staff, a few hundred real sittings (10–25 minutes)
OUT_FILE=<a file OUTSIDE the repository> node audit/fixtures/laporan-lokal.mjs

# one real recalculation for S9.6–S9.7 (a chapter result), and one for the reading map
psql "$SUPABASE_DB_URL" -v mode=POST_TEST -f audit/fixtures/laporan-hitung-ulang.sql
psql "$SUPABASE_DB_URL" -v mode=PRE_TEST  -f audit/fixtures/laporan-hitung-ulang.sql

npm run build
npx next start -p 3999 -H 127.0.0.1
```

Each `laporan-hitung-ulang.sql` run prints the learner whose sitting was recalculated: that learner is the one to sign
in as for S9.7. The OUT file holds every account's email and password (Guru, Kepala departemen, Dekan, Admin sekolah,
and each learner); keep it on the laptop and delete it after the sessions.

**The phone.** Connect it by USB, allow debugging, then, in a **Windows** terminal (where `adb` is installed), make the
laptop's app and API reachable at the phone's own `127.0.0.1`:

```
adb reverse tcp:3999 tcp:3999
adb reverse tcp:54321 tcp:54321
```

On the phone, open Chrome at `http://127.0.0.1:3999`. (Without `adb reverse` the phone cannot reach the laptop's local
API, and signing in fails.)

**Check before the tester arrives** (in Chrome on Windows, and on the phone). Sign in once as the Guru and open «Ringkasan Kelas» for 5C, and once as the
recalculated learner and open that chapter's «Hasil»: the page should show «Hasil ini kemudian dihitung ulang…».

## 4 · Running the session

- Order: S5, S6, S9 with NVDA on the laptop; then S5, S6, S9 with TalkBack on the phone (S9.3 is for the phone).
- The observer reads each step; the tester does it by ear; the observer writes what was **heard**, word for word where
  possible, and the verdict: OK, or an issue classed **A** (blocks the task), **B** (completes with real difficulty) or
  **C** (cosmetic).
- Ask the comprehension questions exactly as written; record the tester's answer.

## 5 · The result

Write each session to `docs/completion-4.0/acceptance/sessions/<date>-<reader>-<initials>.md` with the candidate commit,
the versions (OS, reader, browser) and every step's Heard and verdict. The matrix records the result per reader; the
gate needs S5, S6 and S9 with no **A** and no **B** finding on both readers. Each A or B finding becomes an engineering
item with its step id, and the step is run again after the fix.

# Readiness register draft 2 · PR-12, PR-15, PR-19 from the person's side (Daisy, 24 Nov 2026)

> **What holds now:** a short read of `PRODUCTION-READINESS-REGISTER.md` draft 2 (`7aae24e0`) against the screens on `claude/next-base` `055738ba`. **One real gap:** PR-12 and PR-15 underwrite a promise the screens already make. Two smaller notes. No new words, unless the owner chooses option (b) in §1.

## 1 · PR-12 and PR-15 · the screens promise a response time no one is yet named to keep

**What a staff member sees after «Laporkan masalah»:**
- `lapor.langkah.awal`: «Admin sekolah atau tim PINTAR akan melihatnya dalam satu hari sekolah.»
- If they ticked «Masalah ini menghentikan kelas saya sekarang», `lapor.langkah.awal_kelas`: «Karena menghentikan kelas, laporan ini dijawab pada hari sekolah yang sama.»
- `lapor.privasi`: «… hanya dibaca oleh Anda, Admin sekolah Anda dan tim PINTAR.»

**The gap:**
- The register has PR-12 as **GAP** (no route of reports and errors to a monitored place) and PR-15 as **GAP** (no named first-line contact or hours).
- So «tim PINTAR … dalam satu hari sekolah» and «pada hari sekolah yang sama» are promises that, today, depend on someone happening to look.
- That is a trust risk (ruling 79, H) for the people the form is for: a teacher whose class has stopped.

**Before first use, one of these:**
- **(a) Preferred:** close PR-12 (reports reach a monitored mailbox) and PR-15 (a named person with hours). The words then stay as they are. Add to PR-15's "Done when": «the hours cover school days in every time zone served (WIB, WITA, WIT)».
- **(b) If (a) can't be met in time:** soften the two lines until it is.
  - `lapor.langkah.awal`: «Admin sekolah Anda dan tim PINTAR dapat melihatnya di sini.»
  - `lapor.langkah.awal_kelas`: «Laporan ini ditandai menghentikan kelas, jadi dibaca lebih dulu.» This only holds if the triage list sorts these first; confirm.
  - These change when (a) is met.

**Suggested register wording:** under PR-12 and PR-15, "The screens promise a response «dalam satu hari sekolah» and «pada hari sekolah yang sama» (`lapor.langkah.*`). Close PR-12 and PR-15 before first use, or soften those two strings."

## 2 · PR-12 · the error page

**What anyone sees:**
- «Maaf, halaman ini tidak bisa ditampilkan»;
- «Coba lagi sebentar lagi. Jika masih terjadi, sampaikan kode rujukan di bawah kepada pengelola sekolah Anda.»;
- «Kode rujukan» with the code;
- «Coba lagi» and «Ke halaman awal».

**That is good:** it is calm, it gives a next step, and it carries the code.

**Two small notes (Improvement; for the ruling 79 audit, J10):**
- **No direct route to «Laporkan masalah» from the error page,** though the form has a «Kode rujukan» field (`lapor.rujukan`). For staff, a «Laporkan masalah» link that carries the code would remove a copy step.
- **«pengelola sekolah Anda» for a learner.** Elsewhere a learner is told «tanyakan kepada guru Anda» (`tolak.arti`, and `lapor.murid`, where learners tell their teacher). The error page gives one sentence to everyone. A learner variant, «… sampaikan kode rujukan di bawah kepada guru Anda.», would match.

## 3 · PR-19 · data residency

- **From the person's side, nothing is shown today, and nothing needs to be until counsel answers.**
- **If counsel's answer requires telling people where their data is held,** it belongs in the privacy information (the account page's «Meninggalkan PINTAR» section already explains retention and backups), not in each flow.
- **«Laporan disimpan di dalam PINTAR»** (`lapor.privasi`) stays true either way.
- **No words now.**

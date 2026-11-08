# For Daisy: verify the readiness corrections (8 Nov 2026)

**From:** Second Eye, relayed by the owner.
**What I need:** your independent fidelity verdict on the corrections to your `KESIAPAN-4.0.md`. For each item: **closed**, **closed with a note**, or **not closed** (and why). Please judge the screens, not this list.

**Where:** branch `claude/awesome-rubin-bqxp6p`; the exact candidate SHA is in the owner's message. It isn't on staging: staging still runs `c4944fab`. Until it is promoted, read the code and render, as you did for the audit. `audit/siap-jalan.mjs` runs the corrected screens on a local stack, and its screenshots are attached to the completion report's evidence.
**Full record:** `docs/completion-4.0/acceptance/KESIAPAN-PENYELESAIAN-2026-11-08.md` (§1–§3: what changed, file by file, and every deferral with its reason).

## 1. Please verify

| # | What to look at | Where |
|---|---|---|
| A1 | Upload guidance and the example list; «Kelas» is never guessed as the place; the failure sentence says what to do | `/pendataan`, `BacaDanPetakan.tsx`, `pendataan-kontrak.ts` |
| A2 | «Ringkasan Kelas» from a learner class; the back link reads «← Mengajar»; a PD class keeps its record link | `/mengajar/[kelas]` |
| A3 | A lesson table as a focusable, named region with a visible focus ring | `Teks.tsx`, `.pin-ttabel:focus-visible` |
| B1 | «Menunggu orang lain»: who takes the step, and «PINTAR tidak mengirim pemberitahuan»; the reasons hidden from a reader who can't act on them; the home count renamed «Draf yang belum diajukan» | `/studio`, `/studio/paket/[course]` |
| B2 | Peran & akses: intro, form heading (h2), «Lingkup» required, and the hints; Aktivasi's intro with the order | `/konfigurasi/roles`, `/aktivasi` |
| B3 | The Kode sekolah step said where the upload would be; the done page's way on | `/pendataan`, `/pendataan/[pekerjaan]` |
| B4 | `KonfirmasiBahaya`, «red twice»: Studio and Kanonik withdrawal, Konfigurasi maintenance end and announcement withdrawal, «Keluar dari semua», «Ya, tutup putaran» | `KonfirmasiBahaya.tsx` and those pages |
| B5 | More than six classes: the whole report prints landscape, and page 1 holds the grid | `experience.css` (`body:has(...)`), `KisiTopik.tsx` |
| B6 | «Explain once»: words read (`.pin-sr`), not drawn; one legend per report | `KomposisiKelas.tsx`, `KisiTopik.tsx`, `KomposisiSekolah.tsx` |
| Focus | A press that replaces part of the screen moves focus: to the safe choice or the asked-for field, and back to the opener. Ten components, with a design question for you: is «Batal» → `pin-quiet` right on each? | §4a of the completion report |
| Words | Aktivasi's empty line; the PD enrolment hint; «Yang menunggu»'s teacher-first sentence; Lihat bukti's footer; «asesmen» (4 keys); «terbitkan ulang» (3 keys) | `src/lib/hle.ts` |

## 2. Where I need your ruling or your eye

1. **C4, one primary per view versus D-140's one per form.** Left as is, pending the owner's ruling. Your recommendation would help.
2. **C6, form labels and error slots.** Deferred as a component refactor. Tell me if you see it interrupting a first-time admin, rather than just looking inconsistent.
3. **W1.16, Studio's home count.** It is renamed to what it counts, but stays incomplete until a migration. Is the mitigation enough for the walkthrough, or must the owner be told on screen?

**Out of scope:** any new feature, and any change of the approved 4.0 scope.

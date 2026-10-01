# Journey log

One line of evidence per walk, newest first. A journey is DONE when a person can travel it on staging; machine runs support that, they do not replace it. Items needing Yazid are marked **WAITING FOR OWNER**.

## Journey 1 — teacher → student (synthetic school "Sekolah Uji Kinerja (sintetis)", Kelas Uji Kinerja A)

| When (UTC) | Walk | Result | Evidence |
|---|---|---|---|
| 1 Oct 06:50–07:05 | Teacher signs in like a person (`/masuk` → real email in the staging test mailbox → same browser), uploads Bab 1, prepares and submits in Studio, assigns; 5 students sign in on the real card form, pre-test, every lesson by clicking, post-test, results; teacher reads evidence; Uji Cepat | 19 PASS, 1 NOTE, 1 NOT RUN; no 5xx, no page error | run 36826806100, main `28d3015` on staging |
| 1 Oct 06:43 | Same walk, attempt 1 | Stopped at the teacher's sign-in: the setup's server-made check had started the address's 60 s email window, so the real request was refused (429) while the screen said «Periksa email Anda» (D2). Tooling fixed (`a72f64d`) | run 36825095220; staging Auth log 06:42:48 / 06:43:04 |
| 1 Oct 06:26–06:41 | Same walk, all staff by server-made session (machine support only) | 19 PASS, 1 NOTE, 1 NOT RUN | run 36824753809 |
| 1 Oct 06:22 | Setup for Yazid: teacher `yazidmanan2904+guru@gmail.com` (Guru at the class) and two class cards | done; Yazid's own walk **WAITING FOR OWNER** (his acceptance) | run 36824315868 |

**Fixed on the coordinator branch, not yet on staging** (each with an executable test that is red on `main`; they reach staging only with the push to `main`, item 4 below):

| # | Where the human got stuck | Commit |
|---|---|---|
| W2 | On a shared computer, the next student opened a lesson at the previous student's page and saved it as their own | `b05458b` |
| W3 | A post-test answer chosen but not saved was silently lost at «Kumpulkan»; no confirmation; a reload went back to question 1 | `5729c44` |
| W5 | «Posisi bacaan tersimpan.» shown even when the save failed; a lost last-page save left the lesson unread with no way to retry | `8a243ad` |
| W8 | «Lihat bukti» counted students halfway through a test as «Belum mengerjakan» | `1cfa9e8` |
| W16 | A test starting tomorrow read «Berjalan» today; the home said nothing was waiting while a class had no material | `40d38c3` |

The walks now leave student 4's last post-test answer unsaved before «Kumpulkan» (W3): on `main` that reads 7 of 8, after the fix 8 of 8.

**Still a shortcut, by necessity:** the synthetic school's admin (`uji-kinerja-admin@example.co`) has no address a person can read, so recording students, making cards and approving content run on a server-made session. It is labelled setup, never human proof.

**Natural end not reachable here:**
- **Class figures and certificates:** a synthetic school's evidence is never official (by design), so the teacher's class figures stay empty and no certificate can be earned. Needs a real school: **WAITING FOR OWNER** (below).
- **"Target reached?" on the result (M3, W4):** needs the pass-mark ruling. **WAITING FOR OWNER** (below).

## WAITING FOR OWNER

1. **Real-school provisioning on staging.** `main` lets only a platform admin appoint a school admin (`role_assignments_guard`: SYSTEM_ADMIN or INSTITUTION_ADMIN only by an active SYSTEM_ADMIN; no self-grant). The only platform admin on staging is Yazid's account. Decision: either Yazid, as platform admin, appoints the first school admin of SD ZPS himself (the journey's own first step), or he authorises a staging platform-operator identity whose sign-in mail the automation can read. Until then: SD ZPS has no school admin, so official evidence, class figures and certificates cannot be walked.
2. **Pass-mark semantics** (`docs/coordination/design/PASS-MARK-AND-GRADE-SEMANTICS-REVIEW.md` §6; D-081(d) hold). D-086(b) fixed that the target is the school's sealed pass mark; still open: the alternative (1a/1b/2/3) and what applies before a school sets a mark. Blocks M3/W4 (the result saying whether the target was met). No fallback is invented meanwhile.
3. **D2 (frozen):** when Supabase throttles a sign-in send, the screen still says «Periksa email Anda» (W6). Changing it is a sign-in decision; Gate 3 (held) replaces this path. Not touched.
4. **Pushing to `main`:** this session's safety check refused a push to `main` (1 Oct). Fixes are built and verified on the coordinator branch; they reach staging only once Yazid allows the push (or merges).

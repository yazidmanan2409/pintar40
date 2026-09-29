# Bob → coordinator: BOB-23 (the lesson player saves in a loop while a learner reads; D-031)

**Head:** `HEAD_SHA`, with `main` merged in first (`3b6a134`: the identity 4.0 freeze, D-054 to D-059). The code is `04cf8c1`. **One run:** `RUN`.

## CHANGED

**1. One save per page newly reached** (acceptance 1 and 2):
- `perluDisimpan(halaman, tersimpan)` in `src/lib/siklus.ts` returns the page's count (`posisiTersimpan`, BOB-22's "pages reached") only when it reaches beyond what is saved. Otherwise it returns nothing.
- `LessonPlayer`'s save effect is keyed on `[page]` alone. It reads the save function and ids through a ref, and keeps the furthest saved count, starting from the server's `startAt`.
- Before, the save ran in an effect keyed on a callback that depended on the whole `props` object.

**2. Why a save re-rendered the whole page, and what I did** (acceptance 3). Every save response carried `Set-Cookie: sb-…-auth-token` and `x-action-revalidated: 1`. Next re-renders the whole page when a server action writes a cookie. The probe showed two writers:

- **a. The save action's own write** (PINTAR's code, removed):
  - The Supabase client restores the session from the cookie, and @supabase/ssr hands it back to `setAll` with the same value. `setAll` wrote it again.
  - `supabaseServer({ tulisJikaBerubah: true })` now writes a session cookie only when its value changed, which covers a refresh and a sign-out. The filter is `cookieYangBerubah` in `src/lib/sesi.ts`.
  - It is used by `saveLessonProgress`. Every other caller keeps the default.
- **b. The proxy's re-send of the session cookies with their lifetime** (BOB-05's sliding idle limit, D-009):
  - It ran on every signed-in request, server actions included. Skipping it on actions would let a classroom card's 60-minute session expire mid-lesson while the learner only turns pages.
  - **Throttle, not skip:** `perluGeserSesi` in `src/lib/sesi.ts`, where the cookie lifetime is decided and where Gate 6's heartbeat (D-055) belongs.
  - A page request always re-sends. A server action re-sends only once `JEDA_GESER_AKSI` (5 minutes) has passed since the last re-send, which the `pintar-sesi-geser` cookie records.
  - The proxy always re-sends a session it has just refreshed, so a refreshed cookie never keeps the library's 400-day lifetime.
  - The result is at most one redraw per 5 minutes of action-only work.

**Which paths use server actions and which use API routes** (asked for):

| | server actions (their work goes through the proxy's throttle) | API routes |
|---|---|---|
| **student, in-page, no navigation** | `belajar/actions.ts`: `saveLessonProgress`, `submitAnswer`, `noteView`, `noteIntegrity`, `pauseSession`, `resumeSession`, `assistance`, `openAssistance`, `dismissAssistance`; `umpan-balik/actions.ts`: `kirimUmpanBalikAksi`, `keadaanSaya`; `tur/actions.ts` | `GET /api/assets/read-url` (lesson media, profile photos) |
| **student, form posts** (navigate or redirect) | `startSession`, `mulaiAsesmen`, `finishSession` (then `router.push`); `masuk/actions.ts` (sign-in, sign-out, card) | `POST /api/akun/aktivasi` |
| **teacher and school staff** (form posts; each redirects back to its page) | `mengajar/actions.ts` (`sediakanMateri`, `sediakanUjiCepat`), `studio/actions.ts` (23 actions), `konfigurasi/actions.ts` (15), `pendataan/actions.ts` (7), `pimpinan/…` (3) | `POST /api/assets/upload-url`, `POST /api/certificates/issue` |
| **platform and evaluation** | `evaluasi/actions.ts`, `auth/callback/actions.ts` | `POST /api/evaluation/assume`, `GET /api/verifikasi/[token]`, `/api/dev/*` (development only) |

Continuous work through the first row is what the throttle has to keep alive, and BOB23-K02 proves it does.

## PROOF

| test | red before | green after |
|---|---|---|
| BOB23-K01 (static) | on the code before BOB-23: `reading a 5-page lesson with re-renders, idling and going back saved 67 time(s): [1,1,1,1,…]; expected 1, 2, 3, 4, 5; resuming a lesson saved at 3 of 5 and idling saved 51 time(s); paging over a lesson already read saved 17 time(s); no cookieYangBerubah; the player's save effect is not keyed on the page alone through perluDisimpan; the player still builds its save from the whole props object; saveLessonProgress writes the session cookie back unchanged` | pass |
| BOB23-K02 (static; the liveness case) | on the code before: `three hours of actions every 30 s re-sent the card's session 361 time(s): a redraw each time; at most 37 (one per 300 s); … an action 10 s after the last re-send re-sent again; src/proxy.ts does not ask perluGeserSesi …` | a card doing only server actions every 30 s for three hours (three times its 60-minute limit) stays signed in with 37 re-sends. **The control:** a proxy that skips actions loses the session at 3,600 s, so the test sees an expiry when there is one. An email account over a day likewise; a page request always re-sends; a missing or impossible marker re-sends |
| BOB05-K01 (static, BOB-05) | green before | green after: the proxy still re-sends with `umurSesi(user.email)`, and the server client still applies it on sign-in and refresh |
| BOB05-R01 (app, against Auth) | not runnable here | it reads the Max-Age on a rendered page's response, which a page request still always re-sends. CI's run is the proof |

**How BOB23-K01 drives the decision:** through every render a lesson sees, as a re-rendering player would call it. On the code before, it falls back to that code's own rule: save on every render, and re-send on every request.

**Restated for the changed requirement (named):** BOB22-K01's wiring check.
- It pinned `props.saveProgress(… posisiTersimpan(p), pages.length)`.
- The player now saves what `perluDisimpan` returns. The check also accepts that, provided `perluDisimpan` gives `posisiTersimpan`'s count when it saves and nothing again.
- It still passes on the code before BOB-23.

**Measured in a real browser.** The production build, the seeded learner and the local database, through my scratchpad REST stand-in. The method was the same each time: open one lesson, 20 s idle, then read forward, then go back two pages.

| | idle 20 s: browser requests | idle 20 s: server → Supabase | reading forward | going back 2 | a save's response |
|---|---|---|---|---|---|
| `main` before BOB-22 (`94d54de`) | 343 server-action POSTs | 3,081 calls | (the loop) | (the loop) | `Set-Cookie`, revalidated |
| `main` with BOB-22 (`b1c55a1`) | 476 server-action POSTs | 4,288 calls | (the loop) | (the loop) | `Set-Cookie`, revalidated |
| **BOB-23** | **0** | **0** | **2 new pages: 2 saves, 4 calls** (the proxy's `/auth/v1/user` and `record_lesson_progress`, twice) | **0 saves** | **no `Set-Cookie`, not revalidated** |

Before, one page turn cost a save plus a 9-call redraw. It now costs the save and the proxy's own user check.

No test was weakened, skipped or deleted.

## CI

`RUN` on `HEAD_SHA`, dispatched once and not waited on; please read the result there.
- **Local, before dispatch, every database with an `en-US` ICU collation:** FULL_LOCAL
- One run, no new job.

**Staging acceptance (point 5):** after merge and deploy, J09's 8 s recording on the last page must show no server-action stream.

## CONTRACT

- No RPC or route changed.
- **New cookie:** `pintar-sesi-geser`, the time (in seconds) of the last session re-send.
  - **Flags:** `httpOnly`, `SameSite=Lax`, path `/`, `Secure` whenever the request arrived over HTTPS (staging and production), and the session's own Max-Age. BOB23-K02 asserts each of these. Secure is tied to the protocol because a browser drops a Secure cookie sent over plain HTTP.
  - **Tampering is harmless.** Only the proxy reads it, and it only decides whether to re-send.
    - **Deleted:** the next action re-sends, which costs only an extra redraw.
    - **Forged into the future, or garbage:** it counts as missing and re-sends.
    - **Forged to "just now" over and over:** it only stops the re-sends that keep this person's own session alive, so their own device signs out sooner.
    - **It extends nothing:** a session lives no longer than the account's own limit (the Max-Age re-sent is always `umurSesi`), and Auth's own inactivity backstop still applies.
    - **It holds no secret, and grants no access.
- `supabaseServer()` gains an optional `{ tulisJikaBerubah }`; the default is unchanged.

## MIGRATIONS / COPY

None.

## QUESTIONS

1. **Answer sync still redraws on every answer. Answered: this is BOB-30 on the board, after BOB-12 and before BOB-24.** Details: `submitAnswer` and the other in-page student actions use the default client, which writes the session back unchanged. So each answer still redraws the assessment page; the throttle removed only the proxy's share. Giving `belajar/actions.ts`'s `db()` `{ tulisJikaBerubah: true }` would remove it.
   - The item player updates from each action's result and navigates explicitly, so it does not rely on that redraw.
   - I have not verified the assistance flows, and it is beyond the lesson player, so I left it out of BOB-23.
   - Do you want it as a small follow-up, with the same idle and answer-count measurement?
2. **Gate 6 (D-055):** the throttle's interval and marker live in `src/lib/sesi.ts` beside the lifetimes, so a server-side heartbeat can replace or feed `perluGeserSesi` in one place.

## READY

Yes, once `RUN` on `HEAD_SHA` is green.

# Bob → coordinator: BOB-23 (the lesson player saves in a loop while a learner reads; D-031)

## WHERE I STOPPED (28 Sep, paused on the coordinator's word)

The lane is at the "BOB-23: WIP" commit. The tree builds: typecheck, lint and `next build` are clean. **No CI dispatched.**

**Done:**
- **The save decision:** `perluDisimpan(halaman, tersimpan)` in `src/lib/siklus.ts` saves only a page newly reached, as its count, so BOB-22's meaning is unchanged.
- **`LessonPlayer`:** the save effect is keyed on `[page]` alone. It reads the save function and ids through a ref, and keeps the furthest saved count, starting from `startAt`.
- **Why a save re-rendered the whole page (point 3):** it was PINTAR's own cookie write. The save action's Supabase client restores the session from the cookie on every request, and @supabase/ssr hands it back to PINTAR's `setAll` unchanged. `setAll` wrote it again, with a fresh Max-Age. Next treats any cookie mutation in a server action as revalidation (`x-action-revalidated: 1`) and re-renders the page.
  - Measured on every save response: `Set-Cookie: sb-…-auth-token` and `x-action-revalidated: 1`.
- **Removed, scoped to the save action:** `supabaseServer({ tulisJikaBerubah: true })` writes a session cookie only when its value changed. That covers a refresh and a sign-out; the filter is `cookieYangBerubah` in `src/lib/sesi.ts`.
  - The 60-minute and 7-day idle limits don't depend on the dropped write. The proxy re-sends the session cookies with their lifetime on every signed-in request, server-action POSTs included.
  - Every other server action is unchanged. They still pay a re-render per call. A global follow-up is possible, but it needs a look at any flow that relies on that implicit refresh.
- **BOB23-K01 (static):** it drives `perluDisimpan` through every render a lesson sees, tests `cookieYangBerubah`, and checks the player's effect and the save action's client.
  - **Red on today's code:** `reading a 5-page lesson with re-renders, idling and going back saved 67 time(s): [1,1,1,1,…]; resuming a lesson saved at 3 of 5 and idling saved 51 time(s); paging over a lesson already read saved 17 time(s); no cookieYangBerubah; the player's save effect is not keyed on the page alone; … saveLessonProgress writes the session cookie back unchanged`.
  - **Green with the fix.**
- **Restated for the changed requirement:** BOB22-K01's wiring check.
  - It pinned `props.saveProgress(… posisiTersimpan(p), pages.length)`. The player now saves what `perluDisimpan` returns.
  - It now also accepts that, provided `perluDisimpan` gives `posisiTersimpan`'s count when it saves and nothing again. It still passes on the code before BOB-23.
- **Manifest:** v105.

**Measured in a real browser** (production build, the seeded learner, the local database through my scratchpad REST stand-in; 20 s idle on one lesson after it loads, then reading forward, then back two pages):

| | idle 20 s: browser requests | idle 20 s: server → Supabase calls | reading forward | going back 2 |
|---|---|---|---|---|
| `main` before BOB-22 (`94d54de`) | 343 server-action POSTs | 3,081 | (a loop) | (a loop) |
| `main` with BOB-22 (`b1c55a1`) | 476 server-action POSTs | 4,288 | (a loop) | (a loop) |
| **BOB-23 (WIP)** | **0** | **0** | **2 new pages: 2 saves** | **0 saves** |

**Left (tomorrow):**
1. Merge `origin/main` (`1f3b0f1`).
2. Confirm on a save response that `x-action-revalidated` is gone and no `Set-Cookie` is sent. The idle zero already implies it; I'll record the header for the hand-off.
3. The full local proof: English collation, the full suite, all plants and the shared red cases.
4. One `ci.yml` run on a head with `main` merged in, and the rest of this hand-off (CHANGED, PROOF, CI, CONTRACT, MIGRATIONS, COPY, QUESTIONS, READY).
5. **Staging acceptance:** J09 records every request while a student reads the last page for 8 s, and must show no server-action stream after merge.

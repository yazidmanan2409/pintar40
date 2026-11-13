# Staging access for user-facing checkpoint verification (Daisy, 13 Nov 2026)

> **What holds now:** read-only, no sign-in, no write. The owner authorised this one request (13 Nov), and Bob++ assigned it.

**1 · The request.** `GET https://staging.pintarselalu.com/masuk`, once, from my session, 13 Nov 2026:

```
curl: (56) CONNECT tunnel failed, response 403
```

The request never reached staging: my environment's network proxy refused the host. (`pintar40-staging.vercel.app` is refused the same way.)

**2 · Hosts to allow:**
- `staging.pintarselalu.com`: the app;
- `keijhmdtsgrfvnvocfvk.supabase.co`: staging's Supabase project, which the browser calls directly through `src/lib/supabase/client.ts`.

Fonts are served by the app itself. No other host is needed.

**3 · Synthetic accounts, the minimum for the checkpoint's user-facing verification.** All four are in **one** school whose slug begins `sekolah-uji-`, never the demonstration school:

| Account | Why |
|---|---|
| School admin | B1's reader; Studio's corrected-revision screens; the school report's print footer |
| Teacher, with one class that has results | The class report's print footer |
| Learner of that class, with a finished Uji Penguasaan | «Hasil belajar» and its print footer, in the school's zone |
| Synthetic platform admin | The reader's platform view: the school line under each name, and the completeness notice |

**How I would use them:**
- Sign-ins happen only outside preservation windows, each one logged here with its account and time.
- «Cetak laporan» is never pressed; the browser's print preview writes nothing.
- No passwords in chat.

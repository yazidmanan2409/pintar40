# PINTAR 4.0 · L3: the Working Context, one model (design only, 7 Oct)

**Status: ruled GREEN WITH MODIFICATIONS (D-132, 7 Oct); L3 implementation GO.**
- This page now carries the rulings: C4's ambiguity guard, C5's standing, C9's modification, §2.11's scope and the semantic keys of §7. Each is marked «(D-132)».
- First written as a design for the Second Eye (D-128(a), D-130(j)), before any L3 code.

**Governing words (D-127 §1):** «Identity tells PINTAR who the person is. Entitlement tells PINTAR what they may do. Working context tells PINTAR what they are doing here, in this session, on this device. Working context may narrow presentation and action choices; it must never widen authority.» And: «A school-shaped action occurs within one explicitly identified school context. Platform-wide authority does not imply platform-wide presentation.»

**What exists today** (read from the code on 7 Oct; §8 has the references):
- No context at all: no column, cookie or storage holds a purpose or a school.
- The door's `?peran=` is dropped at sign-in, and the landing follows the highest-ranked role.
- `/akun` and every shell build their navigation from all of a person's roles.
- No surface keeps a school. Konfigurasi and Pendataan open on the first school by name and Pimpinan on the first node. Studio, Mengajar and Bank Soal merge every school.
- After a sign-out, a Back that reaches the server becomes `/masuk?lanjut=<that page>`, and the next sign-in, by anyone, lands there.

## 1. The model in one picture

```
 PERSON ── identity: who                     accounts, persons                         (unchanged)
   │
   ├── ENTITLEMENT: what they may do          role_assignments → role_capabilities      (unchanged)
   │      the database decides every act (RLS, RPCs); it never reads the context
   │
   └── SIGNED-IN SESSIONS: one row per browser   device_sessions (exists; one per Auth session)
          │
          ├─ laptop  ── WORKING CONTEXT  =  purpose  ·  place      Mengajar · SD B
          └─ phone   ── WORKING CONTEXT  =  purpose  ·  place      Mengelola · SD A

  purpose:  Belajar  │  Mengajar     │  Mengelola
  place:    (none)   │  one school   │  one school  ·  Pustaka PINTAR  ·  Seluruh platform
                                       (the last two: only for those with that authority)
```

**The rules:**
1. **Where it lives.** The context lives on the session's own row, so it lives exactly as long as the session.
2. **Who writes it.** One server function writes it, and only for the caller's own current session. It writes only a pair the person holds at that moment.
3. **Who reads it.** The application reads it, to choose the shell, the landing, the lists and the defaults, and to refuse an act aimed outside it.
4. **Never authority.** No RLS policy and no RPC's authorization reads it.

## 2. The twelve answers

| # | Question | Answer |
|---|---|---|
| 1 | **What the device session stores** | On its `device_sessions` row, and nowhere else:<ul><li>the **purpose**: Belajar, Mengajar or Mengelola;</li><li>the **place**: none for Belajar; one school for Mengajar; one school, Pustaka PINTAR or «Seluruh platform» for Mengelola;</li><li>when it was set, and how: door, choice, or a requested page.</li></ul>No destination, no page and no role is stored. |
| 2 | **How a door sets it** | The three signed-out doors keep their words («Saya mau belajar», «Saya mengajar», «Saya mengelola sekolah»).<ul><li>Each sends a **purpose**, not a role: `/masuk?pintu=belajar\|mengajar\|mengelola`. The learner door no longer relies on `lanjut`.</li><li>At sign-in, the server asks which places this person holds **for that purpose**:<ul><li>one place: the context is set and the person lands on its home;</li><li>several: they choose the place first;</li><li>none: §2.3.</li></ul></li><li>The door grants nothing. It only selects among what the entitlement already allows.</li></ul> |
| 3 | **The entitlement does not support the purpose** | No context is set, and nothing else is chosen silently.<ul><li>The person arrives at `/` («Mau ke mana hari ini?»), signed in.</li><li>One sentence says this account does not hold the purpose they chose.</li><li>Below it are the doors they do hold.</li></ul>Example: a teacher who pressed «Saya mengelola sekolah» sees the sentence and «Saya mengajar · SD B». |
| 4 | **Changing purpose deliberately** | **`/` is the chooser.** For a signed-in person it shows the current context, and every purpose · place they hold as a door.<ul><li>Choosing one sets the context and opens its home.</li><li>Visiting `/` changes nothing.</li><li>The shell carries a plain link to `/` beside the context's name. L3 builds it plain; Daisy's shell expresses it (CR-54 S2, P1).</li></ul>There is no switch anywhere else. |
| 5 | **Changing school deliberately** | The same chooser. A purpose held in several places appears once per place, by the school's name. `?sekolah=` stops choosing a school: the context does. `?lingkup=` still chooses a node, inside the context school only. A link to another school's page meets §2.6's rule. |
| 6 | **`/`, `/akun`, Studio and the rest** | Every signed-in surface belongs to a purpose, or is neutral (§5):<ul><li>**A surface of the active context** shows the context place only: its classes, its nodes, its sections, its Studio work. The school is named.</li><li>**Neutral surfaces** (`/akun`, `/perangkat`, `/terkunci`, `/lapor`) keep the context and wear its shell. `/akun` gains a link back to the context's home.</li><li>**Studio** follows the context. It shows the capabilities of the grants that give the active purpose, in the active place. Mengajar · SD B therefore offers Buat Paket and Pustaka for SD B, not review or publishing, even to an Admin platform.</li><li>**A page of another purpose or place** (Back, a typed address, an old link) is never rendered in the wrong context, and is never switched to silently. It shows one sentence: this page is for Mengelola · SD A, and you are in Mengajar · SD B. It offers that context, if held, or the way back. If the person does not hold it, today's refusal stands.</li></ul> |
| 7 | **When the context becomes invalid** | Every read re-derives the stored pair from the grants as they are now (a revoked or expired role, a deactivated school).<ul><li>If the pair is no longer held, the context is cleared, never moved to another purpose or school. The person goes to `/` with one sentence saying why.</li><li>**A session resumed later** (a personal computer within its 7 days, or an unlock with the PIN) is the same row. It keeps its context and is re-checked on that read.</li><li>**An ended session** (idle on a shared computer, three wrong PINs, a credential change, «Keluar dari semua perangkat») takes its context with it.</li></ul> |
| 8 | **Sign-out destroys it** | «Keluar» ends the row (`sesi_akhiri_saya` → `sesi_akhiri_inti`). That same step now **clears the context columns**, and the Auth session is deleted as today. No copy exists anywhere else: no cookie, no browser storage, no URL. The next sign-in creates a new row with no context. |
| 9 | **The stale `lanjut`** | **A destination is never part of the context.** It is honoured only when it is the signing-in person's own request:<ul><li>Every end of a session on a browser sets a **sign-out mark** on that browser. It is set by «Keluar», and whenever the proxy finds this browser's session has ended. That covers an ended row (the shared computer's expiry, three wrong PINs) and also Auth cookies for a session that no longer exists («Keluar dari semua perangkat» from another device, a credential change, even on a personal computer). The mark is a cookie that holds no identity, kept until the next sign-in there.</li><li>At the next sign-in there, **any carried `lanjut` is ignored**. The person lands by their own door and context, and the mark is removed.</li><li>The proxy also stops minting `lanjut` while the mark is present.</li><li>The cost: someone who follows a fresh link on a computer just signed out lands on their own home first, then follows it again.</li></ul>`/terkunci?lanjut=` is untouched: the same session, unlocked by the same person's PIN.<br>**Its standing (D-132(e)):** «A continuation belongs to the authenticated/session journey that created it, not merely to a browser.» The sign-out mark is a **4.0 stale-continuation guard**, not part of the enduring Working Context model.<br>**The invariant:**<ul><li>a session ending destroys its context;</li><li>a stale continuation from it is not inherited;</li><li>a genuinely new request after sign-out stays usable;</li><li>where 4.0 cannot tell stale from new without identity, landing home first is the accepted fallback.</li></ul> |
| 10 | **Two devices, two contexts** | One row per signed-in browser, and the writer touches only `sesi_saya()`'s row. So the phone (Mengelola · SD A) and the laptop (Mengajar · SD B) never affect each other, as the lock and sign-out already do not.<ul><li>**Tabs of one browser share one session**, so they share one context. A tab still showing the old context finds, at its next request, that the page or the act belongs elsewhere (§2.6, §2.11), with the form's values kept (L2).</li><li>A private window or another browser is a separate session.</li></ul> |
| 11 | **Authority stays the database's** | **Two independent gates; context is only the second:**<ol><li>The database authorizes every act exactly as today: RLS, `can_on_node`, `can_in_institution`, INV-13. **No policy or authorization function reads the context.** A static test pins this, and database tests show that, in each context, an act the entitlement lacks is still refused.</li><li>**(D-132(k))** «Every context-bound human action checks that its target belongs to the active context. Authorization remains independently enforced by the database. System and explicitly platform-scoped operations use their governed scope rather than fabricating a device context.» The check is a **narrowing**, never a permit. **No background, system, import or automation path ever creates a device session to satisfy it.**</li></ol>The writer refuses a pair the person does not hold. A forged context changes nothing the database would allow. |
| 12 | **The 4.1 handoff seam** | The context belongs to a session row, has **one writer**, and records **how** it was set.<ul><li>A 4.1 handoff (D-125) would authenticate the destination session as the same person, then call the same writer for it, copying the source's purpose · place after re-checking it. It would never copy cookies or browser state.</li><li>4.0 builds the writer with three causes (door, choice, requested page). A fourth, handoff, is added only by 4.1.</li><li>Context never binds an attempt: Exam binding stays the attempt controller's (D-125(e)).</li></ul> |

## 3. The two scenarios, drawn

**A. Dr Gladys: Admin platform, with teaching appointments in SD A and SD B**

```
LAPTOP · session L                                         PHONE · session P
──────────────────────────────────────────────────────    ──────────────────────────────────────────
1  `/` (signed out) → «Saya mengajar»
   → /masuk?pintu=mengajar → signs in
2  Mengajar is held in two places (her EDUCATOR grants
   in SD A and SD B; Admin platform alone gives none)
   → `/`: «Saya mengajar · SD A», «Saya mengajar · SD B»
3  chooses SD B → L: Mengajar · SD B
   → /mengajar: SD B's classes only; SD B named
                                                           4  «Saya mengelola sekolah» → signs in
                                                              → Mengelola: every school, Pustaka
                                                                PINTAR, «Seluruh platform» → SD A
                                                              → P: Mengelola · SD A → Konfigurasi, SD A only
5  «Akun saya» → /akun: neutral; the Mengajar · SD B shell;
   L unchanged; the link back → /mengajar (SD B)
6  Studio → SD B's Buat Paket and Pustaka (her teaching
   grants' capabilities in SD B); no review, publish or
   JSON import here, though she holds them
7  types /konfigurasi?sekolah=A → the page is Mengelola · SD A:
   one sentence and «Mengelola · SD A» offered; L stays
   Mengajar · SD B unless she chooses it
                                                           8  P changes nothing on L, and L nothing on P
At every step: role_assignments untouched; every act still authorized by the database alone.
```

**B. A shared computer: A signs out on a consequential School A page, then B signs in**

```
1  A is on /mengajar/<class in School A>/siapkan → «Keluar»
   → A's row ended, context cleared; Auth session deleted; cookies cleared; sign-out mark set → `/`
2  B (Back first, or not): A's pages re-request with no session → /masuk, and no `lanjut` is minted (mark)
   (a page restored from the back-forward cache reloads first, on every computer: L1, CR-90)
3  B «Saya mau belajar» → /masuk?pintu=belajar → signs in → a new row, no context
   → the mark: any `lanjut` ignored → context Belajar (B's own door) → /belajar; mark removed
4  B presses Back to A's Siapkan page → requested as B, in B's context (Belajar):
     B not entitled there → today's refusal (BD11)
     B entitled there    → the §2.6 sentence: «this page is for Mengajar · School A», offered, never entered
   → B inherits none of A's purpose, school or destination.
```

## 4. Door × person → where they land (to be walked row by row, CR-83(2))

| Person | «Saya mau belajar» | «Saya mengajar» | «Saya mengelola sekolah» |
|---|---|---|---|
| Learner only | /belajar | `/` with the not-held sentence; Belajar offered | as «Saya mengajar» |
| Class card | /belajar (a card session holds Belajar only) | — | — |
| Teacher, one school | /belajar (their learning, possibly empty) | /mengajar · S | `/` with the not-held sentence; «Saya mengajar · S» offered |
| Teacher + Admin sekolah, one school | /belajar | /mengajar · S | /konfigurasi · S |
| Learner + Admin sekolah | /belajar | not held | /konfigurasi · S |
| Kepala departemen | /belajar | /mengajar · S (the department's classes, HOD-08) | /pimpinan · S |
| Admin platform only | /belajar | not held (no teaching appointment) | `/`: every school, Pustaka PINTAR, «Seluruh platform» |
| Admin platform + teacher in A and B | /belajar | `/`: A or B → /mengajar · chosen | as «Admin platform only» |
| No door (a bookmark of `/masuk`) | — | — | **(D-132(i))** One available purpose · place: selected. Several: the chooser (`/`). D-010's ranking never chooses among several. For example: a learner only → Belajar; a teacher with only Mengajar in one school → Mengajar; Admin platform + teacher → the chooser; teacher + Admin sekolah → the chooser |

**The homes (D-010 kept for where each purpose · place lands, never to choose among several, D-132(i)):**
- Belajar → /belajar.
- Mengajar → /mengajar.
- Mengelola:
  - Admin sekolah or Admin platform in that school → /konfigurasi;
  - Kepala departemen or Dekan → /pimpinan;
  - Pustaka PINTAR → Studio;
  - «Seluruh platform» → Konfigurasi's platform sections.

**Where Studio is offered (C7 and C8 made explicit; 8 Oct, at the Second Eye's L3 hold 2; for the owner's confirmation in the closure decision):**
- Studio is the work of a **place**. It is offered only in a school's context, with the capabilities of the grants that give the active purpose there (C8), or in Pustaka PINTAR's (where Mengelola lands on Studio).
- **«Seluruh platform» offers no Studio**: no Studio link, tab or page. Its views are C7's list, and Studio is not among them. Platform-wide content work is the library's.
- This is presentation only. The database still decides every Studio act from all of the person's grants. Pinned by F22-P02 (in «Seluruh platform» only `/konfigurasi`, `/aktivasi` and `/akun` are served) and walked by journey S2 (Konfigurasi in «Seluruh platform» draws no Studio link).

## 5. Where canon was silent: the choices, and the rulings (D-132)

| | Choice | Why | Ruling (D-132) |
|---|---|---|---|
| C1 | **Belajar has no place.** The person's own learning spans their schools, each item named | It is the person's own work, not a school-shaped act (Q2) | **APPROVE** |
| C2 | **Mengajar comes from teaching grants only** (Guru; Kepala departemen per HOD-08), never from admin authority. **Today `/mengajar` reads any grant**, so an Admin sekolah sees every class of the school | «Platform-wide authority does not imply platform-wide presentation»; Q3 grants real teaching roles through the screens | **APPROVE.** L3 removes the Admin sekolah's every-class view from Mengajar |
| C3 | **`/` is the chooser**, and visiting it changes nothing | It already asks «Mau ke mana hari ini?». One construct serves the doors, the not-held case, and the purpose and school changes | **APPROVE.** No separate role, school or workspace switcher; visiting `/` is non-mutating |
| C4 | **A requested page sets a context only when none exists**, and never replaces one (§2.6's sentence instead) | D-010's exception («a person who asked for a specific page») without a silent switch (Q1: only the person's own act) | **APPROVE with a guard:** only when no context exists **and** exactly one purpose · place the person holds fits that page. Several: the chooser. «A URL may express intent. It must not silently make an ambiguous decision for the person.» |
| C5 | **The first sign-in after any session end on a browser ignores carried destinations** | The only rule that keeps B from inheriting A's destination without knowing who A was; it stores no identity | **APPROVE the 4.0 behaviour; MODIFY its standing:** a 4.0 stale-continuation guard, not Working Context (§2.9) |
| C6 | **A class-card session holds Belajar only** | A narrowing. Cards are the learner's sign-in | **APPROVE as presentation only.** CR-91 separately decides who may hold a class-card credential; not in L3 |
| C7 | **Pustaka PINTAR is a Mengelola place of its own. «Seluruh platform» exists only for Admin platform, for the deliberately platform-wide views:** system checks, platform maintenance, the platform's audit, every school's problem reports, activation across schools, Keamanan, email | Q2's «intentionally platform-wide»; S23j and S23l already walk these as platform views | **APPROVE** |
| C8 | **Inside a context, Studio and every tab show the capabilities of the grants that give that purpose, in that place** | Q11: no casual authoring, launching or publishing in an unnamed or unintended context | **APPROVE**, database authority unchanged |
| C9 | ~~With no door, D-010's ranking chooses the purpose~~ | Canon. The place is never chosen silently | **MODIFY:** no door and one purpose · place → select it; several → the chooser. Ranking never chooses (§4) |
| C10 | **An evaluation persona has no row and so no stored context.** It keeps its single role's home | Personas never hold a `device_sessions` row today (`sesi_periksa` → TANPA) | **APPROVE** |

## 6. What L3 would build and prove (after review)

**Database: one migration, no authority change.**
- The context columns on `device_sessions`.
- The writer (the caller's own session only; refuses a pair not held).
- The reader (re-checks the stored pair and clears it when invalid).
- The list of places the person holds.
- `sesi_akhiri_inti` re-emitted to clear the context.
- No RLS policy, capability or RPC authorization changes.

**Application:**
- Doors (`/`, `masuk`): `pintu`.
- Sign-in's landing (`beranda.ts`, `masuk/actions.ts`, the sign-in routes).
- The sign-out mark: `/keluar`, the proxy's expiry, all devices.
- `/` as the chooser.
- `/akun`, and the shell's navigation from the context, not from every role.
- Studio's `_lib`.
- The surfaces narrowed to the context place: `/mengajar` (also naming each class's own school, §8), `/pimpinan` (and its decision queue), `/konfigurasi`, `/pendataan`, `/aktivasi`.
- The action-level place check.
- **FD-4:** bounded reads, and name lookups that do not grow with the platform.

**Proof:**

| Kind | What it shows |
|---|---|
| Database tests | <ul><li>The writer refuses a pair not held.</li><li>Two sessions of one person hold two contexts, and changing one leaves the other.</li><li>An end clears it.</li><li>A revoked grant invalidates it.</li><li>In each context, an act the entitlement lacks is refused (CR-83(4)).</li><li>Statically: no policy or authorization function reads the context.</li></ul> |
| Pure tests | <ul><li>The door × person table (§4).</li><li>The surface → purpose table.</li><li>The sign-out mark rule.</li><li>Every school-shaped action calls the place check (a BOB32-K02-style static test).</li></ul> |
| Walks | <ul><li>The journeys, with the two scenarios in §3 as steps in two browser contexts and two machines.</li><li>BD11 extended to B's Back.</li><li>Every row of §4.</li><li>One Golden School walk on staging, because landing changes for everyone.</li><li>Restatements where a journey relied on merged schools or first-school defaults (S7b, S14, S15, S15b, S23j, S23l, O4, G1, J01, J02).</li></ul> |

**Cost:** as forecast, 160–174 estimated minutes. **Risk:** high, because every signed-in page's shell and landing change. That is why this page comes first.

## 7. Words needed: for Daisy, and for Dr Gladys's terminology review (none invented)

**Existing words this model uses:**
- «Mau ke mana hari ini?», «Saya mau belajar», «Saya mengajar», «Saya mengelola sekolah», «Saya memimpin bagian sekolah»;
- «Seluruh platform», «Pustaka PINTAR»;
- the homes' names («Belajar», «Kelas», «Pimpinan», «Konfigurasi», «Studio»);
- the school names, which are data.

**Missing: semantic keys, never invented copy (D-132(m)).** Each key is declared and placed. Until Dr Gladys supplies its words it renders nothing (never the key, never a stand-in sentence), and the behaviour does not depend on it:

| Key | Where | Until the words come |
|---|---|---|
| `context.manage_label` | the shell's name for Mengelola. «Mengajar» and «Belajar» exist; «Mengelola» as a label does not | the shell names the place and the home (existing words) |
| `context.not_held` | the sentence on `/` (§2.3) | `/` shows only the doors held |
| `context.other_context` | the «this page is for another context» sentence (§2.6) | `/` with the page's context offered first |
| `context.invalid` | the invalid-context sentence (§2.7) | `/` with the doors held |
| `context.other_school` | the action-level refusal (§2.11) | `/` with the target's context offered, and the form's values kept |
| `context.choose_place` | the place step's question | «Mau ke mana hari ini?» (existing) |

## 8. Noticed while mapping (facts, not designed here)

**Part of L3** (the school scope):
- `/mengajar` labels every class page with the school of the alphabetically first class, not the class's own (`src/lib/pengajar.ts:111-125`). Its data reads use the class's own school.
- `/pimpinan`'s decision queue is not narrowed to the chosen node (`src/lib/pimpinan.ts:242-250`).

**Not L3, for a ruling or the register:**
- **A class-card account can be activated for a person who holds a staff role.** The activation form offers both «email» and «kartu» to everyone waiting (`src/components/aktivasi/FormAktivasi.tsx:197-212`), and `authorize_account_activation` does not check the role. C6 narrows that card's presentation to Belajar, but the database would still authorize the person's staff acts through a card session.
- **«Komputer siapa ini?», opened from `/akun`, preselects «shared» even on a computer declared personal.** The page asks `sesi_periksa` without this browser's identity, so `perlu_pilih` is always true there (`src/app/perangkat/page.tsx:28, 40`). The stored choice is unaffected.
- **`/keluar` calls `exit_persona` for everyone,** and it raises «there is no evaluation session to leave» at every ordinary sign-out (DG investigation D4). Harmless noise.

**Code references for «what exists today»:**
- Doors: `src/app/page.tsx:50-58`.
- `?peran=` dropped: `src/app/masuk/page.tsx:25-33`.
- Landing by rank: `src/lib/beranda.ts:42-57`; `src/app/masuk/actions.ts:137-141`.
- `/akun`'s shell from all roles: `src/app/akun/page.tsx:38-40`.
- `lanjut` minted: `src/proxy.ts:233-241`.
- The session row: `supabase/migrations/20261117100000_a_shared_computer_locks_and_resumes_with_the_pin.sql:28-46, 90-103`.
- First-school defaults: `src/components/sekolah.ts:54-59`; `src/app/pimpinan/page.tsx:77`.

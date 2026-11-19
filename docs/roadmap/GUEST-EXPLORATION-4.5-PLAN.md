# PINTAR 4.5 · Guest Exploration Mode: consolidated planning package

Bob (Chief Architect), 19 November 2026. **Planning only.** This package authorises no code, migration, project,
domain, merge, deployment or spend. It goes to the owner for review and approval.

**Inputs:**
- The owner's handover of 19 Nov;
- the owner's clarification of the same day, which **governs** this package: *a self-service product evaluation, not a
  guided demonstration*;
- the independent review of 19 Nov (**Review X**);
- the follow-up review's three requirements (**Review Y**: freedom of exploration, one demonstration truth, honest
  capability representation);
- the owner's additions of the same day: **context-aware «Bagikan PINTAR»** and the **discovery cycle**, "share the
  discovery, not the session" (§F.1).

**Checked against:**
- `PINTAR-ROADMAP.md` (on `claude/roadmap-45-50`, approved 11 Nov);
- `PLANNING-AUDIT-4.2-4.5-5.0.md`;
- ADR-0006 and ADR-0020;
- the code on `main` `706fe8c5`.

**The governing objective (owner, 19 Nov).** A visitor can independently decide whether PINTAR suits their needs.
They need:
- no login;
- three perspectives, with free switching;
- direct access to the features relevant to their role;
- realistic workflows and results they can inspect;
- nothing saved permanently;
- one Share button;
- registration only when they choose;
- complete separation from real institutional data.

**Success is a visitor's informed judgment, not completion of our story.**

---

## A · Executive recommendation

**Build Guest Mode as a disposable, isolated copy of the real PINTAR, not as a simulation of it.**

### What the code shows

- **All of PINTAR's educational rules run inside the database.** Scoring, the sealed pass mark, eligibility,
  «belum cukup data», misconceptions, the reading map and every report figure are Postgres functions. The engine's own
  header says that grading and the key never leave Postgres (`src/lib/assessment-engine/index.ts`).
- **Every screen reads its data from the database directly.** Studio, the sitting, the teacher's evidence page and the
  leader's page are server components calling Supabase. There is no adapter layer a second data source could plug
  into.

### What that means for a browser-only demonstration

A browser-only demonstration with free access to Studio, sittings and reports would need those rules and screens
**re-implemented a second time.** That copy would:
- **drift from the real product,** breaking Review Y's "honest capability representation";
- **fall short of the owner's objective,** because a visitor would be judging our imitation, not PINTAR;
- **cost more to build and maintain** than the alternative.

### The recommended path

The faithful path is to **run the real release, unchanged, against a disposable fictional school**, one per visitor:
- in a **separate exploration environment** (its own database project and its own web address) that holds no real data
  of any kind;
- **purged automatically** after a short lifetime.

The visitor then uses the real Studio, the real sittings, the real reports and the real rules. Because one engine
computes everything, Review Y's "one demonstration truth" holds by construction.

### Most of the foundation already exists

| What exists | Where | What it gives Guest Mode |
|---|---|---|
| **Ruang Peragaan** | ADR-0020, `/evaluasi` | Fixed persona accounts, real sessions, a «MODE PERAGAAN» band, «Ganti sudut pandang», and audit rows naming the evaluator. Today it is for signed-in evaluators only, and production refuses it by trigger |
| **A complete fictional school** | `supabase/seed/human_evaluation.sql` | «SD Cendekia Nusantara (sekolah peragaan)», with a fractions chapter, items, misconceptions, a Uji Penguasaan, a release and five personas |
| **The `PUBLIC_DEMO` evidence channel and class cap** | ADR-0006 §4 | Any sitting on that channel is capped at `PUBLIC_DEMO` evidence, never official, whatever its school. ADR-0006 recorded "no public demo UI in this phase"; this plan is that UI |

### This changes the ground rule the owner wrote

The handover says "do not create guest accounts, guest institutions, or persistent database records … unless a
compelling technical requirement is established and approved." **This plan establishes that requirement** (the rules
live in the database), so it needs the owner's approval: decision **K1**.

The records are temporary, fictional and in a separate project. They are purged automatically and never reach the
production or staging databases.

### Effort and placement

**Context-aware sharing (§F.1).** A picture (PNG) or PDF of exactly what the visitor sees, framed «DATA CONTOH», is
made in their own browser and shared through the device's share sheet. A separate interactive link opens the same
feature for the recipient in their own fresh sandbox. There is no server storage and no upload.

**Effort:** about **31–39 person-days** across six batches (§J). Placement in 4.5 is in §I.

---

## B · Reconciliation of Review X and Review Y

| Recommendation | Verdict | Reason |
|---|---|---|
| One connected fictional institution; three perspectives; Institusi split into Admin Institusi and Pimpinan | **Accept** | Matches the existing Ruang Peragaan school and personas |
| Switch perspective at any time from one place | **Accept** | «Ganti sudut pandang» exists. ADR-0020 sends persona-to-persona switches through the hub; the guest sees a single action |
| Hybrid demonstration with tab-local browser state | **Modify** | Under the owner's clarification, a hybrid cannot offer free, faithful use: the rules live in the database. Replaced by a server-side disposable sandbox (§D). The browser holds only the sandbox's session cookie |
| "No need to provision an actual institution or account" | **Modify** | True only of a simulation. A faithful sandbox provisions a **fictional** school and **fictional** persona accounts in a **separate** project, then purges them. Owner decision K1 |
| The result is calculated from the guest's actual answers | **Accept, strengthened** | The real engine calculates it, not a demonstration rule |
| A curated fictional cohort | **Modify** | The cohort's evidence is **produced by the real engine** when the dataset is built (scripted sittings), not hand-written. The guest's sitting then joins the class under the real rules, and every count, denominator and «belum cukup data» stays consistent |
| A guided recommended journey | **Modify (governing clarification)** | Free exploration is primary. A dismissible «Saran langkah» panel offers next steps per perspective; nothing is locked or sequenced. The panel reuses the existing tour components (`src/components/tur/*`) |
| Prepared AI drafts, including one deliberately unsuitable draft | **Accept, with a boundary** | The exploration environment has no provider path at all. Prepared drafts are labelled examples. **Possible conflict:** Sharon's C3w-1 condition 5 confines the stand-in provider to tests. Proposed resolution: prepared examples are a separate, labelled source, not the stand-in; Sharon to rule (H-9) |
| Specimen certificate marked «CONTOH — TIDAK BERLAKU», with no usable verification | **Accept** | The exploration environment's own verification page says "contoh". The real site's verification never knows the exploration environment's certificates |
| Registration through "the appropriate existing onboarding route" | **Verify: none exists** | Hosted sign-up is closed (`disable_signup: true`). `/aktifkan` claims identities a school has provisioned and is "never registration". Schools are founded only by the operator workflow. **There is no route a visitor can register through.** Owner decision K3 |
| A new tab starts an independent exploration | **Modify** | One sandbox per browser, held by its cookie, so new tabs continue the same exploration. This is simpler, and nothing in the objective needs per-tab isolation |
| Performance Distribution, Question Intelligence and Quiet Intelligence shown to leaders | **Verify: not built** | Roadmap items 4.5-01 and 4.5-05 are PARTIAL or direction only. Guest Mode shows only what is delivered when each exploration release is cut. Each later 4.5 feature brings its own guest representation (§I) |
| Exam Mode and 4.2 refinements "only where delivered" | **Accept** | 4.2 has not opened. The exploration release follows whatever is accepted |
| Formal educator evaluation as a fictional summary | **Defer** | 4.5-06 waits on R-1. Nothing is shown until it exists and its safeguards are settled |
| Search engines may index the entry page only | **Accept** | |
| Concentrate on delivered capabilities; no future previews (K4) | **Accept** | Matches the roadmap's honesty rule |
| The 24 verification scenarios G01–G24 | **Accept as baseline, extended** | §K adds the scenarios the sandbox architecture introduces (provisioning, purge, environment separation, the production guard), and recasts the human test on the owner's success measure |

**Conflicts with existing rulings, and proposed resolutions:**
1. **ADR-0006 §4, "no public demo UI in this phase":** superseded for 4.5 by the owner's direction. A new ADR
   (ADR-0021, the exploration environment) records that.
2. **ADR-0020: the evaluation facility is refused in production, and entry needs a signed-in evaluator.** Both stay as
   they are. Guest Mode runs in its own project, so that production trigger is untouched. Anonymous entry exists only
   in the exploration environment, and a guard refuses exploration mode on the production or staging project refs.
3. **The roadmap is "UNDERSTAND"**, and Guest Mode is not among its capability groups. The owner's direction adds it
   to 4.5. The roadmap needs a one-line amendment.
4. **The roadmap's "no behaviour tracking" rule:** Guest Mode records no clicks, page views or time. Operational logs
   only (§H).
5. **A3's sitting binding (X-14):** a sandbox must not expire under an open sitting. The lifetime rule (§D.4) keeps any
   school with an open sitting alive until that sitting ends or its own limit passes.

---

## C · Owner decisions

**Already directed (no decision needed):**
- the objective;
- 4.5 placement;
- no login;
- three perspectives with switching;
- no permanent saving;
- one Share button;
- optional registration;
- separation from real data;
- no paid AI;
- no valid certificates;
- 4.1 scope unchanged.

**The team settles these within the approved direction:**
- the sandbox lifetime;
- the «Saran langkah» content;
- screen wording;
- the share text;
- the dataset's contents;
- rate limits;
- the test matrix;
- which existing screens appear in each perspective.

**Genuinely the owner's:**

| # | Decision | Options | Bob recommends |
|---|---|---|---|
| **K1** | **Architecture** | (a) **A disposable real-engine sandbox**, one fictional school per visitor, in a separate project, auto-purged. Faithful and free, with temporary server records. (b) **A browser-only simulation** (Review X's original). No server records, but it re-implements PINTAR, is less faithful and drifts | **(a)**, as the only option that meets the self-service objective. Temporary fictional records in a separate project, purged automatically |
| **K2** | **A separate exploration project and public web address** | (a) A new database project plus its own address (for example `coba.<domain>`): structural separation and isolated load, at **one more project's monthly cost** (amount to confirm on the account's plan). (b) Inside staging: no new cost, but it mixes public traffic with the engineering promotion target and breaks "complete separation". (c) Inside production: rejected | **(a)** |
| **K3** | **What "register" means today** (no self-registration exists) | (a) **A contact route:** the PINTAR team's published contact (email or WhatsApp) shown on «Gunakan PINTAR». No data is collected in PINTAR. (b) An **institution inquiry form:** new personal-data collection, so counsel first (PR-1). (c) **Self-service school founding:** a new capability; large; not 4.5-sized | **(a) for the first release,** (b) later if counsel clears it. A visitor's guest work never carries over (directed) |
| **K4** | **Children on a public page** | The Peserta Didik perspective is open to anyone, including children. Guest Mode collects no personal data: fictional identities only, no free-text fields beyond answers and Studio content, no contact, no tracking. It still becomes a public online service in Indonesia | **Allow, as designed,** and add three questions to the pilot's legal list (§H): PSE registration for a public service; whether minors may use an anonymous demonstration; the hosting notice |


**Owner's direction, 19 Nov (ruling 66; planning only):**
- **K1: approved as the preferred direction,** subject to security, feasibility and operational verification. The
  necessity of a school per visitor is examined in §D.5.
- **K2: approved in principle.** Costs, controls and guarantees are in §D.6, and come before any provisioning.
- **K3: the existing contact route.** «Gunakan PINTAR» says plainly: «Ini bukan pendaftaran. Hubungi tim PINTAR untuk
  menggunakan PINTAR di institusi Anda.» No form; nothing collected.
- **K4: supported in principle,** subject to privacy, safeguarding and legal review before release (§H; pilot legal
  list).

**Still open, and the owner's (needed before provisioning, not before planning):**

| # | Decision | Why it is the owner's | Bob recommends |
|---|---|---|---|
| **K5** | **Confirm the Vercel plan** the team is on | A Hobby plan is for non-commercial use. A public product evaluation site may need Pro (US$20 / month platform fee, if not already paid) | Confirm. If already Pro: no change |
| **K6** | **A spending ceiling for the exploration environment** | Recurring spend | A hard ceiling of US$20 / month across both providers (Supabase spend cap on; Vercel on-demand budget with pause), reviewed after the first month |
---

## D · Architecture

### D.1 · Shape

```
Public site ──► «Jelajahi PINTAR» (exploration address, separate project)
                      │
                      ▼
       Entry: choose a perspective ──► a fresh sandbox is claimed
                      │                (one fictional school, from the canonical dataset)
                      ▼
       The real PINTAR release, unchanged screens and rules,
       signed in as that school's persona for the chosen perspective
       ┌──────────────┬──────────────┬─────────────────────────┐
       │ Peserta Didik│   Pendidik   │ Institusi: Admin · Pimpinan │
       └──────────────┴──────────────┴─────────────────────────┘
            ▲  «Ganti sudut pandang» (same sandbox, another persona)
            │
       Lifetime ends or «Mulai ulang» ──► the sandbox is purged
```

### D.2 · Components

| Part | What it is | New or reused |
|---|---|---|
| **The exploration environment** | A separate database project, plus a deployment of **the same release** with one setting, `PINTAR_EXPLORATION=on` | New project; same code |
| **The production guard** | Exploration mode refuses to start unless the database is the exploration project. Production and staging refs are refused in code and in a database trigger, as ADR-0020's facility is refused in production | New, small |
| **The canonical dataset** | A versioned build of the fictional school, from `human_evaluation.sql` extended. Classes, a cohort of fictional learners whose sittings are **run through the real engine** at build time (`PUBLIC_DEMO` channel), a second, sparse class for «belum cukup data», and Studio content in several states (draft, in review, published, corrected) | Extends the existing seed |
| **Sandbox provisioning** | A pre-warmed pool of N fictional schools copied from the canonical template. A visitor claims one on entry, and the pool refills in the background. No copy is made on the request path | New: one database function plus a scheduled refill |
| **Guest sessions** | Entry mints a session for the sandbox's persona with no password and no refresh token. This is ADR-0020's mechanism with the hub replaced by the perspective screen. Persona switching re-mints within the same sandbox | Reuses ADR-0020's assume path |
| **Lifetime and purge** | Each sandbox has an idle limit and a hard limit. A scheduled job deletes expired sandboxes completely. A sandbox with an open sitting is kept until that sitting finishes or its own limit passes (A3, X-14) | New, small |
| **The «MODE EKSPLORASI · Data contoh» band** | The existing «MODE PERAGAAN» band, with new words and three actions: «Ganti sudut pandang», «Bagikan PINTAR», «Mulai ulang» | Reused |
| **«Saran langkah»** | A dismissible panel of suggested next steps for each perspective, never blocking | Reuses `src/components/tur/*` |
| **Simulation seams** | Clearly labelled stand-ins where a real operation can't run safely: **email** (shown on screen as "would be sent", never sent); **AI drafting** (prepared examples, no provider); **certificate verification** (specimen); **«Laporkan masalah»** (explained, not sent) | New, small; each labelled |

### D.3 · Why this is the simplest faithful design
- **There is no second implementation** of scoring, Studio or reports. One code path is tested once.
- **Isolation is structural:** another project, another web address, other cookies. A signed-in real user's session
  never reaches the exploration environment.
- **Guest-to-guest isolation** uses the existing tenant boundary (one school per visitor) and the existing RLS, which
  are already proven.
- **Load:** public traffic never touches real schools' database (PR-10).

### D.4 · Consequence analysis: "and then what?"

| Decision | And then what? | What else did it change? | Handling |
|---|---|---|---|
| One fictional school per visitor | The pool can run dry under a surge | Capacity becomes a public concern | Pool size and an hourly claim limit per address. When empty: «Eksplorasi sedang penuh, coba lagi beberapa menit lagi» (honest, no queueing system) |
| Real persona sessions | A3 binds each sitting to its session id; re-minting on a perspective switch would end a sitting's controller | An open Uji Penguasaan would demand a teacher's recovery | Switching re-mints only the other persona's session. The learner persona's session is kept until its sitting ends. G-X3 tests a switch mid-sitting |
| Purge after the lifetime | A visitor returning tomorrow finds a fresh school | Expected ("no permanent saving") | The entry sentence says so. The purge is complete: no history is kept |
| `PUBLIC_DEMO` channel | Results can never become official evidence | Certificates: eligibility needs official evidence | The specimen certificate is generated by a labelled specimen path, so the real rule is not weakened. The eligibility screens still show the real conditions |
| Same release, a new setting | Every release must also work in exploration mode | One more deployment and dataset rebuild per release | Built into the release steps. The dataset is rebuilt from the template on each release (versioned) |
| Studio free text | A visitor can type anything | Only that visitor sees it, and it is purged | No moderation is needed. No publication leaves the sandbox. No print carries a real school's identity |
| Two-person approval | A guest wants to publish their own draft | The real rule needs a second educator | The guest switches to the reviewer persona, labelled «Anda kini bertindak sebagai peninjau (orang kedua)». It shows the rule rather than bypassing it |
| Account lifecycle actions (deactivate, anonymise) | A guest anonymises a persona | That persona becomes unusable for the rest of the exploration | Allowed. «Mulai ulang» gives a fresh school. The perspective screen offers only intact personas |

### D.5 · Is a school per visitor necessary? (owner, ruling 66)

**Yes, as the unit of isolation. But the school is small and short-lived, so its marginal cost is close to nothing.
The recurring cost is the project itself (§D.6), not the visitors.**

| Model | What visitors share | Fidelity | Verdict |
|---|---|---|---|
| **M1 · A school per visitor** (from a lean template) | Nothing | Full, for all four perspectives | **Recommended** |
| M2 · A class per visitor in one shared school | The school's pass mark, roles, maintenance windows, Studio content (school-owned) and every school-level figure | The leader's and admin's views mix strangers' actions. One guest's pass-mark change alters everyone's results. Studio edits leak between guests | Rejected: fails isolation and the Institusi perspective |
| M3 · One shared school, read-only, with personal sittings only | Everything except a learner's own sitting | Educators can't edit, publish or assign; admins can't administer | Rejected: fails the self-service objective |
| M4 · A database branch or schema per visitor | Nothing | Full | Rejected: far heavier to create and remove than rows, for no gain over M1 |

**Why the school is the right unit.** In PINTAR the school is already the tenant boundary. RLS, settings, the pass mark,
Studio content, roles and every aggregate are school-scoped. Anything smaller than a school forces strangers to share
state; anything larger adds machinery.

**How M1 is kept cheap:**
1. **A lean template:** one school, two classes, about 30 fictional learners, one chapter, a few hundred items and
   sittings. Bob's estimate is a few thousand rows and well under 1 MB per sandbox, to be measured in G1.
2. **Personas created lazily.** A visitor who stays a learner never gets the other personas. Each perspective's persona
   is created the first time it is opened.
3. **A small pool** (10, refilled in the background), so the copy is never on the visitor's path.
4. **A short lifetime** (2 h idle, 24 h maximum) and a complete purge.
5. **Shared platform content, if the schema allows it.** Where content is platform-level (O41-18), the sandbox reads the
   one shared copy instead of copying it. G1 opens with a one-day feasibility spike to establish what may safely be
   shared read-only, and that nothing a guest can change is shared.

**At a cap of 200 live sandboxes:** a few hundred MB at most, inside the plan's included 8 GB disk. About 6 auth users
per fully explored sandbox: 1,000 visitors a month is about 6,000 monthly active users, inside the included 100,000.

### D.6 · Recurring cost, resource controls and isolation guarantees (before any provisioning)

**Estimated recurring cost** (list prices, 19 Nov; to confirm on the account's billing pages before provisioning):

| Item | Estimate | Note |
|---|---|---|
| Supabase: one more project, default compute size (Micro) | **about US$10 / month** | Pro organisations pay about US$10 per extra project, billed hourly; the included compute credit already covers one project |
| Supabase: disk, auth users, egress | US$0 at the expected scale | Inside the per-project inclusions (8 GB disk, 100,000 MAU) |
| Vercel: a third project on the existing team | **US$0 fixed** | The Pro plan has no per-project fee. Usage draws on the team's shared monthly credit, with on-demand billing beyond it. **The team's current plan must be confirmed** (a Hobby plan is for non-commercial use) |
| The exploration address | US$0 | A subdomain of the existing domain |
| **Total at launch scale** | **about US$10 / month,** plus any Vercel usage beyond the shared credit | Bounded by the controls below |

**Resource controls:**

| Control | Setting (proposed; Sharon to confirm) |
|---|---|
| Live sandboxes | Hard cap of 200. At the cap, entry says «Eksplorasi sedang penuh» |
| Claims | At most 5 an hour per address, and a global hourly cap |
| Per-sandbox quotas | Studio items, imports (size and count), assignments and sittings, each capped at a few times the template's size |
| Request rate | A per-address limit at the proxy, plus Vercel's spend controls (a hard on-demand budget that pauses the project at 100%) |
| Supabase spend cap | On (the default), so usage-based overage can't accrue |
| Lifetime and purge | 2 h idle, 24 h maximum, a purge every 15 minutes, and an idempotent retry |
| A kill switch | One setting turns the entry page into «Eksplorasi ditutup sementara» while leaving live sandboxes to expire |
| Operational counts only | Claims, live sandboxes, database size and purge results, read daily. No behaviour data |

**Isolation guarantees, and how each is proved:**

| Guarantee | Mechanism | Proof |
|---|---|---|
| No real data can be present | A separate project. The template is built only from repository seed files. No workflow can read staging or production into it | Sharon's review; the dataset build script; G-X4 |
| Exploration mode can't run elsewhere | A guard in code and a database trigger refuse the production and staging refs. The normal deployment never has the setting | G-X4, G-X5 |
| No credentials of other environments | The exploration deployment holds only its own project's keys. No SMTP, no AI keys | Sharon's environment check; G-X7 |
| Guests can't see each other | The school tenant boundary and RLS | G18, G-S10 |
| A signed-in real user stays untouched | Another address, so other cookies | G23 |

---

## E · Human journeys (free first; suggestions optional)

Each perspective lands on **that role's real home screen**. Every feature of the role is reachable from its own
navigation. «Saran langkah» lists 4–6 meaningful things to try, each a link. None is required.

| Perspective | Lands on | Can do directly (examples, all real) | «Saran langkah» offers |
|---|---|---|---|
| **Peserta Didik** | The learner's home | Pemetaan Awal; reading; Latihan with help levels; Uji Penguasaan under certifying conditions; Uji Cepat; the result with its explanations and «bagian yang perlu dibaca ulang»; the specimen certificate | "Kerjakan Pemetaan Awal", "Coba Uji Penguasaan", "Baca penjelasan jawaban" |
| **Pendidik** | The teacher's home | Studio (open, edit, import a package, submit for review, see the second-educator rule, publish via the reviewer persona); prepared AI drafts; assign to a class; class evidence and misconceptions; «belum cukup data» on the sparse class; reviewer notes; corrections | "Buka Studio", "Tugaskan bab ke Kelas 5A", "Lihat bukti kelas" |
| **Admin Institusi** | Administration | Classes, people, cards, activation (emails shown, not sent), pass marks, roles, maintenance windows, the class emergency stop | "Atur nilai lulus", "Aktifkan akun guru" |
| **Pimpinan** | The leader's page | Scoped evidence with denominators; «belum cukup data»; drill-down to class; what to discuss with whom | "Baca ringkasan sekolah", "Bandingkan dengan bukti kelas" (within one school only) |

**Cross-role.** Because every perspective shares one sandbox, actions connect on their own: a teacher assigns, the
learner sits, the teacher's evidence and the leader's figures change. The connection is never forced. A suggestion
appears only when it is relevant («Bab ini sudah ditugaskan; lihat sebagai peserta didik?»).

**Shared journeys:**

| Journey | Start → steps | Expected state | Failure behaviour | Evidence |
|---|---|---|---|---|
| First entry | Public page → «Jelajahi PINTAR» → a perspective | A sandbox is claimed; the role's home opens; the band shows | Pool empty: an honest "full" sentence | G01–G03 |
| Returning guest | Same browser within the lifetime | Continues | Expired: «Eksplorasi sebelumnya sudah berakhir; ini sekolah contoh yang baru» | G09, G-X1 |
| Switch perspective | Band → «Ganti sudut pandang» | Same school; work kept; an open sitting kept | Persona unusable: only intact ones offered | G06, G-X3 |
| Refresh or close | — | Continues within the lifetime | — | G09 |
| Interrupted sitting | Connection lost mid-sitting | The real A3 rules: resume on this device; low-stakes may continue | As in 4.1 | G10 |
| Reset | Band → «Mulai ulang» → confirm | Old sandbox purged; a fresh one claimed | — | G08 |
| Share what I'm looking at | Band → «Bagikan PINTAR» → choose picture, PDF or link | Options fit the screen (§F.1). The picture shows the sender's current view, framed «DATA CONTOH». The link names the feature only | Cancel returns to the same screen. No file sharing: download plus copy link | G12–G14, G-S1 to G-S8 |
| Open a shared feature link | `…/jelajah?buka=<fitur>` | The recipient's own fresh sandbox, on the named feature, canonical data | Unknown name: perspective selection | G14, G-S5 |
| Open the general link | — | The recipient starts at perspective selection with their own sandbox | — | G14 |
| Decide to use PINTAR | «Gunakan PINTAR» (band menu) | K3's route; a reminder that guest work isn't carried over | — | G15 |
| Leave without registering | Close the page | Nothing kept beyond the lifetime; nothing asked | — | G16 |
| Existing PINTAR user | Opens the exploration address | Their real session is not visible there (another address); the guest gets a fictional persona | — | G23 |

---

## F · Screen and interaction inventory

**Reused unchanged:** every learner, teacher, Studio, administration and leader screen in the release, plus the shared
components, `hle.ts` and the text-only identity.

**Reused with new words:** the «MODE PERAGAAN» band becomes «MODE EKSPLORASI · Data contoh»; the tour components carry
«Saran langkah».

**New (Daisy designs; Second Eye builds):**
1. The exploration entry page (one sentence, «Jelajahi PINTAR», and «Anda bebas mencoba…»);
2. the perspective screen (four cards, Institusi split in two);
3. the band's three actions;
4. the context-aware «Bagikan PINTAR» control (§F.1);
5. the «Gunakan PINTAR» page (K3);
6. the "full" and "ended" sentences;
7. the labels for the four simulation seams;
8. the specimen certificate treatment.

**Daisy's brief:**
- screen inventory, flows and states for these eight;
- the band's placement on mobile;
- «Saran langkah» for each perspective;
- whether any existing screen reads wrongly in a no-real-data setting (for example a refusal that tells the guest to
  "hubungi admin sekolah").

No separate visual system.

### F.1 · Context-aware «Bagikan PINTAR» (owner's addition, 19 Nov)

**One button, with options that depend on what the visitor is looking at.**

| Option | When offered | What the recipient gets |
|---|---|---|
| **«Gambar tampilan ini» (PNG)** | Every guest screen | **The sender's view as they see it now**, including their own temporary actions. It is a still picture: the recipient sees why the sender liked it |
| **«PDF (A4)»** | Screens that already have an A4 print layout (reports, class and school summaries, the certificate, cards), and any view too long for one image | The same content in PINTAR's existing print layout, page by page |
| **«Tautan untuk mencoba fitur ini»** | Screens on the shareable list (below) | **An interactive link:** the recipient gets their **own fresh sandbox** and lands on the same feature, on the **canonical** fictional data. They do not see the sender's changes or session |
| **«Tautan Jelajahi PINTAR»** | Always | The entry page, starting at perspective selection |

The share text makes the difference between a picture and a link plain, for example: «Gambar: tampilan yang saya lihat
(data contoh). Tautan: coba sendiri dengan data contoh baru.»

**How it works, without server storage or uploads:**

1. **The PNG is captured in the visitor's own browser** from the screen they already see, using a small DOM-to-image
   library.
   - Width is fixed at a phone-readable 1080 px.
   - The text is real text before capture, so it renders sharply.
   - Height is capped. A longer view is offered as PDF instead.
   - Nothing is sent to a server, so the image cannot contain anything the visitor wasn't already shown.
2. **The PDF reuses the existing A4 print layouts** (`@media print` styles, as used by «Cetak laporan» and the
   certificate). The print layout's pages are rendered to images in the browser and assembled into one PDF with a small
   library. This gives one consistent result on phones, where "print to PDF" can't be handed to the share sheet.
   - **The official print path (B2: reference, printer, record) is not used.** A guest print is not official, and
     records nothing.
3. **Sharing** uses `navigator.share` with the file when the device supports file sharing (most Android and iOS
   browsers), so WhatsApp and other installed apps appear.
   - **Fallback:** «Unduh gambar» or «Unduh PDF», plus «Salin tautan» (the existing `SalinTautan` pattern).
   - If even copying fails, the link is shown as selectable text.
4. **Every image and PDF carries a frame that can't be left out** (it is part of what is captured):
   - **header:** «PINTAR · Mode Eksplorasi»;
   - **footer:** «DATA CONTOH — bukan data sebenarnya · coba sendiri di [alamat eksplorasi]»;
   - a light diagonal «CONTOH» across the content;
   - for the certificate: «CONTOH — TIDAK BERLAKU», with no verification address or code.
5. **Interactive links name a feature, never a record or a session.**
   - Example: `…/jelajah?buka=laporan-kelas`.
   - A short allowlist maps each name to a perspective and a page in the recipient's own sandbox.
   - Sandbox ids differ per visitor, so a link can't point into the sender's school.
   - An unknown or retired name opens perspective selection.

**The shareable list** (first release; Daisy confirms):
- the class evidence page;
- the class and school summaries;
- the leader's page;
- a learner's result;
- Studio's home;
- the specimen certificate;
- the perspective screen.

**The discovery cycle (owner, 19 Nov): "Share the discovery, not the session."**

```
Visitor A explores → finds a report → «Bagikan PINTAR»
   └─► one share: the picture (or PDF) + a feature link, together in one message
Visitor B opens the link → own fresh sandbox → lands on that report, canonical data
   └─► explores freely, switches perspective, finds something else → «Bagikan PINTAR»
Visitor C … and so on, with no registration anywhere in the loop
```

- **One message carries both.** With file sharing, the share sheet gets the picture plus a short text holding the
  feature link. Without it, the visitor downloads the file and copies the link, which is given in the same panel. So the
  recipient always gets both what the sender saw and a way to try it.
- **Every hop is independent.** A link carries only a feature name, so B's and C's sandboxes are new copies of the
  canonical school. The cycle can't accumulate or leak state, however long it runs.
- **The landing page explains itself.** A recipient who arrives through a feature link sees one line above the feature:
  «Seseorang membagikan fitur ini. Ini sekolah contoh milik Anda sendiri: silakan coba.» Their perspective is set to the
  feature's role. Everything else, including switching and sharing onward, is available at once.
- **Nothing tracks the chain.** No referral codes, sender ids or hop counts. This keeps the roadmap's no-tracking rule,
  and the cycle needs none of them.

**Stable, maintainable feature links:**

| Rule | How |
|---|---|
| Names describe the feature, not the route | `laporan-kelas`, `bukti-kelas`, `ringkasan-sekolah`, `hasil-belajar`, `studio`, `sertifikat-contoh`. Lower-case Indonesian nouns; never a URL path, id or query |
| One registry, versioned with the dataset | One table: name → perspective, the page in the template school, and a status. It is reviewed in every release's exploration step |
| Moved | The name stays and its target is updated. Old links keep working |
| Renamed | The old name becomes an alias of the new one, never deleted |
| Retired or unavailable | The name stays as a tombstone pointing to the closest living feature (or that perspective's home). The landing line says «Fitur yang dibagikan sudah berubah; ini yang paling dekat.» |
| Unknown or malformed | Perspective selection, with no error page |
| A release check | A test opens every registry name and fails the release if any name resolves to a missing page (G-S12) |

**Boundaries:**
- **Context-aware sharing exists only in exploration mode.** In the real product, a picture of a class report would
  carry real learners' data into WhatsApp, outside every retention and access rule. It is off there, and turning it on
  would be a separate owner decision with privacy review.
- No server storage, no public uploads, no short-link service, no share analytics.

**And then what?**

| If | Then | Handling |
|---|---|---|
| The sender's sandbox shows a guest-typed Studio item | The picture carries their own text | Theirs to share; it is fictional-data context and framed «CONTOH» |
| The recipient opens the link after a release changed the page | The name still resolves, or falls back to perspective selection | The allowlist is versioned with the dataset |
| The picture is forwarded on, out of context | The frame travels with it | The frame is inside the image, not metadata |
| A device can't capture (old browser) | The PNG option is hidden | The links remain |

---

## G · Demonstration data and educational integrity

**Three kinds of evidence, never mixed silently:**

| Kind | Source | Shown as |
|---|---|---|
| Canonical fictional cohort | Engine-generated sittings in the dataset build, `PUBLIC_DEMO` | Ordinary class evidence, under the band's «Data contoh» |
| Guest-generated | The guest's own actions in their sandbox, `PUBLIC_DEMO` | The same, because they are the same kind of record. The learner persona is one member of the class, so the guest's sitting moves the counts exactly as one more learner would |
| Simulation seams | Prepared examples (AI drafts, emails, verification) | Explicitly labelled «Contoh — bukan proses sebenarnya» |

**Why this is honest without special rules.** The real minimum-sample rules (`metric_definitions.minimum_sample`) and
the three evidence states decide what a class or leader page may conclude. One guest sitting can change a class
figure only as much as one real learner's would. The sparse class shows «belum cukup data» truthfully. **No
demonstration calculation exists.**

**The dataset design (Bob drafts; Dr Gladys checks the educational meaning):**
- two classes (one typical, one sparse);
- a cohort spread that produces visible misconceptions and some below-mark sections;
- Studio items in every lifecycle state;
- one correction already applied;
- one certificate-eligible learner.

---

## H · Security and privacy (Sharon's review package)

| # | Area | Proposed protection | For Sharon to confirm |
|---|---|---|---|
| H-1 | Real-data isolation | A separate project; no real data imported, ever; the dataset is built only from fictional sources | That no build or seed path can copy from staging or production |
| H-2 | The production guard | Exploration mode refuses non-exploration project refs (code plus trigger) | The guard's placement; a red test |
| H-3 | The public-route boundary | Anonymous entry exists only in exploration mode. In the normal release, the proxy's public list is unchanged | That the setting can't be switched on in a normal deployment |
| H-4 | Guest isolation | One fictional school per visitor; existing RLS and tenant boundary | Cross-sandbox reads refused (G18) |
| H-5 | Sessions | ADR-0020's assume path: no password, no refresh token, a short expiry; the guest cookie is scoped to the exploration address | The token lifetime against the sandbox lifetime |
| H-6 | Abuse and resources | Pool size; claims per address per hour; request rate limits; the purge | The limits; the behaviour when the pool is empty |
| H-7 | Email | No email leaves the exploration environment (SMTP absent); messages shown on screen | That every send path is covered |
| H-8 | AI and cost | No provider key exists in the environment; prepared examples only | That no code path reaches a provider |
| H-9 | The stand-in provider (C3w-1 condition 5) | Prepared drafts are a separate, labelled example source, not the test stand-in | Her ruling |
| H-10 | Certificates and reports | Specimen marking; verification only within the exploration environment; prints carry «CONTOH» | That a specimen can't be confused with a real one on the real site |
| H-11 | Sharing | Links name an allowlisted feature, never a record, sandbox or session. Pictures and PDFs are made in the visitor's browser from what they already see, framed «DATA CONTOH», never uploaded | That the frame can't be removed through the UI; that no share path exists outside exploration mode; the two new browser libraries (supply chain) |
| H-12 | Registration transition | K3; no data carried over | — |
| H-13 | Logging | Operational logs only, short retention; no behaviour tracking (roadmap rule) | The retention period |
| H-14 | Children | No personal data; fictional identities; the legal questions below | — |
| H-15 | Failure and recovery | A failed provisioning or purge leaves no partial school visible; the purge is idempotent | Red cases |

**Added to the pilot's legal list (PR-1):**
- PSE registration for a public, anonymous service;
- minors using an anonymous demonstration;
- the hosting notice for a public page.

---

## I · Roadmap integration

**What exists now:**
- Ruang Peragaan (ADR-0020);
- the fictional school seed;
- the `PUBLIC_DEMO` channel and cap;
- text-only branding and the shared components;
- the copy-link pattern.

**What it reuses from 4.1:**
- the whole learner, teacher, Studio, administration and leader surface;
- A3's sitting safety;
- the reviewer notes;
- corrections;
- C3w-1's drafting screens (with prepared examples);
- the certificate refinement D2-R (so the specimen shows the refined certificate).

**What must come first:**
1. 4.1 accepted (Z, the walkthrough), so the release being shown is stable;
2. D2-R, before the specimen certificate is designed;
3. the owner's decisions K1–K4;
4. the readiness items a public service needs: error capture (PR-12) and a named contact (PR-15). Backup is
   unnecessary for disposable data.

**Placement in 4.5: early, and in parallel.**
- It depends on no unresolved 4.5 item (R-1 to R-5, RD-4).
- It can be built while the 4.5 measurement work is still being designed.
- It is not a prerequisite for any other 4.5 item, so it must not delay one.

**What it shows at first:** what is accepted at the time, meaning 4.1, plus 4.2 when accepted.

**Each later 4.5 feature** (Question Intelligence, Quiet Intelligence and so on) **carries its own guest representation
as part of its acceptance:** the dataset rows and «Saran langkah» entries it needs.

**Deferred:**
- formal evaluation (R-1);
- any future preview (K4);
- an inquiry form (K3 option b);
- additional subjects or school types until there is evidence they help visitors judge.

**Regression risk:** low for real users, because the normal deployment is unchanged except for one setting that is off.
The main risk is drift: a release that breaks only in exploration mode. Mitigation: exploration mode is part of the
journeys run (§K).

---

## J · Implementation batches (planning estimates; to be re-estimated when 4.5 opens)

| Batch | Objective and scope | Depends on | Owner(s) | Deliverables | Completion gate | Effort |
|---|---|---|---|---|---|---|
| **G0 · Decide and record** | K1–K4; ADR-0021 (exploration environment); the roadmap amendment; ADR-0006's note | Owner | Bob; Sharon reviews the ADR | ADR, amendment, rulings | Owner approval | 2 d |
| **G1 · The exploration environment** | A one-day feasibility spike (§D.5: what may be shared read-only; template size; copy time). Then the project and deployment setting; the production guard; sandbox template, pool, claim and purge; guest sessions on ADR-0020's path; email and AI absent; rate limits | G0; the project (owner) | Second Eye builds; Sharon reviews (H-1 to H-8, H-15) | Workflow, migrations behind the setting, red-first tests | Sharon PASS; G17, G18, G-X1 to G-X6 green | 8–10 d |
| **G2 · The canonical dataset** | Extend the seed into a versioned template; generate cohort sittings through the engine; the sparse class; Studio items in every state | G1's template format | Bob drafts; Dr Gladys checks meaning; Second Eye builds | Dataset build script, version, checksums | G07, G24 green; Dr Gladys's note | 4–5 d |
| **G3 · Entry, perspectives and the band** | The eight new screens and controls (§F) | G1; Daisy's designs | Daisy designs; Second Eye builds | Screens, `hle.ts` words | Daisy PASS; G01–G06, G11–G16, G20 green | 6–7 d |
| **G4 · Simulation seams** | Prepared AI drafts; on-screen email; specimen certificate and verification; «Laporkan masalah» explained | G1; D2-R; C3w-1 accepted | Second Eye; Daisy words; Sharon H-9, H-10 | Seams, each labelled | G21, G22 green; Sharon PASS | 3–4 d |
| **G3s · Context-aware sharing and the discovery cycle** | §F.1: the options per screen; browser-side PNG and PDF with the frame; native file share and fallbacks; the versioned feature-link registry with aliases and tombstones; the recipient's landing line | G3; the A4 print layouts (exist) | Daisy (frame, options, readability, landing line); Second Eye builds; Sharon H-11 | Share control, frame, registry | G12–G14, G-S1 to G-S13 green; Daisy and Sharon PASS | 5–6 d |
| **G5 · Verification and human acceptance** | Full matrix; a load test on the pool; observed self-service sessions | G1–G4, G3s | Second Eye (matrix); Daisy (sessions); Sharon (final security PASS) | Evidence pack | §K's acceptance | 3–5 d |

**Total: about 31–39 person-days.**

**Parallel work:**
- G2's design can run beside G1;
- Daisy's G3 designs can start right after G0;
- G4 waits on D2-R and C3w-1 only.

**The release step it adds:** every PINTAR release also deploys to the exploration environment and rebuilds the
dataset, which the journeys run checks.

---

## K · Verification and acceptance

**Baseline:** Review X's G01–G24, with three recast to the governing objective:
- **G04** becomes "**self-directed evaluation**: given only the entry page, a visitor reaches the features *they* care
  about without help";
- **G05** becomes "**free navigation**: any role feature is reachable from that role's own navigation; no step is
  locked";
- **G07** becomes "**consistency**: after an assign, sit and review in any order, every dependent view (score, feedback,
  class counts, denominators, misconceptions, the leader's figures, «belum cukup data») agrees, because one engine
  computed them".

**Added for the sandbox architecture:**

| # | Scenario | Required result |
|---|---|---|
| G-X1 | The sandbox expires, then the visitor returns | A fresh school; an honest sentence; nothing from the old one visible |
| G-X2 | The purge | No row of an expired sandbox remains (an independent read-only count) |
| G-X3 | Switching perspective during an open Uji Penguasaan | The sitting's controller is unaffected; no recovery is demanded |
| G-X4 | The production guard | Exploration mode refuses to start against the production or staging ref (red test) |
| G-X5 | Normal release unchanged | With the setting off, the public route list and every existing journey are identical (the full journeys suite) |
| G-X6 | Pool exhausted | The honest "full" sentence; no partial school; it recovers when refilled |
| G-X7 | Email and AI | No outbound email or provider request in a full exploration (the network log) |
| G-X8 | Specimen on the real site | The real verification page reports an exploration certificate as not found |
| G-S1 | Picture of a class report after the guest's own sitting | The PNG shows the same figures as the screen, the guest's sitting included, framed «DATA CONTOH» |
| G-S2 | PDF of a multi-page summary | The PDF's pages match the A4 print layout; the frame is on every page; no official print record is written |
| G-S3 | Readability | The PNG at 1080 px is legible on a low-cost phone without zooming (Daisy) |
| G-S4 | Native file share | On Android and iOS, the share sheet offers WhatsApp with the file attached |
| G-S5 | Feature link | The recipient lands on the same feature in their own new sandbox; none of the sender's changes is visible |
| G-S6 | No file sharing | Download plus copy link; then a selectable link if copying fails |
| G-S7 | Certificate specimen | «CONTOH — TIDAK BERLAKU»; no verification address or code anywhere in the file |
| G-S8 | Real product unchanged | With exploration off, no picture, PDF-share or feature-link option exists anywhere |
| G-S9 | **The discovery cycle A → B → C** | A changes data and shares a class report. B opens the link in a separate browser and lands on the class report in a new sandbox, showing canonical figures, none of A's changes. B switches perspective, shares a learner result. C lands on it in a third new sandbox. No step asks for registration |
| G-S10 | Isolation across the cycle | After the chain, A's, B's and C's sandboxes are three different schools. Nothing written in one is readable from another (independent read-only check) |
| G-S11 | One message carries both | The share sheet's payload holds the file and the feature link. On the fallback, the same panel offers download and copy |
| G-S12 | Link stability | Every registry name (including aliases and tombstones) resolves to a living page on the release candidate; a deliberately retired name lands on its fallback with the "berubah" line |
| G-S13 | No tracking | The link and the landing request carry no sender, referral or hop data (inspect the URL and logs) |
| **G-R1** | **Resource exhaustion: sandbox cap** | Claims beyond 200 live sandboxes get «Eksplorasi sedang penuh». No partial school is created. Existing guests are unaffected |
| **G-R2** | **Resource exhaustion: a burst** | 300 claims in a minute from many addresses: the pool drains, then the global cap holds. The database stays under its connection limit. The site recovers once the pool refills |
| **G-R3** | **Per-sandbox quota** | A script creating Studio items and imports past the quota is refused with a plain sentence. Other sandboxes' response times stay within target |
| **G-R4** | **Abandoned sessions** | A sandbox left idle for 2 h is purged on the next run. One with an open sitting is purged only after the sitting ends or its own limit passes. An independent count shows no remaining rows |
| **G-R5** | **Purge failure** | A purge interrupted mid-way leaves the sandbox unreachable and is completed by the next run (idempotent). No orphan rows after two runs |
| **G-R6** | **Failed provisioning** | A copy failing mid-way (forced in a test) rolls back completely. The visitor gets the next pooled school or the "full" sentence. Never a half-built school |
| **G-R7** | **Abuse: one address** | Repeated claims from one address are refused after 5 an hour. The claims of other addresses are unaffected |
| **G-R8** | **Abuse: reaching beyond the sandbox** | Direct API calls with a guest token to another sandbox's ids, to operator functions and to staff-only RPCs are all refused (RLS and grants) |
| **G-R9** | **Abuse: hostile content** | Script or markup typed into Studio renders as text on screen, in the PNG and in the PDF |
| **G-R10** | **The kill switch** | Turning it on closes entry with the sentence. Live sandboxes keep working until they expire. Turning it off restores entry |
| **G-R11** | **Spend controls** | With a test budget set low, reaching it pauses the exploration project's usage. The real projects are unaffected |

**Human acceptance (owner's measure):**
- At least six observed visitors across the perspectives, each given only the entry address. Adults only; any minor
  waits for K4's legal answer.
- **After 15–20 minutes of free use, each is asked:**
  - "Is PINTAR suitable for what you need, and why?"
  - "What did you try?"
  - "What does this result mean?"
  - "Was this real data?"
- **Pass:**
  - at least 5 of 6 give a reasoned suitability judgment based on features they used themselves;
  - every one says the data was fictional;
  - every one found and could explain the Share and perspective controls;
  - no one needed the team to explain a step.
- **The discovery cycle, observed:** in at least three of the sessions, the visitor shares something they chose. The
  next participant starts from that message alone. **Pass:** the recipient understands from the picture what the sender
  found valuable, opens the link, reaches the same feature, and goes on to explore something else, without help.
- Daisy runs it, and Dr Gladys reviews the questions.

---

## L · Risks, open questions and simplifications

**Material risks:**
1. **Drift between releases and the exploration mode:** mitigated by G-X5 and the release step.
2. **Abuse or a surge on a public page:** mitigated by the pool, limits and honest "full" state. Load is isolated from
   real schools.
3. **Legal status of a public anonymous service:** the K4 questions. This could delay a public launch, but not the
   build.
4. **A3 interaction on perspective switches:** designed (D.4) and tested (G-X3).
5. **Picture quality across devices:** a browser-side capture depends on the browser. Mitigated by a fixed share width,
   real text, G-S3 on a low-cost phone, and PDF for long views.

**Open, for the team:**
- the lifetime values (Bob proposes 2 h idle and 24 h maximum);
- the pool size (start at 20, measured in G5);
- the exact Institusi persona set.

**Simplifications chosen:**
- no simulation engine;
- no per-tab state;
- no queueing;
- no inquiry form in the first release;
- no future previews;
- one school template;
- one subject (fractions);
- sharing done entirely in the visitor's browser (no renderer service, no short links, no storage).

---

## M · Final recommendation

1. **K1–K4 are directed** (ruling 66). **K5 and K6** (the Vercel plan and a spending ceiling) are needed before any
   provisioning, not before planning.
2. On approval, G0 is recorded (ADR-0021, the roadmap amendment).
3. Sharon reviews §H and Daisy §F/§E **after their 4.1 work, without delaying C3w-1 or Z.**
4. The build (G1–G5) starts early in 4.5, after 4.1's acceptance, under 4.5's own implementation authorisation.
5. **Nothing is built before then.**

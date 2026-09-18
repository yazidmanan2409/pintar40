# PINTAR CORPORATE WEBSITE — EXPERIENCE ARCHITECTURE

**For:** Sauron · **By:** Pete · **Date:** 2026-09-18
**Status:** architecture for review. **No code written.** Nothing here ships
until the STOP items in §K are ruled on.

Evidence tags used throughout: **OBSERVED** (I read it in this repository) ·
**CANONICAL** (baseline / ADR) · **RULING** (your brief) · **DECISION** (mine,
inside the space the first three leave) · **PROPOSAL** (yours to accept or
reject) · **DEFERRED** (named and not designed).

---

## A · What this website has to accomplish

The presentation deck had a captive room and a presenter. The website has
neither. It gets a stranger, for ninety seconds, with a back button.

So the site cannot work the way the deck worked. The deck could *assert*
PINTAR's doctrine because a person was there to be believed. A website that
asserts the same doctrine — "we are honest about evidence", "AI does not
decide" — sounds exactly like every site that asserts the opposite and means
it less. Assertion is the one register the web has already exhausted.

**The strategic fact this site is built on:** PINTAR's real differentiator is
a *refusal*. It refuses to conclude more than the evidence supports. You
cannot put a refusal on a feature card, because a refusal is only credible
when you watch it happen and it costs the system something. A visitor who
reads "we say when there is not enough evidence" has learned a marketing
claim. A visitor to whom PINTAR *says* "belum cukup bukti" — when a demo had
every commercial incentive to flatter them — has learned the product.

That single observation determines the whole architecture: **Mini-PINTAR is
not a feature of the website. The website is an arrangement around
Mini-PINTAR.** Everything before it exists to make a stranger willing to
spend two minutes; everything after it exists to explain what they just felt.

The site must answer your eleven questions, and it does — but ordered so
that question 10 (*can I experience it myself?*) is answered **before**
questions 5–9, not after them. Most sites explain, then invite. This one
invites, then explains. That inversion is the site's structural signature,
and it is the same shape as the product doctrine: evidence first,
understanding second, decision third.

**What the site is not**, restated as design constraints rather than taste:
no feature grid (PINTAR's value is not additive), no dashboard mosaic (the
management surface is not built — §K.9), no "AI-powered" framing (AI arrives
at ~85% scroll depth, deliberately), no persona gate (§B), no compressed deck
(the deck's job was a room; this one's job is a stranger).

---

## B · Audience model

**DECISION: model by question depth and exit intent, not by job title.**
Persona-gated navigation ("I am a…") asks a visitor to classify themselves
before they know what they would be classifying themselves *for*, and your
brief rules it out. It also produces three near-identical pages that dilute
one narrative into three weak ones.

| # | Who | Time | The question they actually arrive with | What they should do next |
|---|---|---|---|---|
| 1 | **Curious arrival** — parent, teacher, someone sent a link | ~90 s | "What is this?" | Understand in one screen; ideally try it |
| 2 | **Educator** — protective of their time and their students | 5–8 min | "Will this judge my class, and will it add work?" | Mini-PINTAR → the educator chapter |
| 3 | **Institutional decision-maker** — principal, foundation, kaprodi | 10–15 min, returns | "Can I trust the information, and what changes here?" | Evidence & Trust → contact |
| 4 | **Evaluator / partner** — due diligence, returns with colleagues | deep, repeat | "What is actually built, and what is not?" | Boundaries → contact |
| 5 | **Learner arriving by QR or link** | seconds | "Where do I start?" | **Leave the corporate site immediately** for the app |

Audience 5 is a routing problem, not a marketing one. A learner who lands on
the corporate site has been failed by a link, and the site's duty is to get
them out fast — not to detain them with the value proposition. Related: §J.2.

**The design rule this produces: depth ramps, not doors.** Every section
answers the shallow question in its first screen, and the deeper answer sits
below it. Depth is opted into by scrolling, which costs nothing and commits
to nothing, rather than by choosing an identity, which does both.

Learners are central to the *story* and are not the site's user. The
corporate site never adopts a child's register. (The Voice Guide's `ANAK`
register belongs to the product; the site speaks `DEWASA` / `PIMPINAN`.)
Inside Mini-PINTAR the register shifts to the learner's — that shift is part
of the experience.

---

## C · Narrative

Seven movements. Not the deck's twenty-five slides compressed; a different
arrangement for a different reader.

1. **The question.** *Apakah kita benar-benar tahu apa yang sedang terjadi
   dalam proses belajar?* — no product, no claim, no logo wall. A question
   the visitor can already feel.
2. **The gap.** Activity is recorded well. Understanding is not. Stated as
   PINTAR's design emphasis, never as an attack on anybody's LMS
   (**CANONICAL**, doc 15 *What PINTAR is not*).
3. **The idea.** The core proposition, in full, once. The first time the word
   PINTAR carries a definition.
4. **The hinge — the question PINTAR asks first.** *Apakah buktinya sudah
   cukup?* And then the counterintuitive line the whole site rests on:
   **PINTAR is built to be able to say "we don't know yet."**
5. **Experience it.** The site stops talking and hands over. ~40 % scroll
   depth, not the bottom.
6. **What it means — for a learner, an educator, an institution.** Now that
   the visitor has felt it, this reads as scale rather than as claims.
7. **Where AI sits, where it stops, and how to talk to us.** Including the
   boundaries, on the homepage, not buried.

Movement 5 before movement 6 is the whole trick. It is also the honest order:
the visitor earns the understanding before being told what it means.

---

## D · Information architecture

**Top navigation: five items, one button, one language control.** A visitor
should understand PINTAR before being asked to understand its org chart.

```
PINTAR [wordmark]        Gagasan   Cara Kerja   Bukti & Kepercayaan   Tentang
                                          [ Coba Mini-PINTAR ]   ID|EN   Masuk
```

| Route (ID) | Route (EN) | What it holds |
|---|---|---|
| `/` | `/en` | The homepage narrative, §E |
| `/gagasan` | `/en/why` | Why PINTAR exists: the gap, the idea, what PINTAR is not |
| `/cara-kerja` | `/en/how` | One scrolling story in three deep-linkable chapters: `#peserta-didik`, `#pendidik`, `#institusi` |
| `/bukti` | `/en/trust` | Evidence & Trust, including `#ai` and `#batas` (boundaries) |
| `/coba` | `/en/try` | Mini-PINTAR |
| `/tentang` | `/en/about` | Who PINTAR is, and how to talk to us |
| `/masuk` | — | Hands off to the existing application |

**DECISION: no separate "For Learners / For Educators / For Institutions"
pages in V1.** Your brief asked me to investigate whether the site needs
them. It does not, for three reasons: they reinstate the persona gate through
the back door; three pages built from one body of material always decay into
three weaker ones; and the audience-specific material is far stronger as
three *chapters* of a single "how it works" story, because an educator
benefits from reading the learner chapter first and an institution benefits
from reading both. Each chapter is deep-linkable, so sales can still send
`…/cara-kerja#pendidik` to a teacher. If a standalone educator page later
earns its place, it is promoted out of that chapter without restructuring
anything.

**DECISION: "Coba Mini-PINTAR" is a button, not a nav link,** present in the
header from the first viewport and persistent on scroll. It is the site's one
primary action, and a nav link would make it look like a section.

**Not in V1** (**DEFERRED**, named so they are not silently forgotten):
pricing, customer logos, testimonials, blog/news, careers, case studies.
None of them can be truthful yet — there is no shipped customer, no
production-readiness declaration (**CANONICAL**, §K.9), and a fabricated
testimonial would fail the one test this whole project is built on.

---

## E · The homepage, first viewport to final CTA

Nine sections. Roughly 5–6 screens of scroll on desktop.

**1 · Hero.** One question in display type on the warm ground. One line
beneath it. Two actions. Nothing else — no statistics, no carousel, no
product shot, no logo wall.

> **Apakah kita benar-benar tahu apa yang sedang terjadi dalam proses belajar?**
> Bukan berapa banyak yang dikerjakan. Apa yang sebenarnya dipahami.
> `[ Coba Mini-PINTAR ]`   `Apa itu PINTAR ↓`
>
> *EN:* **Do we really know what is happening inside the learning process?**
> Not how much was completed. What was actually understood.

**DECISION: the hero does not say what PINTAR is.** It earns the next scroll
instead of spending the visitor's attention on a definition they have no
reason to want yet. This is the single most contested decision on the page
and I will defend it: a definition in the hero is read by nobody who has not
already decided to care.

**2 · The gap.** A quiet scroll-tied reveal: `tugas → dikerjakan → nilai →
laporan`, and then the chain fades leaving one number alone on the ground.
*Yang tersisa: sebuah angka. Yang hilang: apa yang dipahami, apa yang belum,
dan apakah buktinya cukup untuk menyimpulkan.* Under
`prefers-reduced-motion`, the diagram renders in its final state with the
same meaning and no movement (§ accessibility, in the full spec).

**3 · The idea.** The core proposition, set large, alone on the page, in
full. **RULING** — carried verbatim, both languages, exactly as the deck
carries it.

**4 · The hinge.** *Apakah buktinya sudah cukup?* with the branch — **sudah**
→ an interpretation the evidence supports; **belum** → observe, support,
gather more. Then, plainly: *PINTAR dibangun untuk bisa berkata: kami belum
tahu.* / *PINTAR is built to be able to say: we do not know yet.*

**5 · The invitation.** Full-bleed, deep green, a different surface from
everything above it — the page visibly changes register before the visitor
does.

> **Dua menit. Tanpa akun. Jadilah peserta didik sebentar.**
> `[ Mulai Mini-PINTAR → ]`
> *Tidak ada data tentang Anda yang disimpan.*

At ~40 % scroll depth. A visitor who leaves here has still got the point;
a visitor who clicks gets the argument made for them.

**6 · What changes.** Three columns — peserta didik / pendidik / manajemen —
each three lines, each linking into its `/cara-kerja` chapter. Short, because
after Mini-PINTAR the reader needs confirmation, not persuasion.

**7 · Trust, shown as four refusals.** Four pairs, each expanding to one
sentence: *Observasi ≠ Penilaian · Belum ≠ Tidak · Melihat ≠ Menetapkan ·
Menerbitkan ≠ Menugaskan.* Expanded by default without JavaScript; collapsed
progressively enhanced. This is the section that converts audience 3.

**8 · AI, in its place.** One band, late — at roughly 85 % depth. *AI
membantu menafsirkan. Manusia tetap memutuskan.* with
`bukti → pola → tafsiran → tindakan → keputusan manusia` and the "why?" test.
Links to `/bukti#ai`. **RULING** honoured: a visitor understands PINTAR
before encountering AI.

**9 · Talk to us — and the boundary.** One sentence, one contact route, no
form wall. And then, on the homepage rather than buried: *Inti PINTAR 4.0
sudah lengkap. Kesiapan produksi belum dinyatakan.* Putting the limitation
where everyone sees it **is** the trust argument; a site that hides it has
already conceded the point.

---

## F · Mini-PINTAR — the 2–3 minute journey

### F.0 · Content

**PROPOSAL, needs your ruling.** The demonstration topic is a product
decision about what PINTAR shows the public, so I am putting two options to
you rather than choosing.

**Option 1 — recommended: an original adult-accessible unit, "Membaca
angka" / "Reading a number."** Three Pemetaan Awal questions about what a
simple claim ("85 % siswa lulus") does and does not support; one short
lesson; two Uji Penguasaan questions.

Why I recommend it:
- Every adult visitor can engage. Nobody feels tested on primary arithmetic.
- The misconceptions are real and adult — confusing a rate with a count,
  concluding from a small sample, reading a change as a cause — so the
  adaptation has something genuine to adapt to.
- **It teaches the visitor the exact literacy PINTAR is about.** Finishing
  it, they understand "a number never stands alone" because they just did
  it. The content and the product argument reinforce each other instead of
  competing for the two minutes.
- It is demonstrably original, so it carries no rights question and no
  dependency on OD-3 (**CANONICAL**: no real textbook editions are named
  yet, doc 11 OD-3 OPEN).

**Option 2 — closer to the product: the seeded SD5 "Pecahan" material.**
**OBSERVED**: `supabase/seed/learning_cycle.sql` builds a fractions course
whose source row reads *"Bahan Ajar Sintetis PINTAR — Pecahan… Bukan
terbitan nyata"* — explicitly synthetic and safe to derive from. It has the
advantage of being real product content. It has the disadvantage that an
adult decision-maker spends their two minutes on primary-school fractions,
which makes PINTAR look like a primary-school product and risks a faint
insult.

I recommend Option 1 and will build Option 2 instead without argument if you
prefer product fidelity over visitor fit.

### F.1 · The journey

**Step 0 · The threshold** — 0:00–0:10. The corporate chrome recedes: nav
collapses to a single quiet exit, the surface shifts from the marketing
ground to the product ground, the type scale drops to product scale. A
deliberate ~400 ms settle, not a page flash — the visitor should *feel* the
crossing from explanation into experience. One line, eight words of honesty,
and a button.

> Dua menit. Tidak ada akun, tidak ada data yang disimpan.  `[ Mulai ]`

**Step 1 · Pemetaan Awal** — 0:10–0:55, three questions. Framed in the
product's own words (**OBSERVED**, `src/lib/hle.ts` `pretest.intro`): *"Ini
bukan ujian. Jawabanmu dipakai untuk menyusun peta bacaan yang pas
untukmu."* Dot progress, no timer, no score, **no right/wrong feedback at
any point**. Each distractor is mapped to a named misconception.

**Step 2 · Peta Bacaan** — 0:55–1:20. The payoff, and the first moment the
visitor sees their own answers change something. Three cards, ordered and
tiered with the product's own tier language — *Baca ini lebih dulu · Perlu
dibaca · Sudah kamu kuasai* — each naming its reason in plain language.
**The order is genuinely derived from their answers.** A visitor who answers
differently gets a different order; a visitor who answers consistently well
is told so honestly rather than having a weakness manufactured for them.

**Step 3 · Pelajaran** — 1:20–2:00. One short unit: the one *their* map put
first. About 120 words plus one worked example revealed step by step
("Tampilkan langkah berikutnya"), the same staged-reveal interaction the
product uses. Reading, not video.

**Step 4 · Uji Penguasaan** — 2:00–2:40, two questions on what they just
read. Time counts **up**, never down. "Tandai" available. After roughly
twenty seconds of hesitation the assistance pill appears — *🧭 Perlu arah?* —
and gives a direction of thinking and never the answer. That one interaction
demonstrates INV-02 more convincingly than any paragraph could.

**Step 5 · Hasil** — 2:40–3:00. Three honest outcomes, and the third is the
reason the whole site exists:

- **Evidence sufficient, mastery demonstrated** — what the evidence supports,
  and the change since Pemetaan Awal.
- **Evidence sufficient, not yet demonstrated** — what still needs attention
  and what to do next. Never "failed"; *belum tepat*.
- **Not enough evidence** — reachable, not theatre: *"Belum cukup bukti. Dua
  pertanyaan belum cukup untuk menyimpulkan penguasaan. Itu bukan kekurangan
  Anda — itu batas buktinya."*

**DECISION, and the most important one in this document: Mini-PINTAR always
states the limit of its own evidence, including when the visitor does
well.** Even the best outcome ends with *"Ini cukup untuk satu bacaan kecil.
Belum cukup untuk menilai penguasaan seseorang."* A demo that flatters the
visitor and stays silent about its sample size would be a demo that
contradicts the product on the one point the product is built on. **RULING**
honoured: no evidence is manufactured to produce a satisfying result.

**Step 6 · The reveal** — 3:00–3:30. *Itu tadi PINTAR.* The five steps drawn
as the path they just walked, each annotated with what actually happened:

| | |
|---|---|
| **Pemetaan Awal** | Jawaban Anda bukan nilai. Jawaban Anda adalah bukti. |
| **Peta Bacaan** | Urutannya berubah karena jawaban Anda. Ini bukan peringkat. |
| **Pelajaran** | Anda diberi satu langkah berikutnya, bukan seluruh buku. |
| **Uji Penguasaan** | Bantuan datang, dan tidak pernah menyebut jawabannya. |
| **Hasil** | PINTAR mengatakan apa yang didukung bukti — lalu berhenti di situ. |

Closing: *PINTAR tidak sekadar memberi soal dan nilai. PINTAR memakai bukti
untuk memutuskan apa yang sebaiknya terjadi berikutnya.*

**Step 7 · Return** — three doors, not one CTA: *Apa artinya bagi pendidik ·
Bagaimana PINTAR menjaga bukti · Bicara dengan kami.* Then the honesty line,
once, where it reads as integrity rather than as a legal wall:

> Yang barusan adalah miniatur publik: bukan asesmen resmi, tidak
> menghasilkan sertifikat, dan tidak meninggalkan catatan tentang Anda.

**RULING** honoured — the honesty is two sentences total across the whole
experience (one at the threshold, one at the end), not a disclaimer page.

---

## G · How it demonstrates rather than explains

Five refusals the visitor experiences instead of reading. Each replaces a
claim the site would otherwise have to assert:

| The visitor experiences | Instead of reading |
|---|---|
| It never once says "correct" — and they notice the absence | "We don't shame learners" |
| The reading order visibly changes because of *their* answers | "Adaptive learning" |
| Help arrives, and does not give the answer | "Assistance never reveals the key" |
| It tells them two questions were not enough | "Insufficient evidence is a valid state" |
| It compares them only to their earlier self | "No ranking, no percentile" |

The fourth is the one that converts. It is also the one every competitor's
demo is structurally incapable of doing, because their demo's job is to make
the visitor feel clever.

---

## H · Visual and art direction

**Same organisation as the product, more room to breathe.** The corporate
site may be more expressive than the application; it may not be a different
company.

- **Ground** — the product's warm off-white `#FBFAF7` (**OBSERVED**,
  `src/app/globals.css`). Corporate adds one deep "field" surface for the
  statements and the Mini-PINTAR invitation.
- **Primary** — deep green `#245F55` (**RULING**), with the live conflict in
  §K.3 flagged rather than decided.
- **Type** — Plus Jakarta Sans, one family. Corporate expresses through a
  *larger display scale*, not a second typeface. IBM Plex Mono only for
  evidence labels, rarely. A display serif was considered and rejected: two
  families would read as a different company.
- **Motion doctrine — motion only where it carries the argument.** Two places
  earn it: the gap diagram losing its context, and the reading map
  reordering. Nothing floats, drifts, parallaxes or glows. All of it is off
  under `prefers-reduced-motion` with the meaning preserved statically —
  which is only possible because the motion is never the meaning's only
  carrier.
- **Product imagery** — the same discipline as the deck: honest
  reconstructions, labelled, and nothing depicted that is not built.
  **No fabricated dashboards.**
- Explicitly rejected: SaaS gradients, glassmorphism, glowing orbs, rounded
  feature-card grids, dashboard mosaics, blue-purple "AI company" palette,
  childish education illustration.

**Photography direction: attention, not equipment.**

Indonesian educational environments, natural light, warm neutral grade that
sits with the ground. What to shoot: a teacher mid-*listen*; two students
arguing over a worked example; a staff-room conversation with a printout
between them; a hand pausing over a page. What never to shoot: anyone
pointing at a screen, anyone smiling at a laptop, a posed classroom, a
"digital transformation" composite. Technology appears only where it is
genuinely in use and is never the subject — because the product's whole
claim is that the technology is not the point.

**DECISION: the site ships without photography rather than with placeholder
stock.** Generic stock would contradict the brand more loudly than empty
space does, and stock with genuine Indonesian classroom authenticity is
scarce and usually reads false. Typography and whitespace carry the launch;
commissioned photography is retrofitted into a layout already proven without
it. This also keeps §K.7 off the critical path.

---

## I · Bilingual strategy

Bahasa Indonesia is the default and the canonical authoring language.
English is first-class, not a toggle bolted on afterwards.

- **Routing** — `/…` for Indonesian, `/en/…` for English. The apex negotiates
  from `Accept-Language`, defaults to Indonesian, and remembers the choice in
  a single functional cookie (no account, no profile). `hreflang` and `lang`
  set correctly throughout.
- **Both sides authored, neither generated.** Same discipline as the deck:
  one content model, two authored sides, and a build audit that fails on an
  empty or machine-literal side. Translate meaning, not syntax.
- **Layout designed for the longer string.** Indonesian runs roughly 15–20 %
  longer than English in these registers; no component may depend on a
  specific length, and every one is checked at both.
- **Canonical terms never translate mid-sentence.** *Pemetaan Awal* stays
  *Pemetaan Awal* in the English edition, with *(Initial Mapping)* on first
  use per page — the rule the deck already established. Obsolete variants
  (*Kuis Cepat*, *Quick Quiz*, *Mastery Test*) are blocked by the same audit
  that guards the deck.
- **The language switch preserves position**, including mid-Mini-PINTAR:
  switching at step 3 lands on step 3, not the homepage. A switch that dumps
  you home is a switch nobody uses twice.
- **Mini-PINTAR is fully bilingual**, including the misconception mapping, and
  the adaptation must behave identically in both languages. A demo that
  adapts better in one language is two demos.

---

## J · Contracts that need reconciliation

This is the section I would read first. I stopped short of inventing
anything here, as §13 and §26 of your brief require.

### J.1 · Can Mini-PINTAR run on the real engine? — the central question

**What the baseline says (CANONICAL).** Doc 05's authorization matrix names
a **PUBLIC** principal — *"anonymous, Mini-PINTAR/verification only"* — and
grants it *"Mini-PINTAR public trial session (`PUBLIC_DEMO` mode,
`PUBLIC_DEMO` evidence class) — rate-limited; no persistence beyond the
demo's own scope; never eligible for anything official."* The readiness
report's scenario G-13 (100 k anonymous sessions) is **PASS WITH CONDITION**
on the same basis. Doc 09 puts Mini-PINTAR isolation in **FOUNDATION NOW**.

**What is actually implemented (OBSERVED).**

| | |
|---|---|
| `assessment_mode` includes `PUBLIC_DEMO` | ✅ migration `20260914090000` |
| `mode_policy` row for `PUBLIC_DEMO` exists, and a DB assertion forbids it ever certifying | ✅ `20260914093000` |
| `evidence_class` / `evidence_channel` include `PUBLIC_DEMO`, structurally excluded from official consumers (INV-20) | ✅ `20260912133821` |
| An anonymous visitor can hold a session | ❌ **no** |
| A rate-limit primitive exists | ❌ **none in the repository** |

The blocker is precise. `assessment_sessions` requires, **NOT NULL with
foreign keys**: `person_id`, `institution_id`, `enrollment_id`,
`academic_period_id`, `plp_release_id`, `assessment_definition_id`. And the
engine takes identity only from `current_person_id()` — the delivery
migration says so in as many words: *"Nothing takes a person_id."* An
anonymous visitor has none of those and cannot be given them without
manufacturing a Person for someone who deliberately gave no identity.

Separately, the public surface is tightly governed: `public_surface_registry`
declares exactly what anon may reach (today: the `published_lessons` view and
`verify_certificate`), `assert_public_surface()` fails the build if anything
undeclared becomes anon-reachable, and **anon holds SELECT only and no write
grant anywhere**.

**PROPOSAL — Path A, recommended for V1: a zero-write isolated experience.**

Mini-PINTAR runs entirely in the browser against a content bundle generated
at build time. No session row, no response row, no evidence row, no person,
no server call carrying an answer.

- **Contamination is not prevented — it is impossible.** There is no write
  path at all. That satisfies "MINI-PINTAR MUST NEVER CONTAMINATE OFFICIAL
  PINTAR EVIDENCE" in its strongest available form: not by a filter that a
  future query could forget, but by the absence of a mechanism.
- **It needs no new backend contract.** Zero migrations, zero new anon
  grants, `assert_public_surface()` untouched, the proxy's public path list
  untouched. Nothing about the product's security posture changes.
- **Honest cost, stated plainly:** the adaptation logic is a faithful
  *reimplementation* of the cycle's rules, not a call into the engine. See
  J.3 — that is an invariant question, not a preference.

**Path B — canonical, later (DEFERRED): engine-backed `PUBLIC_DEMO`
sessions.** The minimum contract it would need, identified but not designed:

1. **A public principal that can hold a session without a Person.** Either
   the four provenance columns become conditionally nullable for
   `PUBLIC_DEMO` only (a CHECK keyed on `evidence_class`), or a demo tenant
   supplies throwaway rows. The second is easier and creates person records
   for people who gave no identity — that is a privacy decision, not an
   engineering one, and it is yours.
2. **A rate-limit primitive.** None exists. Doc 05 requires one.
3. **New `public_surface_registry` entries** and a widened
   `assert_public_surface()`, since anon currently executes exactly one
   function.
4. **A retention rule** for demo sessions. Doc 06 says "within the demo's own
   scope"; the duration is unspecified and touches OD-5.
5. INV-20 already handles exclusion. That part is solved and needs nothing.

Path A's content bundle becomes Path B's content source without redesigning
the experience, so choosing A now does not cost B later.

### J.2 · The `/` collision

**OBSERVED**: `src/app/page.tsx` is the application's entry-by-purpose screen
("Mau ke mana hari ini?") and `/` is in the proxy's `PUBLIC_PATHS`. The
corporate homepage wants the same address.

**PROPOSAL: deploy the corporate site separately at the apex, application at
`app.` (or `/app`).** Not merely to resolve the clash — the corporate site is
public, static and cached, and it should not run the application's Supabase
session middleware on every request. Keeping the two deployments apart leaves
INV-37's protection surface exactly as it is, which is worth more than the
convenience of one codebase. Audience 5's routing (§B) is then a simple
redirect rather than a shared-layout problem. **Your decision — it has cost
and domain implications I do not own.**

### J.3 · Does a zero-evidence demo violate INV-26?

INV-26: *"One authoritative assessment engine… No second implementation of
assembly, sanitization, scoring or the safety gate exists."*

Path A reimplements assembly and scoring rules in the browser. **My reading**
is that INV-26 governs *evidence-producing* paths — its stated purpose is
that two code paths must never compute "did this session pass" differently —
and a demo that produces no evidence, no result and no record is outside
that concern. **But I will not decide an invariant question.** It needs an
ADR either way, and if the answer is "yes, that is a second implementation",
Path A is dead and Path B becomes mandatory. This is the single item most
likely to change the plan, which is why it is in the first return.

### J.4 · `published_lessons` is anon-readable

**OBSERVED**: the view is granted to `anon`, and the registry's own note
says *"Cross-tenant scope is an open architecture decision."* **DECISION: the
corporate site will not rely on it.** Building a public experience on a
surface whose scope is flagged as undecided would import someone else's open
question into the marketing site. Mini-PINTAR's content ships in its own
bundle.

### J.5 · Analytics and privacy — needs a ruling

**PROPOSAL**, deliberately minimal. Four aggregate counters, no identifiers,
no profile, no third-party script, no analytics cookie:

`demo_started` · `demo_step_completed` (step name only) · `demo_finished` ·
`language`.

**Never the visitor's answers — not even in aggregate.** An answer
distribution is a set of educational responses, and counting how many people
chose option B is the first row of a psychometric dataset built from people
who never consented to being measured. PINTAR's own doctrine says
demonstration activity never becomes evidence; harvesting it for product
analytics would be the same violation wearing a different hat.

If a counter cannot be implemented without an identifier, it is not
implemented. Whether *any* server-side counting happens at all is a privacy
decision under Indonesian PDP law and adjacent to OD-5 — **yours, not mine.**

---

## K · Risks and STOP items

| # | Item | Type | Blocks |
|---|---|---|---|
| 1 | **OD-11 is OPEN.** Doc 11: whether a public Mini-PINTAR ships is undecided, default "no public trial UI until the product owner moves it to BUILD NOW". Doc 09's rules require an explicit recorded decision **and an ADR**. | **STOP** | All Mini-PINTAR work |
| 2 | **No PINTAR SELALU brand asset exists in this repository.** Exhaustive search: no logo, no SVG, no brand file of any kind — only a favicon. I will not invent one. Need the official file, or written approval to ship a labelled temporary wordmark. *Note: the Canva connector in this session is unauthorized and cannot be used until you authorize it in your claude.ai connector settings — if the identity lives in Canva, that is likely the fastest route to the asset.* | **STOP** for launch | Launch, not design |
| 3 | **The primary colour is contested.** Your brief says `#245F55`; `src/app/globals.css` says `#2F6F8F` marked **PROVISIONAL**, explicitly waiting on the brand assets (ADR-0001). The website will make whichever you choose far more visible than the app does. | **STOP** | Visual system |
| 4 | **INV-26 reading** (§J.3). Does a zero-evidence public demo count as a second assessment implementation? | **STOP** | Which path is built |
| 5 | **Mini-PINTAR content topic** (§F.0). Original adult unit vs. seeded product content. | Ruling | Content build |
| 6 | **Analytics** (§J.5). Whether any counting happens, and consent. | Ruling | Instrumentation only |
| 7 | **Photography has no source.** Commissioning is a budget and schedule decision. Mitigated by design (§H) so it never blocks launch. | Risk | Nothing, by design |
| 8 | **Deployment split** (§J.2). Domain and hosting decision. | Ruling | Implementation shape |
| 9 | **The site must not outrun the product.** FABLE-06 is not built: there is no class-progress surface, no briefing, no institutional report. The site may depict only what the deck may depict, under the same provenance labels. A beautiful page showing a dashboard that does not exist would be the exact failure your brief names. | Standing rule | Everything |
| 10 | **Mini-PINTAR may work too well.** If it feels like the product, visitors will ask to buy *it*. The reveal must be unmistakable that this is a miniature — handled in §F step 7, but worth watching in testing. | Risk | — |

---

## L · What I recommend building first

1. **Your rulings on §K.1–4.** Nothing below is safe until these land, and
   two of them can invalidate the plan. This is the critical path and it is
   yours, not mine.
2. **Mini-PINTAR, before any marketing page.** Counterintuitive and correct:
   it is the hardest thing, the highest-risk thing, and the thing the entire
   IA is arranged around. If the two-minute journey does not land, the
   homepage's shape changes — so building the homepage first would be
   building on an assumption. Ship it standalone at `/coba`, bilingual from
   the first commit, with the content model and the language audit in place
   from the start.
3. **The homepage**, designed against the *finished* Mini-PINTAR so the
   invitation is written for the real thing rather than for a plan.
4. **`/bukti` — Evidence & Trust.** The second most important page, and the
   one that converts institutions.
5. **`/cara-kerja`** with its three chapters.
6. **`/gagasan`, `/tentang`, contact.**
7. **Photography**, retrofitted when it exists into a layout already proven
   without it.

Steps 2 and 3 are the product. Steps 4–6 are the company. If the schedule
compresses, 2 and 3 alone are a coherent, honest, shippable site; 4–6 alone
are not.

---

## Awaiting

Your rulings on §K.1–4, your preference on §F.0, and your decision on §J.2.
I will not write code until the architecture is reviewed.

# Coordinator → Daisy: PINTAR Design System Foundation study, additional instructions

- **Date:** 4 Oct 2026. `main` at `d84e0a4` (Gate 6 landed).
- **Read with:** Yazid's brief, «PINTAR DESIGN SYSTEM — FOUNDATION STUDY».
- **Status of the study:**
  - Prepare only.
  - Nothing is propagated through the application until Yazid approves it explicitly.
  - No functional behaviour, architecture, permission, journey or business rule changes as part of it.

Most of what follows is already ruled, or is enforced by a test that will fail. The brief does not mention these, so they are listed here.

---

## 1. Start from what already exists

- Read `docs/coordination/design/PINTAR-DESIGN-SKILL-SPEC.md` first. It gathers every design ruling so far:
  - token set v2;
  - the type and spacing ladders;
  - the D-059 card family;
  - D-047 acknowledgement;
  - terminology v1;
  - states and motion.
- The proposal evolves token set v2 in `src/app/globals.css`; it does not replace it.
- Mark every token and component as **kept**, **changed (and why)** or **new**.
- Where the brief departs from an existing ruling, flag it for Yazid; do not change it silently. Three examples:
  - shadows and elevation (the current system has no shadow tokens, by design: "hairlines and grounds instead of elevation");
  - more than two font weights (today: 400 and 600);
  - radii other than 8, 12 and pill.

## 2. The completion grammar: one trap

«Kirim → Mengirim… → ✓ Terkirim» must **not** be applied to email.

- PINTAR cannot confirm that an email was delivered. So email actions say PINTAR *is sending*, never that it *has sent* (D-098(c)).
- The test EMAILJUJUR-L01 enforces this.
- «✓ Terkirim», like every completed state, is used only where the server has authoritatively confirmed the result.

Build on the components that already exist and are test-guarded; do not invent new ones:

| Component | What it does |
|---|---|
| `TombolKirim` | busy and disabled while pending, with its own «…» word; it cannot be submitted twice |
| `BarisHasil` | the result, shown at the action, with `role="status"` |
| `MemuatHalaman` | the shared loading shell |
| `TandaTautan` | the mark on a navigation link that is loading |

The checks are DAISY-17-KIRIM-01/02 and DAISY-18-DENGAR-01.

## 3. Words come from the copy table

- All visible text lives in `src/lib/hle.ts` (D-014). Daisy owns the wording; the key names are the contract.
- The checks reject:
  - internal words («Menunggu», «Salah», "Wrong", "Failed", …);
  - notification words («notifikasi», «pemberitahuan», …) (DAISY-25-TEKS-01);
  - «dikunci» on learner lines (DAISY-26-BELAJAR-01).
- In the playground, use real copy keys or clearly marked sample text.

## 4. Students are never named on a shared screen

S15 and D-020 apply.

- The bottom identity area in the proposed navigation model must handle "no name":
  - staff see their own name;
  - a learner sees «Bukan akun Anda?» and Keluar.
- Keluar stays reachable on every signed-in screen.

## 5. Shared school computers are the normal case

D-099 applies: SD/SMP students have no phone at school.

- Design for small, low-resolution laptops and tablets, and for usability down to 320 px (the X.6 crawl checks this).
- Touch targets must be at least 44 px. Today `.pin-btn` is 40, the question navigator 34 and the question bar 32.
- No heavy blur, backdrop filters or large shadows on low-powered hardware.
- Motion stays colour and opacity only, about 160 ms (`--motion-fast`), and is switched off under reduced motion, unless Yazid rules otherwise.
- No essential student journey may assume a phone.

## 6. Include the identity screens (Gates 3–6) in the foundation

From Gate 6 (`main` `d84e0a4`):

- PIN input: the staff 4-digit personal PIN, and the class-card PIN. The error line says how many tries are left.
- «PINTAR terkunci». A class card is never named there.
- «Komputer siapa ini?»: two whole-row choices, with the safer «Komputer bersama» preselected.
- The 4-minute «Saya masih di sini» banner. It is attention, not error.
- «Keluar dari semua perangkat», a destructive confirmation.

From Gates 3–5:

- the activation steps;
- the 6-digit code input;
- the password rules shown before typing;
- recovery by email and by PINTAR ID + PIN.

## 7. Status colour discipline is already ruled

See the spec's §6, where the comments in `experience.css` are cited:

- Management pages have no red "blocked" ground;
- readiness always uses the quiet ground;
- feedback has no red-to-green scale;
- nothing is carried by colour alone.

Contrast pairs must clear 4.5:1 (the check UX1-S0-CONTRAST-01). That includes any accent colour that is introduced.

## 8. Navigation is a proposal, not a change

- A sticky left navigation would replace today's header shell (`src/components/CangkangPengalaman.tsx`). That needs Yazid's approval.
- Derive menus only from the existing roles and journeys; do not invent the canonical menu.
- Consider whether the learner shell should stay simpler than the staff one.

## 9. Where the playground lives

Keep it out of the shipped app's public routes. Either:

- a standalone page outside production; or
- a development-only route that returns 404 elsewhere, as `/api/dev` does.

A route inside the app also needs:

- an entry in `ROUTE_INVENTORY` (`selftest/app.test.ts`, test F06-S02);
- an entry in the surface list of UX1-S0-TOKEN-01 (`selftest/experience.test.ts`);
- to pass the token check: no raw colour or untokenised length outside `globals.css`.

A public route would also need its own entry in the public-surface registry and in `src/proxy.ts`.

## 10. Include a migration map

- Show which current `pin-*` classes and components map to which new component, so that the later application pass is mechanical.
- Rename nothing in `src/` during this study.
- Cover the known gaps listed in the spec's §6:
  - sizes outside the ladder (15 px; 26, 27 and 32 px phone headings);
  - the 6 px radius;
  - `.pin-sehat-tanda.pin-perhatian` painted in blocked colours;
  - controls under 44 px.
- Cover print: certificates, and the class-card sheet (`LembarKartu`).

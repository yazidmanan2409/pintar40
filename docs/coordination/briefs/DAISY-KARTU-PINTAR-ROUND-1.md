# DAISY — PINTAR ID CARD: DESIGN EXPLORATION, ROUND 1

**The brief as sent to Daisy by Yazid, 30 Sep 2026** (drafted by Yazid, revised by the coordinator). Decision: D-071.

---

**Release and scope**
- Yazid releases you from the Gate 2E pause for **this one design-only task**. Nothing else resumes: DAISY-19's wiring, DAISY-20 and every code ticket stay paused until Gate 2E is released.
- This exploration feeds DAISY-24 (Gate 7, the card family); it does not replace it.
- Design and render only: no application code, no `hle.ts` keys, no migrations, no CI.
- Work in `docs/coordination/ux/kartu-pintar/` on your lane, the same way as the email-frame prototype (`ux/email-frame/`): a render script, the renders, and a README.
- Hand off to the coordinator. First line: `READY FOR REVIEW: kartu-pintar round 1 on <sha>`. The coordinator reviews, then Yazid.

**Read first**
- `auth/IDENTITY-4.0.md`: §4 (PINTAR ID), §5 (QR), §11 (the card addendum), plus D-059 and C17.
- `design/PINTAR-DESIGN-SKILL-SPEC.md`: §6, §7, §13, §14, §15, §17.
- Terminology v1: `ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md` (D-068).
- `ux/email-frame/README.md`: where the Digital Card will appear, and how its contrast table was measured.

**What the card is (fixed: do not redesign these)**
- **The PINTAR ID is the person.** 8 characters, shown 4+4: «A14C D7ST». It never encodes school, level, role or permission.
- **The card is the current chapter.** Name, PINTAR ID, QR and the PINTAR brand, plus the person's current role and school, read when the card is rendered.
- **Colour identifies the card family only.** It never implies permission, rank or access. The role and school are always also written in text.
- **A keepsake, not gamification.**
- **In 4.0 the card is digital.** It is delivered in the card email and in Akun saya (DAISY-24). Design it at CR80 proportions so the same design can be printed later, and judge it both on screen and in print.
- **Never on the card:** PIN, password, email address, date of birth, photo, or any security claim.

**1. Format**
- CR80: 85.60 × 53.98 mm, with the standard ≈3.18 mm corner radius.
- Keep type and the QR inside a 3 mm safe margin, and show the bleed wherever colour runs to the edge.
- Design the front and the back.
- **Enlarged renders** for design review.
- **Actual size:** an A4 PDF with the six fronts and one back at 100%, with crop marks, marked "print at 100%, no fit-to-page". Yazid will print it, cut it, and judge the type and the QR by hand.
- **In context:** one card inside the email frame at 600 px and 320 px, in light and dark, and on a phone-width screen.
- The HEX values are screen colours (sRGB). Note which are likely to shift in print.

**2. Six-card baseline (the 4.0 exploration set)**

| Family | Working colour |
|---|---|
| Murid | Slate Blue `#789EB5` |
| Guru | Deep Sage `#688F78` |
| Kepala departemen | Deep Teal `#587F7D` |
| Dekan | Deep Navy `#465B70` |
| Admin sekolah | Deep Stone `#686560` |
| Admin platform | Charcoal `#393E41` |

- These are working directions, not frozen tokens. Adjust luminance or saturation after seeing them on a real CR80 surface, and explain every change.
- Establish one design grammar first. The six must unmistakably be one PINTAR family.
- **Facts to start from** (measured by the coordinator, WCAG contrast ratio):

| Card | White `#FFFFFF` | Warm white `#FBFAF7` | Ink `#1F2A33` |
|---|---|---|---|
| Murid | 2.85 | 2.73 | 5.12 |
| Guru | 3.63 | 3.48 | 4.03 |
| Kepala departemen | 4.42 | 4.24 | 3.30 |
| Dekan | 7.02 | 6.73 | 2.08 |
| Admin sekolah | 5.80 | 5.56 | 2.52 |
| Admin platform | 10.83 | 10.37 | 1.35 |

- **What the table means:**
  - Light text reaches 4.5:1 only on Dekan, Admin sekolah and Admin platform.
  - Murid needs dark text.
  - Guru and Kepala departemen sit in the middle, where neither light nor dark text reaches 4.5:1 comfortably.
- **The rank-ladder risk.** Lightness runs roughly from Murid (lightest) to Admin platform (darkest), nearly the order of seniority. A lineup can therefore read as a rank ladder, which D-059(d) forbids.
  - Explore at least one variant where all six share a similar lightness and differ only by hue, so one text colour works on every card and no card looks "higher".
  - Show Yazid's HEX and your variant side by side.
- **The Murid card is exploration only.** In 4.0 students keep the class card and see no PINTAR-ID screens (C17). Student cards by level (SD, SMP, SMA/SMK, Universitas) come later (D-059).
- **Not in this round:** D-059's other families (Dosen, Kepala Sekolah, Rektor, Tim PINTAR, Founder).

**3. Typography study**
- Propose the typography; don't inherit it blindly. Start from PINTAR's own typefaces (Plus Jakarta Sans, IBM Plex Mono) and depart only with a stated reason.
- Any typeface must be licensed for print and embedding (for example SIL OFL).
- For each style, show:
  - typeface;
  - weight;
  - size in pt at actual size;
  - line height and letter spacing where relevant;
  - text colour;
  - hierarchy.
- At minimum, styles for:
  - person name;
  - role;
  - school;
  - PINTAR ID;
  - PINTAR branding;
  - the QR instruction;
  - small supporting text.
- Keep it to a small, disciplined system with few weights and sizes. Name the smallest size you would print, and why.
- It must stay legible printed at credit-card size. Don't choose a typeface because it looks fashionable enlarged on screen.
- **The PINTAR ID's typeface** must keep look-alike characters apart at card size: 0/D, 1/7, 2/Z, 5/S, 8/B. (I, L, O and U never occur in an ID.)
- **Role names** are Terminology v1's: Murid, Guru, Kepala departemen, Dekan, Admin sekolah, Admin platform. If the card wants a different casing, propose it; do not change the word.

**4. Contrast and text colour**
- Propose a text colour for each surface. Don't default to pure white: explore softened white, warm white, near-black or another restrained neutral.
- **Targets:** small text at least 4.5:1; large text (14 pt bold or 18 pt and above) at least 3:1.
- Measure every pair and record it in a table, as the email frame's README does.
- Printing lowers contrast, so leave margin. Accessibility and real-world printing come before aesthetic subtlety.

**5. Information: realistic fictional samples only**
- **Every card shows:** PINTAR, the person's name, current role, current school, the PINTAR ID in its display form, and the QR.
- **Fictional people and schools only.** Never SD Zayd or SMA Zayd, which are real schools.
- **Stress cases:**
  - a four-word name;
  - a single-word name;
  - a name with an apostrophe;
  - a long school name.
- **Admin platform has no school.** Show how the school line reads when there is none, and raise the wording. Do not invent an affiliation.
- **A person with two roles** (for example Guru and Kepala departemen): show the question, but do not settle which card they get. It goes to Yazid.

**6. The PINTAR QR as a visual signature**
- **What the QR does** (IDENTITY-4.0 §5):
  - It holds only the public link `https://<origin>/id/<PINTAR ID>`.
  - That page looks the same for every ID and reveals nothing. It offers «Masuk ke PINTAR» and recovery with the PIN.
  - So **the QR does not verify the card or the person.** Nothing on the card may say or imply it does: no "verify", "authentic" or "scan to check".
  - The instruction line says what the QR really does (for example, that it leads to signing in to PINTAR), in Terminology v1 words. Propose the wording; don't decide it.
- **The sample QR in every mock-up** encodes `https://contoh.pintar.invalid/id/A14CD7ST`. That domain can never exist, and the link is the same length as the real one, so module size stays realistic. Never encode a real person or a working PINTAR address.
- **PINTAR Green** is the approved primary, `#245F55` (`--pintar-primary`).
  - The QR looks the same on all six cards: PINTAR-green modules on a light panel. The card colour changes; the QR does not.
  - Green printed straight onto the card colours measures 1.05–2.59:1, which won't scan. On white it measures 7.39:1.
  - No inverted QR (light modules on dark).
- **The idea to explore:** "I see that QR and I know it is PINTAR." Restrained branding in or around the QR is welcome only while scanning stays reliable.

**7. QR technical principle: scan reliability first, brand recognition second, decoration never**
- Don't distort the QR to make it attractive. If a branded treatment reduces reliable scanning, simplify it.
- **For each variant, report:**
  - QR version;
  - error-correction level;
  - module size in mm;
  - total size including the quiet zone (at least 4 modules).
- **Target** modules of at least 0.4 mm at actual size, unless tests show otherwise.
- **A centre mark** needs higher error correction and a larger QR. Show that trade-off.
- **Decode test.** Decode every variant with a software QR decoder:
  - from the actual-size render at 300 dpi;
  - again after a stress pass: downscaled, blurred, slightly angled, at lower contrast.

  Report pass or fail for each.
- **Later tests** of the production design: real CR80 printing, office printers, different phone cameras, imperfect lighting, angled scanning, screen display. The physical phone tests happen on Yazid's printed sheet.

**8. Front and back**
- Explore the hierarchy; don't assume everything belongs on the front.
- The front should be immediately recognisable and calm. The back may carry the QR and secondary information if that makes a stronger front.
- Avoid the look of a corporate access badge, a bank card, a government ID card or a collectible. It should feel like a PINTAR identity someone wants to keep.

**9. Visual character**
- **Target:** calm, modern, sophisticated, trustworthy, restrained, recognisably PINTAR.
- **Avoid:**
  - gradients used only as decoration;
  - excessive borders;
  - glass effects;
  - metallic or gold hierarchy;
  - badges;
  - ornamental patterns;
  - unnecessary icons;
  - fake security features;
  - visual noise.
- Use typography, proportion, negative space and colour deliberately.

**10. Deliverables (round 1)**
- **A.** The six fronts together: Yazid's colours and your equal-lightness variant.
- **B.** One card, front and back, in detail.
- **C.** The typography specification: typefaces, sizes in pt, weights, spacing and colours.
- **D.** The QR study: two or three restrained approaches using the same sample QR, each with its version, error-correction level, module size and decode results.
- **E.** The actual-size test: the A4 PDF at 100% with crop marks.
- **F.** The card in its 4.0 context: the email frame at 600 and 320 px, light and dark, and a phone screen.
- **G.** Your recommendation: the strongest direction, and why.
- **H.** The README: every choice with its reason, including colour adjustments and the measured contrast; plus the render script.

**Method.** Establish one design grammar before styling any card; do not create six independently styled cards. Design → render → look → revise → render again.

**The review question.** If six PINTAR cards were lying on a table with their logos partly covered, would they still look like one distinctive PINTAR family, with none looking more important than another?

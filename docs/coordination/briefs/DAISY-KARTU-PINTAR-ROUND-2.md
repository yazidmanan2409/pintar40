# DAISY — PINTAR ID CARD: ROUND 2 REFINEMENT

**The brief as sent to Daisy by Yazid, 30 Sep 2026** (drafted by Yazid, revised by the coordinator). Decision: D-072. Direction image: `briefs/assets/kartu-pintar-ronde-2-arah-yazid.webp`.

---

**Authority and purpose**
- Yazid has reviewed the Round 1 exploration (`c07841c`) and chosen a revised visual direction to refine.
- **The direction:** `docs/coordination/briefs/assets/kartu-pintar-ronde-2-arah-yazid.webp`, on the coordinator's branch. Treat it as a direction, not a specification. Its values are approximate; the phone and email chrome are only context.
- **Release (D-072):** this design-only refinement alone. The Gate 2E pause stays in force for everything else: DAISY-19's wiring, DAISY-20 and every code ticket.
- **No implementation:** no application code, no `hle.ts` keys, no migrations, no production wiring, no unrelated UI work, no CI.
- **Where to work:** `docs/coordination/ux/kartu-pintar/ronde-2/` on your lane. Leave Round 1's files as they are, for comparison, and commit only that folder.
- **Hand-off first line:** `READY FOR REVIEW: kartu-pintar round 2 on <sha>`. The Second Eye reviews, then Yazid.
- **What Yazid has already decided** from your Round 1 questions:
  - the equal-lightness direction;
  - Admin platform has no second line;
  - the PINTAR tile treatment for the QR;
  - Bahasa Indonesia only.

  Your QR instruction, «Pindai untuk membuka halaman masuk PINTAR.», stays unless you propose better; the wording is Yazid's decision.

**The PINTAR Recognition Principle.** PINTAR should be recognisable before it is read. If several unrelated cards lie on a table, someone familiar with PINTAR should eventually be able to pick out the PINTAR card without first reading its name. Recognition must come from consistent visual grammar, not oversized branding, ornament or decorative effects.

**Fixed inputs, carried over from Round 1**
- **The card rules:** IDENTITY-4.0 §4, §5 and §11; D-059; C17; Terminology v1 (D-068).
- **Samples:** invented people and schools only; never SD Zayd or SMA Zayd.
- **The sample QR** encodes only `https://contoh.pintar.invalid/id/A14CD7ST`.
- **Colour** identifies family and context only. It never represents permission, authority, prestige or rank.
- **The Murid card is exploration only (C17).** D-059's other families are out of scope.
- **Role names:** Murid, Guru, Kepala departemen, Dekan, Admin sekolah, Admin platform.

**1. The direction**
- **Card grammar:** a warm-white upper field; a thin warm-gold horizontal signature line; a deep muted family-colour lower field.
- **Front, top to bottom:**
  1. PINTAR SELALU
  2. the person's name
  3. the PINTAR ID
  4. the warm-gold line
  5. the current role
  6. the current school
- **Back, top to bottom:**
  1. the PINTAR QR tile: **PINTAR-green squares on a light, soft-green tile, never a green-filled tile**
  2. the PINTAR ID with the QR
  3. the same warm-gold line, in the same structural position as on the front
  4. the QR instruction
  5. `pintarselalu.com`
- Don't redesign this into another concept. Refine proportions, typography, spacing, optical balance, colours and physical behaviour.

**2. «PINTAR SELALU» as type, not the logo**
- Don't use the stacked block PINTAR SELALU logo on the card. Set «PINTAR SELALU» in type.
- Propose its typeface, weight, size, tracking, colour and placement, starting from the approved PINTAR typography.
- Don't redesign the corporate logo. This is an interim treatment for this artifact; the brand mark is reconsidered separately.
- The card itself, not a large logo, carries the PINTAR identity.
- **Name consistency.** The app and emails call the product «PINTAR», including the back's own instruction «…halaman masuk PINTAR.».
  - Show the front header and the back instruction side by side, and say whether they read as one name.
  - Flag it if they don't. Don't change either.

**3. The warm-gold signature line**
- **Its purpose** is recognition and structural continuity, not decoration, luxury, prestige, rank or a "gold membership" signal.
- It is identical on every card family, sits in the same structural position on front and back, and is independent of role.
- **Widths.** At actual CR80 size, compare at least 0.50, 0.75 and 1.00 mm, and recommend one.
- **Colour.** Propose the warm-gold (ochre) colour. It's a new colour, so record it as a candidate, not a frozen token.
- **No** metallic effect, foil simulation, gradient or luxury-card styling.
- **Test it:**
  - in colour, in greyscale, and in ordinary office print;
  - against warm white and against each family colour;
  - at screen sizes too: on the 320 px email the card is about 266 px wide, so a 0.5 mm line is about 1.5 px. Say whether it survives.
- **The response to aim for** is "that looks like PINTAR", not "that card has a gold stripe".

**4. Family colours**
- **Baseline:** your Round 1 equal-lightness set: Murid `#436478`, Guru `#466754`, Kepala departemen `#406766`, Dekan `#51607D`, Admin sekolah `#695E53`, Admin platform `#5B6167`. These are refinement values, not frozen tokens.
- **Required change: separate the two near-identical pairs.** Measured in OKLab (perceptual distance):
  - Murid and Dekan are 0.024 apart, and Guru and Kepala departemen 0.029. That is about the smallest difference most people can see, even with normal colour vision.
  - Yazid's original colours never came closer than 0.056.
  - Spread the hues at the same lightness until every pair is at least 0.056 apart.
  - Report all 15 pairwise distances, plus a simulation of red-green colour blindness (deuteranopia).
- Other small changes are allowed only for contrast, print behaviour or visual balance. Document each one.
- No card may look like the "premium", "executive" or more important edition.

**5. Front**
- **The upper warm-white field** carries the stable identity: PINTAR SELALU, the name, the PINTAR ID.
- **The lower family-colour field** carries the current chapter: the current role and the current school.
- Keep generous negative space.
- **Don't add:**
  - icons, badges or photos;
  - validity dates;
  - email address, PIN, password or date of birth;
  - signatures or "official" labels;
  - security claims, ornamental patterns, or fake holograms and security devices.
- **Round 1's stress cases still apply.** Never solve a difficult name by shrinking the type until it is uncomfortable at card size.

**6. Back**
- Use the front's grammar without simply copying it.
- Round 1's back was clean but less distinctive than the front. Refine its optical balance and recognisability with the smallest intervention possible. No decoration, and no repeated branding.
- **Recognition test:** with the PINTAR name hidden, does the back still begin to feel like PINTAR?

**7. The PINTAR QR**
- **Keep the tile treatment:** PINTAR Green `#245F55` squares on a light tile; consistent geometry; a quiet zone of at least 4 modules inside the tile; the PINTAR ID with it.
- No inverted QR, and no logo inside the QR matrix.
- **Scan reliability first. Brand recognition second. Decoration never.**
- **Keep Round 1's decode and stress method:** two decoders, 300 dpi from the PDF, then downscaled, blurred, tilted and faded, with graded limits for the refined layout.
- `/id/<PINTAR ID>` is the way into PINTAR's sign-in and recovery. It is not public verification of the person. Never use "verify", "authentic" or "scan to check".

**8. Typography**
- Keep Round 1's restrained direction: Plus Jakarta Sans and IBM Plex Mono unless you find a justified reason to depart. Keep Plex Mono under examination for the PINTAR ID (0/D, 1/7, 2/Z, 5/S, 8/B).
- **Styles to refine:**
  - PINTAR SELALU;
  - name;
  - PINTAR ID;
  - role;
  - school;
  - QR instruction;
  - URL.
- **For each final candidate, record:** typeface, size in pt, weight, line height, tracking and colour.
- Legibility at physical size matters more than how it looks enlarged on screen.

**9. Admin platform**
- The card reads «Admin platform» with no second line (Yazid's decision).
- Don't add «Platform PINTAR», «PINTAR HQ», «Semua sekolah» or anything else to fill the space. Empty space is fine; never invent data to satisfy a layout.

**10. Several roles: still a product question**
- **Current direction:** one person → one PINTAR ID → one card, listing the current roles (for example «Guru · Kepala departemen»). This is not a new ruling.
- **The colour of such a card is undecided.**
  - PINTAR's existing way of picking one role, the role shown as a person's main role, always takes the most senior one. It must not decide the card's colour.
  - Show the multi-role card with each option the Second Eye names for Yazid, each labelled "undecided". For example: the colour of the role held longest; or one shared neutral colour for any card with several roles.
  - Also show the order the roles are listed in, and say which rule sets it.
- **Add one stress case:** a person with roles at two different schools. Show how the school line reads. Don't settle it.
- Don't redesign the identity architecture.

**11. The recognition test (new)**
- **Show the six refined cards three ways:**
  1. normally;
  2. with «PINTAR SELALU» covered;
  3. among several neutral, non-PINTAR sample cards.
- The neutral cards must be your own plain, invented designs, with no real brands, banks or institutions. Don't make them ugly to help PINTAR win.
- **Ask:**
  - Which cards belong to the same family?
  - Can PINTAR be recognised before the name is read?

**12. Physical and context proof: same discipline as Round 1**
- CR80, 85.60 × 53.98 mm, with the 3.18 mm corners, safe area and bleed.
- The A4 PDF at 100%:
  - with crop marks and "print at 100%, no fit-to-page";
  - fronts, backs, and a front/back pair to cut and fold.
- The email frame at 600 px and 320 px, light and dark.
- Phone width.
- A greyscale print test.
- Contrast measurements.
- QR decode and stress results.
- Yazid will judge the printed card by hand.

**13. Future certificates**
- Don't design the certificate; the existing certificate sheet stays untouched.
- Do document which elements of this card language could become reusable PINTAR signatures:
  - the warm-white base;
  - disciplined typography;
  - the warm-gold structural line;
  - muted context colours;
  - the PINTAR-green QR treatment;
  - negative-space discipline.
- The certificate will explore these later on its own terms. It must not become an enlarged ID card.
- **Its future test:** put several certificates on a wall. From a distance, before reading the logo, can someone familiar with PINTAR tell which one is PINTAR's?

**14. Deliverables**
- **A.** The final-candidate family of six fronts, in the separated equal-lightness colours.
- **B.** The Guru card, front and back, in detail.
- **C.** The gold-line study: 0.50, 0.75 and 1.00 mm at actual size, in colour, greyscale and office print, with your recommendation.
- **D.** The typography specification, including the «PINTAR SELALU» treatment.
- **E.** The refined QR tile, with decode and stress evidence.
- **F.** The stress cases:
  - long name, one-word name, apostrophe, long school;
  - Admin platform;
  - several roles, with the colour options labelled undecided;
  - roles at two schools.
- **G.** The recognition test.
- **H.** The context renders: email at 600 and 320 px in light and dark, and phone.
- **I.** The actual-size A4 print proof.
- **J.** The README: every decision, measurement, contrast result, colour distance, QR result and open product question.
- **K.** Your recommendation: what could be frozen for DAISY-24, and what still needs Yazid. Freezing is Yazid's decision.

**15. Second Eye review.** Round 2 will be reviewed for:
- D-059 and identity meaning;
- terminology;
- accessibility and contrast;
- the QR's meaning and robustness;
- any implied hierarchy;
- any invented information;
- whether a real CR80 card is viable;
- the design spec.

Above all, the review asks whether any recommendation is really a new product decision for Yazid. Aesthetic refinement must not quietly create new identity behaviour.

**The standard.** Not "this is a beautiful card", but: "I see a bunch of cards on a table, and I know which one is PINTAR."

Refine. Prove. Recommend. Do not implement.

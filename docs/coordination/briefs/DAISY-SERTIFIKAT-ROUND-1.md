# DAISY — PINTAR CERTIFICATE: DESIGN EXPLORATION, ROUND 1

**The brief as sent to Daisy by Yazid, 30 Sep 2026** (drafted by Yazid, revised by the coordinator). Decision: D-073.

---

**Release and scope**
- **Release (D-073):** Yazid authorises one design-only certificate exploration. It releases no other Daisy work and leaves the engineering and gate order unchanged.
- **Timing:** start after you hand off the PINTAR ID Round 2 (D-072), and carry Round 2's refined colours and gold line forward. The ID direction is not frozen; if Yazid changes it, the certificate follows.
- **Design and render only.** Do not modify:
  - certificate application code;
  - the certificate database model;
  - issuance rules;
  - verification behaviour;
  - migrations;
  - production data;
  - `hle.ts`;
  - CI;
  - unrelated UI.
- **Where to work:** `docs/coordination/ux/sertifikat/` on your lane. Commit only that folder.
- **Hand-off first line:** `READY FOR REVIEW: sertifikat round 1 on <sha>`. The Second Eye reviews, then Yazid.
- **The existing certificate** shows what PINTAR supports today. This exploration decides what a PINTAR certificate should look and feel like.

**1. Objective: the PINTAR Recognition Principle (D-072)**
- **The test:** put several certificates on a wall and stand several metres away. Without reading logos or words, which one is PINTAR's? Someone familiar with PINTAR should eventually recognise it from its visual grammar, not because the name is enormous. Think of a car's light signature: recognition comes from consistent form, not a bigger badge.
- **It should feel:** formal, contemporary, calm, credible, restrained, distinctly PINTAR.
- **It must not feel like:**
  - ceremony for its own sake;
  - a corporate-award template;
  - school clip-art;
  - a luxury certificate;
  - a gamification reward;
  - an oversized ID card.

**2. Relationship to the PINTAR ID**
- **Explore inheriting** the emerging artifact language:
  - a warm-white, paper-led base;
  - disciplined typography;
  - generous negative space;
  - the thin warm-gold structural signature;
  - a deep muted accent;
  - the PINTAR-green QR treatment;
  - restrained «PINTAR SELALU».
- **Do not enlarge the ID card to A4.**
  - The ID answers: *who is this person now?*
  - The certificate answers: *what did this person achieve, at that point in time?*
  - They should feel related without looking identical.

**3. Format and output**
- **A4 first**, designed at actual size and judged at 100%. Also render reduced-size views for the distance test.
- **It must work as:**
  1. an on-screen certificate;
  2. a PDF;
  3. a printed certificate.

  All three use one canonical design and one set of information. No separate "digital" and "print" designs.
- **How the PDF is made today:** there is one action, «Cetak atau simpan PDF», which uses the browser's own print dialog on the same rendered sheet. There is deliberately no server-made PDF, so the certificate is only ever put together in one place.
- **In deliverable M, show the action both ways:**
  - (i) the current single action;
  - (ii) separate «Unduh PDF» and «Cetak».

  Note that (ii) needs a server-generated PDF, an architecture decision for Yazid. Don't choose.

**4. Base visual direction**
- Predominantly white or warm white. The accent is an accent, not the certificate: roughly 90%+ neutral paper. Find the actual proportion through design.
- No decorative backgrounds, gradients, ornamental borders or unnecessary visual furniture.

**5. Accent colours: by the certificate's learning context, never by role**
- **What a certificate records:** the course it was earned on. That course's learning context (Akademik or Pengembangan profesi) is sealed and cannot change. It does not record the holder's role.
- **So design two contexts:**
  - an **academic** certificate (a Murid's), starting from the Murid family colour;
  - a **professional-learning** certificate (a Guru's), starting from the Guru family colour.
- **The colour mapping is Yazid's decision.** Show it; don't settle it.
- **Kepala departemen, Dekan, Admin sekolah and Admin platform colours don't apply to certificates.** A Dekan who completes professional learning receives a professional-learning certificate, not a "Dekan certificate".
- **The certificate must never imply** that a higher role means a better certificate, a darker colour more prestige, or leadership a premium credential.
- One grammar for both contexts. Do not create independently designed templates.

**6. Historical state**
- An issued certificate is historical evidence. It must not change because anything about the person changes later.
- **Today:**
  - the name is fixed at issuance (a snapshot the certificate keeps);
  - the course, and therefore its context, is fixed in the signed record.
- **So an accent that follows the context is already historical.** Anything keyed to the person's later state would not be.
- Don't implement anything. If a proposal would need data the certificate doesn't record, say so in the README rather than assuming it.

**7. The warm-gold signature**
- Carry the ID's warm-gold line into the certificate. Don't just draw a horizontal line across it because the card has one.
- **Explore** how the same signature becomes characteristic of an A4 document:
  - a single characteristic rule;
  - a controlled meeting with the accent;
  - a recurring edge or alignment;
  - another restrained geometric reading.

  You own the composition.
- **The aim:** people eventually see the treatment and think PINTAR, not "gold certificate".
- **No** metallic effect, foil simulation, prestige hierarchy or ornamental gold frame.

**8. «PINTAR SELALU»**
- **Type, not the old stacked block logo.** Propose its size, weight, tracking, placement and colour. Don't redesign the corporate logo.
- **The issuer is the school («Diterbitkan oleh»).** PINTAR SELALU is the platform. It must never read as the issuer, a co-issuer or a signatory.
- The certificate must stay recognisable with «PINTAR SELALU» covered.

**9. Information hierarchy**
- **What the current sheet carries:**
  - the issuing school;
  - «Sertifikat Penguasaan»;
  - the recipient's name;
  - «telah menuntaskan»;
  - the course title;
  - «Predikat» (Sangat Baik, Baik or Cukup);
  - «Tanggal terbit»;
  - «Nomor sertifikat», in the format `PINTAR/<KODE-SEKOLAH>/<TAHUN>/<00001>`;
  - the QR, with «Periksa keaslian», its explanation, and the web link printed as text.
- **Deliberately absent:** score, signature, photo, school logo.
- **Don't silently add fields.**
- **First reading:** recipient → achievement → issuing school → evidence and verification. Not: logo → decoration → number → recipient.
- The name and the achievement are the emotional and informational centre.
- **Wording:** start from the existing copy above. Propose any change as a proposal only; copy changes come in UI/UX POLISHED under Terminology v1.

**10. Typography**
- Start from Plus Jakarta Sans, and IBM Plex Mono for identifiers (the number, the link). Depart only with a documented reason and a print and embedding licence.
- **Specify** typeface, size in pt, weight, line height, tracking and colour for:
  - PINTAR SELALU;
  - the heading;
  - the name;
  - the course title;
  - «telah menuntaskan»;
  - the school;
  - predikat;
  - number;
  - date;
  - the verification text;
  - the printed link;
  - small supporting text.
- It must survive ordinary A4 printing: no very light weights, and no contrast so subtle it disappears on a cheap printer.
- **Stress cases:**
  - a long name;
  - a long course title;
  - a long school name.

**11. The certificate QR: it verifies, unlike the ID's**
- **What it does:** it opens `/verifikasi/<code>`. That page confirms the certificate was genuinely issued and says whether it is still valid or revoked. It shows the result, predikat, issuing school and date.
- **What it never shows:** the name or a photo. That's enforced in the database; the page itself says «Nama pemegang tertera pada sertifikatnya».
- **So the wording may say** the code checks that the certificate is genuine and still valid. It must never claim the page confirms who the person is.
- **Colour:** PINTAR Green `#245F55` squares on a light ground, with a quiet zone of at least 4 modules. Never inverted, and no logo in the matrix.
- **Sample:** encode `https://contoh.pintar.invalid/verifikasi/` followed by an invented 43-character code (the real code's length). The real link is about 80 characters, so this QR will be denser than the card's. Size the modules for that.
- **Hierarchy:** important evidence, visually quiet. Scan reliability comes before decoration.
- **Decode tests:** Round 1's method: two decoders, 300 dpi from the PDF, then downscaled, blurred, tilted and faded.

**12. Photo: exploration, not a ruling**
- **Show:**
  - Version A, without a photo;
  - Version B, with a restrained photo area.
- **For B, use a clearly labelled neutral placeholder («FOTO — CONTOH»).** Not a real person, a stock photo or a generated face.
- **Context for Yazid:** most certificate holders are children. A photo on a printed or shared certificate is personal data of a minor.
- The question for Yazid to answer visually: does a photo strengthen identity and credibility, or make the certificate look like an oversized ID card?
- Don't implement photo support.

**13. School logo: exploration, not a claim**
- There is no approved school logo in PINTAR. The current certificate deliberately shows no placeholder.
- **One study only:** you may show a neutral area labelled «LOGO SEKOLAH — CONTOH», marked as hypothetical. Never invent or copy a logo.
- **Also show** the same certificate without a logo. The canonical design must be complete and credible without one.

**14. Classic / Modern / Minimal**
- **Today:** Studio lets a school pick CLASSIC, MODERN or MINIMAL, but only one sheet is ever drawn.
- **Don't keep three because the option exists.** Explore three credible compositions:
  - **Classic:** formal and institutional, yet PINTAR.
  - **Modern:** editorial, using the artifact language more strongly.
  - **Minimal:** highly restrained, typography-led.
- **All three share** the same information, the same evidence and QR meaning, the same accessibility standard and the same PINTAR DNA.
- **Recommend:** all three add value, only two do, or PINTAR should ship one excellent certificate.

**15. Recognition study (required)**
- **For each serious candidate, a reduced-size recognition board showing:**
  1. the normal certificate;
  2. «PINTAR SELALU» covered;
  3. greyscale;
  4. reduced until body text can't be read.
- **Include neutral non-PINTAR certificates** of your own invention: no real institutions or brands, and not made ugly to help PINTAR win.
- **Ask:** does this still look like PINTAR?
- **Recognition should come from:**
  - composition and proportion;
  - typography;
  - the warm-gold signature and the accent;
  - negative space;
  - the QR treatment.
- If it becomes anonymous once the name is hidden, the grammar isn't strong enough yet.

**16. Print reality**
- An A4 PDF marked «Cetak 100% / Ukuran sebenarnya».
- **Test or simulate:**
  - a colour office printer;
  - monochrome;
  - reduced printer contrast;
  - ordinary white paper;
  - **A4 printed on F4 paper (215 × 330 mm) at 100%**, which many Indonesian schools use;
  - PDF viewing;
  - screen preview.
- It must remain credible from an ordinary school printer. Colour enriches it; colour must not be needed to understand it.

**17. No credential theatre**
- **Nothing added just because certificates traditionally have it:**
  - ornate borders;
  - fake embossed seals;
  - medallions, ribbons or laurels;
  - fake signatures or stamps;
  - crests;
  - decorative watermarks;
  - gradients or glass effects;
  - guilloché;
  - "official" badges.
- PINTAR doesn't need to imitate an 1897 diploma to look credible 😂. Credibility comes from composition, typography, evidence and restraint.

**18. Deliverables**
- **A.** Three directions: Classic, Modern, Minimal.
- **B.** Your recommended direction, and why.
- **C.** Academic and professional-learning variants: the same grammar with different accents, the mapping labelled "for Yazid".
- **D.** Without and with a photo (placeholder).
- **E.** Without and with a logo (labelled placeholder).
- **F.** The typography specification.
- **G.** The accent and warm-gold specification.
- **H.** The certificate QR treatment, with dimensions and decode evidence.
- **I.** The recognition board, including covered-name and reduced-size tests.
- **J.** The A4 PDF at actual size.
- **K.** The greyscale and ordinary-printer proof, including A4 on F4.
- **L.** The screen preview.
- **M.** The action concept, both ways (§3), with only enough surrounding PINTAR UI to show it.
- **N.** The README: every decision, assumption, open product question, and any conflict with the current implementation.

**19. Second Eye review.** The Second Eye reviews the package for:
- fit with the existing certificate architecture;
- certificate meaning and the preservation of historical evidence;
- current verification behaviour;
- terminology;
- accessibility;
- print viability;
- QR robustness;
- fit with the ID-card language;
- no invented institutional claims;
- no hierarchy carried by colour;
- whether any proposal is really a new product decision.

**Decisions to put to Yazid:**
1. photo or no photo;
2. school logo support or none;
3. one design or several layouts;
4. the final visual signature;
5. the accent mapping to learning context;
6. a single print/save action or a separate server-made PDF.

Design exploration must not quietly change what a certificate means.

**The review question.** Not "is this certificate beautiful?", but: "If it hung among ten others, would I know which one is PINTAR before I read the logo?"

Design → render → print → look from a distance → cover the name → revise → recommend. Do not implement.

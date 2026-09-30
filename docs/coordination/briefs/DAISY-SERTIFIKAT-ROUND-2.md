# DAISY — PINTAR CERTIFICATE: ROUND 2 REFINEMENT

**The brief as sent to Daisy by Yazid, 30 Sep 2026,** with his reference image (a revised Modern composition, not committed). Drafted by Yazid after his review of Round 1 (`dd292f6`) and revised by the coordinator. Decision: D-076.

---

**Authority and scope**
- Yazid has reviewed Round 1 (`dd292f6`) and selected a revised Modern composition. His reference image comes with this message.
  - Treat it as the direction. Its values, spacing and sample text are approximate.
  - **Refine this composition; don't redesign it.** This is a refinement round, not another exploration.
- **Design only:** no application code, no `hle.ts` keys, no migrations, no CI.
- **Where to work:** `docs/coordination/ux/sertifikat/ronde-2/` on your lane. Leave Round 1's files as they are, for comparison.
- **Order:** this round follows your DAISY-19 wiring hand-off. BOB-25's interface is published at `2bcbed8`.
- **Hand-off first line:** `READY FOR REVIEW: sertifikat round 2 on <sha>`. The Second Eye reviews, then Yazid.
- **Samples:**
  - invented people and schools only; never SD Zayd or SMA Zayd;
  - use the card's sample PINTAR ID `A14CD7ST`, so that the card and certificate samples agree.

**Decided by Yazid (don't reopen)**
- **Structure:** Achievement → Issuer → Verification.
- **Keep:**
  - «SERTIFIKAT PENGUASAAN» upper-left;
  - «PINTAR SELALU» upper-right, set in type (D-074), not the logo;
  - the recipient's name as the dominant element;
  - the course directly under the completion statement;
  - Predikat, Tanggal terbit and Nomor sertifikat as one restrained record block;
  - the warm-gold line;
  - the issuer band with «Diterbitkan oleh» and the school;
  - a quiet verification area at the foot, with the QR in generous clear space.
- **Refine** typography, alignment, spacing and proportion. Don't add anything to fill empty space.
- **Nothing added:**
  - no photo, school logo, signature or signature line;
  - no seal or crest, ornamental border, watermark or flourish;
  - no celebratory or gamified graphic.

  The QR, the number and the verification record are the proof. Don't imitate traditional certificate decoration.

**Correct in the reference** (mock-up slips, not direction):
- «DI TERBITKAN OLEH» → «Diterbitkan oleh»: one word, as in `verifikasi.institusi`.
- «Matematika . Bab 4» → «Matematika · Bab 4»: the middle dot the app uses.
- The number and link placeholders → the proposals in 1 and 2.

**1. Certificate number: a proposal to design; Bob confirms the contract**
- **The proposal:** the holder's PINTAR ID, a slash, then that person's certificate sequence: `A14CD7ST/00001`, then `/00002`, `/00003`.
  - The PINTAR ID identifies the person. The suffix identifies that person's certificate sequence.
  - A number is never changed or reused. A revoked or superseded certificate keeps its number, and gaps are allowed.
  - Nothing mutable enters the number: no school, year or course.
- **Already confirmed by the coordinator,** so the design can rely on it:
  - The PINTAR ID is globally unique: a unique index.
  - It can never change or be reused: the database refuses it (`PINTAR_ID_IMMUTABLE`).
  - Persons are never deleted.
  - It is not a secret (IDENTITY-4.0 §4).
- **The number is a label, never a key.** The public verification page never looks a certificate up by its number.
- **Design questions for you:**
  - Show the ID unbroken (`A14CD7ST/00001`) or in its 4+4 display form (`A14C D7ST/00001`)? Test reading, dictating and typing, and recommend one.
  - The typeface: IBM Plex Mono as on the card (0/D, 1/7, 2/Z, 5/S, 8/B), checked at certificate size.
- **Not yours to settle in the design:**
  - the per-person sequence and its concurrency;
  - the change to the signed record;
  - whether a student's academic certificate may show their PINTAR ID (in 4.0, students see no PINTAR-ID screens, C17).

  These stay with the Second Eye, Bob and Yazid.

**2. Verification link: a proposal to design; Bob confirms the route and token**
- **The proposed form:** `https://verifikasi.pintarselalu.com/<token>`.
  - Printed without the protocol: `verifikasi.pintarselalu.com/<token>`.
  - The QR holds the full HTTPS URL.
- **The token is opaque and random.** It is never derived from the PINTAR ID, the number or any sequence. The number (1) and the token are separate things.
- **Token length is a security floor, not a layout choice.**
  - The token is the only thing protecting the public record from guessing.
  - A 6-character token such as `K7M4QX` (about 30 bits) is too short to be safe.
  - Design for 12 Crockford Base32 characters (60 bits), for example `K7M4QX9P2HDT`, and show a 16-character stress case.
  - Bob sets the final length.
- **QR tests:**
  - At 12 characters the full URL is 48 characters. Report the QR version and error-correction level in byte mode, and in uppercase alphanumeric mode (`HTTPS://VERIFIKASI.PINTARSELALU.COM/K7M4QX9P2HDT`), which may fit a smaller version. Say which is smaller; Bob confirms whether the route accepts uppercase.
  - Round 1's 83-character link needed version 5-M. Compare module size and scan margin.
  - Keep Round 1's decode and stress method.
- **The printed link** shows the token in one piece. Grouping (`K7M4-QX9P-2HDT`) only if typing the groups also works; mark it as depending on Bob's route.
- **Validate the benefits:**
  - a cleaner sheet;
  - a shorter payload and a less dense QR;
  - easier scanning;
  - a PINTAR-owned destination;
  - practical manual typing.
- **Out of scope:**
  - the verification page itself;
  - the domain and DNS set-up, which is a production change needing Yazid's approval (D-039).

**3. «telah menuntaskan»: review the wording**
- **The facts:**
  - A certificate is issued only when an official result on a formal assessment (the Uji Penguasaan) reaches that course's pass mark (`certificate_eligibility`).
  - So it proves the mastery standard was met, not that the course was finished.
- **Where the wording stands:**
  - «telah menuntaskan» is the app's current, approved copy (`hle.ts`).
  - Terminology v1 (D-068) does not settle the verb.
  - «Sertifikat Penguasaan» and «Uji Penguasaan» share their noun.
- **What to do:**
  - Compare «telah menuntaskan», «telah menyelesaikan» and any other candidate against what the certificate proves.
  - Don't change the word because another sounds nicer.
  - Recommend one, with reasons. The same verb must also work on a professional-learning certificate. Yazid decides.

**4. Accent**
- **Keep testing:** academic → plum `#725471`; professional learning → sage `#446A4B`.
- Test the whole certificate grammar in print first. Don't strengthen sage to make it louder.
- The band identifies the context; it is never the only carrier of meaning. The course title says what was learned.

**5. Gold line**
- The shared structural signature with the card.
- Its width follows the card's physical proof. Don't freeze it.

**6. Printing**
- **One action:** «Cetak atau simpan PDF». No server-side PDF.
- **Specify and prove the fix for today's print,** so it gives one clean A4 page:
  - the on-screen card no longer printed ahead of the sheet;
  - no second page;
  - colours kept;
  - the page size and margins set.
  - Say plainly what the page can and cannot control of the browser's own date, title, address and page numbers.
- **Prove it** with your Round 1 harness (the real component and stylesheet, in Chromium): PDFs before and after.
- **Write the exact change as a proposal** in your folder. It lands in the certificate implementation ticket once Yazid opens it, not in `src/` this round.

**7. Round 1's findings: not yours to fix here**
- **These go to the Second Eye for classification,** and to Bob where an engineering invariant is involved:
  - the course-name fallback;
  - the live school name;
  - «Perlu Pendampingan» on a certificate;
  - the Studio layout choice that does nothing;
  - the language following the viewer;
  - the token and QR capacity.
- **Yazid's principle:** a historical certificate must never silently change meaning because the application's current state has changed.
- **In the design:** show the certificate as issued, with the course and the school as they were at issuance. The renders stay in Bahasa Indonesia.

**Deliverables**
- **A.** The refined certificate in normal colour.
- **B.** The academic (plum) and professional-learning (sage) variants.
- **C.** Stress cases:
  - a long name;
  - a long course title;
  - a long school name;
  - the number;
  - a 16-character token.
- **D.** Greyscale and simulated office print.
- **E.** The A4 PDF at 100%: one page per certificate, marked "print at 100%, no fit-to-page".
- **F.** The verification detail: the QR at actual size with decode and stress results, the printed link, and the number.
- **G.** The print proof: before and after PDFs from the harness (6).
- **H.** A one-page before/after sheet showing exactly what changed from Round 1.
- **I.** The README:
  - every change, with its reason;
  - the measurements: contrast, QR version and module size;
  - the wording recommendation (3);
  - what stays open for Yazid and Bob.

**The standard.** At first glance: a certificate. At second glance: unmistakably PINTAR. Underneath: verifiable, immutable evidence.

Refine. Prove. Recommend. Do not implement.

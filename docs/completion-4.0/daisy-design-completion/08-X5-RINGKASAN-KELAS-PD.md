# For Daisy · X5: Ringkasan Kelas of a professional-development class

**Ruling:** D-196 (owner, 7 Nov). It is recorded in `docs/coordination/DECISIONS.md`.

**What we ask of you:** apply the established design grammar to the summary below. The owner asked for no new reporting experience: please do not add new figures, charts or sections. Check it at 1280 px, 390 px and A4, as for CONTOH LAPORAN.

## What is built (branch `claude/awesome-rubin-bqxp6p`)

Ringkasan Kelas (`/edukator/ringkasan?kelas=…`) first reads which kind of class it is opening.

- **A class of learners:** the academic report stays as it is. That is CONTOH LAPORAN 2-guru/2b with your fidelity corrections.
- **A professional-development class (participants):** no academic read is made. The page draws, in this order:
  1. **The report's frame**, as on every report:
     - the scope line (school, class, school year);
     - eyebrow «Ringkasan Kelas», with the class name as h1;
     - the way back and «Cetak»;
     - the A4 header and footer.
  2. **The owner's sentence**, in an info alert (`pin-banner pin-info`, the chooser's pattern): «Kelas pengembangan profesional tidak menggunakan ringkasan penguasaan akademik murid.»
  3. **Your 6-fasilitator composition**, unchanged (`KomposisiPengembangan`). It reads `professional_learning_record`:
     - one table per package;
     - participants in alphabetical order, nothing added up;
     - the columns this reader is allowed to see. The facilitator, the Kepala departemen and the Dekan see the steps and the result. Admin sekolah sees enrolment, participation and completion only.
     - Section A «Langkah setiap peserta» and Section B «Tentang catatan ini».
  4. **A reader the record refuses**, or a class with no participant yet: one line in words (`Kosong`). The refused reader's line says who the record is for.

It never shows a mastery figure, a score strip, a band, «Perlu penguatan», or any line saying figures will appear later.

## Questions for your pass (answer only where the grammar needs it)

1. Should the owner's sentence sit in the info alert, or as the report's lead sentence (`pin-lk-kalimat`)?
2. Is anything needed between the frame and Section A? For example, should the sentence carry a section letter?

## Evidence

- Rendered test: `LAPORAN-KELAS-PD-01` (`selftest/b5a.test.ts`).
- Walk: the journey's `C12f2` (`audit/c12.mjs`), with screenshots `c12-x5-fasilitator`, `-kepala`, `-dekan`, `-admin` and `-390`.
- Boundary test: `F33-P01` (`selftest/db/fable33.sql`).

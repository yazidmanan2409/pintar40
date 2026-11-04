# D2 · The certificate's PDF file name (DAISY-36)

**Form K (the recommended file name and metadata title, within W3.1).** Register entry D2.
**Rule:** W3.1 keeps people's names out of titles. My round-2 example, «Sertifikat Penguasaan · Bagas Saputra» (ronde-2 README:392), is the one that conflicts.
**Built at 0b19707:** `sertifikat.berkas` «Sertifikat Penguasaan · {kursus}» / «Certificate of Mastery · {kursus}». It is set as the document's title only while printing (`src/components/sertifikat/AksiCetak.tsx`, `beforeprint` / `afterprint`), so it becomes «Simpan sebagai PDF»'s suggested name and, in Chromium, the PDF's metadata Title.
**Evidence:** `batch-6/evidence/B6C/sertifikat-A4.pdf`, Title «Sertifikat Penguasaan · Matematika · Pecahan Senilai».
**Decides:** D, within W3.1. **Only naming the person would go to the owner (O7). It is not recommended, so nothing goes.**
**Not reopened:** the certificate's visible heading (the frozen sheet), the 43-character token, the QR, verification.

---

| # | String | Today | Verdict | Approved |
|---|---|---|---|---|
| K1 | **The suggested file name** | «Sertifikat Penguasaan · {kursus}» | **CONFIRM.** **My round-2 example is withdrawn.** | **«Sertifikat Penguasaan · {package title}»**, for example «Sertifikat Penguasaan · Matematika · Pecahan Senilai». The value is the package's own title (its subject · title); the placeholder's name `{kursus}` is engineering's and follows X12. |
| K2 | **The PDF's metadata Title** | the same string | **CONFIRM** | The same string as K1. One string, two uses. |
| K3 | **The learner's name** | absent | **CONFIRM absent (W3.1)** | **Never in the file name or the Title.** The certificate itself names its holder. The file name travels further: a shared computer's Downloads folder, an email attachment's name, a print queue. There it would put a child's name where the certificate's own protections (the token, verification) do not reach. |
| K4 | **Characters a file name cannot hold** | not handled | **CORRECT** | Before the string is set as the title: `\ / : * ? " < > \|` each become «-», and runs of spaces collapse to one. The string is capped at 150 characters at a word boundary. So every browser suggests the same name. «·» stays: it is valid in file names on Windows, macOS, Android and iOS. |
| K5 | **The tab title after printing** | restored on `afterprint` | **CONFIRM** | Restored after printing **and after a cancelled print** (`afterprint` fires for both), and when the page is left (the effect's cleanup) |
| K6 | **English** | «Certificate of Mastery · {kursus}» | **CONFIRM** | The certificate's English name, with the package's title as it is |

**D-172 note:** the certificate page's «Cetak» stays the primary action (P1), because printing or saving is what that page is for. On a report (C1), «Cetak laporan» is secondary because the figures are the page. One rule (P1), two different pages.

## Acceptance checklist

- [auto] The printed PDF's Title and the suggested file name both equal «Sertifikat Penguasaan · {package title}», in the reader's language.
- [auto] Neither contains the learner's name.
- [auto] Characters invalid in a file name are replaced, and the string is at most 150 characters.
- [auto] The tab title is restored after printing, after a cancelled print, and on leaving the page.
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): P1 (the page's one main action), P5 (no result claimed: the browser's own dialog answers).

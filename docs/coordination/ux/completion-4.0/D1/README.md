# D1 step 1 · the email frame: covered / missing (CR-22, DAISY-37)

**Accepted by the owner, 4 Nov (D-164).** Step 2 is in `STEP-2.md`. Row references corrected in step 2's commit.

**Form K.** One row per requirement, as the brief asks (§5).
- **Authority:** D-079(a)–(f) and its addendum; DAISY-37 (1)–(4) (BOARD.md:211); D-074(5) and its addendum; D-163(a).
- **Read at:** engineering commit `0b19707`, read-only. File and line references are to that commit.
- **Date:** 4 Nov. Daisy (UX-1).

## The frame identified

The approved frame is DAISY-19's. Its accepted prototype is `docs/coordination/ux/email-frame/bingkai.mts` (29 Sep). It is built as **`src/components/email/bingkai.ts`**: one function, `bingkaiEmail(email, konteks)`, shared by every email.

Five templates call it:

| Email | Template |
|---|---|
| Activation code; the resend (`ulang`) | `identitas.ts:32` `templatKode` |
| Recovery | `identitas.ts:83` `templatPemulihan` |
| Password changed | `identitas.ts:104` `templatPasswordDiubah` |
| The card | `identitas.ts:55` `templatKartu` |
| Security notices: six events, to the owner and to the security recipient | `keamanan.ts:18` `templatKeamanan` |

**The answer.** The frame is complete as a frame on every structural, accessibility and plain-text requirement, so those rows are confirmed and reused. **Five rows are missing.**
- **Rows 3a, 3b, 3c and 4:** DAISY-37's three named gaps, which are exactly the gaps the coordinator listed on 30 Sep (D-079, «Coordinator's mapping»). Row 4 is the who → why → what check, which waits on row 3b.
- **Row 5:** the brand's own recognition (D-079(e)). It cannot be established before F-11's master; that is the brief's §8 rule.

Separately, **the card in the email has no approved composition:** all five card points are missing. **One of them is also an engineering defect:** the card email's role rows are ordered by seniority, against D-074(5).

So step 2 is not a redraw. It adds four things to the existing frame:
- a reason line under the heading;
- a context line;
- the live-text wordmark slot (the placeholder), with the warm-gold line;
- the card block.

The six emails' content then goes inside that frame.

## The mapping

| # | Requirement | Where it is met (file, render, line) | Covered / missing |
|---|---|---|---|
| 1 | **D-079(a)** The boundary: every product email is a Daisy template on the one shell, through BOB-25's `Templat<D>`; Bob supplies the data and the send | Each email is a `Templat<D>` that ends in one `bingkaiEmail()` call: `identitas.ts:32, 55, 83, 104`; `keamanan.ts:18`. The frame never chooses FROM, Reply-To or the recipient, and never sends (`bingkai.ts:52–53`). | **Covered** |
| 2 | **D-079(b)** One canonical shell, with variants for the code (activation, resend, recovery), the card, security and account notices, and password changed; no new trigger | One shell, `bingkaiEmail` (`bingkai.ts:221`), with the variants in row 1. The resend is a flag on the code template (`identitas.ts:34`), not a second email. The security template carries six events (`email.aman.*`, `hle.ts:4659–4695`). No new trigger. | **Covered** |
| 3 | **D-079(c)** What the shell carries. Point by point: | | |
| 3a | · the identity and wordmark | The header is today's logo image, `public/brand/pintar-email-logo.png` at 104 × 58 (`bingkai.ts:96, 229`). Its alt text is styled as the wordmark: «PINTAR» (`email.bingkai.merek`, `hle.ts:4365`), bold, letter-spaced, in `#245F55` (`bingkai.ts:229`). That predates D-163(a): the wordmark is now «Pintar» in `#075056`, and the master is pending F-11. | **Missing.** Step 2 draws the slot as the placeholder; it is not the master (D-163(a), F-11). |
| 3b | · why the recipient received it | Each email passes its own reason, but the frame prints it in the footer only (`bingkai.ts:227, 261`). DAISY-37 (1) moves it up (row 8). | **Missing** (its position) |
| 3c | · the school or context where appropriate | Nothing in the frame. Only the card email states a role and school, as detail rows (`identitas.ts:57–60`). | **Missing** (row 9) |
| 3d | · a warm, restrained visual language | A warm canvas `#F3F1EC`, a white card, a hairline and radius 12, the token palette written out (`bingkai.ts:99–110, 251–256`). The warm-white and gold language of the artifacts is row 10. | **Covered** for restraint. The artifact language is row 10. |
| 3e | · clear hierarchy; one strong primary action where needed | One `<h1>` (`bingkai.ts:257`); the `tombol` block, full width at 480 px and below (`bingkai.ts:155–160, 197–198`). | **Covered** |
| 3f | · a fallback if the button or link fails | `cadangan`: «Jika tombol tidak bisa dibuka, salin alamat ini ke peramban Anda:» and the address (`bingkai.ts:161–163`; `hle.ts:4369`). | **Covered** |
| 3g | · a footer with support and security lines | The reason; «PINTAR tidak pernah meminta PIN atau password lewat email.»; «Ada pertanyaan? Tulis ke info@pintarselalu.com.»; «PT ZAYD PINTAR SELALU · pintarselalu.com» (`bingkai.ts:260–265`). | **Covered** |
| 3h | · responsive mobile rendering | One column, at most 600 px and fluid to 320 px; Outlook gets a fixed 600 px table (`bingkai.ts:253–254`); narrow rules at 480 px (`bingkai.ts:192–199`). Renders: `email-frame/render-wiring/contoh-kode-320-terang.png`, `-320-gelap.png`, `-600-terang.png`, `-600-gelap.png`. | **Covered** |
| 3i | · accessible type and contrast | Body 16/26, smallest 13 px; AA contrast in light and dark, pinned by `DAISY-19-EMAIL-01` (`selftest/email.test.ts`); `lang="id"`; one `<h1>`; layout tables have `role="presentation"` (`bingkai.ts:35–37, 250`). | **Covered** |
| 3j | · graceful rendering with images blocked | The alt text carries the name (`bingkai.ts:229`). Render: `render-wiring/contoh-kode-600-tanpa-gambar.png`, identical to the prototype. | **Covered** for the frame. The wordmark's own text is row 3a. |
| 3k | · a plain-text version | `teksBiasa`: every block, wrapped at 72 characters, a URL whole on its own line, and the footer (`bingkai.ts:278–310`). Samples: `render-wiring/contoh-kode-staging.txt`, `contoh-pemberitahuan-staging.txt`. | **Covered** |
| 3l | · Indonesian-first copy suited to the recipient | Every word from the copy table in Bahasa Indonesia (`kata`, `bingkai.ts:85`); `lang="id"` on the document and the article. | **Covered** |
| 4 | **D-079(d)** Calm and functional: no newsletter look, gradient, clutter or celebration; who → why → what within seconds | No gradient, image banner, confetti or marketing block, and the static scan has a planted control (`DAISY-19-EMAIL-01`). **Who → why → what:** «who» is the header, «what» is the heading and the action. «Why» is in the footer (row 3b), so the within-seconds order is not met. | **Covered** for calm. **Missing** for the order, until row 8. |
| 5 | **D-079(e)** It looks like PINTAR before the recipient reads the sender | The token palette and today's logo. Recognition of the brand cannot be established with a placeholder (the brief, §8), and the wordmark is changing (D-163(a)). | **Missing until F-11.** The provisional protocol (who, why, what in 5 s) runs in step 2; the final recognition test runs after the master. |
| 6 | **D-079(f)** When: the POLISHED bar, before C-11 | Timing, not composition. It is met when step 2 is accepted and built before C-11. | **Open (timing).** No design row of its own. |
| 7 | **D-079 addendum:** the real duration, read from the canonical setting, never typed; no «segera» or «shortly»; the clock time optional | «Kode ini berlaku selama» + `format.durasi(data.berlakuMenit * 60)` + «. Jika sudah lewat, minta kode baru di halaman yang sama.» (`identitas.ts:39, 94`; `hle.ts:4834–4835`). `berlakuMenit` comes from the server's canonical setting (`identitas.ts:9–12`). No «segera» or «shortly» in `src/components/email/`. | **Covered** |
| 8 | **DAISY-37 (1)** Who → why → what: the reason directly under the heading or in the preview line | **The preview lines do give the purpose** for the code, recovery and password emails: «Pakai kode ini untuk mengaktifkan akun PINTAR Anda.» (`hle.ts:4825`), and likewise at `:4421` and `:4428`. The security preview line is the event itself (`keamanan.ts:40`). The card's preview line is only the ID (`hle.ts:4840`). **In the body, the reason stays in the footer for every email** (`bingkai.ts:261`), and the frame has no slot under the heading. | **Missing.** Step 2 adds the slot under the heading and uses it in all six. |
| 9 | **DAISY-37 (2)** A school or context line where appropriate; in text, implying no authority (D-059) | None in the frame. The code, recovery and password data carry the name only (`DataEmailKode`, `DataEmailPasswordDiubah`), so there is no school to state. Only the card's data has role and school. | **Missing** (frame slot). Step 2 draws the line and says which emails carry it. **Engineering note:** a context line on the code, recovery and password emails needs the school in the data shape. That is Bob's (D-079(a)), and it adds no decision. |
| 10 | **DAISY-37 (3)** The artifact language in email, without reopening the card or the certificate. Point by point: | | |
| 10a | · the identity typeset as live text, so it survives images being blocked | The header is an image whose alt text imitates the wordmark (`bingkai.ts:229`); there is no live-text wordmark. DAISY-37 says «PINTAR SELALU»; under D-163(a) the public wordmark is «Pintar», `#075056`. | **Missing.** The placeholder slot in step 2; final after F-11. |
| 10b | · warm white and restrained typography | The card is `#FFFFFF` on `#F3F1EC`. Typography is restrained (`bingkai.ts:112, 148, 257`). The artifacts' warm white is not used. | **Missing** (warm white). The typography is covered. |
| 10c | · the warm-gold line where it works in email | None. | **Missing** |
| 10d | · email-safe font fallbacks | `'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`; Arial forced in Outlook (`bingkai.ts:112, 245`); no web fonts (`bingkai.ts:28–31`). | **Covered** |
| 11 | **DAISY-37 (4)** Everything else in D-079(c) kept: one action with a fallback, a footer with the PIN and password line and support, 320 px, AA, images blocked, plain text, Indonesian first | Rows 3e to 3l. | **Covered** |
| 12 | **Card in the email:** 600 / 320 px, light / dark | **No render of the built card email exists.** The only renders are DAISY-24's mock-ups (`kartu-pintar/ronde-2/render/H-email-600-terang.png`, `-600-gelap`, `-320-terang`, `-320-gelap`). They predate the brand change, and their content differs from the built template. | **Missing** |
| 13 | **Card in the email:** table HTML or an image | **Built:** text detail rows only, as table HTML: Nama, PINTAR ID, and one Peran row per role (`identitas.ts:69`). The card object is not drawn. **Mock-up:** two PNG images, the front and the back (`buat-kartu.mts:486–489`). Nothing is approved. | **Missing.** Step 2 decides; it is presentation. |
| 14 | **Card in the email:** the back and the QR, shown or not | **Built:** neither; the email points to Akun saya, where the QR is (`identitas.ts:20–22, 71`). **Mock-up:** both. | **Missing.** Step 2 decides. |
| 15 | **Card in the email:** the wordmark with images blocked | **Built:** the frame's alt text «PINTAR» (row 3a); there is no card image, so nothing else blocks. **Mock-up:** the card's alt text names the person, ID, role and school (`buat-kartu.mts:484`), but not the wordmark. | **Missing.** With the placeholder. |
| 16 | **Card in the email:** the rows' order and the colour rule (D-074(5) and its addendum: alphabetical by Terminology v1 names, never seniority; the colour is the first alphabetical role's family) | **Built:** the roles come in the database's order, which is **seniority**. `urutan`: SYSTEM_ADMIN 1, INSTITUTION_ADMIN 2, DEAN 3, HEAD_OF_DEPARTMENT 4, else 5; then by the institution's name (`supabase/migrations/20261112100000_a_person_activates_their_own_account.sql:387–390`). The email keeps that order (`identitas.ts:57`). There is no colour, because there is no card image. | **Missing**, and an **engineering defect** against D-074(5): the order must be alphabetical by the role's Terminology v1 name. The colour rule applies only if step 2 draws the card. |

## What step 2 draws

Only the missing rows. Everything else is the frame as built.

1. **The reason line under the heading** (rows 3b, 8, and 4's order). It holds each email's existing reason (`email.*.alasan`), so the footer's line becomes the frame's short general one or goes. That is decided in step 2, with the copy as a T table.
2. **The context line** (rows 3c, 9): the school or place, in text, for the emails whose data carries it.
3. **The wordmark slot** (rows 3a, 10a, 15): live text, as a box at the slot's exact size labelled «Pintar (master pending F-11)». Engineering integrates the master after F-11.
4. **Warm white and the gold line** (rows 10b, 10c), in email-safe form.
5. **The card in the email** (rows 12–16):
   - drawn in the email matrix;
   - table HTML or images, and the back and the QR, each decided as presentation;
   - the colour rule, if the card is drawn.
6. **The six emails** in the email matrix: 600 and 320 px, each in light and dark; images blocked; the plain text.

## The engineering defect (for the coordinator)

Row 16: the card email's contexts are `order by k.urutan, k.name`, where `urutan` is the role's seniority. D-074(5) says alphabetical by Terminology v1 names, never seniority.
- The fix is the order, by the role's Indonesian name, then the school's.
- It is an engineering row, not a design one: no decision is needed.
- Engineering should also check that the Digital Card screen (Akun saya) uses the same order, since the card and the email must agree.

## Decisions this depends on

- **F-11** (the master): rows 3a, 5, 10a and 15 stay provisional, with the placeholder, until it exists.
- **No O# or G# decision** is needed for step 1 or for the composition in step 2. Any new reason or context words are presentation copy under existing keys, delivered as a T table in step 2.

## Acceptance (step 1)

- [manual] The owner accepts this mapping. Step 2 starts only after that.
- [auto] Row 16's test: a person holding Dekan, Guru and Kepala departemen receives the card email with its role rows in the order «Dekan», «Guru», «Kepala departemen» (alphabetical, D-074(5)). Today it gives «Dekan», «Kepala departemen», «Guru» (seniority). The test fails now and passes after the fix.

# D1 step 2 · the six identity emails, in the DAISY-19 frame (DAISY-37)

**Accepted for design by the owner, 4 Nov.** Two notes recorded: the card block is built from `susunKartu`'s lines (§1); «Akun PINTAR Anda di …» awaits Dr Gladys (§5).

**Form C (composition), in the email matrix.**
- **Authority:** D-079(a)–(f) and its addendum; DAISY-37 (1)–(4); D-074(4)–(6); D-059; D-163(a); the owner's D1 ruling of 4 Nov (D-164) and its images-blocked addendum.
- **Built on:** the step 1 mapping (`README.md`), accepted 4 Nov.
- **Design only:** nothing in `src/` changes. The words are the copy table at engineering commit `0b19707`.

**What this is.** The DAISY-19 frame as built, plus the five elements step 1 found missing. Nothing marked covered is redrawn.
- **The frame specimen:** `bingkai-d1.mts`. It is `src/components/email/bingkai.ts` at `0b19707`, copied unchanged except at lines marked «D1:». Engineering builds the change as that diff.
- **The six emails:** `buat-d1.mts`. They are 0b19707's templates (`identitas.ts`, `keamanan.ts`), block for block, through the specimen frame.
- **To run:** `npx tsx docs/coordination/ux/completion-4.0/D1/buat-d1.mts` from the repository root.

## 1. The complete composition

Every email has the same regions, top to bottom. The «D1» rows are new; the rest is DAISY-19 as built.

| Region | What | Component, tokens, measurements |
|---|---|---|
| Preview line | Hidden, as built | `pratinjau` |
| **D1 · Wordmark slot** | A **placeholder**: a box at the slot's exact size and position, labelled «Pintar (master pending F-11)». It is live text, so it reads with images blocked. It is never the master. | `slotMerek`. **120 × 40 px**, left, in the header cell above the card (as built: padding 0 4 18 4). Border 1 px dashed `#075056`, radius 4. The label is 11/14, 700 «Pintar» and 400 «(master pending F-11)», in `#075056`; on dark, `#86CFBF`. The geometry stays provisional until F-11. |
| **D1 · Gold line** | The artifacts' warm-gold line, as the card's top edge | `border-top: 3px solid #C09C4F` on `.pin-card`, kept on dark. Decorative: it carries no meaning. |
| **D1 · Warm white** | The card is the artifacts' paper | `.pin-kartu` background `#FBFAF7` (`--surface-0`), replacing `#FFFFFF`. Dark unchanged (`#182025`). |
| Heading | One `<h1>`, as built | 24/32 600, `ink-1`; 22/30 at 480 px and below. Its bottom margin goes from 16 to 8, so the reason sits close under it. |
| **D1 · Reason line** | Why the person received it, **directly under the heading** (DAISY-37 (1)). Each email's existing `email.*.alasan` moves here, unchanged. | `.pin-alasan` 14/21, `ink-2` (`#4E5A64`; `#BAC4C9` on dark). Bottom margin 20, or 4 when a context line follows. |
| **D1 · Context line** | **Where authoritative, permitted data is available:** the place or places of the person's account (DAISY-37 (2)), in text, implying no authority (D-059) | `.pin-konteks` 14/21 600, `ink-2`. Bottom margin 20. Its copy is in §5. |
| Body blocks | As built: `paragraf`, `kode`, `tombol` with `cadangan`, `rincian`, `catatan` | Unchanged |
| **D1 · The card block** | In the card email only: the PINTAR Card as **live-text table HTML**. Not an image, no back, no QR (§7). | `kartuHtml`; see «The card in the email» below |
| Footer | As built, **minus the reason**, which has moved up: «PINTAR tidak pernah meminta PIN atau password lewat email.», «Ada pertanyaan? Tulis ke info@pintarselalu.com.», «PT ZAYD PINTAR SELALU · pintarselalu.com» | Unchanged |

**The card in the email** (rows 12–16 of step 1):

| Part | Specification |
|---|---|
| Form | One table, at most 440 px wide and 100% of the card's width below that; radius 12; border 1 px, the frame's `garis` (`--line`, `#E2E4E5`), kept in dark because the paper is kept (P4). Paper `#FBFAF7` in light **and dark**: the card is an artifact, so it keeps its own paper, as the physical and digital card do. |
| Header | The card's own wordmark slot: **96 × 32 px**, the same placeholder at 9 px, inset 14 16 10 16 |
| Gold line | A 2 px full-width rule, `#C09C4F`, under the header (D-074's line, scaled for email) |
| Name | 18/24 600, `#1F2A33`, inset 14 16 4 |
| PINTAR ID | Shown 4 + 4 («K7M2 Q9XA»), Consolas / SF Mono 14/20, letter-spacing 1 px, `#4E5A64` |
| Role band | One band for every role, in **the family colour of the first role in alphabetical order** (D-074(4) addendum; the ruled «terpisah» palette): Guru `#446A4B`, Kepala departemen `#2E6973`, Dekan `#515E83`, Admin sekolah `#7A5648`, Admin platform `#5E6062`. Each role and its school is one line, «**Peran** · Sekolah» (D-074(6)), 13/19, paper `#FBFAF7`, at least 4.5:1 on every family (ronde-2 §4). |
| Lines | **The Digital Card's own lines** (`susunKartu` → `baris`, `src/lib/kartu-pintar.ts`): several roles at one school share one line with the school beneath; roles at different schools are one line each (D-074(6)). The specimen shows the two-school case. Engineering builds the block from `susunKartu`, so the card and the email always read alike (confirmed 4 Nov). |
| Order | **Alphabetical by the Terminology v1 role name, then by school**, exactly as the Digital Card (D-074(5)). The data arrives in that order (`urutKonteksKartu`, D-164(b)); the block draws it as given. |
| Colour is never alone | Every role is written (D-074(8)) |

## 2. Layouts: the email matrix

Emails are exempt from the screen widths: 600 and 320 px, each in light and dark; images blocked; the plain text.

| | 600 light | 600 dark | 320 light | 320 dark | Images blocked (600, 320) | Plain text |
|---|---|---|---|---|---|---|
| 1 Activation code | `render/1-aktivasi-600-terang.png` | `-600-gelap` | `-320-terang` | `-320-gelap` | `-600-tanpa-gambar`, `-320-tanpa-gambar` | `1-aktivasi.txt` |
| 2 Resend | `render/2-kirim-ulang-…` | ✓ | ✓ | ✓ | ✓ | `2-kirim-ulang.txt` |
| 3 Recovery | `render/3-pemulihan-…` | ✓ | ✓ | ✓ | ✓ | `3-pemulihan.txt` |
| 4 Password changed | `render/4-password-diganti-…` | ✓ | ✓ | ✓ | ✓ | `4-password-diganti.txt` |
| 5 The card (one role) | `render/5-kartu-…` | ✓ | ✓ | ✓ | ✓ | `5-kartu.txt` |
| 5b The card (two roles, two schools) | `render/5b-kartu-dua-peran-…` | ✓ | ✓ | ✓ | ✓ | `5b-kartu-dua-peran.txt` |
| 6 Security notice (the owner) | `render/6-keamanan-…` | ✓ | ✓ | ✓ | ✓ | `6-keamanan.txt` |
| 6b Security notice (the security recipient) | `render/6b-keamanan-admin-…` | ✓ | ✓ | ✓ | ✓ | `6b-keamanan-admin.txt` |

The HTML of each is beside it (`<email>.html`).

**The images-blocked renders follow the owner's addendum.** They block images, and they also **remove the wordmark slot and the card's own slot outright**. That is the worst case once the master exists, because the master will be an image. Each email still states:
- **who:** «PINTAR» in the heading or the reason, and «PT ZAYD PINTAR SELALU» in the footer;
- **why:** the reason line, under the heading;
- **what:** the heading, then the code or the action.

The card email's facts (name, ID, roles) are live text, so the card's content survives without its artwork.

## 3. States and variants

| Email | Variants drawn | Not drawn, and why |
|---|---|---|
| Activation; resend | Each, once. The resend is the same template with `ulang` (D-079(b)). | — |
| Recovery | Once | — |
| Password changed | Once, with its formal date and time («4 November 2026 pukul 15.30 WIB», `tanggal(…, "resmiJam")`) | — |
| The card | One role at one school; **two roles at two schools** (the edge case: alphabetical, the colour is the first role's) | **More than two role and school pairs: not drawn.** B3 is excluded by the owner; the rule holds as built. |
| Security notice | To the owner (with the action), and to the security recipient (no action, the neutral note). Both use one event, `TERKUNCI`. | The other five events are the same template with their own words (`email.aman.*`); none changes the layout. |
| Staging | Not drawn. As built, staging adds the slim test line above the heading (ruling 3); this changes nothing. | — |
| Name absent | Not drawn. As built, «Halo, {nama}.» is left out when the name is empty (`identitas.ts:36`). | — |
| **Context unavailable** | The six emails as composed **without** a context line wherever their data carries no place: activation, resend, recovery, password changed and both security notices. | See below |

**The context line, where authoritative, permitted data is available.**
- **Today only the card email's data carries places:** its role assignments' institutions. So only the card email shows the line: «Akun PINTAR Anda di SMP Cahaya Kaliandra.»
- **Activation, resend, recovery and password changed** carry the name only (`DataEmailKode`, `DataEmailPasswordDiubah`). **The security notices** carry the PINTAR ID and time. **This composition does not assume school data will ever be added to them,** and it is complete and correct without it.
- **When context is unavailable, the line is omitted. Nothing stands in for it:** no placeholder text, no «PINTAR» line, no role. The reason line then has its full 20 px below it, and the layout closes up. Omitting it implies nothing about authority (D-059). A generic substitute such as «Akun PINTAR Anda» would add words without information.
- **When the data does carry places,** in this email or any other, the line names every place, alphabetically, joined by «, » and «dan». It never summarises a place away, because the card's rows list each one. It names a place, never a role, so it states no authority (D-059).

## 4. Keyboard and accessibility

| | |
|---|---|
| Tab order | Document order: the action, then its fallback link, then the footer's `mailto:` and domain. The keyboard files are `jalan/<email>.txt`; for example, the card email is «Buka Akun saya» → its address → info@pintarselalu.com → pintarselalu.com. Emails with no action (the code emails, the security recipient's) start at the footer. Focus return does not apply: an email has no dialogs or layers. |
| Skip link | Not applicable. An email is read in the client's own reading view and has no repeated navigation. |
| Names and roles | `role="article"` named by the subject; one `<h1>`; layout tables `role="presentation"` (as built). The wordmark slot is text, read as «Pintar (master pending F-11)». After F-11 the master is an image whose alt text is the name. The card block is plain text in reading order: name, ID, roles. The trees are in `jalan/`. |
| Colour never alone | The card's family colour is redundant with the written role (D-074(8)). The gold line is decoration. «Perhatian» notes keep their 4 px edge and their words. |
| Targets | The button is at least 48 px high, full width at 480 px and below (as built). The checks find no button under 44 px. |
| Text | Smallest 13 px (the footer). The card slot's label is 9 px, but it is a placeholder label, not content. The check floor is 9 px. Contrast is AA in light and dark, as pinned by `DAISY-19-EMAIL-01`. The reason, in `ink-2` on `#FBFAF7`, is 6.8:1 (9.3:1 on dark); the band text on the families is 5.9 to 6.2:1. |
| Reduced motion | Not applicable: the emails have no motion. |

## 5. Copy (T table)

Every key below is **presentation**, not a protected term. Every other word is the copy table's as built at `0b19707`.

| Key | Indonesian | English | Where it appears | Status |
|---|---|---|---|---|
| `email.kode.alasan` · `email.pulih.alasan` · `email.diubah.alasan` · `email.kartu.alasan` · `email.aman.alasan` · `email.aman.alasan_admin` | as built | as built | **Moved:** from the footer to the reason line, directly under the heading | Moved, words unchanged |
| `email.bingkai.alasan` (the frame's default) | as built | as built | The reason line, when an email passes none. All six pass their own. | Moved, words unchanged |
| `email.bingkai.konteks` | Akun PINTAR Anda di | Your PINTAR account at | The context line, followed by the place or places and a full stop | **New.** Kept as drawn; **with Dr Gladys for confirmation** before final terminology acceptance (a PINTAR ID is the person's own, not a school's) |
| `email.bingkai.konteks.dan` | dan | and | Joins the last two places in the context line | **New** |
| (no key) The context line when unavailable | — (the line is omitted) | — | Activation, resend, recovery, password changed, security notices; any email whose data has no place | Presentation rule, no words |
| (no key) The wordmark placeholder | «Pintar (master pending F-11)» | the same | The header slot and the card's slot. **A design-time label, never sent**: engineering replaces it with the master after F-11, and until then keeps today's logo in that slot (D-160(a)). | Placeholder |

**Unchanged on purpose:** the plain text's first line (`email.bingkai.merek`, «PINTAR») and «PINTAR» in running text. Where «PINTAR SELALU» or «Pintar» replaces «PINTAR» in text is open, and not mine (the commission, §4).

## 6. Components, tokens and measurements

All in §1. They are the frame's own (`WARNA`, `HURUF`, `HURUF_KODE`), plus these additions:
- `WARNA.terang.emas` `#C09C4F` (D-074's line);
- `WARNA.terang.merek` `#075056` (D-163(a), for the placeholder only);
- `kartu` `#FBFAF7` (`--surface-0`);
- the five family colours above (the ruled palette).

No application token changes.

## 7. Navigation and outcomes

| Email | Action | Where it leads | What is saved |
|---|---|---|---|
| Activation, resend, recovery | None: the code is typed on the open page | — | Nothing |
| Password changed | «Buat password baru» | Lupa password | Nothing |
| The card | «Buka Akun saya» | Akun saya, **where the card with its QR is** | Nothing |
| Security (the owner) | «Pulihkan akun lewat email» | Lupa password | Nothing |
| Security (the recipient) | None | — | Nothing |

**Why the card is live text, with no back and no QR** (step 1, rows 13 and 14; presentation, decided here):
- **Live text survives images being blocked, which Outlook does by default.** An image card would vanish or shrink to its alt text, and the person would lose their name and ID. Text also scales with the client's text size and reads to a screen reader in order.
- **The back is the QR, and the QR opens the sign-in page** (D-074(7)). In an email, the person is already holding the device it would open on. A QR image would vanish with images blocked, could be taken for a security code, and adds nothing the button does not.
- The card with its QR stays where it is built: Akun saya and the printed card. The email says so through the button.

## 8. Edge cases

- **Two roles at two schools** (5b). It shows alphabetical order, one band in the first role's colour, and one line per pair. A long school name wraps inside the band at 320 px.
- **A long name and a long school at 320 px.** The 320 px renders show no sideways scroll for any email: the check fails on any page wider than its viewport.
- **Images blocked**, with the wordmark and the card's slot removed (§2).
- **Dark mode.** The card keeps its paper; the gold line stays; the placeholder turns `#86CFBF` so it stays legible. The master's own dark form is F-11's.
- **A client that strips `<style>`**, as some Gmail apps do. Every D1 element is inline-styled; only the dark-mode and narrow-screen rules are enhancements, as built.
- **Outlook for Windows.** The frame's fixed 600 px table and Arial (as built). The slot and the card are plain tables with no CSS the client ignores, except `border-radius`, which degrades to square corners.
- **More than two pairs:** excluded (B3).

## 9. Acceptance checklist

**Automated** (engineering; `buat-d1.mts` runs the same checks on the specimen: `render/laporan.txt`, 8 emails, 0 with a failure):
- [auto] One shell. Every product email is one `bingkaiEmail` call with no per-email frame (as built, `DAISY-19-EMAIL-01`).
- [auto] The reason line is the first text after the `<h1>`, in every email, and the footer no longer repeats it.
- [auto] The context line is present when the email's data carries a place, and **absent, with no substitute text, when it does not**. The tests cover the card with one place, the card with two, and each of the other five emails with none.
- [auto] The context line names every place, alphabetically, joined by «, » and «dan», and names no role.
- [auto] The card email's roles render in alphabetical order by their Terminology v1 names. The band colour is the first role's family. A Dekan, Guru and Kepala departemen person renders in the order «Dekan», «Guru», «Kepala departemen», in Dekan's `#515E83` (D-074(5), (4) addendum).
- [auto] The card block is table HTML with no back and no QR. Its only image is the wordmark slot: the placeholder in these specimens; in the build until F-11, today's logo (D-160(a); P2).
- [auto] The wordmark slot is 120 × 40 in the header and 96 × 32 on the card, and every placeholder label reads «Pintar (master pending F-11)». After F-11 this line is replaced by the master's own check.
- [auto] The card's top edge is 3 px `#C09C4F` in light and dark; the card is `#FBFAF7` in light.
- [auto] At 320 px there is no sideways scroll, no text under 13 px except the placeholder label, every button is at least 44 px, and **the reason line is above the fold** (within the first 900 px).
- [auto] The plain text is complete. It contains the heading, the reason, the context line where present, every block (the card as its name, ID and role lines), the action's URL and the footer, and no internal word (PR0xx, SQLSTATE, undefined, null, IDENTITY_…) and no vague expiry («segera kedaluwarsa», «shortly»).
- [auto] The real duration still comes from the data (`berlakuMenit`), as built.
- [auto] AA contrast for every new text colour, in light and dark: the reason, the context line, the band text on every family.
- [auto] With images blocked and both slots removed, each email still has «PINTAR» in its heading or reason, «PT ZAYD PINTAR SELALU» in its footer, a reason line, and a heading with its code or action.

**Manual** (the recorded protocol, the brief §8; the provisional email protocol, with the placeholder):
- [manual] Each of the six emails is sent to a test inbox and opened in Gmail web, Gmail on a phone, Outlook desktop and Outlook on a phone, in light and dark, and once with images blocked. Per client, record: the layout matches this composition; nothing is clipped or overflows at 320 px; the plain text is complete; with images blocked the email still reads in full.
- [manual] **With images blocked, every one of the six emails remains fully understandable without relying on the Pintar wordmark or the Digital Card artwork: who it is from, why the person received it, and what to do** (the owner's addendum, 4 Nov). Recorded per email and per client, in the images-blocked pass above.
- [manual] **Recognition:** a reader not involved in the design, shown the email at 320 px, states who sent it, why, and what to do within 5 seconds, in at least 4 of 5 attempts per email. Each attempt uses a different reader, new to that email, and the readers are spread across the clients. **This stage cannot establish brand recognition:** a labelled placeholder is not the brand.
- [manual] After F-11: the final recognition test, with the approved artwork, as the brief §8 sets out.

## Decisions this depends on

- **F-11:** the master. The wordmark slots stay provisional placeholders; engineering integrates the owner-supplied master and I verify its fit. Until then today's logo stays in that slot (D-160(a)).
- **Not a decision this design needs:** whether school data is ever added to the activation, recovery or password emails. The composition is complete without it.
- **No O# or G# decision.** The new copy (§5) is presentation.

## Missing evidence

None relied on. The card email's data and its alphabetical order are engineering's at `9b52b51` (D-164(b)); this design does not depend on them.

## Implementation answers (owner's questions, 4 Nov)

- **P2 · The card's wordmark slot until F-11:** (a) today's logo as the block's one image (D-160(a)), with `alt="Pintar"`; the card's live text still carries who and what with images blocked.
- **P3 · The header slot until F-11:** keep it at today's pinned 104 × 58 and do not rescale the logo; 120 × 40 is the slot for the F-11 master.
- **P4 · The card border:** `--line`, the frame's existing `garis` (`#E2E4E5`). The `#D9D6CE` in step 2 was an untokened value of mine, now corrected in `bingkai-d1.mts`; the renders are regenerated.


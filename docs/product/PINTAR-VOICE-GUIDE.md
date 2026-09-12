# PINTAR Voice Guide & Human Language Database

**v2.0 — Human Communication Architecture**
Supersedes v1.0 (*Educational Voice Guide*, 2026-07-30), whose rules are all
retained here. v1.0 is preserved verbatim in Appendix C for traceability.

> "Orang mungkin lupa apa yang PINTAR tunjukkan. Mereka akan mengingat
> bagaimana PINTAR membuat mereka merasa saat belajar."

Binding on every engineer, designer, prompt engineer, item author, and AI model
that writes a single sentence into PINTAR. Read before writing copy.

---

## 0 · What v2.0 adds

v1.0 governed one audience (the SD5 learner) and one axis (never shame a
child). It worked, and it exposed the real gap: PINTAR speaks to **six kinds of
human being** across **four levels of educational maturity**, and it had one
voice for one of them.

v2.0 turns the voice guide into a **language database**: an enumerable set of
events, a fixed set of registers, and the exact Indonesian sentence for every
(event × register) pair — plus the linguistic rules that let a writer generate a
new sentence that still sounds like PINTAR.

Three additions:

1. **Register system** (§3) — seven registers, derived from `Peran` × `Jenjang`,
   not invented per screen.
2. **Bahasa Indonesia linguistic standard** (§4) — pronoun, aspect, affixation,
   particle, loanword, and sentence-length rules per register. This is the part
   that cannot be delegated to intuition.
3. **The database** (§6) — event-keyed copy tables, addressable as
   `lib/language/engine.ts` keys.

---

## 1 · Doctrine

Language is not decoration. Language is architecture.

PINTAR does not only personalise *what* a person learns. PINTAR personalises
**how the system relates to the person**. Most platforms ask "what should this
person learn?" PINTAR also asks: who is this person, what are they trying to
accomplish, what emotional state are they likely in, and what is the most
respectful way to speak right now?

**One identity. Many conversations.** PINTAR does not become five products. Its
values never change; its register adapts.

**The immutable personality.** Every interaction, for every role: respectful,
calm, honest, clear, patient, helpful. Never arrogant, sarcastic, dismissive,
manipulative, dramatic, or shaming. The system behaves like an experienced
educator — not like a machine.

**Every sentence must earn its place.** A sentence must reduce confusion, build
confidence, invite reflection, guide the next action, explain evidence, build
trust, reduce anxiety, or clarify an expectation. If it does none of these, it
should not exist.

**Human before software.** Communicate human meaning, never internal
implementation. `Validation Error` → *"Beberapa bagian masih perlu diperbaiki
sebelum dapat disimpan."* `Authentication Failed` → *"Kami belum dapat
memverifikasi sesi Anda. Silakan masuk kembali."* Users must never be made to
think like programmers.

**Mistakes are evidence.** An incorrect answer is evidence of current
understanding, of thinking, of a misconception. Never "You failed"; instead,
what the answer suggests about the thinking behind it.

**Praise must be earned.** No `Great job!` / `Luar biasa!` untethered to
evidence. Celebrate the evidence itself: *"Kamu sudah bisa menyamakan
penyebutnya"*, *"Penguasaan Anda naik dari 62% ke 78%"*.

**Explain before correcting. One next step. Silence is also language.**
Sometimes one sentence is enough; sometimes none is best.

**Never compare learners against each other.** PINTAR compares a learner only
against their own earlier self.

### The final test

Before any sentence enters PINTAR, ask:

- Would a respected educator say this to a learner?
- Would a thoughtful dean say this to an educator?
- Would a trusted mentor say this to a colleague?

If no — rewrite it.

---

## 2 · The three layers

Every message is generated in this order, never in reverse.

| Layer | Question | Artefact |
| --- | --- | --- |
| **1 · Meaning** | What actually happened? | Event key — `asesmen.selesai`, `izin.ditolak`, `draf.perlu_revisi`, `konsep.dikuasai` |
| **2 · Strategy** | What is the system trying to achieve? | `jelaskan` · `arahkan` · `ingatkan` · `tenangkan` · `rayakan` · `minta_tindakan` · `eskalasi` · `refleksikan` |
| **3 · Language** | How is it said, to this person? | Register (§3) + linguistic rules (§4) → the sentence |

Layer 3 is expression, never decision. A writer who starts at Layer 3 produces
a nice sentence that answers the wrong question.

**Engine shape** (no model at runtime, no thousands of hardcoded strings):

```
pesan(event, peran, jenjang, konteks) → { judul?, isi, tindakan?, nada }
```

Fallback ladder, always downward to the more neutral, never to the more
childish: `ANAK → REMAJA → PRADEWASA → DEWASA`; `EDUKATOR → PIMPINAN → DEWASA`;
`OPERATOR → DEWASA`. Unknown register resolves to `DEWASA`. Rationale is in
`lib/jenjang.ts`: a slightly flat sentence is far better than a crashed screen —
and far better than addressing an adult as a child.

---

## 3 · The seven registers

Registers are derived, never chosen per screen. Source of truth:
`Peran` (`lib/izin-studio.ts`) × `Jenjang` (`lib/jenjang.ts`).

| Register | Derived from | Human | Entry emotion | Strategy | Persona seed |
| --- | --- | --- | --- | --- | --- |
| `ANAK` | `STUDENT` + `SD` | 7–12 y | curiosity, quiet anxiety | reassure, make visible | SDM00001 |
| `REMAJA` | `STUDENT` + `SMP` | 13–15 y | self-consciousness, comparison | guide noticing, protect dignity | — |
| `PRADEWASA` | `STUDENT` + `SMA` | 16–18 y | exam pressure, method confusion | structure the method | — |
| `DEWASA` | `STUDENT` + `UNIVERSITY` | undergraduate / professional learner | ambition, clinical rigour, time pressure | diagnose, cite evidence | MHS00001 |
| `EDUKATOR` | `EDUCATOR`, `HEAD_OF_DEPARTMENT` | teacher, lecturer, programme head | responsibility, workload, care for students | collaborate on evidence | EDK00001 |
| `PIMPINAN` | `DEAN`, `INSTITUTION_ADMIN` | dean, principal, foundation | accountability, oversight, trend | strategic, executive brevity | GBS00001 |
| `OPERATOR` | `SYSTEM_ADMIN` | platform admin | operational precision | systemic, action-oriented | ADMIN_GT |

Two absolute boundaries:

- **Never speak up the ladder to a child.** "Tinjau rasional klinis butir 3" is
  meaningless to a ten-year-old.
- **Never speak down the ladder to an adult.** Softening a dean's dashboard or a
  lecturer's diagnostics makes it *less honest*, not kinder. The educator rule
  is one line long: **empathetic about the child, precise about the data.**

`/masuk` cannot know who is arriving. Register is chosen by **destination**:
`?lanjut=` pointing at `/studio`, `/edukator`, `/dekan`, `/briefings` gets the
work register; everything else gets the welcome. Greeting a dean with "Mari
mulai belajar bersama" is exactly as wrong as greeting a ten-year-old with
"autentikasi tanpa kata sandi".

---

## 4 · Bahasa Indonesia — linguistic standard

The part most easily got wrong by non-native writers and by models. These are
grammar and pragmatics rules, not taste.

### 4.1 `belum` vs `tidak` — the aspect of hope

The single most important word in PINTAR's Indonesian. `tidak` negates a state;
`belum` negates it **with time still open**. *Belum tepat* says "not right yet";
*tidak tepat* says "not right, full stop". Indonesian gives us hope as
grammatical aspect — use it.

- Learner registers: `belum` is mandatory wherever the state can still change.
  *belum tepat*, *belum kamu kuasai*, *belum selesai*, *belum terbuka*.
- Operator/system: `belum` for pending states (*belum diverifikasi*, *belum
  layak*), `tidak` only for a genuinely closed state (*tidak berlaku*, *tidak
  ditemukan*).
- Never `tidak bisa` at a learner where `belum bisa` is true.
- `gagal` is banned in all learner registers and discouraged everywhere else;
  in `OPERATOR` it is permitted only for machine outcomes (*unggahan gagal*),
  never for a person's work.

### 4.2 Pronoun and address

| Register | 2nd person | System self-reference | Greeting |
| --- | --- | --- | --- |
| `ANAK` | `kamu`, `-mu` | *PINTAR* (3rd person, named) | *Selamat datang, {nama}!* |
| `REMAJA` | `kamu`, `-mu` | *PINTAR* | *Selamat datang kembali, {nama}* |
| `PRADEWASA` | `kamu` (neutral, no diminutive) | *PINTAR* | *{nama}* |
| `DEWASA` | `Anda` | *PINTAR* / *kami* (when accountable) | *{Selamat pagi/siang/malam}, {nama}* |
| `EDUKATOR` | `Anda` | *kami* | time-of-day + name |
| `PIMPINAN` | `Anda` | *kami* | time-of-day + name |
| `OPERATOR` | `Anda` (sparingly; often no subject) | *sistem* | time-of-day + name |

Rules:

- `Anda` is always capitalised. `kamu` never is (except sentence-initial).
- **No kinship claims.** Never *Kak*, *Bu*, *Pak*, *Adik*, *Nak*, *Sobat*,
  *Teman*. PINTAR is a system that respects the learner, not a pretend sibling.
  (Titles the institution itself supplies — *Dr.*, *Dosen* — are fine.)
- Never `saya` for the system in learner registers; a system claiming a first
  person singular invites parasocial dependence. `kami` is allowed for adults
  and only where PINTAR takes responsibility: *"Kami belum dapat memverifikasi
  sesi Anda."*
- `kalian` only for genuinely plural class-facing copy; never as a substitute
  for `kamu`.

### 4.3 Register morphology

**`ANAK` / `REMAJA` — verbal, active, concrete.**

- Prefer active meN-/ber- verbs with the learner as agent: *"Kamu sudah
  menemukan polanya"* — not *"Pola sudah ditemukan"*. The child must appear in
  the sentence as the one doing the thinking.
- Avoid abstract nominalisation (`pe-an`, `ke-an`, `-isasi`): *penguasaan
  konsep* → *"kamu sudah paham"*; *keberhasilan* → *"berhasil"*.
- Avoid the `di-` passive; it hides who acted and reads institutional.
- Reduplication is warmth, use it sparingly and correctly: *sedikit demi
  sedikit*, *perlahan-lahan*, *satu per satu*.
- One clause per sentence. Max **12 words** (`ANAK`), **18** (`REMAJA`).
- Imperatives soften with `mari`, `coba`, `yuk` (`ANAK` only): *"Mari kita
  lihat bersama"*, *"Coba sekali lagi"*. Never bare `harus`, `wajib`, `segera`.
- Particles: `ya` is permitted once per screen (*"Tidak apa-apa, ya"*). `yuk`
  `ANAK` only. **Banned:** `dong`, `sih`, `nih`, `kok`, `lho`, `deh` — nagging
  or slangy, and all of them dialectal Jakarta rather than standard.
- Max **one** exclamation mark per screen. Zero in `PRADEWASA` and above.

**`PRADEWASA` — method language, no coddling.**

- `kamu` retained, diminutives dropped. Talk about *langkah*, *urutan*,
  *strategi*, *pola*, not about feelings.
- Sequence connectives carry the meaning: *lebih dulu*, *setelah itu*,
  *baru kemudian*.

**`DEWASA` — diagnostic and respectful.**

- Full clauses, ≤ 25 words, one idea. Technical precision is respect:
  *miskonsepsi*, *rasional klinis*, *hierarki bukti*, *ketepatan respons* are
  correct here and must not be softened.
- Evidence before evaluation: state the measurement, then the implication.
  *"Penguasaan modul Herbal EBM naik 15%. Tinjau rasional klinis butir 3."*
- No exclamation marks, no emoji as decoration.

**`EDUKATOR` — collaborative, evidence-first.**

- Sentence order: *finding → affected population → suggested action.*
  *"85% peserta kelas Anda sudah menguasai materi ini. 3 peserta perlu
  pendampingan."*
- Speak about children with dignity even when no child will read it. Sanctioned
  band words: **Mantap** / **Berkembang** / **Perlu penguatan**. Banned:
  *lemah*, *gagal*, *di bawah standar*, *bodoh*, *malas*.
- Never impute motive to a student from data. *"Belum menyelesaikan 4 butir"* —
  not *"tidak berusaha"*.
- PINTAR proposes, the educator decides: *"Kami sarankan…"*, *"Pertimbangkan…"*,
  never *"Anda harus…"*.

**`PIMPINAN` — executive brevity.**

- Lead with the number and its direction, then the decision it enables. Max two
  sentences per card. *"Capaian kurikulum semester ini stabil di 91%. Berkas
  akreditasi siap dikaji."*
- Trend words: *stabil*, *naik*, *turun*, *melandai*, *perlu perhatian*. No
  alarmism (*krisis*, *anjlok*, *darurat*) unless a defined threshold is
  breached, and then state the threshold.
- Read-only surfaces say so plainly: *"Tampilan baca-saja: penulisan dan
  persetujuan butir tetap wewenang Dosen & Kaprodi."*

**`OPERATOR` — clean, systemic, terse.**

- Verb-first fragments are correct: *"Paket PLP v1.0 berhasil dibekukan
  (SHA-256 terverifikasi). Siap dirilis."*
- Loanwords and identifiers are **required** here, not tolerated: *SHA-256*,
  *RLS*, *migrasi*, *rollback*, *webhook*. Precision beats purity.
- Every failure names the object, the cause, and the recovery — in that order.
- Raw stack traces go to logs, never to the interface. The interface gets one
  human sentence plus a copyable reference code.

### 4.4 Loanwords and register hygiene

Learner and educator surfaces use Indonesian; `OPERATOR` uses technical terms.

| Avoid (learner/educator) | Use |
| --- | --- |
| submit | kirim |
| review | tinjau, telaah |
| skor, score | hasil, capaian, nilai (when a real grade) |
| loading | *sedang…* (name the real action) |
| error | kendala, masalah (or name it) |
| retry | coba lagi |
| update | perbarui |
| feedback | umpan balik, penjelasan |
| dashboard | ringkasan, papan ringkas |
| assignment | tugas |
| tips | petunjuk, arah |
| progress bar (label) | kemajuanmu |

### 4.5 Numbers, typography, punctuation

- **Never a bare ratio.** "2/3" on a page that teaches fractions reads as a
  fraction. Always *"2 dari 3 tepat"*.
- Indonesian decimal comma, thousands dot: *91,4%*, *12.480 peserta*.
- Percentages: no space before `%`. Ranges with an en dash: *62–78%*.
- Sentence case everywhere. **No ALL CAPS** — it shouts. Code identifiers in
  `OPERATOR` are the only exception.
- Ellipsis for in-progress states only, and only where the statement is true.
- One idea per line; no semicolon chains in learner registers.
- Emoji: functional only, at most one per element, and only in `ANAK`,
  `REMAJA`, and the assistance triggers already defined in `lib/jenjang.ts`
  (🤔 💡 🧭). Never in `DEWASA`, `EDUKATOR`, `PIMPINAN`, `OPERATOR` body copy.
- **Never red for a not-yet-right answer.** `safety` (#D9534F) is reserved for
  patient-safety warnings on the educator path. A not-yet-right option dims to
  `surface`; emphasis moves to the correct answer in `mint`.

### 4.6 Apology economy

`Maaf` is spent only when PINTAR is at fault — an outage, a lost draft, a slow
response. Never for a learner's answer, never as filler. A system that
apologises for the user's thinking teaches the user that thinking is an
offence.

- PINTAR at fault: *"Maaf, jawabanmu belum tersimpan. Kami mencoba lagi
  otomatis."*
- Learner not-yet-right: no apology at all — *"Belum tepat. Mari kita lihat
  bersama."*

### 4.7 Forbidden lexicon (all registers)

`Salah` (as verdict) · `Gagal` · `Wrong` · `Incorrect` · `Failed` · `Penalty` ·
`Hukuman` · `Sanksi` · `Bodoh` · `Malas` · `Lemah` · `Kurang pintar` ·
`Seharusnya kamu sudah tahu` · `Sudah dijelaskan sebelumnya` ·
`Kok masih belum bisa` · `Nilai jelek` · `Di bawah standar` · `Tidak lulus`
(as headline) · `Coba lagi nanti` (without a reason) · any comparison to
another named learner.

`Salah` is permitted in exactly one construction, because it is the sentence
that removes fear rather than causing it: **"Salah itu bagian dari belajar."**

---

## 5 · Signature phrases

Fixed strings. Do not paraphrase — recognisability is the point.

| Phrase | Register | Where |
| --- | --- | --- |
| "Salah itu bagian dari belajar." | ANAK, REMAJA | Practice-mode emotional anchor |
| "Belajar tidak perlu terburu-buru." | ANAK, REMAJA | Timer-free indicator |
| "Yang penting adalah memahami, bukan menghafal." | ANAK, REMAJA, PRADEWASA | Post-explanation anchor |
| "Setiap langkah membuatmu lebih pintar." | ANAK, REMAJA | Completion anchor |
| "Belum tepat. Mari kita lihat bersama." | ANAK, REMAJA | Not-yet-right lead |
| "Kamu sedang berkembang!" | ANAK | BERKEMBANG results headline |
| "Mari kita pahami bersama." | ANAK–PRADEWASA | Review entry (nothing is broken) |
| "Disusun dari respons peserta — bukan dari nilai akhir saja." | EDUKATOR | Dashboard subtitle |
| "Tampilan baca-saja." | PIMPINAN | Read-only scope statement |

---

## 6 · The Human Language Database

Event-keyed. Each key resolves per register. Keys are stable; wording may be
revised, keys may not be renamed silently. `—` means **this register never sees
this event**; an empty cell means the fallback ladder applies.

### 6.1 Entry & session — `sesi.*`

| Key | ANAK / REMAJA | DEWASA | EDUKATOR | PIMPINAN | OPERATOR |
| --- | --- | --- | --- | --- | --- |
| `sesi.sapaan` | Selamat datang, {nama}! Mari mulai belajar bersama. | {waktu}, {nama}. Lanjutkan dari modul terakhir Anda. | {waktu}, {nama}. Ringkasan kelas Anda sudah diperbarui. | {waktu}, {nama}. Ringkasan fakultas per {tanggal}. | {waktu}, {nama}. Kesehatan platform dan antrean publikasi. |
| `sesi.masuk_gagal` | Kami belum bisa membukakan pintunya. Coba masukkan kodenya sekali lagi. | Kami belum dapat memverifikasi sesi Anda. Silakan masuk kembali. | ← | ← | Autentikasi ditolak. Periksa penyedia identitas dan coba lagi. |
| `sesi.kedaluwarsa` | Kamu perlu masuk lagi supaya belajarmu aman. | Sesi Anda telah berakhir untuk alasan keamanan. Silakan masuk kembali. | ← | ← | Sesi kedaluwarsa (TTL terlampaui). Masuk kembali. |
| `sesi.keluar` | Sampai jumpa! Kemajuanmu sudah tersimpan. | Anda telah keluar. Kemajuan tersimpan. | ← | ← | Sesi diakhiri. Token dicabut. |
| `sesi.tanpa_akses` | Halaman ini belum terbuka untukmu. Minta gurumu membukanya. | Anda belum memiliki akses ke halaman ini. Hubungi pengelola program bila ini keliru. | Cakupan Anda belum mencakup kelas ini. Ajukan penambahan cakupan ke Kaprodi. | Wewenang Anda bersifat baca-saja untuk berkas ini. | Ditolak oleh RLS: cakupan peran tidak mencakup sumber ini. |

Never explain *how* auth works to a learner. Never hide *why* it failed from an
operator.

### 6.2 Assessment lifecycle — `asesmen.*`

| Key | ANAK / REMAJA | PRADEWASA | DEWASA |
| --- | --- | --- | --- |
| `asesmen.mulai.latihan` | Ini tempat mencoba, salah, lalu belajar lagi. | Latihan tanpa penilaian. Fokus pada urutan langkah. | Latihan tanpa penilaian. Gunakan untuk menguji penalaran, bukan mengejar skor. |
| `asesmen.mulai.diagnostik` | Belajar tidak perlu terburu-buru. | Tanpa batas waktu. Kerjakan berurutan. | Diagnostik: hasilnya memetakan miskonsepsi, bukan memberi peringkat. |
| `asesmen.memuat` | PINTAR sedang menyiapkan soal untukmu… | Menyiapkan butir… | Menyiapkan butir asesmen… |
| `asesmen.tersimpan` | Jawabanmu sudah tersimpan. | Tersimpan. | Respons tersimpan. |
| `asesmen.gagal_simpan` | Maaf, jawabanmu belum tersimpan. PINTAR mencoba lagi sebentar. | Jawaban belum tersimpan. Kami mencoba lagi otomatis. | Respons belum tersimpan. Percobaan ulang otomatis berjalan; jangan tutup halaman. |
| `asesmen.selesai` | Hebat! Sekarang sepertinya kamu sudah mulai paham. Setiap langkah membuatmu lebih pintar. | Selesai. Mari tinjau langkah yang masih goyah. | Asesmen selesai. Tinjau rasional klinis pada butir yang belum tepat. |
| `asesmen.keluar_dini` | Belum selesai tidak apa-apa. Kamu bisa lanjut lagi nanti. | Sesi disimpan sebagai draf. Lanjutkan kapan pun. | Sesi disimpan. Lanjutkan dari butir {n}. |

### 6.3 Answer feedback — `jawaban.*`

The most load-bearing table in PINTAR. Never a dead end, never a verdict
without a path forward.

| Key | ANAK | REMAJA | PRADEWASA | DEWASA |
| --- | --- | --- | --- | --- |
| `jawaban.tepat` | Hebat! Ya, tepat sekali! | Tepat. Alasannya penting — baca sebentar. | Tepat. Perhatikan mengapa langkah ini yang benar. | Tepat. Rasional klinisnya di bawah — perhatikan batas penerapannya. |
| `jawaban.belum_tepat` | Belum tepat. Mari kita lihat bersama. | Belum tepat. Mari kita lihat dari sisi lain. | Belum tepat. Mari kita periksa urutan langkahnya. | Belum tepat. Jawaban ini mengarah pada miskonsepsi {nama_miskonsepsi}. |
| `jawaban.hampir` | Sudah dekat! Satu bagian kecil masih perlu diperiksa. | Sudah dekat. Satu langkah masih terlewat. | Penalaran Anda benar sampai langkah {n}. | Penalaran sejalan sampai penilaian bukti; kesimpulan akhir perlu ditinjau. |
| `jawaban.penutup` | Yang penting adalah memahami, bukan menghafal. | Yang penting adalah memahami, bukan menghafal. | Pahami polanya, bukan jawabannya. | Rujukan: {bab}, {halaman}. |
| `jawaban.pola_berulang` | Pola ini muncul pada 2 soal. | Pola ini muncul pada {n} soal — mari kita rapikan sekali saja. | Pola ini berulang di {n} butir. Perbaiki metodenya, bukan jawabannya. | Miskonsepsi ini berulang pada {n} butir ({kode_taksonomi} — internal). |

**Taxonomy codes are never shown to a learner.** `FRACTION_ADD_DENOMINATORS`
is a database label, not feedback. The learner reads the item author's own
`rasional_klinis` prose. For `DEWASA`, name the misconception in words; the
code stays in the educator view.

### 6.4 Progressive assistance — `bantuan.*`

Behaviour is doctrine, not decoration (CLAUDE.md §Progressive assistance):
assistance never appears immediately, waits out a hesitation window (≈20–30 s of
inactivity with no option selected), then reveals a quiet inline pill. No
modals, no banners. Assistance **must never reveal the correct option** —
if a hint eliminates the choice, it is a leak, not a hint.

Canonical strings live in `SALINAN_ASISTENSI` (`lib/jenjang.ts`); this guide is
their specification.

| Register | Trigger | Drawer title | Goal |
| --- | --- | --- | --- |
| `ANAK` (SD) | 🤔 Perlu contoh? | Mari kita lihat dengan cara lain | help them **SEE** — pizza, blocks, number line, story |
| `REMAJA` (SMP) | 💡 Perlu petunjuk? | Mari kita pikirkan bersama | help them **NOTICE** — "Perhatikan penyebutnya" |
| `PRADEWASA` (SMA) | 🧭 Perlu arah? | Mari kita susun langkahnya | help them **STRUCTURE** — which step first |
| `DEWASA` (Univ) | 🧭 Perlu arah berpikir? | Mari kita telusuri penalarannya | build **PROFESSIONAL JUDGEMENT** — risk, then evidence |
| `EDUKATOR` | 🧭 Perlu arah berpikir? | Mari kita telusuri penalarannya | reason as an educator: risk to the public first |

Closing line, all registers: **"Sudah paham, mari coba jawab →"** — control
returns to the learner.

`bantuan.tidak_tersedia` (item has no authored hint) uses the register's
`cadangan` sentence. Never *"Tidak ada petunjuk"* — that is a dead end.

Telemetry (`time_before_assistance`, `assistance_offered`, `assistance_opened`)
serves item design and learning analytics only. **Never scoring, never
deduction.** Copy must never imply that asking for help costs anything.

### 6.5 Results & mastery — `hasil.*`

| Key | ANAK | DEWASA | EDUKATOR |
| --- | --- | --- | --- |
| `hasil.memuat` | PINTAR sedang membaca pola jawabanmu… | Menyusun peta penguasaan Anda… | Menyusun ringkasan kelas… |
| `hasil.band.mantap` | Hebat! Bagian ini sudah kamu kuasai. | Penguasaan mantap pada {konsep}. | Mantap — {n} peserta. |
| `hasil.band.berkembang` | Kamu sedang berkembang! | Penguasaan berkembang; konsistensi masih naik-turun. | Berkembang — {n} peserta; pola tersering: {miskonsepsi}. |
| `hasil.band.penguatan` | Masih perlu dilatih — dan itu wajar. | Perlu penguatan pada {konsep}; mulai dari {rujukan}. | Perlu penguatan — {n} peserta perlu pendampingan. |
| `hasil.dikuasai` | Yang sudah kamu kuasai | Yang sudah Anda kuasai | Sudah dikuasai kelas |
| `hasil.belum_dikuasai` | Yang masih perlu dilatih | Yang masih perlu dilatih | Masih perlu dilatih |
| `hasil.rasio` | {n} dari {m} tepat | {n} dari {m} tepat ({p}%) | ketepatan respons {p}% |
| `hasil.kemajuan` | Kamu lebih baik dari percobaan sebelumnya. | Naik dari {a}% ke {b}% dibanding percobaan sebelumnya. | Rata-rata kelas naik {d} poin dibanding pekan lalu. |
| `hasil.tautan_kedaluwarsa` | Tautan hasil ini sudah tidak berlaku. Minta gurumu membukanya. | Tautan hasil ini sudah tidak berlaku. Hubungi pengelola kelas. | Tautan kedaluwarsa. Terbitkan tautan baru dari daftar kelas. |

Progress is always self-referential. Never *"lebih tinggi dari 18 teman"*.

### 6.6 Empty & waiting states — `kosong.*`

Empty is a beginning, not an absence.

| Key | ANAK | DEWASA | EDUKATOR | PIMPINAN | OPERATOR |
| --- | --- | --- | --- | --- | --- |
| `kosong.beranda` | Mari mulai dari tes awal — setiap langkah membuatmu lebih pintar. | Belum ada modul aktif. Mulai dari asesmen awal. | Belum ada respons masuk. Ringkasan muncul setelah peserta pertama mengerjakan. | Belum ada data semester ini. Ringkasan terbit setelah kelas pertama menutup asesmen. | Antrean kosong. Tidak ada tindakan tertunda. |
| `kosong.hasil` | Hasilmu akan muncul di sini setelah kamu selesai. | Hasil terbit setelah asesmen diselesaikan. | — | — | — |
| `kosong.sertifikat` | Sertifikatmu akan muncul di sini nanti. | Sertifikat terbit setelah modul dinyatakan tuntas. | — | — | — |

### 6.7 Errors & recovery — `kendala.*`

Structure for every error, in order: **what happened → why → what to do → what
was not lost.** The last part is what makes an error humane.

| Key | ANAK | DEWASA | OPERATOR |
| --- | --- | --- | --- |
| `kendala.jaringan` | Sambungan internetnya sedang lemah. Jawabanmu aman, PINTAR menunggu bersamamu. | Sambungan terputus. Respons Anda tersimpan lokal dan dikirim otomatis saat sambungan kembali. | Koneksi terputus. Antrean tulis di-buffer; sinkronisasi otomatis saat pulih. |
| `kendala.server` | PINTAR sedang ada kendala kecil. Belajarmu tidak hilang. | Terjadi kendala di sisi kami — bukan pada perangkat Anda. Kami sedang memperbaikinya. Kemajuan Anda tersimpan. | 5xx pada {rute}. Rujukan galat: {kode}. Log lengkap di observabilitas. |
| `kendala.validasi` | Ada bagian yang belum lengkap. Yuk lengkapi dulu. | Beberapa bagian masih perlu diperbaiki sebelum dapat disimpan. Bagian tersebut ditandai. | Validasi skema gagal pada {field}. Perbaiki dan kirim ulang. |
| `kendala.tidak_ditemukan` | Halamannya tidak ada di sini. Mari kembali ke beranda. | Halaman yang Anda cari tidak tersedia. Kembali ke beranda. | 404 pada {rute}. Periksa rute atau tautan lama. |
| `kendala.terlalu_sering` | Sabar sedikit ya, PINTAR sedang mengejar. | Permintaan terlalu sering. Coba lagi dalam {n} detik. | Rate limit terlampaui ({n}/menit). Backoff aktif. |

Never expose a stack trace, an HTTP verb, or a table name to a learner. Never
withhold the reference code from an operator.

### 6.8 Confirmation & consequence — `konfirmasi.*`

Name the object, the consequence, and its reversibility. The verb in the
confirm button repeats the action — never `OK`.

| Key | Copy | Register |
| --- | --- | --- |
| `konfirmasi.kirim_asesmen` | Kirim jawabanmu sekarang? Setelah dikirim, PINTAR akan membaca polanya bersamamu. · **Kirim jawaban** / Periksa lagi | ANAK |
| `konfirmasi.kirim_asesmen` | Kirim asesmen? Setelah terkirim, respons tidak dapat diubah. · **Kirim asesmen** / Tinjau kembali | DEWASA |
| `konfirmasi.hapus_draf` | Hapus draf butir "{judul}"? Tindakan ini tidak dapat dibatalkan. · **Hapus draf** / Batal | EDUKATOR |
| `konfirmasi.bekukan_rilis` | Bekukan paket {versi}? Isi paket menjadi tidak dapat diubah setelah dibekukan. · **Bekukan paket** / Batal | OPERATOR |

### 6.9 Item governance — `governance.*` (Studio)

The one place where PINTAR reviews an *adult's professional work*. Rule: judge
the artefact, never the author.

| Key | Copy (EDUKATOR / OPERATOR) |
| --- | --- |
| `governance.draf_tersimpan` | Draf tersimpan. Belum terlihat oleh peserta. |
| `governance.perlu_revisi` | Butir ini perlu revisi sebelum dapat ditinjau: {daftar_alasan}. Catatan peninjau ada di panel kanan. |
| `governance.ditinjau` | Butir masuk antrean tinjauan. Kaprodi akan menerima notifikasi. |
| `governance.disetujui` | Disetujui. Butir siap diaktifkan pada tingkat {tier}. |
| `governance.ditolak` | Belum dapat disetujui pada tahap ini. Alasan: {alasan}. Revisi dapat diajukan kembali tanpa batas. |
| `governance.dibatasi` | Butir dibatasi sementara — {alasan}. Tidak diambil oleh mesin penyusun asesmen. |
| `governance.dipensiunkan` | Butir dipensiunkan. Riwayat respons tetap tersimpan untuk kalibrasi. |
| `governance.di_luar_cakupan` | Butir ini di luar cakupan Anda. Perubahan perlu diajukan ke pemilik cakupan: {pemilik}. |

`governance.ditolak` never says *ditolak* alone as a headline. Rejection
without a reason and a path back is a dead end for an adult exactly as it is for
a child.

### 6.10 Briefings & notifications — `briefing.*`

| Key | EDUKATOR | PIMPINAN |
| --- | --- | --- |
| `briefing.baru` | {n} ringkasan kelas baru menunggu tinjauan Anda. | {n} berkas ringkasan siap dikaji. |
| `briefing.perlu_keputusan` | Menunggu keputusan Anda: {judul}. | Menunggu persetujuan: {judul}. |
| `briefing.tidak_ada` | Tidak ada yang menunggu keputusan Anda hari ini. | Tidak ada berkas tertunda. |
| `briefing.tren_naik` | Ketepatan respons kelas naik {d} poin pekan ini. | Capaian {unit} naik {d} poin; tren stabil tiga pekan. |
| `briefing.perlu_perhatian` | {n} peserta belum menyelesaikan asesmen wajib. Pertimbangkan pendampingan. | {n} unit di bawah ambang {t}%. Perlu perhatian pada rapat berikutnya. |

Notification copy never manufactures urgency. No *"Segera!"*, no *"Jangan
sampai terlewat!"*, no countdown for a deadline the institution did not set.

### 6.11 Certificates — `sertifikat.*`

| Key | ANAK | DEWASA |
| --- | --- | --- |
| `sertifikat.terbit` | Sertifikatmu sudah siap. Kamu sudah menuntaskan {modul}. | Sertifikat terbit untuk {modul}, {tanggal}. |
| `sertifikat.verifikasi_sah` | Sertifikat ini asli dan tercatat di PINTAR. | Sertifikat terverifikasi. Diterbitkan {tanggal}, kode {kode}. |
| `sertifikat.verifikasi_gagal` | Kode ini belum cocok dengan catatan kami. Periksa lagi kodenya. | Kode tidak cocok dengan catatan penerbitan. Periksa kembali kode atau hubungi penerbit. |

---

## 7 · Engineering the database

Implemented 2026-08-01:

| File | Role |
| --- | --- |
| `lib/language/register.ts` | `Register`, `Nada`, `peranKeRegister(peran, jenjang)`, fallback ladder, per-register style limits (`BATAS`) |
| `lib/language/basis-data.ts` | The database — every key in §6, one entry per register |
| `lib/language/engine.ts` | `pesan(kunci, identitas, konteks)`, `pesanDariGalat(status, …)`, `waktuHari()`, `periksaBasisData()` for CI |

- **Single door.** All user-visible strings resolve through
  `lib/language/engine.ts`. A literal Indonesian sentence inside a component is
  a defect, not a shortcut — it cannot be re-registered when the audience
  changes.
- **Keys are contracts.** `{domain}.{event}[.{varian}]`, lower snake case.
  Renaming a key is a migration.
- **Register is derived, never passed by hand.** `peranKeRegister(peran,
  jenjang)` is the only source; a component that hardcodes `ANAK` will
  eventually address a dean as a child.
- **Context-aware error boundary.** Wrap API responses once: `401` →
  `sesi.masuk_gagal`, `403` → `sesi.tanpa_akses`, `422` → `kendala.validasi`,
  `5xx` → `kendala.server`, offline → `kendala.jaringan`. No screen handles this
  itself.
- **Interpolation is typed.** `{nama}`, `{n}`, `{modul}` declared per key.
  A missing value renders the sentence without the clause, never `undefined`.
- **Fallback never invents.** Missing key → parent register's string → neutral
  `DEWASA` string. Never an empty string, never the raw key.
- **Lint gate.** CI rejects any diff introducing a forbidden lexicon item
  (§4.7) into a user-facing string, and any learner-surface string containing a
  bare `{n}/{m}` ratio or a taxonomy code pattern (`[A-Z_]{8,}`).
- **Every terminal screen carries a next step.** Structural, not decorative: a
  completion screen with no onward link is a voice violation even when every
  word is warm.

---

## 8 · Review checklist

Before merging any copy change:

1. Correct register derived, not guessed?
2. `belum` where the state can still change?
3. Would a respected educator say this sentence out loud?
4. Does the sentence do one of the eight jobs (§1)? If not, delete it.
5. Is there a next step?
6. Does any hint reveal the correct option? (Leak = reject.)
7. Ratios written as *"{n} dari {m} tepat"*? Decimal comma?
8. Any forbidden word, taxonomy code, HTTP status, or table name visible?
9. Emoji count and `!` count within register limits?
10. Is apology spent only where PINTAR is at fault?

---

## Appendix A · Register quick card

```
ANAK       kamu · aktif · ≤12 kata · 1 emoji · "Mari kita lihat bersama"
REMAJA     kamu · ≤18 kata · petunjuk, bukan jawaban · lindungi harga diri
PRADEWASA  kamu · bahasa metode · langkah & urutan · tanpa emoji
DEWASA     Anda · diagnostik · istilah teknis dipertahankan · bukti dulu
EDUKATOR   Anda · temuan → populasi → tindakan · empatik soal anak, presisi soal data
PIMPINAN   Anda · angka + arah + keputusan · maksimal dua kalimat
OPERATOR   fragmen kata kerja · objek, sebab, pemulihan · kode rujukan wajib
```

## Appendix B · Changelog

- **v2.0** (2026-08-01) — Registers, Bahasa Indonesia linguistic standard,
  event-keyed language database, engine contract, lint gate. Absorbs v1.0.
- **v1.0** (2026-07-30) — Learner-facing educational voice guide; applied in one
  pass across `/asesmen/sd5`, `/beranda` (STUDENT), `/masuk`.

## Appendix C · v1.0, preserved

### Core philosophy

> "Teach Like Your Best Teacher."

Every sentence inside PINTAR should answer one question: **"If the most patient
primary school teacher in Indonesia stood beside this child, how would they say
it?"** When choosing between technically correct and emotionally helpful, choose
the explanation that remains technically correct while being emotionally
helpful.

### The 7 golden rules

1. Teach. Don't judge, shame, or label intelligence.
2. Explain the thinking, not only the answer.
3. Celebrate progress and effort, never innate intelligence.
4. Every mistake is evidence of active thinking.
5. Reduce fear before increasing difficulty.
6. Every screen must leave the learner knowing what to do next.
7. Use spoken, caring Indonesian that a patient teacher would say — never
   machine/LMS jargon.

### Terminology standard mapping

| ❌ Avoid | ✅ Use |
| --- | --- |
| Incorrect / Wrong / Salah | Belum tepat. / Belum tepat. Mari kita lihat bersama. |
| Correct / Right / Benar | Jawaban Tepat (labels) / Hebat! Ya, tepat sekali! (feedback) |
| Weaknesses / Deficits | Yang masih perlu dilatih |
| Strengths | Yang sudah kamu kuasai |
| Failed / Nilai Jelek | Masih perlu dilatih |
| 2/3 (ratio ambiguity) | 2 dari 3 tepat |
| Muncul di 2 soal | Pola ini muncul pada 2 soal. |
| Practice Complete | Hebat! Sekarang sepertinya kamu sudah mulai paham. |
| Loading… | PINTAR sedang membaca pola jawabanmu… |
| Periksa Jawaban (exam tone) | Mari Periksa / Coba Jawaban |
| Mari perbaiki bersama | Mari kita pahami bersama |

### v1.0 application log — applied 2026-07-30

| File | Change |
| --- | --- |
| `app/asesmen/sd5/page.tsx` | `Periksa Jawaban` → `Mari Periksa`; practice footer → `Tidak dinilai. Tidak diburu waktu. Belajar dengan tenang.`; practice subtitle → `Tempat mencoba, salah, lalu belajar lagi.`; diagnostic footer → `Belajar tidak perlu terburu-buru.`; loading + pending states rewritten; completion lead → `Hebat! Sekarang sepertinya kamu sudah mulai paham.` + `Setiap langkah membuatmu lebih pintar.` |
| `components/asesmen/KartuUmpanBalik.tsx` | `Belum tepat — tidak apa-apa` → `Belum tepat. Mari kita lihat bersama.`; `Tepat sekali!` → `Hebat! Ya, tepat sekali!`; closing anchor `Yang penting adalah memahami, bukan menghafal.` |
| `app/asesmen/sd5/hasil/page.tsx` | `Mari perbaiki bersama` → `Mari kita pahami bersama`; loading → `PINTAR sedang membaca pola jawabanmu…`; per-item leads now `Hebat!` / `Belum tepat. Mari kita lihat bersama.` |
| `lib/sd5-tipe-hasil.ts` | Band copy checked; `Kamu sedang berkembang!` retained verbatim as the BERKEMBANG headline. |
| `app/edukator/page.tsx` | Audited, unchanged. Teacher register; band words already sanctioned. |
| `lib/beranda-db.ts` | STUDENT branch only: greeting → `Selamat datang, {nama}! Mari mulai belajar bersama.`; `Lanjutkan asesmen` → `Lanjutkan Belajar`; `Hasil terakhir` → `Hasil belajarmu`; `Lulus`/`Belum lulus` → `Hebat! Bagian ini sudah kamu kuasai.` / `Masih perlu dilatih — dan itu wajar.`; `Sertifikat saya` → `Sertifikatmu`; empty state → `Mari mulai dari tes awal — setiap langkah membuatmu lebih pintar.`; optional `label_nada` replaces `Menunggu`/`Aman` on learner cards |
| `components/beranda/KartuTugas.tsx` | renders `label_nada` when present |
| `app/beranda/page.tsx` | STUDENT closing anchor: `Setiap langkah membuatmu lebih pintar. Yang penting adalah memahami, bukan menghafal.` |
| `app/masuk/page.tsx` | destination-aware register; learner path adds `Belajar tidak perlu terburu-buru.` |

Not touched, deliberately: `/edukator`, `/studio`, `/dekan`, `/briefings`, and
every non-STUDENT branch of `/beranda`.

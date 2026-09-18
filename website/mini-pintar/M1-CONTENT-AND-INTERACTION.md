# MINI-PINTAR M1 — CONTENT AND INTERACTION ARCHITECTURE

**For:** Sauron · **By:** Pete · **Date:** 2026-09-18
**Governing:** rulings R1–R10 (2026-09-18) · **ADR-0021** (recorded)
**Status:** for review. **No implementation code written.**

The twelve M1 items, in order. §3 is the one to read first — it is the
content itself, complete, in both languages.

---

## 1 · Rulings recorded

**ADR-0021 — Mini-PINTAR is a public, zero-write demonstration**
(`docs/adr/0021-mini-pintar-public-demonstration.md`) carries R1, R2 and R3
together: OD-11 resolved to BUILD NOW, Path A fixed as the execution model,
and INV-26 interpreted — *not weakened* — as governing authoritative,
evidence-producing execution only.

Two things in it are worth surfacing here because they constrain everything
below.

**A binding content rule, new in the ADR.** Mini-PINTAR scores locally, so
its bundle contains its own answer key and any visitor can read it. That is
acceptable for demonstration content and would be a breach of INV-01 for
product content. So: **Mini-PINTAR content is authored for Mini-PINTAR and
is never imported from any PINTAR item bank.** No item, option, rationale or
misconception code that exists in `items` / `item_options` may appear in the
bundle. Everything in §3 is original and exists nowhere else.

**A debt the ADR names rather than hides.** Doc 09 must move the public
Mini-PINTAR experience from FOUNDATION NOW to BUILD NOW, and doc 11 must
mark OD-11 RESOLVED against ADR-0021. Both are frozen baseline documents, so
that is a governed amendment — new bytes, new `baseline` identity, matching
in-document marker, `BASELINE-MANIFEST.json` regenerated — and a separate
change from the ADR. **Until it lands, doc 11 still reads OD-11 as OPEN and
contradicts the ADR.** `npm run baseline:parity` passes today (25 documents
byte-identical), so the amendment is a deliberate act, not a drift. Carried
as STOP-1 in §12.

Also applied throughout: **R6** — `#245F55` for the corporate direction,
with no retrofit of closed product surfaces; **R7** — a clearly replaceable
identity slot, no invented mark, no time spent chasing Canva; **R9** — the
reveal's closing line corrected so PINTAR never appears to make the
decision (§11).

---

## 2 · Content model

Five entities. Deliberately fewer than the product's — a demonstration that
needs the product's full model has stopped being a demonstration.

```
Domain          id · name(ID/EN) · severity(1–3) · lesson
  ├─ Misconception   code · name(ID/EN) · mapReason(ID/EN)
  ├─ Lesson          title · body · workedExample{title, steps[]}
  └─ Item            id · stage(MAP|CHECK) · stem · options[]
        └─ Option    label · text · correct · rationale · misconception?
```

| Field | Why it exists |
|---|---|
| `Domain.severity` | Fixes the Peta Bacaan order deterministically (§4). Not a score. |
| `Misconception.mapReason` | The Reading Map names **the visitor's thinking**, not their score. Nine of these exist, one per (domain × misconception), which is what makes the map feel read rather than switched. |
| `Option.rationale` | Required and non-empty on **every** option, correct ones included — the demonstration honours INV-03's principle that a distractor must teach, even though no invariant binds it. |
| `Item.stage` | `MAP` items and `CHECK` items are disjoint sets. No item appears in both, so no "improvement" can be an artefact of having seen the question already. |

Every string is a `{id, en}` pair. Both sides are authored; neither is
generated. The same build-time audit that guards the deck guards this —
empty side, obsolete terminology, forbidden learner words.

**Not in the model, on purpose:** no score field, no mastery field, no
percentile, no learner, no session, no timestamp, no persistence key.

---

## 3 · "MEMBACA ANGKA" / "READING A NUMBER" — the complete content

### 3.1 Why this topic

Three domains, and each one is simultaneously (a) real adult numeracy, (b) a
PINTAR doctrine, and (c) a tool the visitor can immediately turn on PINTAR
itself. That last property is the reason to choose it: a visitor who
finishes Mini-PINTAR is better equipped to interrogate PINTAR's own claims,
and a company that hands you that tool is making an argument about itself
that no tagline can make.

| Domain | ID | EN | The PINTAR doctrine it *is* |
|---|---|---|---|
| **D1** | Angka dan dasarnya | A number and what it counts | *A number never stands alone* |
| **D2** | Cukup atau belum | Enough, or not yet | *Belum cukup bukti* |
| **D3** | Berhubungan atau menyebabkan | Linked, or causing | *Observation is not judgment* |

Severity for ordering: **D2 (3) > D3 (2) > D1 (1)**. Concluding from too
little is the error with the largest institutional consequence; mistaking a
link for a cause is next; a missing denominator is the most easily repaired.

### 3.2 Register — Mini-PINTAR speaks to an adult

**CORRECTION to the architecture document.** §F of
`../EXPERIENCE-ARCHITECTURE.md` proposed framing Pemetaan Awal with the
product's own words, *"Ini bukan ujian. Jawabanmu dipakai untuk menyusun
peta bacaan yang pas untukmu."* That string belongs to the `ANAK` register —
it is what PINTAR says to a ten-year-old. Mini-PINTAR's visitor is an adult
on a corporate website, which is `DEWASA`, and the Voice Guide is explicit:
*never speak down the ladder to an adult.* Borrowing a child-register
sentence for a principal or a foundation would be a register error on the
most visible public surface PINTAR has.

**DECISION: Mini-PINTAR uses `Anda` throughout, and restates the product's
concepts in the adult register rather than quoting its child-register
strings.** This is not a screenshot — nothing in Mini-PINTAR is a
reconstruction of a product screen, so the discipline that keeps a
screenshot's wording untouched does not apply. The product's *concepts* and
*labels* carry over; its `ANAK` phrasing does not.

| Concept | Product (`ANAK`) | Mini-PINTAR (`DEWASA`) |
|---|---|---|
| Pemetaan Awal intro | Ini bukan ujian. **Jawabanmu** dipakai untuk menyusun peta bacaan yang pas **untukmu**. | Ini bukan ujian. **Jawaban Anda** dipakai untuk menyusun urutan bacaan yang sesuai. |
| Peta Bacaan intro | Mulailah dari kartu paling atas. Urutannya sudah disusun **untukmu**. | Mulailah dari kartu paling atas. Urutannya disusun dari jawaban **Anda**. |
| Third tier label | Sudah **kamu** kuasai | Jawaban **Anda** sudah tepat di bagian ini |

*EN:* Initial Mapping — "This is not an exam. Your answers are used to build
a reading order that suits you." · Reading Map — "Start with the top card.
The order comes from your answers." · third tier — "Your answer here was
already right."

**SECOND CORRECTION, on the product owner's ruling of 2026-09-18.** The
adult-register fix above was not enough. *"Sudah Anda kuasai" / "Already
yours"* is a claim of **mastery**, and one correct Pemetaan Awal answer
cannot support it — the same overclaim that `DIDUKUNG` was renamed to avoid
at the other end of the journey. The tier's visible label now describes the
**observed answer**: *"Jawaban Anda sudah tepat di bagian ini"* / *"Your
answer here was already right."* The tier's function in §4.1 is unchanged;
the adaptation is not redesigned.

**Consequence I took on my own, flagged for reversal in one line.** The
internal tier identifier was `KUAT` — "strong" — which is the same
inferred-mastery word in the data model that the ruling removed from the
screen. Leaving it would put an internal vocabulary one careless debug
surface away from contradicting the label, which is the leak
`INTERNAL_WORDS` exists in `src/lib/hle.ts` to prevent. The identifier is
now **`SUDAH_TEPAT`**. Function, ordering and tier count are identical; if
you prefer `KUAT` retained, it is one rename.

### 3.2a Pemetaan Awal — three questions

No score, no timer, no right/wrong feedback, dot progress, and every
question may be skipped. **Skipping is evidence too** — an honest "I don't
know" — and it is treated as such in §4, not as a blank.

---

**P1 · D1**

> **ID** — Sebuah laporan sekolah menulis: *"85% siswa lulus ujian akhir."*
> Apa yang paling perlu Anda ketahui berikutnya agar angka itu bisa dibaca
> dengan adil?
>
> **EN** — A school report says: *"85% of students passed the final exam."*
> What do you most need to know next before that number can be read fairly?

| | Option | |
|---|---|---|
| **A** ✓ | **ID** Berapa siswa yang mengikuti ujian itu.<br>**EN** How many students sat the exam. | *ID* Persentase adalah perbandingan. Tanpa tahu dibandingkan terhadap berapa, 85% bisa berarti 17 dari 20 — atau 850 dari 1.000.<br>*EN* A percentage is a ratio. Without knowing what it is a ratio of, 85% could mean 17 of 20 — or 850 of 1,000. |
| **B** | **ID** Berapa persentasenya tahun lalu.<br>**EN** What the percentage was last year. | `M-D1-BANDING`<br>*ID* Membandingkan dua angka yang belum dipahami hanya menghasilkan dua angka yang belum dipahami.<br>*EN* Comparing two numbers you do not yet understand leaves you with two numbers you do not yet understand. |
| **C** | **ID** Siapa yang mengajar kelas itu.<br>**EN** Who taught the class. | `M-D1-ATRIBUSI`<br>*ID* Mencari siapa yang bertanggung jawab sebelum tahu apa yang terjadi biasanya menemukan orang, bukan sebab.<br>*EN* Looking for who is responsible before knowing what happened usually finds a person, not a cause. |
| **D** | **ID** Berapa nilai rata-ratanya.<br>**EN** What the average score was. | `M-D1-RINGKASAN`<br>*ID* Rata-rata juga sebuah ringkasan. Menukar satu ringkasan dengan ringkasan lain tidak menambah konteks.<br>*EN* An average is also a summary. Trading one summary for another adds no context. |

---

**P2 · D2**

> **ID** — Sebuah kelas mencoba cara belajar baru selama satu minggu. Tiga
> siswa mencobanya, dan ketiganya membaik. Kesimpulan mana yang paling
> jujur?
>
> **EN** — A class tries a new way of studying for one week. Three students
> try it, and all three improve. Which conclusion is the most honest?

| | Option | |
|---|---|---|
| **A** | **ID** Cara itu berhasil.<br>**EN** The method works. | `M-D2-SIMPUL`<br>*ID* Tiga orang dalam satu minggu bisa membaik karena banyak hal. Buktinya belum memisahkan cara belajar dari hal-hal lain itu.<br>*EN* Three people in one week can improve for many reasons. The evidence has not yet separated the method from those reasons. |
| **B** | **ID** Cara itu tidak berhasil.<br>**EN** The method does not work. | `M-D2-BALIK`<br>*ID* Membalik kesimpulan tidak menambah bukti. Keduanya sama-sama melampaui apa yang diketahui.<br>*EN* Reversing a conclusion adds no evidence. Both go further than what is known. |
| **C** ✓ | **ID** Belum cukup bukti untuk menyimpulkan. Ini arah yang layak diamati lebih lama.<br>**EN** Not yet enough evidence to conclude. It is a direction worth watching for longer. | *ID* Mengatakan "belum" bukan menghindar. Itu menyebut dengan tepat apa yang belum ada: jumlah dan waktu.<br>*EN* Saying "not yet" is not avoidance. It names precisely what is missing: numbers, and time. |
| **D** | **ID** Cara itu berhasil untuk siswa yang tekun.<br>**EN** The method works for diligent students. | `M-D2-HIAS`<br>*ID* Menambahkan syarat membuat kesimpulan terdengar lebih hati-hati, padahal bukti di belakangnya tidak bertambah.<br>*EN* Adding a condition makes a conclusion sound more careful while the evidence behind it stays exactly the same. |

---

**P3 · D3**

> **ID** — Di sebuah sekolah, siswa yang membawa bekal dari rumah cenderung
> punya nilai lebih tinggi. Mana yang paling tepat dikatakan tentang temuan
> ini?
>
> **EN** — At one school, students who bring lunch from home tend to have
> higher grades. What is the most accurate thing to say about this finding?

| | Option | |
|---|---|---|
| **A** | **ID** Membawa bekal meningkatkan nilai.<br>**EN** Bringing lunch raises grades. | `M-D3-SEBAB`<br>*ID* Dua hal yang muncul bersama belum tentu yang satu menyebabkan yang lain.<br>*EN* Two things appearing together does not mean one produces the other. |
| **B** | **ID** Nilai yang tinggi membuat siswa membawa bekal.<br>**EN** Higher grades cause students to bring lunch. | `M-D3-ARAH`<br>*ID* Membalik arah sebab tetap sebuah klaim sebab. Buktinya sama-sama belum menunjukkannya.<br>*EN* Reversing the direction is still a causal claim. The evidence shows neither one. |
| **C** ✓ | **ID** Keduanya berhubungan. Penyebabnya belum diketahui, dan bisa jadi hal ketiga.<br>**EN** The two are linked. The cause is not known, and may be a third thing. | *ID* Hubungannya nyata dan berguna. Yang belum ada adalah sebabnya — keadaan di rumah, misalnya, bisa memengaruhi keduanya sekaligus.<br>*EN* The link is real and useful. What is missing is the cause — a home circumstance, for instance, could shape both at once. |
| **D** | **ID** Temuan ini tidak berarti apa-apa.<br>**EN** The finding means nothing. | `M-D3-TOLAK`<br>*ID* Bukti yang belum menunjukkan sebab tetap menunjukkan sesuatu. Membuangnya sama menyesatkannya dengan melebihkannya.<br>*EN* Evidence that does not show a cause still shows something. Discarding it misleads as much as overstating it. |

### 3.3 Peta Bacaan — the nine reasons

The card does not say "you got this wrong". It says what the visitor's
answer suggests they were reaching for, and what the reading is about.

| Misconception | Card reason |
|---|---|
| `M-D1-BANDING` | *ID* Jawaban Anda menuju perbandingan lebih dulu. Bacaan ini tentang memahami satu angka sebelum membandingkannya.<br>*EN* Your answer reached for a comparison first. This reading is about understanding one number before comparing it. |
| `M-D1-ATRIBUSI` | *ID* Jawaban Anda menuju orangnya. Bacaan ini tentang membaca angkanya lebih dulu.<br>*EN* Your answer reached for the people. This reading is about reading the number first. |
| `M-D1-RINGKASAN` | *ID* Jawaban Anda menukar satu ringkasan dengan ringkasan lain. Bacaan ini tentang apa yang ada di balik ringkasan.<br>*EN* Your answer traded one summary for another. This reading is about what sits behind a summary. |
| `M-D2-SIMPUL` | *ID* Jawaban Anda mengambil kesimpulan dari bukti yang masih sedikit. Bacaan ini tentang kapan sebuah kesimpulan boleh diambil.<br>*EN* Your answer drew a conclusion from thin evidence. This reading is about when a conclusion may be drawn. |
| `M-D2-BALIK` | *ID* Jawaban Anda membalik kesimpulannya. Bacaan ini tentang mengapa keduanya sama-sama melampaui buktinya.<br>*EN* Your answer reversed the conclusion. This reading is about why both go past the evidence. |
| `M-D2-HIAS` | *ID* Jawaban Anda menambahkan syarat pada kesimpulan. Bacaan ini tentang kapan sebuah kesimpulan boleh diambil.<br>*EN* Your answer added a condition to the conclusion. This reading is about when a conclusion may be drawn. |
| `M-D3-SEBAB` | *ID* Jawaban Anda membaca hubungan sebagai sebab. Bacaan ini tentang jarak antara keduanya.<br>*EN* Your answer read a link as a cause. This reading is about the distance between the two. |
| `M-D3-ARAH` | *ID* Jawaban Anda membalik arah sebabnya. Bacaan ini tentang apa yang dibutuhkan sebuah klaim sebab.<br>*EN* Your answer reversed the direction of cause. This reading is about what a causal claim requires. |
| `M-D3-TOLAK` | *ID* Jawaban Anda membuang temuannya. Bacaan ini tentang apa yang masih ditunjukkan sebuah hubungan.<br>*EN* Your answer discarded the finding. This reading is about what a link still shows. |

**Skipped** — *ID* Anda melewati pertanyaan ini. Bacaan ini tetap
disiapkan, karena melewatinya juga memberi tahu sesuatu. / *EN* You skipped
this one. The reading is offered anyway, because skipping tells us
something too.

**Answer already right** (`SUDAH_TEPAT`, label *"Jawaban Anda sudah tepat di
bagian ini"* / *"Your answer here was already right"*) — *ID* Bagian ini
tidak perlu dibaca lebih dulu. Kartunya tetap ditampilkan agar urutannya
terlihat utuh. / *EN* This part does not need reading first. The card is
still shown so the whole order stays visible.

### 3.4 Pelajaran — three lessons, of which the visitor reads one

**Three lessons exist and the visitor reads exactly one.** This is what makes
the reordering meaningful rather than decorative: with a single lesson, the
Peta Bacaan would be a label over a fixed path.

---

**L-D2 · "Kapan sebuah kesimpulan boleh diambil" / "When a conclusion may be drawn"**

> **ID** — Setiap kesimpulan berdiri di atas dua hal: berapa banyak yang
> diamati, dan berapa lama.
>
> Tiga siswa selama satu minggu memberi kita sesuatu, tetapi belum cukup
> untuk memisahkan cara belajar dari hal lain yang terjadi pada minggu yang
> sama. Ujian yang kebetulan lebih mudah, atau kebetulan biasa, bisa
> menghasilkan gambaran yang persis sama.
>
> Yang perlu berubah bukan jawabannya, melainkan kalimatnya. "Cara itu
> berhasil" adalah kesimpulan. "Ini arah yang layak diamati lebih lama"
> adalah pengamatan. Hanya yang kedua jujur hari ini.
>
> Menunda kesimpulan bukan sikap ragu-ragu. Itu cara menjaga agar kesimpulan
> berikutnya masih berarti.

> **EN** — Every conclusion rests on two things: how much was observed, and
> for how long.
>
> Three students over one week give us something, but not enough to separate
> the method from everything else that happened in the same week. An exam
> that happened to be easier, or ordinary chance, would produce the same
> picture.
>
> What has to change is not the answer but the sentence. "The method works"
> is a conclusion. "This is a direction worth watching for longer" is an
> observation. Only the second is honest today.
>
> Holding a conclusion back is not indecision. It is how you keep the next
> conclusion worth something.

*Worked example — "Berapa yang cukup?" / "How much is enough?"*
1. *ID* Tanyakan dulu: berapa banyak yang diamati? Tiga. / *EN* Ask first: how many were observed? Three.
2. *ID* Lalu: berapa lama? Satu minggu. / *EN* Then: for how long? One week.
3. *ID* Lalu: apa lagi yang berubah pada waktu yang sama, dan adakah kelompok serupa yang tidak mencobanya? Tanpa pembanding, buktinya belum memisahkan apa pun. / *EN* Then: what else changed over the same period, and was there a similar group that did not try it? Without something to compare against, the evidence has not separated anything yet.

---

**L-D3 · "Berhubungan, atau menyebabkan" / "Linked, or causing"**

> **ID** — Dua hal yang bergerak bersama disebut berhubungan. Itu temuan
> yang nyata dan sering berguna.
>
> Sebab adalah klaim yang jauh lebih besar. Untuk mengatakan A menyebabkan
> B, kita perlu menyingkirkan dua kemungkinan lain: bahwa B yang menyebabkan
> A, dan bahwa ada hal ketiga yang menggerakkan keduanya.
>
> Pada contoh bekal dan nilai, hal ketiga itu mudah dibayangkan — keadaan di
> rumah bisa memengaruhi keduanya. Selama itu belum diperiksa, kata yang
> tepat adalah "berhubungan", bukan "menyebabkan".
>
> Yang juga keliru adalah membuang temuannya. Hubungan yang belum dijelaskan
> tetap menunjukkan ke mana harus melihat berikutnya.

> **EN** — Two things that move together are linked. That is a real finding
> and often a useful one.
>
> Cause is a far larger claim. To say A causes B, two other possibilities
> have to be ruled out: that B causes A, and that some third thing moves
> both.
>
> In the lunch-and-grades example the third thing is easy to imagine — a
> home circumstance could shape both. Until that has been examined, the
> accurate word is "linked", not "causes".
>
> Discarding the finding is the opposite error. A link you cannot yet
> explain still shows you where to look next.

*Worked example — "Menguji sebuah klaim sebab" / "Testing a causal claim"*
1. *ID* Sebutkan klaimnya: membawa bekal meningkatkan nilai. / *EN* State the claim: bringing lunch raises grades.
2. *ID* Balik arahnya: mungkinkah nilai yang tinggi membuat siswa membawa bekal? Jika belum bisa disingkirkan, klaimnya belum berdiri. / *EN* Reverse it: could higher grades be what leads students to bring lunch? If you cannot rule that out, the claim is not standing yet.
3. *ID* Cari hal ketiga: adakah sesuatu yang memengaruhi keduanya? Jika ada, klaim sebab belum boleh diambil. / *EN* Look for a third thing: is there something shaping both? If there is, the causal claim cannot be made yet.

---

**L-D1 · "Sebuah angka dan dasarnya" / "A number and what it counts"**

> **ID** — Persentase adalah perbandingan, dan sebuah perbandingan belum
> lengkap tanpa apa yang dibandingkan.
>
> "85% lulus" bisa berarti 17 dari 20 siswa, atau 850 dari 1.000. Keduanya
> ditulis 85%, dan masing-masing menuntut tanggapan yang berbeda. Pada 20
> siswa, tiga orang yang belum lulus adalah tiga nama yang bisa didampingi
> minggu depan. Pada 1.000 siswa, 150 orang adalah persoalan dengan bentuk
> yang lain.
>
> Karena itu pertanyaan pertama untuk setiap persentase selalu sama: dari
> berapa?
>
> Pertanyaan kedua hampir sama pentingnya: siapa yang tidak ikut dihitung?

> **EN** — A percentage is a ratio, and a ratio is not complete without
> what it is a ratio of.
>
> "85% passed" can mean 17 students out of 20, or 850 out of 1,000. Both are
> written 85%, and each asks for a different response. At 20 students, three
> who have not passed are three names you can sit with next week. At 1,000,
> a hundred and fifty is a problem of a different shape.
>
> So the first question for any percentage is always the same: out of how
> many?
>
> The second matters nearly as much: who was left out of the count?

*Worked example — "Membaca 85%" / "Reading 85%"*
1. *ID* Tulis ulang sebagai pecahan: 85 dari 100. / *EN* Rewrite it as a fraction: 85 out of 100.
2. *ID* Ganti dasarnya: 85% dari 20 siswa adalah 17 orang; 85% dari 1.000 adalah 850 orang. / *EN* Change the base: 85% of 20 students is 17 people; 85% of 1,000 is 850.
3. *ID* Tanyakan siapa yang tidak masuk hitungan — misalnya siswa yang tidak hadir saat ujian. / *EN* Ask who is outside the count — the students who were absent on the day, for instance.

### 3.5 Uji Penguasaan — two questions per domain

Six items, **disjoint from the Pemetaan Awal set**. The visitor answers the
two belonging to the lesson they read.

**U-D2-1** — *ID* Sebuah program baru dicoba di dua kelas selama satu
semester, dan hasilnya membaik. Mana yang paling menambah kekuatan
buktinya? / *EN* A new programme runs in two classes for a semester and
results improve. Which of these adds the most to the strength of the
evidence?
**A ✓** Membandingkan dengan kelas serupa yang tidak mengikuti program. / Comparing with similar classes that did not take part.
**B** Menambah jumlah kelas yang mengikuti program. / Adding more classes to the programme.
**C** Memperpanjang program menjadi dua semester. / Extending the programme to two semesters.
**D** Mengumpulkan pendapat guru tentang program itu. / Gathering the teachers' views on the programme.

**U-D2-2** — *ID* Manakah kalimat yang paling tepat ketika buktinya masih
sedikit? / *EN* Which sentence is the most accurate when the evidence is
still thin?
**A ✓** "Kami belum bisa menyimpulkan, dan kami akan terus mengamati." / "We cannot conclude yet, and we are continuing to watch."
**B** "Sementara ini kami menyimpulkan program ini berhasil." / "For now we conclude that the programme works."
**C** "Kami tidak menemukan apa-apa." / "We found nothing."
**D** "Program ini berhasil untuk sebagian siswa." / "The programme works for some students."

**U-D3-1** — *ID* Siswa yang mengikuti klub membaca cenderung punya nilai
bahasa lebih tinggi. Sebelum mengatakan klub itu meningkatkan nilai, apa
yang perlu diperiksa? / *EN* Students in the reading club tend to have
higher language grades. Before saying the club raises grades, what needs
checking?
**A ✓** Apakah siswa yang memang sudah suka membaca yang cenderung mendaftar. / Whether it is students who already like reading who tend to join.
**B** Berapa jumlah anggota klub. / How many members the club has.
**C** Siapa yang mendirikan klub itu. / Who founded the club.
**D** Apakah klub itu populer. / Whether the club is popular.

**U-D3-2** — *ID* Sebuah hubungan ditemukan, tetapi sebabnya belum jelas.
Tindakan mana yang paling tepat? / *EN* A link is found but its cause is not
clear. Which action is most appropriate?
**A ✓** Catat hubungannya, sebutkan bahwa sebabnya belum diketahui, dan rencanakan cara memeriksanya. / Record the link, say that the cause is not known, and plan how to examine it.
**B** Abaikan temuan itu sampai ada bukti sebab. / Set the finding aside until there is causal evidence.
**C** Umumkan hubungannya sebagai sebab, dengan catatan kecil. / Announce the link as a cause, with a small footnote.
**D** Cari data lain yang mendukung sebab yang sudah diduga. / Look for other data supporting the cause you already suspect.

**U-D1-1** — *ID* Dua sekolah sama-sama melaporkan kehadiran 90%. Sekolah A
punya 100 siswa, sekolah B punya 1.000. Apa yang paling tepat dikatakan? /
*EN* Two schools both report 90% attendance. School A has 100 students,
school B has 1,000. What is the most accurate thing to say?
**A ✓** Jumlah siswa yang sering tidak hadir jauh berbeda, meskipun persentasenya sama. / The number of frequently absent students differs greatly, even though the percentage is identical.
**B** Kedua sekolah menghadapi persoalan yang sama besar. / Both schools face a problem of the same size.
**C** Sekolah B lebih berhasil karena siswanya lebih banyak. / School B is doing better because it has more students.
**D** Karena persentasenya sama, penanganannya boleh sama. / Because the percentage is the same, the response can be the same.

**U-D1-2** — *ID* Sebuah laporan menulis "70% peserta puas". Manakah
pertanyaan yang paling membantu membacanya? / *EN* A report says "70% of
participants were satisfied". Which question helps most in reading it?
**A ✓** Dari berapa peserta, dan siapa yang tidak menjawab. / Out of how many participants, and who did not reply.
**B** Apakah 70% termasuk tinggi. / Whether 70% counts as high.
**C** Bagaimana cara menaikkannya. / How to raise it.
**D** Apakah tahun lalu lebih tinggi. / Whether last year was higher.

### 3.6 Assistance — two levels, neither naming the answer

Per lesson, staged. Level 1 is a direction of thinking; level 2 is a first
step. Both are written so that they could not name or narrow to the correct
option — the rule INV-02 enforces in the product, honoured here by
authoring.

| | **ARAH** (level 1) | **PETUNJUK** (level 2) |
|---|---|---|
| **D1** | *ID* Tanyakan apa yang ada di bawah persentase itu.<br>*EN* Ask what sits underneath the percentage. | *ID* Coba tulis ulang angkanya sebagai "sekian dari sekian", lalu lihat mana yang belum Anda ketahui.<br>*EN* Try rewriting it as "so many out of so many", then see which part you do not have. |
| **D2** | *ID* Tanyakan berapa banyak, dan berapa lama.<br>*EN* Ask how many, and for how long. | *ID* Bayangkan apa lagi yang mungkin berubah pada waktu yang sama.<br>*EN* Picture what else might have changed over the same period. |
| **D3** | *ID* Tanyakan apakah ada kemungkinan lain selain yang disebutkan.<br>*EN* Ask whether there is another possibility besides the one stated. | *ID* Coba balik arahnya, lalu cari sesuatu yang bisa memengaruhi keduanya.<br>*EN* Try reversing the direction, then look for something that could shape both. |

### 3.7 The time budget, measured

**CORRECTION.** `../EXPERIENCE-ARCHITECTURE.md` §F put step times against
the clock — Pemetaan Awal at 0:10–0:55, Hasil at 2:40–3:00 — and those
markers were asserted, not measured. Counting the words tells a different
story, and it is better that you hear it from me than discover it in a
usability session.

At **180 words per minute** for a fluent adult reading a multiple-choice
question, plus a realistic **five seconds of decision** per question:

| Step | Words (ID) | Time |
|---|---|---|
| 0 · Threshold | 12 | 0:06 |
| 1 · Pemetaan Awal, 3 × (stem + 4 options) | 3 × ~50 | 1:06 |
| 2 · Peta Bacaan | ~58 | 0:22 |
| 3 · Pelajaran, body + worked example | ~130 | 0:48 |
| 4 · Uji Penguasaan, 2 × (stem + 4 options) | 2 × ~46 | 0:40 |
| 5 · Hasil | ~44 | 0:15 |
| **Journey subtotal** | | **3:17** |
| 6 · The reveal | ~68 | 0:23 |
| 7 · Return | ~40 | 0:14 |
| **Total** | **~740** | **3:54** |

A fast reader at 260 wpm who decides quickly completes the journey in about
**2:20** and the whole thing in about **2:45**. A careful reader takes
**3:54**.

**So the honest figure is 2:20–3:55, not 2–3 minutes.** The lesson bodies in
§3.4 have already been trimmed by about 25 % from the first draft to buy
back roughly fifteen seconds; that is the cut available without damage.

**What I did not do, and why.** The obvious way to reach three minutes flat
is to drop Pemetaan Awal from three questions to two. I have not done it,
because the Peta Bacaan would then carry two cards instead of three and the
adaptation would look thinner than it is — which is precisely the failure
your brief names ("do not make it so short that adaptation becomes
meaningless"). Three questions is the smallest number that produces a map
worth reading.

**RULED (product owner, 2026-09-18).** The public promise is
*"sekitar tiga menit" / "about three minutes"*, and all three Pemetaan Awal
questions are kept. Over-promising two minutes and delivering four would be
a small dishonesty on a website whose entire argument is that PINTAR does
not overstate. Every remaining "dua menit / two minutes" string in the
website documents, the wireframes and the ADR has been reconciled to this
figure; STOP-7 is closed in §12 with the ruling recorded against it.

---

## 4 · Deterministic adaptation

**No randomness anywhere.** Same answers → same map → same lesson → same
check questions → same result. No shuffling, no sampling, no time-dependent
behaviour, no A/B branch. The property is testable by replay, and it is what
lets a salesperson walk an institution through the same journey twice.

### 4.1 Pemetaan Awal → Peta Bacaan

For each domain the visitor's answer is `correct`, a named misconception, or
`skipped`.

```
needs   = domains where the answer was a misconception or a skip
right   = domains where the answer was correct

if needs is empty:
    every card SUDAH_TEPAT, ordered by severity descending,
    plus D2 promoted to DISARANKAN as an extension reading
else:
    highest-severity member of needs      → PERLU_SEGERA  "Baca ini lebih dulu"
    remaining members of needs            → WAJIB         "Perlu dibaca"
    members of right                      → SUDAH_TEPAT   "Jawaban Anda sudah tepat…"
    order: PERLU_SEGERA, then WAJIB by severity desc, then SUDAH_TEPAT by severity desc
```

The lesson served at step 3 is the one attached to the **first card**.

**The all-correct path is designed, not patched.** A visitor who answers all
three correctly is told so, and is offered a reading that deepens rather
than repairs: *"Tidak ada yang perlu diperbaiki lebih dulu. Ini bacaan yang
memperdalam."* / *"Nothing needs repairing first. This reading goes
deeper."* No weakness is manufactured to keep the journey symmetrical — the
brief forbids it and the doctrine forbids it.

### 4.2 Uji Penguasaan → Hasil

Two answers, each `correct`, a misconception, or `skipped`.

| Condition | Outcome | What it says |
|---|---|---|
| any answer skipped | `BELUM_CUKUP` | The visitor's own honest signal is that they do not know; the demonstration does not overrule it |
| 2 correct | `KONSISTEN` | Consistent with having understood the reading — **bounded**, never "mastered" |
| 1 correct | `BELUM_CUKUP` | One of two cannot separate understanding from a good guess |
| 0 correct | `PERLU_PERHATIAN` | Names what is worth reading again — **not** a mastery verdict |

**`BELUM_CUKUP` is reachable by ordinary routes — but it is not the modal
one, and the first draft of this document claimed it was.** That claim does
not survive scrutiny: the two check questions come immediately after the
lesson that answers them, so an attentive visitor will usually get both
right. The honest description is that `BELUM_CUKUP` is reached by one
correct answer out of two, or by any skip — both ordinary, neither rare —
while the outcome most visitors see is `KONSISTEN`.

**The doctrine is therefore carried by the limit statement, not by the
outcome distribution.** Every outcome, `KONSISTEN` included, says that two
questions cannot judge anyone's mastery. That is what makes the
demonstration honest, and it does not depend on most visitors being told
they fell short.

If you would rather `BELUM_CUKUP` were the *modal* outcome, the check
questions have to be materially harder — which is a different product
choice with a real cost: a demonstration that leaves a visiting principal
feeling caught out. My recommendation is the design as written. It is your
call, and §12 carries it.

**There is no delta, and the demonstration says why.** Pemetaan Awal and Uji
Penguasaan ask about different things and share no items, so a before/after
number would be a comparison nobody made. Where the product would show a
delta, Mini-PINTAR shows a sentence:

> *ID* Pemetaan Awal dan Uji Penguasaan menanyakan hal yang berbeda, jadi
> keduanya tidak dibandingkan.
> *EN* Initial Mapping and the Mastery Check ask about different things, so
> the two are not compared.

Refusing to compute a flattering number is a stronger demonstration than any
number would have been.

---

## 5 · Every reachable path

**Pemetaan Awal**: 4 options + skip, three questions → **125 input states**,
collapsing to **8 map shapes** (each domain needs-or-not) × the specific
misconception that colours each card's reason.

**Lesson served**: one of 3 (D2, D3, D1 by severity), or the D2 extension
framing on the all-correct path → **4 distinct lesson presentations**.

**Uji Penguasaan**: 4 options + skip, two questions → 25 input states per
lesson, collapsing to **3 outcomes**.

**Terminal states: 3 × 4 = 12 distinct Hasil presentations**, and every one
of them is written — none is generated by template substitution, because a
generated sentence is how a system starts saying things nobody approved.

**Exits available at every step:** *Keluar* (returns to the corporate site,
§7), browser back, and — from Hasil and the reveal only — *Ulangi* (restart
from the threshold with a clean state).

**Adversarial paths, and what happens:**

| Path | Behaviour |
|---|---|
| Skip everything | Map offers all three readings with the skip reason; Hasil is `BELUM_CUKUP`. No error state, no scolding. |
| Reload mid-journey | Restarts from the threshold. State is in memory only (§6), so this is the honest consequence of keeping nothing. Stated at the threshold in advance. |
| Language switch mid-journey | Position and answers preserved; content swaps. Adaptation is identical in both languages. |
| Back button mid-journey | Returns to the previous step with the previous answer shown and changeable. Answers are not locked. |
| Answer, go back, change it | Permitted. The map recomputes. Nothing is "submitted", so nothing is being gamed. |
| Open devtools and read the key | Possible by design (§1). The content is demonstration content that exists in no bank. |
| Deep-link to `/coba/hasil` | Redirects to the threshold. There is no result to show someone who has not been through it. |

---

## 6 · Zero-write isolation, proved by design

Five properties. Each is a structural fact, not a rule someone must remember.

1. **No request carries an answer.** The only network activity is fetching
   static assets. There is no endpoint that accepts a response, so there is
   nothing to secure, rate-limit or audit.
2. **No database object is touched.** No session, response, evidence row,
   Person, Institution, Enrollment or Academic Period is created, read or
   updated. `assert_public_surface()` and `functions_executable_by_anon`
   report exactly what they reported before.
3. **No persistence, including on the visitor's own device.** No
   `localStorage`, no `sessionStorage`, no IndexedDB, no cookie. State is a
   single in-memory object for the tab's lifetime and closing the tab ends
   it. **DECISION:** this is stronger than required, and it is the only
   reading under which *"tidak ada catatan tentang Anda"* is literally true.
   The cost — a reload restarts the journey — is disclosed at the threshold
   and is about three minutes.
4. **No product content is present.** The bundle contains only the content
   in §3, authored for this purpose. INV-01 is untouched because no product
   item's key is published (ADR-0021, *Security implications*).
5. **No identity of any kind is requested, derived or inferred.** No email,
   no account, no fingerprint, no visitor id — so the demonstration has
   nothing to link, nothing to profile, and nothing to lose.

**Analytics (R8).** Four counters — `demo_started`, `demo_step_completed`
(step identifier only), `demo_finished`, `language` — and **never** an
answer, a selected option, a misconception code, an outcome, hesitation
timing, or a response distribution. An answer distribution is a set of
educational responses; counting it would be the beginning of a psychometric
dataset built from people who never consented to being measured, which is
the violation this whole design exists to avoid. Per R8's own condition: if
these four cannot be implemented without identifiers or tracking machinery,
**V1 ships with no analytics.** Carried as STOP-2 in §12.

---

## 7 · Corporate → Mini-PINTAR → Corporate

The crossing is designed in both directions, because a visitor who does not
notice they have crossed will read the demonstration as more marketing.

**Entering.** From the homepage invitation (~40 % depth, per R10) to
`/coba`. Over roughly 400 ms: the corporate header recedes to a single quiet
*Keluar*; the marketing type scale steps down to the product scale; the
ground shifts from the corporate surface to the product's `#FBFAF7`; the
footer is gone. Under `prefers-reduced-motion`, the same end state arrives
without the transition. Then one line and one button — nothing else on the
screen:

> **ID** Sekitar tiga menit. Tidak ada akun, tidak ada data yang disimpan.  `[ Mulai ]`
> **EN** About three minutes. No account, nothing kept about you.  `[ Start ]`

That sentence is the first of exactly **two** honesty statements in the whole
experience (the second is at the end, §11). The brief asked for elegance over
a disclaimer wall, and two sentences is what that costs.

**Inside.** No corporate navigation, no CTA, no cookie banner, no chat
widget, no newsletter. One step at a time. The only persistent affordances
are *Keluar*, the language control, and the step indicator.

**Leaving.** Two doors, deliberately different:

- **Keluar mid-journey** → returns to the homepage *at the invitation
  section*, not the top. The visitor resumes where they left the argument.
- **Finishing** → the reveal (§11), then three doors rather than one CTA:
  *Apa artinya bagi pendidik* · *Bagaimana PINTAR menjaga bukti* · *Bicara
  dengan kami*. A single CTA after a three-minute experience wastes the one
  moment the visitor is most willing to go further, by guessing which
  direction they want.

---

## 8 · Wireframes

Rendered, greyscale, structural — layout and behaviour only, no visual
design. In `website/mini-pintar/wireframes/`:

| File | Contents |
|---|---|
| `desktop-01-threshold-to-lesson.png` | Steps 0–3, desktop |
| `desktop-02-check-to-return.png` | Steps 4–7, desktop |
| `mobile-01-threshold-to-lesson.png` | Steps 0–3, 390 px |
| `mobile-02-check-to-return.png` | Steps 4–7, 390 px |
| `detail-belum-cukup-bukti.png` | The `BELUM_CUKUP` Hasil, both widths |

Each frame is annotated with its interaction and accessibility behaviour.
Visual direction (colour, type, photography) is deliberately **not** applied
— that is stage H of the process and comes after this review.

---

## 9 · Desktop and mobile

Designed separately, not stacked.

| | Desktop ≥ 1024 px | Mobile < 768 px |
|---|---|---|
| **Measure** | Content column max 34 rem, centred. The experience never uses the full width — it is one person reading. | 16 px side gutters, single column |
| **Options** | Full-width cards in the column, 56 px min height | Same cards, 56 px min height, thumb-reachable |
| **Peta Bacaan** | Three cards stacked vertically, tier label above each | Identical — the vertical order *is* the meaning, so it survives narrowing untouched |
| **Worked example** | Steps revealed in place, one button below | Same; the button stays above the fold after each reveal |
| **Uji Penguasaan** | Timer and *Tandai* on one line above the stem | Timer and *Tandai* on one line, 14 px, never wrapping to two |
| **Assistance pill** | Inline below the options, never a modal | Inline, above the keyboard safe area |
| **Reveal** | Five steps as a vertical path with annotations right | Five steps as a vertical path with annotations beneath each |
| **Primary action** | Bottom of the column | **Sticky at the bottom** once the visitor has chosen, so no scroll is needed to continue |

Two mobile-specific decisions. **The reveal is vertical on both** — a
horizontal five-step diagram that becomes vertical on mobile is two
different diagrams, and the vertical one is better on both. **Nothing
depends on hover** anywhere in the experience, so there is no interaction
that exists only on desktop.

No horizontal overflow at 320 px. No text below 14 px except the step
indicator at 12 px. Tested at 320, 390, 768, 1024, 1440.

---

## 10 · Accessibility

Designed in, not audited on.

- **Keyboard completes the whole journey.** Tab to options, Space/Enter to
  choose, Enter on the primary action to continue. No pointer-only path
  exists.
- **Options are a real radio group** (`role="radiogroup"`, arrow keys move
  within it), not clickable divs. Choosing does not auto-advance — the
  visitor confirms, so a mis-keyed arrow never loses their place.
- **Focus moves deliberately on step change:** to the step's `h1`, which is
  `tabindex="-1"`, and the step is announced by an `aria-live="polite"`
  region naming the step and its position ("Pemetaan Awal, pertanyaan 2 dari
  3"). Focus is never trapped and never left on a removed element.
- **The assistance pill is not gated behind a timer.** The hesitation window
  still offers it after ~20 seconds of inactivity, *and* a persistent
  *Perlu arah?* button is available from the moment each check question
  appears. A screen-reader user reading at their own pace must not have to
  race a timer to be offered help — and removing the dependency also removes
  the WCAG 2.2.1 timing question entirely. When the pill appears on its own
  it is announced politely and **does not take focus**.
- **The counting-up timer is decorative** and marked `aria-hidden`. It
  imposes no limit; announcing it every second would be intolerable and
  would imply a limit that does not exist.
- **Semantic headings** — one `h1` per step, in document order, no skipped
  levels. Progress dots have a text equivalent.
- **`prefers-reduced-motion`** removes the threshold transition, the card
  reordering animation and the worked-example reveal animation. Every one of
  them has a static end state that carries the same meaning — which is only
  possible because no meaning is carried by motion alone.
- **Contrast** — all text meets 4.5:1, all non-text UI 3:1, at the corporate
  palette's `#245F55` on `#FBFAF7` and every semantic tone.
- **Touch targets** ≥ 44 × 44 px with ≥ 8 px separation.
- **Zoom to 200 %** with no loss of content or function; the layout reflows
  rather than scrolling horizontally.
- **Bilingual expansion** — every component is checked at both lengths;
  none depends on a specific string length.
- **Language** — `lang` is correct on `<html>` and the switch updates it, so
  a screen reader changes voice with the content.

---

## 11 · The evidence limit and the reveal

### 11.1 The limit, in all three outcomes

Every Hasil carries it. **Including `KONSISTEN`** — especially `KONSISTEN`,
because that is the outcome where the temptation to stay quiet is greatest.

The outcome was called `DIDUKUNG` ("supported") in the first draft and is
renamed here. Two questions cannot *support* a conclusion about mastery, so
naming the best outcome "supported" would have contradicted the limit
statement printed directly beneath it. `KONSISTEN` claims exactly what the
evidence permits: the answers are consistent with having understood the
reading.

> **ID** Ini cukup untuk satu bacaan kecil. Belum cukup untuk menilai
> penguasaan seseorang.
> **EN** Enough for one small reading. Not enough to judge anyone's mastery.

The three outcome headlines:

| Outcome | ID | EN |
|---|---|---|
| `KONSISTEN` | **Dua jawaban Anda sejalan dengan bacaan itu.** | **Both your answers are consistent with the reading.** |
| `BELUM_CUKUP` | **Belum cukup bukti.** Dua pertanyaan belum cukup untuk menyimpulkan penguasaan. Itu bukan kekurangan Anda — itu batas buktinya. | **Not yet enough evidence.** Two questions are not enough to conclude anything about mastery. That is not a shortcoming in you — it is the limit of the evidence. |
| `PERLU_PERHATIAN` | **Ada bagian yang layak dibaca ulang.** Dua pertanyaan tadi belum tepat, dan itu menunjukkan bagian mana — bukan ukuran penguasaan Anda. | **There is a part worth reading again.** Both answers were not yet right, and that shows you which part — not a measure of your mastery. |

Note what none of them says: no percentage, no score, no "you scored", no
"failed", no "passed". The Voice Guide's *belum*, not *tidak*, throughout.

### 11.2 The reveal

**Itu tadi PINTAR.** / **That was PINTAR.** Then the path they walked, each
step annotated with what actually happened:

| Step | ID | EN |
|---|---|---|
| **Pemetaan Awal** | Jawaban Anda bukan nilai. Jawaban Anda adalah bukti. | Your answers were not a score. They were evidence. |
| **Peta Bacaan** | Urutannya berubah karena jawaban Anda. Ini urutan, bukan peringkat. | The order changed because of your answers. It is an order, not a ranking. |
| **Pelajaran** | Anda diberi satu langkah berikutnya, bukan seluruh buku. | You were given one next step, not the whole book. |
| **Uji Penguasaan** | Bantuan tersedia, dan tidak pernah menyebut jawabannya. | Help was there, and never named the answer. |
| **Hasil** | PINTAR menyebut apa yang didukung bukti, dan menyebut batasnya. | PINTAR said what the evidence supports, and said where it ends. |

**Closing line — revised per R9:**

> **ID** PINTAR tidak sekadar memberi soal dan nilai. PINTAR menunjukkan apa
> yang didukung bukti saat ini, dan membantu Anda memilih langkah
> berikutnya.
>
> **EN** PINTAR does not simply hand out questions and a score. It shows
> what the evidence supports right now, and helps you choose what comes
> next.

The correction matters and I have kept it in the grammar, not only in the
wording: in both languages the verb PINTAR performs is *menunjukkan /
shows* and *membantu / helps*, and the verb the human performs is *memilih /
choose*. The system never holds the deciding verb.

**The second honesty statement**, immediately below, then the three doors:

> **ID** Yang barusan adalah miniatur publik: bukan asesmen resmi, tidak
> menghasilkan sertifikat, dan tidak meninggalkan catatan tentang Anda.
> **EN** What you just did is a public miniature: not an official
> assessment, it issues no certificate, and it leaves no record of you.

---

## 12 · Remaining STOP items

| # | Item | Blocks | Owner |
|---|---|---|---|
| **STOP-1** | **Baseline amendment owed.** Doc 09 must move the public Mini-PINTAR experience FOUNDATION NOW → BUILD NOW; doc 11 must mark OD-11 RESOLVED against ADR-0021. Both are frozen documents: new bytes, new `baseline` identity, in-document marker, manifest regenerated. Until it lands, doc 11 contradicts the ADR. | Not implementation — but it should not ship publicly with the baseline disagreeing with itself | Engineering, on your instruction |
| **STOP-2** | **Analytics feasibility (R8).** Whether four counters can be implemented with no identifier and no tracking machinery is an implementation question with a privacy consequence. R8's own fallback applies if not: ship V1 with none. | Instrumentation only | Me, at implementation; you if a privacy decision appears |
| ~~**STOP-3**~~ | **CLOSED 2026-09-18 — content review gate (R4).** §3 approved: "Proceed with 'Membaca Angka / Reading a Number.'" §4.2 approved with the outcome table preserved. §6.3 approved as memory-only. One bounded semantic correction was ruled and is applied in §3.2/§3.3. Native Indonesian editorial review remains required — it did **not** close, it is STOP-4. | Nothing | Closed |
| **STOP-4** | **Native Indonesian read.** The ID content in §3 is authored, not translated, and I am confident in it — but educational copy that a public audience will read deserves a native editorial pass before launch, independent of your content approval. | Public launch | You to assign |
| **STOP-5** | **Domain cutover (R5).** `pintarselalu.com` / `app.pintarselalu.com` — DNS, certificates, and whether the application moves now or later. R5 says do not move application routes yet, so V1 can be built and previewed without it. | Public launch, not build | You / infrastructure |
| **STOP-6** | **Identity asset (R7).** A replaceable slot is designed in; final external release remains blocked on the approved PINTAR SELALU asset, per your ruling. | External release | Separate identity exploration |
| ~~**STOP-7**~~ | **CLOSED 2026-09-18 — duration claim (§3.7).** Ruled: the public promise is *"sekitar tiga menit" / "about three minutes"* and all three Pemetaan Awal questions are kept. Every remaining "dua menit / two minutes" string in §7, `../EXPERIENCE-ARCHITECTURE.md`, the wireframe generator and ADR-0021 is reconciled. The measured range in §3.7 (2:20–3:55) is left as measured. | Nothing | Closed |
| ~~**STOP-8**~~ | **CLOSED 2026-09-18 — modal outcome (§4.2).** Ruled: preserve the outcome table; `BELUM_CUKUP` is **not** to be made artificially modal and the check is **not** to be made materially harder to manufacture the refusal. The doctrine is carried by the evidence-limit statement in every outcome, `KONSISTEN` included. This is now a **standing constraint on future edits**, not merely a closed question. | Nothing | Closed |

**Still open after the M1 gate: STOP-1, STOP-2, STOP-4, STOP-5, STOP-6.**
None of them blocks implementation; STOP-1 and STOP-4 block public launch and
STOP-6 blocks external release. They are carried forward verbatim into the
implementation phase's handoff rather than absorbed — a debt that stops being
written down stops being paid.

---

## 13 · M1 gate outcome

**M1 CONTENT / INTERACTION GATE: PASSED**, 2026-09-18, on the product
owner's ruling. What was decided, in the ruling's own terms:

| Asked | Ruled |
|---|---|
| §3 — the content | **APPROVED.** Proceed with "Membaca Angka / Reading a Number." |
| §3.7 — the duration | **APPROVED.** Public promise is "sekitar tiga menit / about three minutes"; keep all three Pemetaan Awal questions. |
| §4.2 — the outcome table | **APPROVED, preserved.** Do not make `BELUM_CUKUP` artificially modal; do not make the check materially harder to manufacture the refusal. |
| §6.3 — storage | **APPROVED.** Memory-only. No `localStorage`, `sessionStorage`, IndexedDB or cookie for answers, progress, adaptation or outcome. Reload restarts. Corporate-site language preference may remain a separate functional mechanism, but **Mini-PINTAR educational state must never enter it.** |
| adversarial corrections | **ACCEPTED** — adult register, U-D2-1, lesson↔check coherence, `DIDUKUNG`→`KONSISTEN`. |
| ADR-0021 content boundary | **ACCEPTED.** Mini-PINTAR content is never imported from the protected PINTAR item bank. |

**One bounded semantic correction was ruled and is applied** (§3.2, §3.3,
§4.1): a single correct Pemetaan Awal response does not justify *"Sudah Anda
kuasai / Already yours"*, so the third tier's label now describes the
observed answer — *"Jawaban Anda sudah tepat di bagian ini"*. The tier's
function is preserved and the adaptation is not redesigned.

**Scope of the next phase, as instructed:** the already-defined Mini-PINTAR
implementation phase only. Not the rest of the corporate website.

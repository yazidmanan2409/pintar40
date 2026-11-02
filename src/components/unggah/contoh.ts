import { KOLOM, type NamaLembar } from "@/lib/unggah-kontrak";
import { lembarTemplat, tulisBukuKerja, type LembarTulis, type Sel } from "./templat";

/**
 * W1.10 (Batch 3; DG-36): AN EXAMPLE-ONLY WORKBOOK, OFFERED BESIDE THE BLANK TEMPLATE.
 *
 * The earlier example (src/lib/contoh-buku-kerja.ts) is a whole chapter that is also imported and taken by learners in
 * the audit journeys, with its Pemetaan Awal and Uji Penguasaan keys, so it stays withheld (the Second Eye's L4 finding
 * 1). This one is a different thing: a small chapter WRITTEN FOR THIS EXAMPLE ALONE, filled in on every sheet so a
 * teacher sees how each column is filled. None of its questions is a live item: none is in the synthetic corpus
 * (docs/onboarding/konten-sintetis), in an audit fixture or in any real chapter, and STUDIO3B-CONTOH-01 checks the
 * first two. Its course title begins «Contoh — », and its first lesson says it is made up.
 *
 * Built in the browser at the moment of download, from the template's own sheets (lembarTemplat) and the column
 * contract (KOLOM), so it cannot drift from what the reader accepts and nothing is stored or served. The importer has
 * no special case for it: imported on purpose, it is an ordinary draft in the school's Studio, seen by no learner until
 * the normal review and publish steps.
 *
 * Each question names its key by letter (`kunci`), never as a flag beside each option, in the shape the synthetic
 * corpus's generator uses.
 */

export const NAMA_UNDUHAN_CONTOH = "contoh-isian-pelajaran-pintar.xlsx";
/** The course title's mark, as the withheld example's (TANDA_CONTOH in src/lib/contoh-buku-kerja.ts). */
export const TANDA = "Contoh — ";

type Baris = Record<string, string>;

const KURSUS: Baris = {
  title: `${TANDA}Matematika Kelas 4 · Kelipatan Bilangan`,
  subject: "Matematika",
  stage: "SD",
  grade_label: "Kelas 4",
  konteks: "",
};

const BAB: Baris[] = [{ ordinal: "1", title: "Kelipatan Bilangan" }];

const PELAJARAN: Baris[] = [
  {
    module: "1", ordinal: "1", title: "Mengenal Kelipatan",
    summary: "Contoh isian buku kerja: pelajaran ini dikarang untuk menunjukkan cara mengisi setiap kolom.",
    body_markdown: [
      "## Apa itu kelipatan",
      "Kelipatan sebuah bilangan didapat dengan menjumlahkan bilangan itu berulang-ulang. Kelipatan 3 adalah 3, 6, 9, 12, dan seterusnya.",
      "",
      "Cara lain: kalikan bilangan itu dengan 1, 2, 3, 4, dan seterusnya.",
      "- 3 × 1 = 3",
      "- 3 × 2 = 6",
      "- 3 × 3 = 9",
      "",
      "## Memeriksa sebuah kelipatan",
      "Sebuah bilangan adalah kelipatan 3 bila bilangan itu habis dibagi 3, tanpa sisa.",
      "",
      "**Coba:** apakah 14 kelipatan 3?",
      "_Periksa: 14 dibagi 3 hasilnya 4 sisa 2, jadi 14 bukan kelipatan 3._",
    ].join("\n"),
    objective: "Kalian dapat menyebutkan kelipatan sebuah bilangan dan memeriksa apakah sebuah bilangan adalah kelipatannya.",
    bloom: "Memahami", media: "", transcript: "",
  },
  {
    module: "1", ordinal: "2", title: "Kelipatan Persekutuan",
    summary: "Bilangan yang menjadi kelipatan dua bilangan sekaligus.",
    body_markdown: [
      "## Kelipatan yang sama",
      "Kelipatan 2 adalah 2, 4, 6, 8, 10, 12. Kelipatan 3 adalah 3, 6, 9, 12. Bilangan 6 dan 12 ada di kedua daftar.",
      "",
      "Bilangan yang ada di kedua daftar disebut **kelipatan persekutuan**. Yang paling kecil disebut kelipatan persekutuan terkecil.",
      "",
      "**Coba:** sebutkan kelipatan persekutuan terkecil dari 4 dan 6.",
      "_Periksa: kelipatan 4 adalah 4, 8, 12; kelipatan 6 adalah 6, 12. Yang terkecil di keduanya adalah 12._",
    ].join("\n"),
    objective: "Kalian dapat menentukan kelipatan persekutuan terkecil dari dua bilangan kecil.",
    bloom: "Menerapkan", media: "", transcript: "",
  },
];

type Soal = {
  ref: string; pelajaran: string; guna: "" | "Pemetaan awal" | "Cek penguasaan"; sulit: "Mudah" | "Sedang" | "Sulit";
  pertanyaan: string; petunjuk?: string;
  /** The key, by its letter. */
  kunci: string;
  /** Each option: its letter, its text, why it is or is not the answer, and (a wrong one) the misconception it shows. */
  pilihan: ReadonlyArray<readonly [string, string, string, string?]>;
};

const SOAL: readonly Soal[] = [
  {
    ref: "C1", pelajaran: "1", guna: "Pemetaan awal", sulit: "Mudah", kunci: "C",
    pertanyaan: "Bilangan manakah yang termasuk kelipatan 4?",
    pilihan: [
      ["A", "6", "6 dibagi 4 bersisa 2, jadi bukan kelipatan 4.", "CONTOH-M-01"],
      ["B", "10", "10 dibagi 4 bersisa 2, jadi bukan kelipatan 4.", "CONTOH-M-01"],
      ["C", "16", "4 × 4 = 16, jadi 16 adalah kelipatan 4."],
      ["D", "14", "14 dibagi 4 bersisa 2, jadi bukan kelipatan 4.", "CONTOH-M-01"],
    ],
  },
  {
    ref: "C2", pelajaran: "1", guna: "Cek penguasaan", sulit: "Sedang", kunci: "B",
    pertanyaan: "Kelipatan 5 yang keempat adalah ....",
    petunjuk: "Tuliskan kelipatan 5 mulai dari yang pertama.",
    pilihan: [
      ["A", "9", "9 didapat dari 5 + 4; kelipatan didapat dari menjumlahkan 5 berulang.", "CONTOH-M-02"],
      ["B", "20", "5, 10, 15, 20: yang keempat adalah 20."],
      ["C", "54", "54 didapat dengan menuliskan 5 dan 4 berdampingan, bukan dengan menghitung.", "CONTOH-M-02"],
      ["D", "15", "15 adalah kelipatan 5 yang ketiga.", "CONTOH-M-03"],
    ],
  },
  {
    ref: "C3", pelajaran: "2", guna: "Cek penguasaan", sulit: "Sedang", kunci: "D",
    pertanyaan: "Kelipatan persekutuan terkecil dari 3 dan 4 adalah ....",
    pilihan: [
      ["A", "7", "7 adalah 3 + 4, bukan kelipatan keduanya.", "CONTOH-M-02"],
      ["B", "24", "24 kelipatan persekutuan 3 dan 4, tetapi bukan yang terkecil.", "CONTOH-M-03"],
      ["C", "1", "1 bukan kelipatan 3 maupun 4.", "CONTOH-M-01"],
      ["D", "12", "Kelipatan 3: 3, 6, 9, 12; kelipatan 4: 4, 8, 12. Yang terkecil di keduanya 12."],
    ],
  },
  {
    ref: "C4", pelajaran: "1", guna: "", sulit: "Mudah", kunci: "A",
    pertanyaan: "Tiga kelipatan 6 yang pertama adalah ....",
    pilihan: [
      ["A", "6, 12, 18", "6 × 1, 6 × 2 dan 6 × 3."],
      ["B", "6, 7, 8", "Bilangan itu bertambah 1, bukan bertambah 6.", "CONTOH-M-02"],
      ["C", "1, 2, 3", "Itu faktor dari 6, bukan kelipatannya.", "CONTOH-M-01"],
      ["D", "12, 18, 24", "Daftar itu melewatkan kelipatan yang pertama, yaitu 6.", "CONTOH-M-03"],
    ],
  },
  {
    ref: "C5", pelajaran: "2", guna: "", sulit: "Sulit", kunci: "B",
    pertanyaan: "Lampu merah menyala setiap 2 menit dan lampu hijau setiap 5 menit. Keduanya menyala bersama pada menit ke-0. Pada menit ke berapa keduanya menyala bersama lagi?",
    pilihan: [
      ["A", "7", "7 adalah 2 + 5, bukan kelipatan keduanya.", "CONTOH-M-02"],
      ["B", "10", "Kelipatan 2 dan 5 yang terkecil adalah 10."],
      ["C", "5", "5 bukan kelipatan 2.", "CONTOH-M-01"],
      ["D", "20", "20 kelipatan keduanya, tetapi 10 datang lebih dulu.", "CONTOH-M-03"],
    ],
  },
];

const MISKONSEPSI: Baris[] = [
  { code: "CONTOH-M-01", label: "Kelipatan tertukar dengan bilangan sembarang atau faktor",
    description: "Murid memilih bilangan yang tidak habis dibagi, atau faktor dari bilangan itu.",
    remediation: "Bagi bilangan pilihan dengan bilangan yang ditanya dan periksa sisanya." },
  { code: "CONTOH-M-02", label: "Kelipatan dihitung dengan menambah 1 atau menjumlahkan sekali",
    description: "Murid menambahkan dua bilangan sekali, atau menambah 1, alih-alih menjumlahkan bilangan yang sama berulang.",
    remediation: "Tuliskan daftar kelipatan dengan menjumlahkan bilangan yang sama berulang, satu per satu." },
  { code: "CONTOH-M-03", label: "Urutan atau yang terkecil terlewat",
    description: "Murid memilih kelipatan yang benar tetapi bukan yang diminta: urutannya bergeser atau bukan yang terkecil.",
    remediation: "Hitung dari kelipatan pertama dan tandai yang diminta sebelum menjawab." },
];

/** A sheet's rows in the contract's column order. */
function urut(lembar: NamaLembar, baris: readonly Baris[]): Sel[][] {
  return baris.map((b) => KOLOM[lembar].map((k) => b[k.kunci] ?? ""));
}

function barisSoal(): Baris[] {
  return SOAL.map((q) => ({
    ref: q.ref, module: "1", lesson: q.pelajaran, item_type: "Pilihan ganda", stem: q.pertanyaan, stimulus: "",
    petunjuk: q.petunjuk ?? "", use: q.guna || "Latihan", difficulty: q.sulit, parallel_group: "",
  }));
}

function barisPilihan(): Baris[] {
  return SOAL.flatMap((q) => q.pilihan.map(([label, body, rationale, kode]) => ({
    ref: q.ref, label, body, is_correct: label === q.kunci ? "Ya" : "Tidak", rationale, misconception_code: kode ?? "",
  })));
}

/** The example's sheets: the template's guidance and its five sheets, each filled, then «Miskonsepsi». */
export function lembarContoh(): LembarTulis[] {
  const isi: Partial<Record<NamaLembar, Baris[]>> = {
    Kursus: [KURSUS], Bab: BAB, Pelajaran: PELAJARAN, Soal: barisSoal(), Pilihan: barisPilihan(),
  };
  const templat = lembarTemplat().map((l) => {
    const baris = isi[l.nama as NamaLembar];
    return baris ? { ...l, baris: [...l.baris, ...urut(l.nama as NamaLembar, baris)] } : l;
  });
  const judul = templat[1].baris[0][0];
  const gayaJudul = typeof judul === "string" ? undefined : judul.gaya;
  return [
    ...templat,
    {
      nama: "Miskonsepsi",
      baris: [
        KOLOM.Miskonsepsi.map((k): Sel => (gayaJudul === undefined ? k.judul : { teks: k.judul, gaya: gayaJudul })),
        ...urut("Miskonsepsi", MISKONSEPSI),
      ],
      lebar: KOLOM.Miskonsepsi.map((k) => Math.min(48, Math.max(14, k.judul.length + 6))),
      bekukanJudul: true,
    },
  ];
}

/** The example file itself. The same contract always gives the same bytes. */
export function bukuKerjaContohSaja(): Uint8Array {
  return tulisBukuKerja(lembarContoh());
}

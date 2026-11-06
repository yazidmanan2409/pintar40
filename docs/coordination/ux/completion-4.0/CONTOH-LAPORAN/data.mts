/**
 * CONTOH LAPORAN · the simulated school behind the seven sample reports.
 *
 * One invented school (SMP Cahaya Kaliandra), one seed. Every answer is simulated item by item; every
 * figure in every report is computed from those answers, so a total, a percentage, a chart and the
 * sentence that interprets it cannot disagree, inside a report or between reports (Kelas 7A in the
 * Guru report is the same 7A in the Kepala departemen's grid and inside the Dekan's school figures).
 *
 * Nothing here is PINTAR's calculation: the definitions are read from the metric catalogue's own
 * words (metrik.*.arti) and applied simply. Specimen data, never real people.
 */

// ── the seed ─────────────────────────────────────────────────────────────────
function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const acak = mulberry32(20261106);
const normal = () => { let u = 0, v = 0; while (!u) u = acak(); while (!v) v = acak(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const sig = (x: number) => 1 / (1 + Math.exp(-x));

export const SEKOLAH = "SMP Cahaya Kaliandra";
export const TAHUN = "TA 2026/2027";
export const WAKTU = "6 Nov 2026, 07.30 WIB";
export const SOAL_PER_TOPIK = 4;
export const MIN_SAMPEL = 5; // the catalogue's minimum sample for a class figure, as the specimens of C1 show it («perlu 5»)
export const TARGET = 75; // the school's target for a chapter (siklus.ambang), not PINTAR's bands
export const PITA = { mantap: 80, berkembang: 60 }; // PINTAR's fixed bands (kesiapan.catatan)

// ── the packages ─────────────────────────────────────────────────────────────
export type Topik = { nama: string; d: number; ranah: string };
export type Paket = { kode: string; mapel: "Matematika" | "IPA"; kelas: number; bab: string; topik: Topik[]; wajib: number[] };
const R = { bil: "Bilangan", alj: "Aljabar", dat: "Data dan peluang", geo: "Geometri dan pengukuran", zat: "Zat dan perubahannya", ger: "Gerak dan energi", lis: "Listrik dan magnet", ilm: "Kerja ilmiah" };
export const RANAH = Object.values(R);
// `wajib`: the item indices (0–19) that are required items (soal wajib); two per paper.
export const PAKET: Paket[] = [
  { kode: "M7", mapel: "Matematika", kelas: 7, bab: "Bab 2 · Pecahan", wajib: [0, 12], topik: [
    { nama: "Pecahan senilai", d: -1.1, ranah: R.bil }, { nama: "Menyederhanakan pecahan", d: -0.7, ranah: R.bil },
    { nama: "Membandingkan pecahan", d: -0.4, ranah: R.bil }, { nama: "Penjumlahan dan pengurangan pecahan", d: 0.45, ranah: R.bil },
    { nama: "Pecahan campuran", d: 0.75, ranah: R.bil }] },
  { kode: "M8", mapel: "Matematika", kelas: 8, bab: "Bab 3 · Persamaan dan fungsi linear", wajib: [0, 8], topik: [
    { nama: "Bentuk aljabar", d: -0.6, ranah: R.alj }, { nama: "Persamaan linear", d: -0.2, ranah: R.alj },
    { nama: "Fungsi linear", d: 0.3, ranah: R.alj }, { nama: "Membaca grafik", d: -0.3, ranah: R.dat }, { nama: "Menafsirkan tabel", d: -0.5, ranah: R.dat }] },
  { kode: "M9", mapel: "Matematika", kelas: 9, bab: "Bab 2 · Bangun ruang", wajib: [0, 8], topik: [
    { nama: "Jaring-jaring", d: 0.4, ranah: R.geo }, { nama: "Luas permukaan", d: 1.4, ranah: R.geo },
    { nama: "Volume", d: 1.3, ranah: R.geo }, { nama: "Skala", d: -0.4, ranah: R.bil }, { nama: "Menaksir ukuran", d: 1.1, ranah: R.geo }] },
  { kode: "I7", mapel: "IPA", kelas: 7, bab: "Bab 1 · Zat dan wujudnya", wajib: [0, 4], topik: [
    { nama: "Wujud zat", d: -1.0, ranah: R.zat }, { nama: "Perubahan wujud", d: -0.5, ranah: R.zat },
    { nama: "Massa jenis", d: 0.5, ranah: R.zat }, { nama: "Campuran dan larutan", d: 0.1, ranah: R.zat }, { nama: "Mengamati dan mencatat", d: -0.3, ranah: R.ilm }] },
  { kode: "I8", mapel: "IPA", kelas: 8, bab: "Bab 2 · Gerak dan gaya", wajib: [0, 4], topik: [
    { nama: "Gerak lurus", d: -0.5, ranah: R.ger }, { nama: "Gaya", d: -0.2, ranah: R.ger },
    { nama: "Hukum Newton", d: 0.4, ranah: R.ger }, { nama: "Usaha dan energi", d: 0.3, ranah: R.ger }, { nama: "Membaca data percobaan", d: -0.1, ranah: R.ilm }] },
  { kode: "I9", mapel: "IPA", kelas: 9, bab: "Bab 3 · Listrik", wajib: [0, 4], topik: [
    { nama: "Muatan listrik", d: 0.6, ranah: R.lis }, { nama: "Rangkaian listrik", d: 1.2, ranah: R.lis },
    { nama: "Hukum Ohm", d: 1.5, ranah: R.lis }, { nama: "Energi listrik", d: 0.6, ranah: R.ger }, { nama: "Keselamatan listrik", d: -0.6, ranah: R.lis }] },
];
// The one recurring misunderstanding coded in M7's Penjumlahan items (12–15): adding tops and bottoms.
export const MISKONSEPSI = {
  kode: "M7", soal: [12, 13, 14, 15],
  nama: "Menjumlahkan pembilang dengan pembilang dan penyebut dengan penyebut",
  contoh: "1/2 + 1/3 = 2/5",
  saran: "Mulai dari gambar: tunjukkan dengan pita pecahan bahwa 1/2 + 1/3 lebih dari 1/2, lalu samakan penyebut sebelum menjumlahkan.",
};

// ── people ───────────────────────────────────────────────────────────────────
const DEPAN = ["Adi", "Ayu", "Bima", "Citra", "Dimas", "Eka", "Fajar", "Fitri", "Galih", "Gita", "Hana", "Indra", "Intan", "Joko", "Kirana", "Laras", "Maya", "Nanda", "Nadia", "Oki", "Putri", "Raka", "Rani", "Rizky", "Sari", "Satria", "Tari", "Teguh", "Umi", "Wulan", "Yoga", "Zahra", "Arif", "Bayu", "Dinda", "Farah", "Kevin", "Lina", "Mega", "Niko", "Rendra", "Salsa", "Tegar", "Vina", "Wahyu", "Yuni", "Aldi", "Bella", "Danu", "Elsa"];
const BELAKANG = ["Pratama", "Lestari", "Wibowo", "Kusuma", "Saputra", "Anggraini", "Nugroho", "Permata", "Santoso", "Rahayu", "Hidayat", "Maharani", "Setiawan", "Purnama", "Wijaya", "Utami", "Siregar", "Lubis", "Nasution", "Hasibuan", "Simanjuntak", "Sihombing", "Tanjung", "Harahap"];
const dipakai = new Set<string>(["Bagas Pratama"]);
function namaBaru(): string { for (;;) { const n = `${DEPAN[Math.floor(acak() * DEPAN.length)]} ${BELAKANG[Math.floor(acak() * BELAKANG.length)]}`; if (!dipakai.has(n)) { dipakai.add(n); return n; } } }

// ── answers ──────────────────────────────────────────────────────────────────
export type Lembar = { benar: boolean[]; keliru: boolean[] /* chose the coded misconception, per item */ };
export type HasilMurid = { paket: Paket; awal?: Lembar; akhir?: Lembar };
/** Why someone cannot sign in yet, as PINTAR knows it: their data still waits in Pendataan; no class card has been
 *  made; or a card exists and its first sign-in has not happened (the account is still waiting to be activated). */
export type Alasan = "data" | "kartu" | "aktivasi";
export type Murid = { nama: string; kelas: string; akun: boolean; alasan?: Alasan; hasil: Record<string, HasilMurid> };
export type Kelas = { nama: string; tingkat: number; murid: Murid[] };

function kerjakan(p: Paket, kemampuan: number): Lembar {
  const benar: boolean[] = [], keliru: boolean[] = [];
  p.topik.forEach((t, ti) => { for (let i = 0; i < SOAL_PER_TOPIK; i++) {
    // A required item checks what nobody may leave without: it is easier than its topic.
    const d = p.wajib.includes(ti * SOAL_PER_TOPIK + i) ? t.d - 2.2 : t.d;
    const b = acak() < sig(kemampuan - d + 0.25 * normal()); benar.push(b);
    keliru.push(!b && p.kode === MISKONSEPSI.kode && acak() < 0.42);
  } });
  return { benar, keliru };
}
// Each class: its size, its offset, how many took each paper so far, how many still have no account.
const KELAS_RENCANA: Record<string, { n: number; geser: number; akhir: number; awal: number; tanpaAkun: number; kelompokLemah: number }> = {
  "7A": { n: 32, geser: 0.15, akhir: 29, awal: 30, tanpaAkun: 1, kelompokLemah: 0.28 },
  "7B": { n: 31, geser: 0.35, akhir: 30, awal: 31, tanpaAkun: 0, kelompokLemah: 0.2 },
  "7C": { n: 30, geser: -0.1, akhir: 27, awal: 29, tanpaAkun: 2, kelompokLemah: 0.35 },
  "7D": { n: 32, geser: 0.55, akhir: 31, awal: 32, tanpaAkun: 0, kelompokLemah: 0.12 },
  "7E": { n: 33, geser: 0.05, akhir: 4, awal: 30, tanpaAkun: 3, kelompokLemah: 0.3 }, // its Uji Penguasaan is still being held
  "8A": { n: 31, geser: 0.3, akhir: 30, awal: 30, tanpaAkun: 0, kelompokLemah: 0.2 },
  "8B": { n: 30, geser: 0.1, akhir: 28, awal: 29, tanpaAkun: 1, kelompokLemah: 0.25 },
  "8C": { n: 32, geser: 0.4, akhir: 31, awal: 31, tanpaAkun: 0, kelompokLemah: 0.15 },
  "8D": { n: 31, geser: 0.0, akhir: 29, awal: 30, tanpaAkun: 2, kelompokLemah: 0.3 },
  "8E": { n: 30, geser: 0.2, akhir: 29, awal: 29, tanpaAkun: 0, kelompokLemah: 0.2 },
  "9A": { n: 32, geser: 0.3, akhir: 31, awal: 32, tanpaAkun: 0, kelompokLemah: 0.15 },
  "9B": { n: 31, geser: 0.05, akhir: 29, awal: 30, tanpaAkun: 1, kelompokLemah: 0.3 },
  "9C": { n: 30, geser: 0.45, akhir: 30, awal: 30, tanpaAkun: 0, kelompokLemah: 0.1 },
  "9D": { n: 32, geser: -0.05, akhir: 30, awal: 31, tanpaAkun: 1, kelompokLemah: 0.3 },
  "9E": { n: 31, geser: 0.25, akhir: 30, awal: 30, tanpaAkun: 0, kelompokLemah: 0.2 },
};
export const KELAS: Kelas[] = Object.entries(KELAS_RENCANA).map(([nama, r]) => {
  const tingkat = Number(nama[0]);
  const paket = PAKET.filter((p) => p.kelas === tingkat);
  const murid: Murid[] = [];
  for (let i = 0; i < r.n; i++) {
    // Real classes are rarely one bell: a smaller group sits well below the rest.
    const lemah = acak() < r.kelompokLemah;
    const kemampuan = r.geser + (lemah ? -0.55 + 0.45 * normal() : 1.15 + 0.55 * normal());
    const hasil: Record<string, HasilMurid> = {};
    for (const p of paket) hasil[p.kode] = { paket: p, awal: i < r.awal ? kerjakan(p, kemampuan - 1.05) : undefined, akhir: i < r.akhir ? kerjakan(p, kemampuan) : undefined };
    murid.push({ nama: namaBaru(), kelas: nama, akun: i < r.n - r.tanpaAkun, hasil });
  }
  // Who has not taken a paper yet is not the same few in every column: shuffle the order once.
  murid.sort(() => acak() - 0.5);
  return { nama, tingkat, murid };
});

// Reasons for the students who cannot sign in, in class order: two wait on one Pendataan import, three have a card
// they have not used yet, and the rest have no card yet.
KELAS.flatMap((k) => k.murid.filter((m) => !m.akun)).forEach((m, i) => { m.alasan = i < 2 ? "data" : i < 5 ? "aktivasi" : "kartu"; });

// Bagas, the learner of report 1, is in 7A. His papers are written out, so his report reads as it should.
const tulis = (p: Paket, perTopik: number[], wajibTepat = true): Lembar => {
  const benar: boolean[] = [];
  perTopik.forEach((n) => { for (let i = 0; i < SOAL_PER_TOPIK; i++) benar.push(i < n); });
  if (!wajibTepat) benar[p.wajib[1]] = false;
  return { benar, keliru: benar.map(() => false) };
};
{
  const k = KELAS.find((x) => x.nama === "7A")!;
  const m7 = PAKET.find((p) => p.kode === "M7")!, i7 = PAKET.find((p) => p.kode === "I7")!;
  const bagas: Murid = { nama: "Bagas Pratama", kelas: "7A", akun: true, hasil: {
    M7: { paket: m7, awal: tulis(m7, [3, 2, 2, 1, 1]), akhir: tulis(m7, [4, 4, 4, 3, 2]) },
    I7: { paket: i7, awal: tulis(i7, [2, 1, 1, 1, 2]), akhir: tulis(i7, [4, 3, 1, 2, 3]) },
  } };
  // He takes the place of one student who took both papers, so 7A's counts stay as planned.
  const j = k.murid.findIndex((m) => m.hasil.M7.akhir && m.hasil.M7.awal && m.hasil.I7.akhir && m.hasil.I7.awal);
  dipakai.delete(k.murid[j].nama); k.murid[j] = bagas;
}
// Bagas's earlier and current chapters that are not in the school-wide papers above.
export const BAGAS_LAIN = {
  bab1: { mapel: "Matematika", bab: "Bab 1 · Bilangan bulat", awal: 11, akhir: 18, topik: [["Bilangan bulat pada garis bilangan", 4], ["Penjumlahan dan pengurangan", 4], ["Perkalian dan pembagian", 3], ["Soal cerita", 3], ["Urutan operasi", 4]] as Array<[string, number]> },
  bab3: { mapel: "Matematika", bab: "Bab 3 · Perbandingan", awal: 9, pelajaran: [2, 4] as [number, number] },
};

// ── computing, by the catalogue's own words ──────────────────────────────────
export const skor = (l: Lembar) => l.benar.filter(Boolean).length;
export const persen = (l: Lembar) => (skor(l) / l.benar.length) * 100;
export const wajibTepat = (l: Lembar, p: Paket) => p.wajib.every((i) => l.benar[i]);
export type Pita = "mantap" | "berkembang" | "penguatan";
// kesiapan.catatan: 80% and above; 60–79%; below 60% or a required item not yet right.
export const pita = (l: Lembar, p: Paket): Pita => !wajibTepat(l, p) || persen(l) < PITA.berkembang ? "penguatan" : persen(l) >= PITA.mantap ? "mantap" : "berkembang";
export const topikPersen = (l: Lembar, t: number) => (l.benar.slice(t * SOAL_PER_TOPIK, (t + 1) * SOAL_PER_TOPIK).filter(Boolean).length / SOAL_PER_TOPIK) * 100;
export const topikSkor = (l: Lembar, t: number) => l.benar.slice(t * SOAL_PER_TOPIK, (t + 1) * SOAL_PER_TOPIK).filter(Boolean).length;
const rata = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

export type RingkasKelas = {
  kelas: Kelas; paket: Paket; terdaftar: number; peserta: number; belum: number; keduanya: number;
  pemahaman: number | null; kenaikan: number | null; pita: Record<Pita, number> | null; topik: Array<number | null>;
  miskonsepsi: number | null; wajib: number | null; skor: number[]; awalAkhir: Array<[number, number]>;
  penguatan: Murid[];
};
export function ringkasKelas(namaKelas: string, kode: string): RingkasKelas {
  const kelas = KELAS.find((k) => k.nama === namaKelas)!;
  const paket = PAKET.find((p) => p.kode === kode)!;
  const ikut = kelas.murid.filter((m) => m.hasil[kode]?.akhir);
  const dua = ikut.filter((m) => m.hasil[kode].awal);
  const cukup = ikut.length >= MIN_SAMPEL, cukupDua = dua.length >= MIN_SAMPEL;
  const akhir = (m: Murid) => m.hasil[kode].akhir!;
  const pitaH: Record<Pita, number> = { mantap: 0, berkembang: 0, penguatan: 0 };
  ikut.forEach((m) => { pitaH[pita(akhir(m), paket)]++; });
  return {
    kelas, paket, terdaftar: kelas.murid.length, peserta: ikut.length, belum: kelas.murid.length - ikut.length, keduanya: dua.length,
    pemahaman: cukup ? rata(ikut.map((m) => persen(akhir(m)))) : null,
    kenaikan: cukupDua ? rata(dua.map((m) => persen(akhir(m)) - persen(m.hasil[kode].awal!))) : null,
    pita: cukup ? pitaH : null,
    topik: paket.topik.map((_, t) => (cukup ? rata(ikut.map((m) => topikPersen(akhir(m), t))) : null)),
    miskonsepsi: kode === MISKONSEPSI.kode && cukup ? ikut.filter((m) => MISKONSEPSI.soal.some((i) => akhir(m).keliru[i])).length : null,
    wajib: cukup ? ikut.filter((m) => wajibTepat(akhir(m), paket)).length : null,
    skor: ikut.map((m) => skor(akhir(m))).sort((a, b) => a - b),
    awalAkhir: dua.map((m) => [skor(m.hasil[kode].awal!), skor(akhir(m))] as [number, number]),
    penguatan: ikut.filter((m) => pita(akhir(m), paket) === "penguatan").sort((a, b) => a.nama.localeCompare(b.nama, "id")),
  };
}

export function ringkasSekolah() {
  const semua = KELAS.flatMap((k) => k.murid);
  const hasil = semua.flatMap((m) => Object.values(m.hasil));
  const akhir = hasil.filter((h) => h.akhir);
  const dua = akhir.filter((h) => h.awal);
  const peserta = semua.filter((m) => Object.values(m.hasil).some((h) => h.akhir)).length;
  const angkatan = [7, 8, 9].map((t) => {
    const hs = KELAS.filter((k) => k.tingkat === t).flatMap((k) => k.murid.flatMap((m) => Object.values(m.hasil))).filter((h) => h.akhir);
    return { tingkat: t, tahun: 2026 - (t - 7), n: hs.length, nilai: rata(hs.map((h) => persen(h.akhir!))) };
  });
  const ranah = RANAH.map((r) => {
    const xs: number[] = [];
    akhir.forEach((h) => h.paket.topik.forEach((t, i) => { if (t.ranah === r) xs.push(topikPersen(h.akhir!, i)); }));
    return { ranah: r, nilai: rata(xs), soal: (xs.length * SOAL_PER_TOPIK) };
  });
  const kesiapan = KELAS.flatMap((k) => PAKET.filter((p) => p.kelas === k.tingkat).map((p) => {
    const n = k.murid.filter((m) => m.hasil[p.kode].akhir).length;
    return { kelas: k.nama, paket: p, n, keadaan: n >= MIN_SAMPEL ? "cukup" : n > 0 ? "belum_cukup" : "belum_ada" };
  }));
  return {
    terdaftar: semua.length, peserta,
    kenaikan: rata(dua.map((h) => persen(h.akhir!) - persen(h.awal!))), keduanya: dua.length,
    wajib: { tepat: akhir.filter((h) => wajibTepat(h.akhir!, h.paket)).length, dari: akhir.length },
    // MC-1 (calc_institution_verified_credentials): issued and not revoked, of all issued. The certificate service
    // decides issuance; here a simulated stand-in issues one for a result at the target with every required item right.
    sertifikat: (() => { const terbit = akhir.filter((h) => persen(h.akhir!) >= TARGET && wajibTepat(h.akhir!, h.paket)).length; return { berlaku: terbit - 3, terbit, dicabut: 3 }; })(),
    angkatan, ranah, kesiapan,
  };
}

// ── professional learning ────────────────────────────────────────────────────
export const PAKET_PD = { judul: "Merancang Asesmen Formatif di Kelas", pelajaran: 5, topik: [
  "Tujuan pembelajaran yang dapat diukur", "Merancang soal diagnostik", "Umpan balik yang membantu", "Membaca bukti belajar", "Menindaklanjuti hasil"] };
export type Peserta = { nama: string; peran: string; akun: boolean; mulai: boolean; awal: number[] | null; pelajaran: number; akhir: number[] | null };
// Each value list is the participant's correct items per topic (of 4). In the order the record returns them: by name.
export const PESERTA: Peserta[] = [
  { nama: "Andi Nugroho", peran: "Guru IPA", akun: true, mulai: true, awal: [3, 2, 2, 1, 2], pelajaran: 5, akhir: [4, 4, 3, 2, 4] },
  { nama: "Budi Santoso", peran: "Guru Matematika", akun: true, mulai: true, awal: [2, 2, 1, 1, 2], pelajaran: 5, akhir: [4, 3, 3, 3, 3] },
  { nama: "Citra Lestari", peran: "Guru Matematika", akun: true, mulai: true, awal: [3, 3, 2, 2, 2], pelajaran: 4, akhir: null },
  { nama: "Dian Purnama", peran: "Guru Bahasa Indonesia", akun: true, mulai: true, awal: [2, 1, 2, 1, 1], pelajaran: 5, akhir: [3, 2, 3, 2, 2] },
  { nama: "Eko Prasetyo", peran: "Kepala departemen", akun: true, mulai: true, awal: [3, 3, 3, 2, 3], pelajaran: 5, akhir: [4, 4, 4, 3, 4] },
  { nama: "Fransiska Ayu", peran: "Guru IPS", akun: true, mulai: true, awal: [2, 2, 1, 2, 1], pelajaran: 2, akhir: null },
  { nama: "Gilang Ramadhan", peran: "Guru PJOK", akun: true, mulai: false, awal: null, pelajaran: 0, akhir: null },
  { nama: "Hesti Wulandari", peran: "Guru IPA", akun: true, mulai: true, awal: [3, 2, 2, 2, 2], pelajaran: 5, akhir: [4, 4, 3, 4, 3] },
  { nama: "Imam Syafii", peran: "Guru Matematika", akun: false, mulai: false, awal: null, pelajaran: 0, akhir: null },
  { nama: "Juwita Sari", peran: "Guru Bahasa Inggris", akun: true, mulai: true, awal: [2, 2, 2, 1, 2], pelajaran: 3, akhir: null },
  { nama: "Kurniawan Adi", peran: "Guru IPS", akun: true, mulai: true, awal: [3, 2, 3, 2, 2], pelajaran: 5, akhir: [3, 3, 4, 3, 3] },
  { nama: "Lusi Handayani", peran: "Guru Seni Budaya", akun: true, mulai: true, awal: [2, 1, 1, 1, 1], pelajaran: 1, akhir: null },
];
export const pdSkor = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const pdTercapai = (xs: number[]) => (pdSkor(xs) / (xs.length * SOAL_PER_TOPIK)) * 100 >= TARGET;

/**
 * W3.4 (Batch 2; CR-88; Daisy, components/Table, Search, Pagination): the Collection's rules with no React in them,
 * so a test can execute them and a page can read its own query with them.
 *
 * Everything a person changes in a collection (what they searched, which filter, which page) travels in the URL as
 * plain GET parameters: the browser's Back, a reload and a shared link keep the place, and paging needs no script.
 */

/** The parameters one collection reads. A page with two collections gives the second its own names. */
export type ParamKoleksi = { cari: string; saring: string; hal: string };
export const PARAM_BAKU: ParamKoleksi = { cari: "cari", saring: "saring", hal: "hal" };

/** The filter value that shows every row (Daisy: the filter's first option, «Semua»). */
export const SEMUA = "semua";

type Nilai = string | string[] | undefined;
const satu = (v: Nilai): string | undefined => (Array.isArray(v) ? v[0] : v);

/** What was searched, trimmed; empty when nothing was. */
export function kueriDiminta(v: Nilai): string {
  return (satu(v) ?? "").trim().slice(0, 200);
}

/**
 * The filter asked for, always one of `pilihan` (else «Semua»).
 *
 * The toolbar carries the filter twice, as segments (wide) and as a select (below 640 px), both under one name, and
 * the value it was drawn with as `tadi`. Without script both are sent; the one that differs from `tadi` is the one the
 * person changed. With script the two are kept equal, so either answers.
 */
export function saringDiminta(v: Nilai, pilihan: readonly string[], tadi?: Nilai): string {
  const semua = (Array.isArray(v) ? v : v === undefined ? [] : [v]).filter((x) => x === SEMUA || pilihan.includes(x));
  const lama = satu(tadi);
  const dipilih = semua.find((x) => x !== lama) ?? semua[0];
  return dipilih ?? SEMUA;
}

/** The page asked for (1-based), whatever the parameter held. */
export function halamanKoleksi(v: Nilai): number {
  const n = Number(satu(v));
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/**
 * Where a page sits in the whole: the page itself (a page past the last is the last), how many pages there are, and
 * the rows it shows, 1-based and inclusive («Menampilkan 21–40 dari 312»). Nothing at all is page 1 of 1, showing 0–0.
 */
export type Posisi = { halaman: number; jumlahHalaman: number; dari: number; sampai: number; total: number; ukuran: number };
export function posisiHalaman(total: number, diminta: number, ukuran: number): Posisi {
  const u = Math.max(1, Math.floor(ukuran));
  const t = Math.max(0, Math.floor(total));
  const jumlahHalaman = Math.max(1, Math.ceil(t / u));
  const halaman = Math.min(Math.max(1, Math.floor(diminta) || 1), jumlahHalaman);
  const dari = t === 0 ? 0 : (halaman - 1) * u + 1;
  const sampai = Math.min(halaman * u, t);
  return { halaman, jumlahHalaman, dari, sampai, total: t, ukuran: u };
}

/** Alphabetical by name, in Indonesian order, ignoring case and accents: the default and, for people, the only order. */
export function urutAbjad<T>(baris: readonly T[], nama: (b: T) => string): T[] {
  const banding = new Intl.Collator("id", { sensitivity: "base", numeric: true });
  return [...baris].sort((a, b) => banding.compare(nama(a), nama(b)));
}

/** Does a row's searchable text hold the query (case and accents ignored)? */
export function cocokKueri(teks: string, kueri: string): boolean {
  if (!kueri) return true;
  const rata = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("id");
  return rata(teks).includes(rata(kueri));
}

/**
 * One page of a collection already read: searched, filtered, alphabetical, paged. `totalSemua` is every row before
 * the search and the filter, so a page can tell «nothing here yet» (an Empty state) from «nothing matches».
 */
export function susunKoleksi<T>(baris: readonly T[], o: {
  nama: (b: T) => string;
  /** The text a search looks in; the name when not given. */
  dicari?: (b: T) => string;
  /** The filter value a row belongs to. */
  kelompok?: (b: T) => string;
  kueri?: string;
  saring?: string;
  halaman: number;
  ukuran: number;
}): { isi: T[]; posisi: Posisi; totalSemua: number } {
  const kueri = o.kueri ?? "";
  const saring = o.saring ?? SEMUA;
  const cocok = baris.filter((b) =>
    cocokKueri((o.dicari ?? o.nama)(b), kueri) && (saring === SEMUA || !o.kelompok || o.kelompok(b) === saring));
  const urut = urutAbjad(cocok, o.nama);
  const posisi = posisiHalaman(urut.length, o.halaman, o.ukuran);
  return { isi: urut.slice(posisi.dari === 0 ? 0 : posisi.dari - 1, posisi.sampai), posisi, totalSemua: baris.length };
}

/**
 * A link within the collection: `tetap` (what the page needs to stay where it is: its section, its school) first, then
 * the search, the filter and the page, each left out when it is the default. `#jangkar` returns the person to the table.
 */
export function tautanKoleksi(jalan: string, tetap: Record<string, string>, nilai: { cari?: string; saring?: string; hal?: number },
  param: ParamKoleksi = PARAM_BAKU, jangkar = ""): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(tetap)) if (v !== "" && k !== param.cari && k !== param.saring && k !== param.hal) q.append(k, v);
  if (nilai.cari) q.set(param.cari, nilai.cari);
  if (nilai.saring && nilai.saring !== SEMUA) q.set(param.saring, nilai.saring);
  if (nilai.hal && nilai.hal > 1) q.set(param.hal, String(nilai.hal));
  const s = q.toString();
  return `${jalan}${s ? `?${s}` : ""}${jangkar ? `#${jangkar}` : ""}`;
}

import Link from "next/link";
import type { ReactNode } from "react";
import { format, t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import Ikon from "@/components/Ikon";
import TandaTautan from "@/components/TandaTautan";
import FormKoleksi from "./FormKoleksi";
import { PARAM_BAKU, SEMUA, posisiHalaman, tautanKoleksi, type ParamKoleksi, type Posisi } from "./aturan";

/**
 * W3.4 · TABLE / COLLECTION (Batch 2; CR-88; Daisy, components/Table, Table rows, Search, Pagination, Segmented
 * control, Empty state; composed in J2Kelas). One frame for rows people read: a search and at most one filter above,
 * the table in a named, focusable frame with a sticky head and striped rows of 52 px or more, each row named by a
 * `th scope="row"`, and the pager beneath that never hides the total («Menampilkan 21–40 dari 312 murid»).
 *
 * Server-rendered: the search, the filter and the page are GET parameters (see aturan.ts), the pager is two links, and
 * nothing needs script; with script a filter applies as it is chosen (FormKoleksi). The rows arrive already searched,
 * filtered, ordered (alphabetical by default: urutAbjad) and paged (susunKoleksi for a list read whole; a database
 * range and its count for a long one), so the component is the same whatever a row holds.
 *
 * The noun (`benda`, already in the reader's language, e.g. t("bukti.murid")) is the only word a caller brings to the
 * count and the empty row; every other word is the copy table's (koleksi.*).
 */

export type KolomKoleksi = {
  judul: string;
  /** A number: right-aligned, tabular. */
  angka?: boolean;
  /** Steps back below 640 px (Daisy: `data-prioritas="rendah"`). */
  prioritas?: "rendah";
  /** As narrow as its content (the actions column). */
  sempit?: boolean;
  /** The header is read, not shown (the actions column's «Tindakan»). */
  tersembunyi?: boolean;
};

export type BarisKoleksi = {
  kunci: string;
  /** The row's name: its `th scope="row"`. */
  nama: ReactNode;
  /** The other cells, in the order of the columns after the first. */
  sel: ReactNode[];
};

type Tautan = { jalan: string; tetap?: Record<string, string>; param?: ParamKoleksi; jangkar?: string };

function kata(kunci: HleEvent, untuk: Persona, locale: Locale, isi: Record<string, string | number> = {}): string {
  let s = t(kunci, untuk, { locale });
  // the query is put in last, so nothing a person typed is read as a placeholder
  for (const [k, v] of Object.entries(isi).sort(([a], [b]) => (a === "q" ? 1 : b === "q" ? -1 : 0))) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/**
 * PAGINATION, under a table (Daisy, Pagination: the default). Where am I, how much is there, how do I move: always all
 * three. Two links that keep the search and the filter and return to the table (`#jangkar`); a move that is not
 * possible stays in place, disabled. Nothing at all is not paged: the empty row says so.
 */
/**
 * E-K2 (D-173(d)): where the total is not known (a keyset page, FD-4), the same pager without a total: «Menampilkan
 * 21–40 laporan», «Halaman 2», and the move that is not possible disabled, never hidden. No total is computed for it.
 */
export type PosisiTerbuka = { halaman: number; lagi: boolean; dari: number; sampai: number };

export function HalamanKoleksi({
  posisi, benda, jalan = "", tetap = {}, cari = "", saring = SEMUA, param = PARAM_BAKU, jangkar = "", ke, locale, untuk = "staff",
}: Partial<Tautan> & {
  posisi: Posisi | PosisiTerbuka;
  benda: string;
  cari?: string;
  saring?: string;
  /** Builds page n's link instead (a page whose other parameters follow their own rule, as tautanHalaman). */
  ke?: (n: number) => string;
  locale: Locale;
  untuk?: Persona;
}) {
  const terbuka = !("total" in posisi);
  if (!terbuka && posisi.total === 0) return null;
  if (terbuka && posisi.halaman <= 1 && !posisi.lagi) return null;
  const n = (x: number) => format.number(x, locale);
  const tautan = (h: number) => (ke ? ke(h) : tautanKoleksi(jalan, tetap, { cari, saring, hal: h }, param, jangkar));
  const gerak = (arah: "sebelum" | "sesudah") => {
    const ke_ = arah === "sebelum" ? posisi.halaman - 1 : posisi.halaman + 1;
    const bisa = ke_ >= 1 && (terbuka ? arah === "sebelum" || posisi.lagi : ke_ <= posisi.jumlahHalaman);
    const nama = kata(arah === "sebelum" ? "lesson.prev" : "lesson.next", untuk, locale);
    const isi = arah === "sebelum"
      ? <><Ikon nama="chevron-left" /><span className="pin-pager-teks">{kata("koleksi.sebelumnya", untuk, locale)}</span></>
      : <><span className="pin-pager-teks">{kata("koleksi.berikutnya", untuk, locale)}</span><Ikon nama="chevron-right" /></>;
    return bisa
      ? <Link href={tautan(ke_)} className="pin-btn" aria-label={nama} rel={arah === "sebelum" ? "prev" : "next"} data-pager={arah}>{isi}<TandaTautan /></Link>
      : <a role="link" aria-disabled="true" className="pin-btn" aria-label={nama} data-pager={arah}>{isi}</a>;
  };
  return (
    <nav className="pin-pager" aria-label={kata("koleksi.halaman.label", untuk, locale, { benda })}>
      <span className="pin-pager-ringkas" aria-live="polite">
        {terbuka
          ? kata("koleksi.menampilkan_tanpa_total", untuk, locale, { dari: n(posisi.dari), sampai: n(posisi.sampai), benda })
          : kata("koleksi.menampilkan", untuk, locale, { dari: n(posisi.dari), sampai: n(posisi.sampai), total: n(posisi.total), benda })}
      </span>
      <span className="pin-pager-gerak">
        {gerak("sebelum")}
        <span className="pin-pager-posisi" aria-live="polite">
          {terbuka
            ? kata("koleksi.posisi.terbuka", untuk, locale, { n: n(posisi.halaman) })
            : <>
              <span className="pin-pager-lebar">{kata("koleksi.posisi", untuk, locale, { n: n(posisi.halaman), total: n(posisi.jumlahHalaman) })}</span>
              <span className="pin-pager-kecil">{kata("koleksi.posisi.ringkas", untuk, locale, { n: n(posisi.halaman), total: n(posisi.jumlahHalaman) })}</span>
            </>}
        </span>
        {gerak("sesudah")}
      </span>
    </nav>
  );
}

/** The Collection: toolbar, frame and pager (Daisy, Table: anatomy). */
export default function Koleksi({
  id, nama, keterangan, benda, kolom, baris, posisi, totalSemua, kosong,
  jalan, tetap = {}, param = PARAM_BAKU, cari = "", placeholder, saring, locale, untuk = "staff",
}: Tautan & {
  /** The frame's id: the pager and the empty row's way back return here. */
  id: string;
  /** The frame's accessible name («Murid Kelas 5A»). */
  nama: string;
  /** The table's caption, read before the rows; the name when not given. */
  keterangan?: string;
  benda: string;
  /** The first column heads the rows' names. */
  kolom: KolomKoleksi[];
  baris: BarisKoleksi[];
  /** Where this page sits in what matched (posisiHalaman, or susunKoleksi's). */
  posisi: Posisi;
  /** Every row before the search and the filter: none at all is the Empty state `kosong`, not an empty table. */
  totalSemua: number;
  kosong?: ReactNode;
  cari?: string;
  /** What can be searched («Nama atau PINTAR ID»); «Cari nama» when not given. */
  placeholder?: string;
  /** The one filter: two to four choices after «Semua» (segments wide, a select below 640 px). */
  saring?: { nilai: string; pilihan: Array<{ nilai: string; label: string }> };
  locale: Locale;
  untuk?: Persona;
}) {
  if (totalSemua === 0 && !cari && (!saring || saring.nilai === SEMUA)) return <>{kosong ?? null}</>;
  const s = (k: HleEvent, isi?: Record<string, string | number>) => kata(k, untuk, locale, isi);
  const nilaiSaring = saring?.nilai ?? SEMUA;
  const pilihan = saring ? [{ nilai: SEMUA, label: s("koleksi.saring.semua") }, ...saring.pilihan] : [];
  const tanpaCari = tautanKoleksi(jalan, tetap, { saring: nilaiSaring }, param, id);
  const ulang = tautanKoleksi(jalan, tetap, {}, param, id);
  const tersaring = nilaiSaring !== SEMUA;
  const idHasil = `${id}-hasil`;
  const p = posisiHalaman(posisi.total, posisi.halaman, posisi.ukuran);
  const kelasKolom = (k: KolomKoleksi) => [k.angka ? "pin-angka" : "", k.sempit ? "pin-sempit" : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div className="pin-koleksi">
      <FormKoleksi saring={param.saring}>
        {Object.entries(tetap).filter(([k, v]) => v !== "" && ![param.cari, param.saring, param.hal].includes(k))
          .map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <span className="pin-cari">
          <Ikon nama="search" />
          <input
            className="pin-input" type="search" name={param.cari} defaultValue={cari} autoComplete="off"
            aria-label={s("koleksi.cari.label", { benda })} placeholder={placeholder ?? s("koleksi.cari.placeholder")}
            aria-describedby={idHasil}
          />
          {cari ? <Link href={tanpaCari} className="pin-cari-hapus" aria-label={s("koleksi.cari.hapus")}><Ikon nama="x" /></Link> : null}
        </span>
        {saring ? (
          <>
            <input type="hidden" name={`${param.saring}_tadi`} value={nilaiSaring} />
            <div className="pin-seg pin-lebar-saja" role="radiogroup" aria-label={s("koleksi.saring.label")}>
              {pilihan.map((o) => (
                <label key={o.nilai}>
                  <input type="radio" name={param.saring} value={o.nilai} defaultChecked={o.nilai === nilaiSaring} />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
            <span className="pin-pilih pin-sempit-saja">
              <select className="pin-input" name={param.saring} defaultValue={nilaiSaring} aria-label={s("koleksi.saring.label")}>
                {pilihan.map((o) => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
              </select>
              <Ikon nama="chevron-down" />
            </span>
            <noscript><button type="submit" className="pin-btn">{s("koleksi.saring.label")}</button></noscript>
          </>
        ) : null}
      </FormKoleksi>
      <p className="pin-hint pin-cari-hasil" id={idHasil} aria-live="polite">
        {cari && p.total > 0 ? s("koleksi.cari.cocok", { n: format.number(p.total, locale), benda, q: cari }) : null}
      </p>
      <div className="pin-tabel-bingkai" id={id} role="region" tabIndex={0} aria-label={nama}>
        <table className="pin-tabel">
          <caption className="pin-sr">{keterangan ?? nama}</caption>
          <thead>
            <tr>
              {kolom.map((k, i) => (
                <th key={i} scope="col" className={kelasKolom(k)} data-prioritas={k.prioritas}>
                  {k.tersembunyi ? <span className="pin-sr">{k.judul}</span> : k.judul}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.kunci}>
                <th scope="row" className="pin-tabel-nama">{b.nama}</th>
                {b.sel.map((x, i) => {
                  const k = kolom[i + 1] ?? {};
                  return <td key={i} className={kelasKolom(k as KolomKoleksi)} data-prioritas={(k as KolomKoleksi).prioritas}>{x}</td>;
                })}
              </tr>
            ))}
            {p.total === 0 ? (
              <tr className="pin-tabel-kosong">
                <td colSpan={kolom.length}>
                  <div className="pin-kosong-cocok">
                    <h3>{s("koleksi.kosong.judul", { benda })}</h3>
                    {cari ? <p>{s("koleksi.kosong.kueri", { q: cari })}</p> : null}
                    <div className="pin-actions">
                      <Link href={tersaring ? ulang : tanpaCari} className="pin-btn">
                        {s(tersaring ? "koleksi.kosong.reset" : "koleksi.cari.hapus")}<TandaTautan />
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <HalamanKoleksi posisi={p} benda={benda} jalan={jalan} tetap={tetap} cari={cari} saring={nilaiSaring} param={param}
        jangkar={id} locale={locale} untuk={untuk} />
    </div>
  );
}

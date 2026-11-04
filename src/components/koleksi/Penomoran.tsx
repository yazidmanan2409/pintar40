import { type Locale } from "@/lib/hle";
import { HalamanKoleksi } from "./Koleksi";
import { posisiHalaman } from "./aturan";
import { UKURAN } from "./halaman";

/**
 * L4 (CR-88, investigation RC-6 (1)): NO STAFF LIST RENDERS MORE THAN ONE PAGE OF ROWS. A list shows a page of rows at
 * a time; the page is a plain GET parameter, so the browser's Back and a shared link keep their place, and each list
 * names its own parameter so two lists on one page move independently.
 *
 * E-K2 (D-173(d)): ONE PAGINATION GRAMMAR. This is the Collection's pager (HalamanKoleksi), not a second one: where the
 * list knows its total, «Menampilkan 21–40 dari 312 …» and «Halaman 2 dari 16»; where it does not (a page read one
 * row past its end, FD-4), «Menampilkan 21–40 …» and «Halaman 2», with no total computed. «Sebelumnya» and
 * «Berikutnya» are always drawn, a move that is not possible disabled, never hidden. Nothing is drawn for one page.
 */
export { UKURAN, halamanDiminta, satuHalaman, rentang, tautanHalaman } from "./halaman";

export default function Penomoran({ halaman, lagi, ke, locale = "id", benda, jumlah, ukuran = UKURAN, total }: {
  halaman: number; lagi: boolean; ke: (n: number) => string;
  /** W1.9 (UX-25): the reader's language. */
  locale?: Locale;
  /** What the rows are, in the reader's language («laporan»). */
  benda: string;
  /** The rows on this page. */
  jumlah: number;
  /** The page's size, when it is not UKURAN. */
  ukuran?: number;
  /** The whole count, only where the list already has it (never computed for the pager). */
  total?: number;
}) {
  const dari = (halaman - 1) * ukuran + 1;
  const posisi = total !== undefined
    ? posisiHalaman(total, halaman, ukuran)
    : { halaman, lagi, dari: jumlah > 0 ? dari : 0, sampai: jumlah > 0 ? dari + jumlah - 1 : 0 };
  return (
    <div data-penomoran="">
      <HalamanKoleksi posisi={posisi} benda={benda} ke={ke} locale={locale} />
    </div>
  );
}

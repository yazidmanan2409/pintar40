import Link from "next/link";
import { t, type Locale } from "@/lib/hle";
import TandaTautan from "@/components/TandaTautan";

/**
 * L4 (CR-88, investigation RC-6 (1)): NO STAFF LIST RENDERS MORE THAN ONE PAGE OF ROWS. A list shows `UKURAN` rows
 * at a time and moves between pages with «Kembali» and «Berikutnya» (words the copy table already has). The page is
 * a plain GET parameter, so the browser's Back and a shared link keep their place, and each list names its own
 * parameter so two lists on one page move independently.
 *
 * Daisy's Collection component (Table + Pagination + Search, with an explicit edit action) supersedes the look; the
 * bound is the engineering half and stays.
 */
export { UKURAN, halamanDiminta, satuHalaman, rentang, tautanHalaman } from "./halaman";

/**
 * «Kembali» · Halaman n · «Berikutnya». `ke(n)` builds the link to page n, keeping whatever else the URL says.
 * Nothing is drawn when the list is one page.
 */
export default function Penomoran({ halaman, lagi, ke, locale = "id" }: {
  halaman: number; lagi: boolean; ke: (n: number) => string;
  /** W1.9 (UX-25): the reader's language. */
  locale?: Locale;
}) {
  if (halaman <= 1 && !lagi) return null;
  // the design system's own classes (tokens only), and a menu link that acknowledges the click (DAISY-18)
  return (
    <nav className="pin-actions" data-penomoran="">
      {halaman > 1 ? <Link href={ke(halaman - 1)} className="pin-tautan">{t("koleksi.kembali", "staff", { locale })}<TandaTautan /></Link> : null}
      <span className="pin-meta">{t("lesson.page_of", "staff", { locale })} {halaman}</span>
      {lagi ? <Link href={ke(halaman + 1)} className="pin-tautan">{t("koleksi.berikutnya", "staff", { locale })}<TandaTautan /></Link> : null}
    </nav>
  );
}

import { t } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import MerekPintar from "./MerekPintar";

/**
 * MemuatHalaman — THE ONE LOADING SHELL OF PINTAR'S MAIN SECTIONS (DAISY-18,
 * D-047). Each section's loading.tsx is this and nothing else, so a menu
 * click changes the screen at once -- the brand, "Memuat halaman…" and the
 * shape of a page -- while the server prepares the real one.
 *
 * `role="status"` says it once; the shape is aria-hidden.
 *
 * INSIDE A SECTION'S OWN FRAME (Studio's layout draws its title and menu and
 * stays on screen), the shell is only the sentence and the shape: a second
 * header and a second <main> would be a page inside a page.
 */
export default async function MemuatHalaman({ dalamBingkai = false }: { dalamBingkai?: boolean } = {}) {
  const locale = await currentLocale();
  const isi = (
    <>
      <p className="pin-memuat-kata" role="status">{t("memuat.halaman", "public", { locale })}</p>
      <div className="pin-memuat-bentuk" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </>
  );
  if (dalamBingkai) {
    return <div className="pin-memuat pin-memuat-bingkai" aria-busy="true">{isi}</div>;
  }
  return (
    <div className="pin-memuat" aria-busy="true">
      <header className="pin-top pin-shell">
        <MerekPintar />
      </header>
      <main className="pin-col">{isi}</main>
    </div>
  );
}

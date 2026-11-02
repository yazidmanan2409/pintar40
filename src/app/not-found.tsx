import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import MerekPintar from "@/components/MerekPintar";
import KakiPintar from "@/components/KakiPintar";

/**
 * PINTAR's page for an address that leads nowhere (DAISY-04, D-011), in the
 * reader's language, instead of Next's English "404: This page could not be
 * found." It says what probably happened and offers the way back; it does not
 * say whether a resource exists and is merely somebody else's -- a page that
 * refuses a reader has its own sentence, on the refusal page.
 */
export default async function TidakAda() {
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "public", { locale });
  return (
    <div className="pin-col">
      <main id="isi" tabIndex={-1}>
        <section className="pin-refusal">
          <MerekPintar standalone />
          <h1>{s("tidak_ada.judul")}</h1>
          <p className="pin-intro">{s("tidak_ada.arti")}</p>
          <Link className="pin-btn" href="/">
            {s("galat.beranda")}
          </Link>
        </section>
      </main>
      <KakiPintar className="pin-noprint" />
    </div>
  );
}

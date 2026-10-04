import { notFound } from "next/navigation";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { HALAMAN_PEMULIHAN, kanonikPintarId, tampilPintarId } from "@/lib/aktivasi-kontrak";
import PengalihBahasa from "@/components/PengalihBahasa";
import MerekPintar from "@/components/MerekPintar";
import PanelPernyataan from "@/components/masuk/PanelPernyataan";

export const dynamic = "force-dynamic";

/**
 * THE PAGE A PINTAR CARD'S QR OPENS (IDENTITY-4.0 §5, BOB-28 / DAISY-22).
 *
 * THE SAME PAGE FOR EVERY WELL-FORMED ID. It asks nothing of the database, so
 * it cannot say whether the ID is anyone's, whose, or which school: the ID it
 * shows is the one in the address, made canonical. A malformed ID is PINTAR's
 * not-found page, which is the same for every malformed ID. The QR is never a
 * credential: the page offers «Masuk ke PINTAR» and recovery with the PIN,
 * which opens «Lupa password?» on its PIN step with this ID filled in: the
 * same door (/masuk/lupa/pin), counter and ladder as a typed ID. Public, in
 * the proxy's PUBLIC_PREFIXES and in public_surface_registry.
 */
export default async function HalamanId({ params }: { params: Promise<{ pintarId: string }> }) {
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "public", { locale });
  const { pintarId } = await params;
  const id = kanonikPintarId(decodeURIComponent(pintarId));
  if (!id) notFound();
  return (
    <main className="pin-masuk">
      <div className="pin-panggung">
        <div className="pin-auth">
          <div className="pin-authtop">
            <MerekPintar />
            <PengalihBahasa locale={locale} />
          </div>
          <div className="pin-authbody">
            <div className="pin-form">
              <h1 className="pin-mh1">{s("idpage.judul")}</h1>
              <p className="pin-lede-m">{s("idpage.lede")}</p>
              <p className="pin-lbl">{s("idpage.id_label")}</p>
              <p className="pin-idn-id">{tampilPintarId(id)}</p>
              <a className="pin-mbtn pin-mbtn-1" href="/masuk">{s("idpage.masuk")}</a>
              <a className="pin-mbtn pin-mbtn-2" href={`${HALAMAN_PEMULIHAN}?id=${id}`}>{s("idpage.pulih")}</a>
            </div>
          </div>
          <p className="pin-berdiri">{s("auth.foot")}</p>
          <span className="pin-tanda" aria-hidden="true" />
        </div>
        <PanelPernyataan locale={locale} />
      </div>
    </main>
  );
}

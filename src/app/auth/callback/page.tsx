import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { tujuanInternal } from "@/lib/tujuan";
import MerekPintar from "@/components/MerekPintar";
import PengalihBahasa from "@/components/PengalihBahasa";
import PanelFoto, { KalimatPonsel } from "@/components/masuk/PanelFoto";
import TukarTautan from "@/components/masuk/TukarTautan";

export const dynamic = "force-dynamic";

/**
 * WHERE A SIGN-IN LINK LANDS — S13 and S14.
 *
 * S14 IS DRAWN IN THE ATTENTION REGISTER, NOT THE BLOCKED ONE. Nothing is
 * broken and nobody did anything wrong; a link aged out. `blocked` is for a
 * thing that cannot proceed until it is corrected, and this can proceed the
 * moment a new link is asked for.
 *
 * THE FRESH LINK DOES NOT INHERIT THE OLD DESTINATION (Sauron, D1). "Minta
 * tautan baru" goes to the sign-in screen with no `lanjut`, so the next
 * successful authentication lands the person on their role's home. Carrying an
 * intent across a failed exchange means carrying it across an unauthenticated
 * boundary, and the destination contract was closed on security grounds. This
 * is lifecycle behaviour at the failed-callback boundary; `tujuanInternal` is
 * untouched, and it is simply not given a destination to narrow.
 */
export default async function Callback({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; lanjut?: string; error?: string; error_code?: string }>;
}) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "public", { locale });
  // L-1. The destination arrives from a link in an email -- the one value on
  // this route that nothing in PINTAR has held since it was written -- so it
  // is narrowed here as well as where the link was built. A link forged by
  // hand never passed through the builder.
  const lanjut = tujuanInternal(sp.lanjut);
  // A link the provider itself already refused, or a URL with nothing to
  // exchange: there is no request to make, so S14 is rendered directly rather
  // than after a round trip that cannot succeed.
  const mati = Boolean(sp.error || sp.error_code) || !sp.code;

  return (
    <main className="pin-masuk">
      <div className="pin-panggung">
      <div className="pin-auth">
        <div className="pin-authtop">
          <MerekPintar />
          <PengalihBahasa locale={locale} />
        </div>
        <div className="pin-authbody">
          <TukarTautan locale={locale} kode={mati ? null : String(sp.code)} lanjut={lanjut} />
          <KalimatPonsel locale={locale} />
        </div>
        <p className="pin-berdiri">{s("auth.foot")}</p>
        <span className="pin-tanda" aria-hidden="true" />
      </div>
      <PanelFoto locale={locale} />
      </div>
    </main>
  );
}

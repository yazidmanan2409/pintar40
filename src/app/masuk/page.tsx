import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { currentViewer } from "@/lib/auth";
import { tujuanInternal } from "@/lib/tujuan";
import PengalihBahasa from "@/components/PengalihBahasa";
import MerekPintar from "@/components/MerekPintar";
import LayarMasuk from "@/components/masuk/LayarMasuk";
import PanelFoto, { KalimatPonsel } from "@/components/masuk/PanelFoto";
import FokusAwal from "@/components/masuk/FokusAwal";
import { keluarDariSesi, lanjutkanSesi } from "./actions";

export const dynamic = "force-dynamic";

/**
 * THE SIGN-IN SCREEN.
 *
 * A split stage: the form on the left, the photographic panel on the right,
 * and on a phone the panel goes and its sentence stays. The hierarchy follows
 * the authentication contract's own asymmetry — one road almost everyone
 * takes, one named turning off it — rather than offering two equal doors or
 * asking a person to classify themselves before they can act.
 *
 * `?peran=` CHANGES NOTHING ON THIS SCREEN, and that is deliberate rather than
 * an omission. The parameter selects wording elsewhere and confers no role, no
 * permission and no scope; here there is nobody to word anything for. The
 * screen has not met this person yet and should not pretend it has, so a child
 * with a card and a head teacher with an email see the same welcome. It is
 * carried to the authentication boundary and dropped there: a presentation
 * hint that outlives the moment it was for invites later code to read it as an
 * assertion about who somebody is.
 *
 * THE LANGUAGE CONTROL IS HERE, BEFORE ANYONE SIGNS IN, for the reason it is
 * on the public verification page: a person who cannot read the screen cannot
 * sign in to change the setting. It is the same cookie mechanism the rest of
 * the Experience uses, which is also why the choice survives the magic-link
 * round trip — it never needed a session.
 */
export default async function Masuk({
  searchParams,
}: {
  searchParams: Promise<{ peran?: string; lanjut?: string }>;
}) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "public", { locale });
  // L-1. Narrowed here as well, because this value is written into a hidden
  // field and posted straight back; the actions narrow it again on receipt.
  const lanjut = tujuanInternal(sp.lanjut);
  // S15. Asked before anything is drawn: arriving here with a live session is
  // a different screen, not a variation of this one.
  const viewer = await currentViewer();

  return (
    <main className="pin-masuk">
      <div className="pin-panggung">
      <div className="pin-auth">
        <div className="pin-authtop">
          <MerekPintar />
          <PengalihBahasa locale={locale} />
        </div>

        <div className="pin-authbody">
          {viewer ? (
            /* S15. THE SCREEN DOES NOT NAME THE SIGNED-IN PERSON. A shared
               device shows this surface to whoever is holding it, and
               "Welcome back, Nadia" discloses Nadia to the next child in the
               queue. "Lanjutkan" is enough. */
            <div className="pin-form">
              <FokusAwal />
              <span className="pin-disc pin-disc-primary" aria-hidden="true">✓</span>
              <h1 className="pin-mh1" tabIndex={-1} data-fokus-awal="1">{s("auth.in_h")}</h1>
              <p className="pin-lede-m">{s("auth.in_p")}</p>
              <div className="pin-stack">
                <form action={lanjutkanSesi}>
                  <input type="hidden" name="lanjut" value={lanjut} />
                  <button type="submit" className="pin-mbtn pin-mbtn-1">{s("auth.in_go")}</button>
                </form>
                <form action={keluarDariSesi}>
                  <button type="submit" className="pin-mbtn pin-mbtn-2">{s("auth.in_out")}</button>
                </form>
              </div>
            </div>
          ) : (
            <LayarMasuk locale={locale} lanjut={lanjut} />
          )}

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

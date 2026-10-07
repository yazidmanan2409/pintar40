import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { currentViewer } from "@/lib/auth";
import { tujuanInternal } from "@/lib/tujuan";
import { bacaPintu, namaPintu } from "@/lib/konteks";
import PengalihBahasa from "@/components/PengalihBahasa";
import MerekPintar from "@/components/MerekPintar";
import LayarMasuk from "@/components/masuk/LayarMasuk";
import PanelPernyataan, { KalimatPonsel } from "@/components/masuk/PanelPernyataan";
import FokusAwal from "@/components/masuk/FokusAwal";
import TombolKirim from "@/components/TombolKirim";
import { keluarDariSesi, lanjutkanSesi } from "./actions";

export const dynamic = "force-dynamic";

/**
 * THE SIGN-IN SCREEN.
 *
 * A split stage: the form on the left, PINTAR's statement on the right
 * (D-018), and on a phone the panel goes and its statement stays below the
 * form. The hierarchy follows the authentication contract's own asymmetry —
 * one road almost everyone takes, one named turning off it — rather than
 * offering two equal doors or asking a person to classify themselves before
 * they can act.
 *
 * THE DOOR (`?pintu=`, L3, D-127 Q1, D-132) CHANGES NOTHING ON THIS SCREEN, and confers no role, no permission and
 * no scope. The screen has not met this person yet and should not pretend it has, so a child with a card and a head
 * teacher with an email see the same welcome. It is a PURPOSE, carried through the sign-in as the destination
 * `/mulai?pintu=…`, where the session's working context is set from what this person holds for it (§2.2). It
 * replaces `?peran=`, which was dropped here and so made «Saya mengajar» and «Saya mengelola sekolah» one door.
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
  searchParams: Promise<{ pintu?: string; lanjut?: string; sesi?: string }>;
}) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "public", { locale });
  // L-1. Narrowed here as well, because this value is written into a hidden
  // field and posted straight back; the actions narrow it again on receipt.
  // BOB-06 (D-010): no destination stays NO destination. Narrowed to "/" it
  // was posted back as if asked for, and beat the role's home.
  const asal = tujuanInternal(sp.lanjut, "");
  // L3: a door rides as the destination /mulai?pintu=…, with any page asked for after it (§2.2)
  const pintu = bacaPintu(sp.pintu);
  const lanjut = pintu
    ? `/mulai?pintu=${namaPintu(pintu)}${asal ? `&lanjut=${encodeURIComponent(asal)}` : ""}`
    : asal;
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
                  <TombolKirim className="pin-mbtn pin-mbtn-1" sibuk={s("tombol.memproses")}>{s("auth.in_go")}</TombolKirim>
                </form>
                <form action={keluarDariSesi}>
                  <TombolKirim className="pin-mbtn pin-mbtn-2" sibuk={s("tombol.memproses")}>{s("auth.in_out")}</TombolKirim>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* BOB-29: the proxy sends an ended session here (3 wrong PINs, 60 minutes locked, signed out elsewhere) */}
              {sp.sesi === "berakhir" ? <p className="pin-msg pin-msg-note" role="status">{s("masuk.sesi_berakhir")}</p> : null}
              <LayarMasuk locale={locale} lanjut={lanjut} />
            </>
          )}

          <KalimatPonsel locale={locale} />
        </div>

        <p className="pin-berdiri">{s("auth.foot")}</p>
        <span className="pin-tanda" aria-hidden="true" />
      </div>

      <PanelPernyataan locale={locale} />
      </div>
    </main>
  );
}

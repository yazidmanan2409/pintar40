import { t } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { currentViewer } from "@/lib/auth";
import PengalihBahasa from "@/components/PengalihBahasa";
import MerekPintar from "@/components/MerekPintar";
import PanelPernyataan, { KalimatPonsel } from "@/components/masuk/PanelPernyataan";
import MintaKode from "@/components/aktifkan/MintaKode";
import WizardAktivasi from "@/components/aktifkan/WizardAktivasi";

export const dynamic = "force-dynamic";

/**
 * «AKTIFKAN AKUN PINTAR ANDA» (DAISY-20, D-054, BOB-26 §1).
 *
 * Claiming an identity a school already provisioned; never registration (C1).
 * It starts signed out, so it is a public path in the proxy (BOB-26), and it is
 * drawn on the sign-in screen's own stage — the form on the left, PINTAR's
 * statement on the right — because activation is the first half of signing in,
 * not a different place.
 *
 * SIGNED OUT: the email, then the code (MintaKode). SIGNED IN: the wizard
 * (WizardAktivasi), which asks the server where the set-up stands; an account
 * whose set-up is REQUIRED is held here by the proxy until it finishes, and a
 * finished or inapplicable account is told so and sent home.
 *
 * The language control is here, before anyone signs in, for the sign-in
 * screen's reason: a person who cannot read the page cannot change the setting.
 */
export default async function Aktifkan() {
  const locale = await currentLocale();
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
            {viewer ? <WizardAktivasi locale={locale} /> : <MintaKode locale={locale} />}
            <KalimatPonsel locale={locale} />
          </div>
          <p className="pin-berdiri">{t("auth.foot", "public", { locale })}</p>
          <span className="pin-tanda" aria-hidden="true" />
        </div>
        <PanelPernyataan locale={locale} />
      </div>
    </main>
  );
}

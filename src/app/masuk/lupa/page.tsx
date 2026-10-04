import { t } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { PENGATURAN } from "@/lib/pengaturan-auth";
import PengalihBahasa from "@/components/PengalihBahasa";
import MerekPintar from "@/components/MerekPintar";
import PanelPernyataan, { KalimatPonsel } from "@/components/masuk/PanelPernyataan";
import LupaPassword from "@/components/aktifkan/LupaPassword";

export const dynamic = "force-dynamic";

/**
 * «LUPA PASSWORD?» (BOB-27, Gate 4; IDENTITY-4.0 §9, D-055(f)).
 *
 * Signed out, so a public path in the proxy, and drawn on the sign-in
 * screen's own stage, as «Aktifkan akun» is: recovering a password is part of
 * signing in, not a different place. The password rules are the canonical
 * setting's (supabase/auth-identitas.json), read here and shown before typing.
 */
export default async function Lupa() {
  const locale = await currentLocale();
  return (
    <main className="pin-masuk">
      <div className="pin-panggung">
        <div className="pin-auth">
          <div className="pin-authtop">
            <MerekPintar />
            <PengalihBahasa locale={locale} />
          </div>
          <div className="pin-authbody">
            <LupaPassword locale={locale} aturan={PENGATURAN.aturanPassword} />
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

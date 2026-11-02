import { t } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { PENGATURAN } from "@/lib/pengaturan-auth";
import { kanonikPintarId } from "@/lib/aktivasi-kontrak";
import PengalihBahasa from "@/components/PengalihBahasa";
import MerekPintar from "@/components/MerekPintar";
import PanelPernyataan, { KalimatPonsel } from "@/components/masuk/PanelPernyataan";
import LupaPassword from "@/components/aktifkan/LupaPassword";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/masuk/lupa");

export const dynamic = "force-dynamic";

/**
 * «LUPA PASSWORD?» (BOB-27, Gate 4; IDENTITY-4.0 §9, D-055(f)).
 *
 * Signed out, so a public path in the proxy, and drawn on the sign-in
 * screen's own stage, as «Aktifkan akun» is: recovering a password is part of
 * signing in, not a different place. The password rules are the canonical
 * setting's (supabase/auth-identitas.json), read here and shown before typing.
 *
 * BOB-28 (Gate 5): the same page recovers with a PINTAR ID and PIN. Opened
 * from a card's public page (/id/<ID>), `?id=` starts it there with the ID
 * filled in: the same door and the same ladder as a typed ID.
 */
export default async function Lupa({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const locale = await currentLocale();
  const { id } = await searchParams;
  const idAwal = kanonikPintarId(Array.isArray(id) ? id[0] : id);
  return (
    <main id="isi" tabIndex={-1} className="pin-masuk">
      <div className="pin-panggung">
        <div className="pin-auth">
          <div className="pin-authtop">
            <MerekPintar />
            <PengalihBahasa locale={locale} />
          </div>
          <div className="pin-authbody">
            <LupaPassword locale={locale} aturan={PENGATURAN.aturanPassword} idAwal={idAwal} />
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

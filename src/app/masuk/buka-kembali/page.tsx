import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import PengalihBahasa from "@/components/PengalihBahasa";
import MerekPintar from "@/components/MerekPintar";
import PanelPernyataan from "@/components/masuk/PanelPernyataan";
import BarisHasil from "@/components/BarisHasil";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/masuk/buka-kembali");
export const dynamic = "force-dynamic";

/**
 * OWNER RULING 2 (9 Nov): «MINTA AKUN DIBUKA KEMBALI», signed out, on the sign-in screen's own stage as «Lupa password?»
 * is. One form, posted to /masuk/buka-kembali/kirim (its door). What the person is told is the same whatever they type:
 * the request reaches the Admin PINTAR only if the account was closed, and nothing reopens until an Admin PINTAR has
 * verified who they are.
 */
export default async function BukaKembali({ searchParams }: { searchParams: Promise<{ hasil?: string; kode?: string }> }) {
  const locale = await currentLocale();
  const sp = await searchParams;
  const s = (k: HleEvent) => t(k, "public", { locale });
  return (
    <main id="isi" tabIndex={-1} className="pin-masuk">
      <div className="pin-panggung">
        <div className="pin-auth">
          <div className="pin-authtop">
            <MerekPintar />
            <PengalihBahasa locale={locale} />
          </div>
          <div className="pin-authbody" data-buka-kembali="">
            <h1>{s("buka_kembali.judul")}</h1>
            <p className="pin-meta">{s("buka_kembali.arti")}</p>
            {sp.hasil === "terkirim" ? <BarisHasil nada="ok">{s("buka_kembali.terkirim")}</BarisHasil> : null}
            {sp.kode ? <BarisHasil nada="gagal">{s(sp.kode === "ISIAN" ? "buka_kembali.galat.isian" : "buka_kembali.galat.umum")}</BarisHasil> : null}
            {sp.hasil === "terkirim" ? null : (
              <form method="post" action="/masuk/buka-kembali/kirim" className="pin-isian">
                <label htmlFor="bk-identitas">{s("buka_kembali.identitas")}</label>
                <input id="bk-identitas" name="identitas" className="pin-input" required maxLength={254} autoComplete="username" />
                <label htmlFor="bk-pesan">{s("buka_kembali.pesan")}</label>
                <p className="pin-meta" id="bk-pesan-arti">{s("buka_kembali.pesan_arti")}</p>
                <textarea id="bk-pesan" name="pesan" className="pin-input" rows={4} required minLength={10} maxLength={500}
                  aria-describedby="bk-pesan-arti" />
                <button type="submit" className="pin-btn pin-primary">{s("buka_kembali.kirim")}</button>
              </form>
            )}
            <p className="pin-rute"><a className="pin-tautan" href="/masuk">{s("buka_kembali.ke_masuk")}</a></p>
          </div>
          <p className="pin-berdiri">{t("auth.foot", "public", { locale })}</p>
          <span className="pin-tanda" aria-hidden="true" />
        </div>
        <PanelPernyataan locale={locale} />
      </div>
    </main>
  );
}

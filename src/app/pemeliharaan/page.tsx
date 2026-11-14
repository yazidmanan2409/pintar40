import Link from "next/link";
import { redirect } from "next/navigation";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { jamWib, jendelaUtama, statusSaya } from "@/lib/pemeliharaan";
import MerekPintar from "@/components/MerekPintar";
import PengalihBahasa from "@/components/PengalihBahasa";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/pemeliharaan");

export const dynamic = "force-dynamic";

/**
 * #148 (D-094, D-100(b)(c)): WHERE A PERSON THE MAINTENANCE STOPS IS SENT, and the one page that answers them
 * (src/proxy.ts; the database's pre-request lets its status read through). Receive, acknowledge, explain, next step:
 *
 *  - PLANNED, under way: since when, the estimated end, the administrators' message, that what was saved is safe, and
 *    an assessment handed in since it began acknowledged with its time; come back after it ends.
 *  - EMERGENCY: PINTAR stopped by Admin platform for safety; what was saved is safe and nothing was deleted; anything
 *    not yet «Tersimpan» did not reach PINTAR; a sitting under way was not handed in for them, and if its time ran out
 *    meanwhile they tell their teacher (D-100(c): no pretended continuity).
 *  - A new assessment refused in the 15 minutes before a window (?mulai=ditolak): when maintenance starts, and to
 *    start it after.
 *  - Nothing stopping them: PINTAR is available, back to it.
 *
 * «Keluar» is always offered, so a shared computer can be left for the next person.
 */
export default async function Pemeliharaan({ searchParams }: { searchParams: Promise<{ mulai?: string }> }) {
  const locale = await currentLocale();
  const { mulai } = await searchParams;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  const status = await statusSaya();
  const w = jendelaUtama(status);
  const s = (k: HleEvent) => t(k, "learner", { locale });
  const jam = (iso: string) => `${jamWib(iso)} ${s("pemeliharaan.zona")}`;

  let isi: React.ReactNode;
  if (status.terhenti === "EMERGENCY") {
    isi = (
      <>
        {/* A2a, Daisy (A2-KATA-DESAIN.md A3): a class stop names its classes; a person with another class or school is
            told the stop reaches them there too, only where true */}
        {w?.jenis === "EMERGENCY" && w.kelas ? (
          <>
            <h1 className="pin-mh1">{s("pemeliharaan.darurat.judul_kelas").replace("{kelas}", w.kelas.join(", "))}</h1>
            <p className="pin-lede-m">{s("pemeliharaan.darurat.arti_kelas")}</p>
            {w.kelasLain ? <p className="pin-lede-m">{s("pemeliharaan.darurat.kelas_lain")}</p> : null}
          </>
        ) : (
          <>
            <h1 className="pin-mh1">{s("pemeliharaan.darurat.judul")}</h1>
            <p className="pin-lede-m">{s("pemeliharaan.darurat.arti")}</p>
          </>
        )}
        <p className="pin-msg pin-msg-note">{s("pemeliharaan.darurat.aman")}</p>
        <p className="pin-lede-m">{s("pemeliharaan.darurat.asesmen")}</p>
        <p className="pin-lede-m"><strong>{s("pemeliharaan.darurat.langkah")}</strong></p>
      </>
    );
  } else if (status.terhenti === "PLANNED" && w) {
    isi = (
      <>
        <h1 className="pin-mh1">{s("pemeliharaan.judul")}</h1>
        <p className="pin-lede-m">
          {s("pemeliharaan.sejak")} {jam(w.mulai)}.{" "}
          {w.selesai ? <>{s("pemeliharaan.kira")} {jam(w.selesai)}.</> : s("pemeliharaan.kira_belum")}
        </p>
        {w.pesan ? <p className="pin-msg pin-msg-note"><strong>{s("pemeliharaan.pesan")}</strong> {w.pesan}</p> : null}
        {w.terkumpul ? <p className="pin-lede-m" role="status">{s("pemeliharaan.terkumpul")} {jam(w.terkumpul)}.</p> : null}
        <p className="pin-lede-m">{s("pemeliharaan.aman")}</p>
        <p className="pin-lede-m"><strong>{s("pemeliharaan.langkah")}</strong></p>
      </>
    );
  } else if (mulai === "ditolak" && w && w.jenis === "PLANNED" && w.keadaan !== "AKTIF") {
    isi = (
      <>
        <h1 className="pin-mh1">{s("pemeliharaan.menjelang.judul")}</h1>
        <p className="pin-lede-m">
          {s("pemeliharaan.pita.pukul")} {jam(w.mulai)}.{" "}
          {w.selesai ? <>{s("pemeliharaan.pita.selesai_kira")} {jam(w.selesai)}.</> : null}
        </p>
        <p className="pin-lede-m">{s("pemeliharaan.menjelang.arti")}</p>
        <Link className="pin-mbtn pin-mbtn-1" href="/">{s("pemeliharaan.kembali.tautan")}</Link>
      </>
    );
  } else if (w && w.jenis === "PLANNED" && w.keadaan === "AKTIF") {
    // under way, but it does not stop this reader: their sitting drains, or they administer the window
    isi = (
      <>
        <h1 className="pin-mh1">{s("pemeliharaan.pita.berlangsung")}</h1>
        <p className="pin-lede-m">{w.menguasai ? s("pemeliharaan.pita.menguasai") : s("pemeliharaan.pita.berjalan")}</p>
        <Link className="pin-mbtn pin-mbtn-1" href="/">{s("pemeliharaan.kembali.tautan")}</Link>
      </>
    );
  } else {
    isi = (
      <>
        <h1 className="pin-mh1">{s("pemeliharaan.kembali.judul")}</h1>
        <p className="pin-lede-m" role="status">{s("pemeliharaan.kembali.arti")}</p>
        <Link className="pin-mbtn pin-mbtn-1" href="/">{s("pemeliharaan.kembali.tautan")}</Link>
      </>
    );
  }

  return (
    <main id="isi" tabIndex={-1} className="pin-masuk">
      <div className="pin-panggung">
        <div className="pin-auth">
          <div className="pin-authtop">
            <MerekPintar />
            <PengalihBahasa locale={locale} />
          </div>
          <div className="pin-authbody">
            <div className="pin-form">
              {isi}
              <form action="/keluar" method="post" className="pin-stack">
                <button type="submit" className="pin-mbtn pin-mbtn-2">{t("sesi.keluar", "learner", { locale })}</button>
              </form>
            </div>
          </div>
          <p className="pin-berdiri">{t("auth.foot", "public", { locale })}</p>
          <span className="pin-tanda" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}

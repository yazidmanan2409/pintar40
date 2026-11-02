import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import { PERAN_STAF } from "@/components/sesi";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import KakiPintar from "@/components/KakiPintar";
import AkunSaya from "@/components/aktifkan/AkunSaya";
import KeluarSemua from "@/components/sesi/KeluarSemua";
import { supabaseServer } from "@/lib/supabase/server";
import { bacaPenjagaan, HALAMAN_PERANGKAT } from "@/lib/penjaga-sesi-kontrak";
import { konteksSaya } from "@/lib/konteks-server";
import { berandaPasangan } from "@/lib/konteks";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/akun");

export const dynamic = "force-dynamic";

/**
 * AKUN SAYA (DAISY-20, BOB-26 §4): the staff member's PINTAR ID, QR and card.
 *
 * STAFF ONLY, DECIDED BEFORE ANYTHING IS ASKED (C17). Students keep the class
 * card and see no PINTAR-ID screen in 4.0, so a reader without a staff role —
 * or whose roles could not be read — gets the one refusal page, and the card's
 * data is never requested for them. The route refuses them too
 * (`403 TIDAK_BERLAKU`); this is the page not asking.
 *
 * L3 (CR-83; D-127 Q1, D-132 §2.6): AKUN SAYA KEEPS THE WORKING CONTEXT. It is a neutral surface: it changes no
 * context and wears the active one's shell, whose tabs include that context's home, so Dr Gladys in Mengajar · SD B
 * opens Akun saya and comes back to Mengajar · SD B (DG-20). Without a context (an evaluation persona, C10) the shell
 * is read from the roles, as before.
 */
export default async function Akun() {
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const peran = await peranSaya();
  const staf = Boolean(peran?.some((p) => PERAN_STAF.includes(p)));
  if (!staf) {
    return <HalamanPenolakan messageKey="auth.not_yet" persona="public" locale={locale} backHref="/" backKey="galat.beranda" />;
  }
  // BOB-29 (C11): what this browser was declared for this person, to show and to change
  const { data: sesi } = await (await supabaseServer()).rpc("sesi_periksa");
  const mode = bacaPenjagaan(sesi)?.mode;
  const k = await konteksSaya();
  const kind = k?.keadaan === "ADA"
    ? (k.tujuan === "BELAJAR" ? "learner" : k.tujuan === "MENGAJAR" ? "pengajar"
        : berandaPasangan(k) === "/pimpinan" ? "pimpinan" : "pendataan")
    : peran!.includes("EDUCATOR") ? "pengajar"
      : peran!.some((p) => p === "HEAD_OF_DEPARTMENT" || p === "DEAN") ? "pimpinan"
        : "pendataan";

  return (
    <>
      <CangkangPengalaman locale={locale} kind={kind} halamanKini="akun" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <div className="pin-head">
          <h1 className="pin-h1">{s("akun.judul")}</h1>
          <p className="pin-intro">{s("akun.intro")}</p>
        </div>
        <AkunSaya locale={locale} />
        {mode === "SHARED" || mode === "PERSONAL" ? (
          <section className="pin-sec" aria-labelledby="pin-akun-perangkat">
            <h2 id="pin-akun-perangkat">{s("akun.perangkat.judul")}</h2>
            <p className="pin-meta">{s(mode === "SHARED" ? "akun.perangkat.SHARED" : "akun.perangkat.PERSONAL")}</p>
            <div className="pin-actions">
              <a className="pin-btn" href={`${HALAMAN_PERANGKAT}?lanjut=%2Fakun`}>{s("akun.perangkat.ubah")}</a>
            </div>
          </section>
        ) : null}
        <KeluarSemua locale={locale} />
        <KakiPintar />
      </main>
    </>
  );
}

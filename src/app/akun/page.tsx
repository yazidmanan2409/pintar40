import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import { PERAN_STAF } from "@/components/sesi";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import KakiPintar from "@/components/KakiPintar";
import AkunSaya from "@/components/aktifkan/AkunSaya";
import KeluarSemua from "@/components/sesi/KeluarSemua";
import FotoProfil from "@/components/akun/FotoProfil";
import { supabaseServer } from "@/lib/supabase/server";
import { bacaPenjagaan, HALAMAN_PERANGKAT } from "@/lib/penjaga-sesi-kontrak";
import { konteksSaya } from "@/lib/konteks-server";
import { berandaPasangan } from "@/lib/konteks";
import { judulHalaman } from "@/lib/judul-halaman";
import { evaluationState } from "@/lib/evaluation";
import MeninggalkanPintar, { type PermintaanSaya } from "@/components/akun/MeninggalkanPintar";
import { kodeAkunDari } from "@/lib/akun-kontrak";

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
export default async function Akun({ searchParams }: { searchParams: Promise<{ hasil?: string; kode?: string }> }) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const peran = await peranSaya();
  const staf = Boolean(peran?.some((p) => PERAN_STAF.includes(p)));
  // J1.8 (W6.10), before the staff check, so a learner persona meets it too: an evaluation persona is kept out of
  // identity. Its account is not the viewer's, so the page is not a dead end («belum bisa dimuat») beside a photo
  // upload: it says why, and the way back is the demonstration room
  if (await evaluationState()) {
    return <HalamanPenolakan messageKey="evaluasi.akun_tidak_ada" persona="staff" locale={locale} backHref="/evaluasi" backKey="evaluasi.kembali" />;
  }
  // L1 (owner, 9 Nov): «Akun saya» for everyone. A learner's page holds what leaving means and how, and signing out
  // everywhere; the rest of this page is a staff account's
  const sb = await supabaseServer();
  const { data: akuL } = await sb.rpc("current_person_id");
  if (!akuL) {
    return <HalamanPenolakan messageKey="auth.not_yet" persona="public" locale={locale} backHref="/" backKey="galat.beranda" />;
  }
  const { data: mintaData } = await sb.rpc("permintaan_akun_saya");
  const permintaan = (Array.isArray(mintaData) ? mintaData : []) as PermintaanSaya[];
  const { data: belajar } = await sb.from("enrollments").select("id").eq("person_id", akuL).in("status", ["PENDING", "ACTIVE"]).limit(1);
  const bisaMinta = (belajar ?? []).length === 0;
  const tinggal = (persona: "staff" | "learner") => (
    <MeninggalkanPintar locale={locale} bisaMinta={bisaMinta} permintaan={permintaan} hasil={sp.hasil} kode={kodeAkunDari(sp.kode)} persona={persona} />
  );
  if (!staf) {
    const sl = (k: HleEvent) => t(k, "learner", { locale });
    return (
      <>
        <CangkangPengalaman locale={locale} kind="learner" halamanKini="akun" />
        <main id="isi" tabIndex={-1} className="pin-col">
          <div className="pin-head">
            <h1 className="pin-h1">{sl("akun.judul")}</h1>
            <p className="pin-intro">{sl("akun.tinggal.intro_murid")}</p>
          </div>
          {tinggal("learner")}
          <KeluarSemua locale={locale} />
          <KakiPintar />
        </main>
      </>
    );
  }
  // BOB-29 (C11): what this browser was declared for this person, to show and to change
  const supabase = await supabaseServer();
  const { data: sesi } = await supabase.rpc("sesi_periksa");
  // W2.8 (CR-07): the person's own photo, shown through the read route (/api/assets/read-url, alih=1: a 60-second signed
  // URL, the database deciding who may see whose photo), never through a URL this page signs itself
  const { data: aku } = await supabase.rpc("current_person_id");
  const { data: orang } = aku ? await supabase.from("persons").select("photo_path").eq("id", aku).maybeSingle() : { data: null };
  const jalurFoto = (orang as { photo_path?: string | null } | null)?.photo_path ?? null;
  const urlFoto = jalurFoto && aku && jalurFoto.startsWith(`profile/${aku}/`)
    ? `/api/assets/read-url?path=${encodeURIComponent(jalurFoto)}&alih=1`
    : null;
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
        {aku ? <FotoProfil locale={locale} personId={String(aku)} url={urlFoto} /> : null}
        {mode === "SHARED" || mode === "PERSONAL" ? (
          <section className="pin-sec" aria-labelledby="pin-akun-perangkat">
            <h2 id="pin-akun-perangkat">{s("akun.perangkat.judul")}</h2>
            <p className="pin-meta">{s(mode === "SHARED" ? "akun.perangkat.SHARED" : "akun.perangkat.PERSONAL")}</p>
            <div className="pin-actions">
              <a className="pin-btn" href={`${HALAMAN_PERANGKAT}?lanjut=%2Fakun`}>{s("akun.perangkat.ubah")}</a>
            </div>
          </section>
        ) : null}
        {tinggal("staff")}
        <KeluarSemua locale={locale} />
        <KakiPintar />
      </main>
    </>
  );
}

import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import PemulihanPin from "@/components/keamanan/PemulihanPin";
import CatatanKeamanan, { type BarisKeamanan } from "@/components/keamanan/CatatanKeamanan";
import { judulHalaman } from "@/lib/judul-halaman";
import AkunPlatform, { type BarisPermintaan, type KeadaanAkun } from "@/components/keamanan/AkunPlatform";
import { kodeAkunDari } from "@/lib/akun-kontrak";

export const generateMetadata = judulHalaman("/konfigurasi/keamanan");

export const dynamic = "force-dynamic";

/**
 * «KEAMANAN AKUN» (BOB-28 with DAISY-22; C5 path (2), C7; D-101 (1)): the
 * assisted PIN-recovery tool, and for the Platform Admin the security record.
 *
 * For the Platform Admin and a School Admin: anyone else gets the one refusal
 * page. Which person each may assist is the database's (recovery_status and
 * admin_reset_recovery: a School Admin, a person their school has; never one's
 * own); the security record stays the Platform Admin's (security_event_list).
 * The reset is `/api/keamanan/pemulihan`'s: a stated reason, audited; the
 * ladder back to 0 and a new PIN required; every session of the person ended;
 * the owner and the security recipient are emailed.
 */
export default async function Keamanan({ searchParams }: { searchParams: Promise<{ pid?: string; hasil?: string; apa?: string; kode?: string }> }) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [supabase, viewer] = await Promise.all([supabaseServer(), currentViewer()]);
  const saya = viewer?.personId ?? null;
  const [{ data: sistem }, { data: adminSekolah }] = await Promise.all([
    supabase.rpc("is_system_admin"),
    saya
      ? supabase.from("role_assignments").select("id").eq("person_id", saya).eq("role", "INSTITUTION_ADMIN")
          .is("revoked_at", null).gt("valid_until", new Date().toISOString()).limit(1)
      : Promise.resolve({ data: [] as Array<{ id: string }> }),
  ]);
  if (!saya || (sistem !== true && (adminSekolah ?? []).length === 0)) {
    return <HalamanPenolakan messageKey="keamanan.ditolak" persona="staff" locale={locale} backHref="/" backKey="galat.beranda" />;
  }
  const { data } = sistem === true ? await supabase.rpc("security_event_list", { p_limit: 50 }) : { data: null };
  const baris = ((Array.isArray(data) ? data : []) as Array<{ at: string; action: string; pintar_id: string | null }>)
    .map((r): BarisKeamanan => ({ waktu: String(r.at), aksi: String(r.action), pintarId: r.pintar_id ?? null }));

  // §5b / L2–L4: the PINTAR Administrator finds one identity by its PINTAR ID, and reads the people's own requests
  const pid = /^[0-9A-HJKMNP-TV-Z]{8}$/.test((sp.pid ?? "").trim().toUpperCase()) ? (sp.pid ?? "").trim().toUpperCase() : "";
  let akun: KeadaanAkun | null = null;
  let antrean: BarisPermintaan[] = [];
  if (sistem === true) {
    if (pid) {
      const { data: o } = await supabase.from("persons").select("id").eq("pintar_id", pid).maybeSingle();
      const id = (o as { id?: string } | null)?.id;
      if (id) akun = ((await supabase.rpc("akun_keadaan", { p_person: id })).data ?? null) as KeadaanAkun | null;
    }
    antrean = ((await supabase.rpc("permintaan_akun_antrean")).data ?? []) as BarisPermintaan[];
  }

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" halamanKini="keamanan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("keamanan.eyebrow")}</p>
          <h1 className="pin-h1">{s("keamanan.judul")}</h1>
          <p className="pin-intro">{s("keamanan.intro")}</p>
        </div>
        <PemulihanPin locale={locale} />
        {sistem === true ? (
          <AkunPlatform locale={locale} pid={pid} akun={akun} antrean={antrean} hasil={sp.hasil} apa={sp.apa} kode={kodeAkunDari(sp.kode)} />
        ) : null}
        {sistem === true ? (
          <CatatanKeamanan locale={locale} baris={baris} />
        ) : null}
        <KakiPintar />
      </main>
    </>
  );
}

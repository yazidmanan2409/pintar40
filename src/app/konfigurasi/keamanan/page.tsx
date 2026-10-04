import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import PemulihanPin from "@/components/keamanan/PemulihanPin";
import CatatanKeamanan, { type BarisKeamanan } from "@/components/keamanan/CatatanKeamanan";

export const dynamic = "force-dynamic";

/**
 * «KEAMANAN AKUN» (BOB-28 with DAISY-22; C5 path (2), C7): the platform
 * admin's PIN-recovery tool and the security record.
 *
 * For the platform admin only: the page asks is_system_admin and shows anyone
 * else the one refusal page; the database refuses them too (recovery_status,
 * admin_reset_recovery and security_event_list are SYSTEM_ADMIN's). The reset
 * is `/api/keamanan/pemulihan`'s: a stated reason, audited; the ladder back to
 * 0 and a new PIN required; the owner and the security recipient are emailed.
 */
export default async function Keamanan() {
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();
  const { data: sistem } = await supabase.rpc("is_system_admin");
  if (sistem !== true) {
    return <HalamanPenolakan messageKey="keamanan.ditolak" persona="staff" locale={locale} backHref="/" backKey="entry.title" />;
  }
  const { data } = await supabase.rpc("security_event_list", { p_limit: 50 });
  const baris = ((Array.isArray(data) ? data : []) as Array<{ at: string; action: string; pintar_id: string | null }>)
    .map((r): BarisKeamanan => ({ waktu: String(r.at), aksi: String(r.action), pintarId: r.pintar_id ?? null }));

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" />
      <main className="pin-col">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("keamanan.eyebrow")}</p>
          <h1 className="pin-h1">{s("keamanan.judul")}</h1>
          <p className="pin-intro">{s("keamanan.intro")}</p>
        </div>
        <PemulihanPin locale={locale} />
        <CatatanKeamanan locale={locale} baris={baris} />
        <KakiPintar />
      </main>
    </>
  );
}

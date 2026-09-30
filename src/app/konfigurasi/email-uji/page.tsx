import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import FormEmailUji from "@/components/email-uji/FormEmailUji";
import { NAMA_PENGATURAN_EMAIL } from "@/app/api/_email/pengaturan";

export const dynamic = "force-dynamic";

/**
 * «KIRIM EMAIL UJI» (BOB-51, D-057, REL-08): Gate 2E's delivery proof as a
 * click, so M6 and the C-11 production send need no typed commands.
 *
 * For the platform admin only: the page asks is_system_admin and shows anyone
 * else the one refusal page. The page decides nothing about the send; the route
 * (`POST /api/email/uji`, BOB-25, unchanged) asks again, applies the limits and
 * writes the send log.
 */
export default async function EmailUji() {
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();
  const { data: sistem } = await supabase.rpc("is_system_admin");
  if (sistem !== true) {
    return (
      <HalamanPenolakan messageKey="emailuji.ditolak" persona="staff" locale={locale}
        backHref="/" backKey="entry.title" />
    );
  }

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" />
      <main className="pin-col">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("emailuji.eyebrow")}</p>
          <h1 className="pin-h1">{s("emailuji.judul")}</h1>
          <p className="pin-intro">{s("emailuji.intro")}</p>
        </div>
        <FormEmailUji locale={locale} namaPengaturan={NAMA_PENGATURAN_EMAIL} />
        <KakiPintar />
      </main>
    </>
  );
}

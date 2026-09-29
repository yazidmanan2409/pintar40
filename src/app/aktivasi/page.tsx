import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { sekolahPendataan } from "@/lib/pendataan";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import FormAktivasi from "@/components/aktivasi/FormAktivasi";
import { KeMasuk } from "@/components/aktivasi/HasilAktivasi";

export const dynamic = "force-dynamic";

/**
 * ACCOUNT ACTIVATION (F-01) — where a provisioned person becomes someone who
 * can sign in.
 *
 * The intake provisions people and deliberately activates nothing ("provisioned
 * is not active", WP5B). This screen is the step after it, and it is a screen
 * of its own so that rule stays true of the intake. Everything shown comes from
 * `persons_awaiting_account()` — the people in the institutions where the
 * reader holds CAN_PROVISION_PEOPLE who hold no account — and every action goes
 * through `/api/akun/aktivasi`, where the database decides before an identity
 * is created. A reader with no such institution sees the one refusal page.
 */
export default async function Aktivasi() {
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();

  const [{ data: menunggu, error }, { data: sistem }] = await Promise.all([
    supabase.rpc("persons_awaiting_account"),
    supabase.rpc("is_system_admin"),
  ]);
  const orang = (Array.isArray(menunggu) ? menunggu : []) as Array<{
    person_id: string; display_name: string; institutional_id: string; institution_id: string;
  }>;
  const adminSistem = sistem === true;

  // who may use this screen at all: a SYSTEM_ADMIN, or anyone the intake
  // already recognises as provisioning for a school (the same predicate)
  const sekolah = adminSistem ? [] : await sekolahPendataan();
  if (error || (!adminSistem && sekolah.length === 0)) {
    return (
      <HalamanPenolakan messageKey="aktivasi.ditolak" persona="staff" locale={locale}
        backHref="/" backKey="entry.title" />
    );
  }

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" current="aktivasi" />
      <main className="pin-col">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("aktivasi.eyebrow")}</p>
          <h1 className="pin-h1">{s("aktivasi.judul")}</h1>
          {/* Polish batch 2 (UX-11): the sign-in address, not the path /masuk */}
          <p className="pin-intro">{s("aktivasi.intro")} <KeMasuk s={s} sebelum="aktivasi.intro.buka" /></p>
        </div>
        <FormAktivasi locale={locale} orang={orang} adminSistem={adminSistem} />
        <KakiPintar />
      </main>
    </>
  );
}

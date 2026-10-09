import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { t } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { bacaPenjagaan, COOKIE_PERANGKAT } from "@/lib/penjaga-sesi-kontrak";
import { hashPerangkat } from "@/lib/penjaga-sesi";
import { tujuanInternal } from "@/lib/tujuan";
import MerekPintar from "@/components/MerekPintar";
import PengalihBahasa from "@/components/PengalihBahasa";
import PilihPerangkat from "@/components/sesi/PilihPerangkat";

export const dynamic = "force-dynamic";

/**
 * «KOMPUTER SIAPA INI?» (BOB-29; IDENTITY-4.0 C11).
 *
 * Asked of a staff person after signing in on a browser that has not answered it (the proxy sends them here once
 * the set-up is done), and open from Akun saya to change the answer. «Komputer bersama» is the default and the
 * safer choice; «Komputer pribadi saya» keeps D-009's 7 days. A declaration for this browser, not proof of
 * ownership. A class card and an evaluation persona are never asked (T1, D-086(c), C13): they go back.
 */
export default async function Perangkat({ searchParams }: { searchParams: Promise<{ lanjut?: string | string[] }> }) {
  const locale = await currentLocale();
  const { lanjut } = await searchParams;
  const tujuan = tujuanInternal(Array.isArray(lanjut) ? lanjut[0] : lanjut, "/");
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  // CR-92: asked with this browser's own identity, as the proxy asks, so a browser already declared opens on its choice
  // (without it the database cannot find the declaration and answers «not chosen yet», which preselected «shared»)
  const alat = (await cookies()).get(COOKIE_PERANGKAT)?.value;
  const { data, error } = await supabase.rpc("sesi_periksa", { p_perangkat: hashPerangkat(alat) });
  const jaga = error ? null : bacaPenjagaan(data);
  if (!jaga || jaga.keadaan !== "BUKA" || (jaga.mode !== "SHARED" && jaga.mode !== "PERSONAL")) redirect(tujuan);
  return (
    <main className="pin-masuk">
      <div className="pin-panggung">
        <div className="pin-auth">
          <div className="pin-authtop">
            <MerekPintar />
            <PengalihBahasa locale={locale} />
          </div>
          <div className="pin-authbody">
            <PilihPerangkat locale={locale} awal={jaga.perluPilih ? "SHARED" : jaga.mode} tujuan={tujuan} />
          </div>
          <p className="pin-berdiri">{t("auth.foot", "public", { locale })}</p>
          <span className="pin-tanda" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}

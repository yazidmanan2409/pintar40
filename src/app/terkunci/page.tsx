import { redirect } from "next/navigation";
import { t } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { bacaPenjagaan } from "@/lib/penjaga-sesi-kontrak";
import { tujuanInternal } from "@/lib/tujuan";
import MerekPintar from "@/components/MerekPintar";
import PengalihBahasa from "@/components/PengalihBahasa";
import LayarTerkunci from "@/components/sesi/LayarTerkunci";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/terkunci");

export const dynamic = "force-dynamic";

/**
 * «PINTAR TERKUNCI» (BOB-29, Gate 6; IDENTITY-4.0 C4, §3; D-085 T1).
 *
 * Where a locked session is sent (src/proxy.ts), and the only page it may open. It shows nothing of the person but,
 * for a staff person, their own name, as the session strip does; a learner is never named (S15, D-020). The PIN
 * resumes this session only; «Bukan akun Anda?» signs this computer out so the next person signs in as themselves.
 * Asked while the session is open, it goes back to the page; ended, to the sign-in.
 *
 * Works entirely on the shared computer: no phone, no message, nothing but the PIN (owner, 4 Oct: SD/SMP students
 * have no phone at school; a forgotten card PIN is the school's to re-issue).
 */
export default async function Terkunci({ searchParams }: { searchParams: Promise<{ lanjut?: string | string[] }> }) {
  const locale = await currentLocale();
  const { lanjut } = await searchParams;
  const tujuan = tujuanInternal(Array.isArray(lanjut) ? lanjut[0] : lanjut, "/");
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  const { data, error } = await supabase.rpc("sesi_periksa");
  const jaga = error ? null : bacaPenjagaan(data);
  if (!jaga || jaga.keadaan === "BUKA" || jaga.keadaan === "TANPA") redirect(tujuan);
  const kartu = jaga.mode === "CARD";
  const persona = kartu ? "learner" : "staff";
  return (
    <main id="isi" tabIndex={-1} className="pin-masuk">
      <div className="pin-panggung">
        <div className="pin-auth">
          <div className="pin-authtop">
            <MerekPintar />
            <PengalihBahasa locale={locale} />
          </div>
          <div className="pin-authbody">
            <LayarTerkunci
              locale={locale}
              persona={persona}
              kartu={kartu}
              nama={kartu ? null : jaga.nama}
              berakhir={jaga.keadaan === "BERAKHIR"}
              bisaPin={jaga.bisaPin}
              percobaanSisa={jaga.percobaanSisa}
              tujuan={tujuan}
            />
          </div>
          <p className="pin-berdiri">{t("auth.foot", "public", { locale })}</p>
          <span className="pin-tanda" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}

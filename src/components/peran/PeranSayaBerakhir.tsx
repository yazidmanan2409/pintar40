import Link from "next/link";
import Ikon from "@/components/Ikon";
import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";
import { supabaseServer } from "@/lib/supabase/server";
import { HARI_PERINGATAN, type PeranBerakhir } from "@/lib/peran-kontrak";

/**
 * B0 · THE HOLDER'S OWN NOTICE. On a role holder's home, from seven days before one of their own roles ends
 * (peran_akan_berakhir without a school answers the caller's own roles; the database counts the days on the school's
 * clock). Nothing is drawn when none ends: no heading, no empty line. The date is said on the role's own clock.
 *
 * A notice, not an action: a role is renewed by whoever may grant it, on «Peran & akses». The one holder who renews
 * their own, the platform's only active administrator, is given the way there.
 */
export default async function PeranSayaBerakhir({ locale, persona = "staff" }: { locale: Locale; persona?: Persona }) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("peran_akan_berakhir", { p_institution: null, p_hari: HARI_PERINGATAN.sendiri });
  const milik = error ? [] : ((data ?? []) as PeranBerakhir[]).filter((r) => r.milik_sendiri);
  if (milik.length === 0) return null;
  const s = (k: HleEvent) => t(k, persona, { locale });
  const peran = (r: string) => (["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"].includes(r) ? s(`role.${r}` as HleEvent) : "—");
  return (
    <div className="pin-banner pin-info mt-4" role="status" aria-labelledby="pin-peran-saya" data-peran-saya={milik.length}>
      <Ikon nama="info" />
      <p id="pin-peran-saya" className="font-medium">{s("peran.saya.judul")}</p>
      <ul className="grid gap-1 text-sm">
        {milik.map((r) => {
          const sendiri = r.role === "SYSTEM_ADMIN" && r.pemegang_terakhir;
          const kunci: HleEvent = sendiri ? "peran.saya.berakhir_sendiri" : r.role === "SYSTEM_ADMIN" || !r.tempat ? "peran.saya.berakhir_platform" : "peran.saya.berakhir";
          return (
            <li key={r.id} data-peran-saya-baris={r.id} data-sisa-hari={r.sisa_hari}>
              {s(kunci).replace("{peran}", peran(r.role)).replace("{tempat}", r.tempat ?? "").replace("{tanggal}", tanggal(r.valid_until, "baca", locale, r.zona))}
              {sendiri ? <> <Link className="pin-tautan" href={`/konfigurasi/roles?perpanjang=${r.id}#perpanjang`}>{s("peran.saya.buka")}</Link></> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

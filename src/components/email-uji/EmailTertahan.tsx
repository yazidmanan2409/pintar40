import { t, type HleEvent, type Locale } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { tanggal } from "@/lib/tanggal";
import Kosong from "@/components/Kosong";
import { JENIS_EMAIL as JENIS, MENIT_TERTAHAN } from "./jenis";


/**
 * W2.19 (Batch 4, J1.9): «PENGIRIMAN TERTAHAN». The sends the email server has not answered after ten minutes, read
 * from the send log by email_send_stuck (the platform admin's only; no address, code or message), oldest first: what
 * kind, when it was handed to the server, how long it has waited, and its reference for «Riwayat pengiriman» and the
 * server log. None at all is said as such, not as an empty list.
 */
export default async function EmailTertahan({ locale }: { locale: Locale }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("email_send_stuck", { p_minutes: MENIT_TERTAHAN });
  const baris = (Array.isArray(data) ? data : []) as Array<{ id: string; kind: string; requested_at: string; minutes: number }>;
  return (
    <section className="pin-akt-orang" aria-labelledby="email-tertahan" id="tertahan">
      <h2 id="email-tertahan">{s("emailuji.t.judul")}</h2>
      <p className="pin-meta">{s("emailuji.t.intro")}</p>
      {error ? (
        <p className="pin-meta">{s("emailuji.t.galat")}</p>
      ) : baris.length === 0 ? (
        <Kosong jenis="belum" kalimat={s("emailuji.t.kosong")} />
      ) : (
        <ul className="pin-lap-baris" data-tertahan={baris.length}>
          {baris.map((b) => (
            <li key={b.id}>
              <span><strong>{s(JENIS[b.kind] ?? "emailuji.r.jenis.lain")}</strong> · {tanggal(b.requested_at, "cap", locale) || b.requested_at}</span>
              <span>
                {s("emailuji.t.menunggu")} <span className="pin-num">{b.minutes}</span> {s("emailuji.t.menit")}
                {" · "}{s("emailuji.rujukan")} <span className="pin-num">{b.id}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

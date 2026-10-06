import { allKeys, t, TANPA_SALINAN, TIMEZONE, type HleEvent, type Locale } from "@/lib/hle";
import { tampilPintarId } from "@/lib/aktivasi-kontrak";
import BarisHasil from "@/components/BarisHasil";

export type BarisKeamanan = { waktu: string; aksi: string; pintarId: string | null };

const BERNAMA = new Set<string>(allKeys().filter((k) => k.startsWith("keamanan.a.")));

/**
 * THE SECURITY RECORD (BOB-28, C7's in-app list): the newest identity and
 * recovery events from the audit log (security_event_list), each with the
 * PINTAR ID it concerns. What is shown is what the record holds; an event this
 * page has no words for is shown by its own name, never hidden.
 */
export default function CatatanKeamanan({ locale, baris }: { locale: Locale; baris: BarisKeamanan[] }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const nama = (aksi: string) => (BERNAMA.has(`keamanan.a.${aksi}`) ? s(`keamanan.a.${aksi}` as HleEvent) : aksi);
  const waktu = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE,
    }).format(d);
  };
  return (
    <section className="pin-sec" aria-labelledby="pin-keamanan-catatan">
      <h2 id="pin-keamanan-catatan">{s("keamanan.catatan_judul")}</h2>
      {baris.length === 0 ? (
        <BarisHasil nada="netral">{s("keamanan.catatan_kosong")}</BarisHasil>
      ) : (
        <ul className="pin-lap-baris">
          {baris.map((b, i) => (
            <li key={`${b.waktu}-${i}`}>
              <span><strong>{nama(b.aksi)}</strong> · {waktu(b.waktu)}</span>
              <span className="pin-num">{b.pintarId ? tampilPintarId(b.pintarId) : TANPA_SALINAN}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

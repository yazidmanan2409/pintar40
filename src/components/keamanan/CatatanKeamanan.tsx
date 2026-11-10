import { allKeys, t, TANPA_SALINAN, type HleEvent, type Locale } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";
import { tampilPintarId } from "@/lib/aktivasi-kontrak";
import BarisHasil from "@/components/BarisHasil";
import { kataAksiAudit } from "@/lib/jejak-audit";

export type BarisKeamanan = { waktu: string; aksi: string; pintarId: string | null };

const BERNAMA = new Set<string>(allKeys().filter((k) => k.startsWith("keamanan.a.")));

/**
 * THE SECURITY RECORD (BOB-28, C7's in-app list): the newest identity and
 * recovery events from the audit log (security_event_list), each with the
 * PINTAR ID it concerns. What is shown is what the record holds; an event this
 * page has no words for is still shown, never hidden, in the words of the Jejak audit (its action's own, else its
 * area's, else «Perubahan tercatat»), never by its code (D-140(c), 9 Oct review RV-2). The moment carries its year
 * and WIB: an account's security event is tied to no school, so it is written on the platform's stated clock (the
 * owner's ruling, 10 Nov), «WIB» printed.
 */
export default function CatatanKeamanan({ locale, baris }: { locale: Locale; baris: BarisKeamanan[] }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const nama = (aksi: string) => (BERNAMA.has(`keamanan.a.${aksi}`) ? s(`keamanan.a.${aksi}` as HleEvent) : kataAksiAudit(aksi, locale));
  // a line of history: the timestamp, with its year and WIB («9 Okt 2026, 07.30 WIB»; W3.3, RV-16)
  const waktu = (iso: string) => tanggal(iso, "cap", locale) || iso;
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
              <span>{s("idpage.id_label")} <span className="pin-num">{b.pintarId ? tampilPintarId(b.pintarId) : TANPA_SALINAN}</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

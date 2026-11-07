import { format, t, type HleEvent, type Locale } from "@/lib/hle";
import { JudulBagian } from "@/components/laporan/tata";

/**
 * KESETIAAN #18 (owner GO, 7 Nov): EVIDENCE READINESS PER SUBJECT, as the Dekan's school report draws it. Per subject,
 * how many of the classes it is assigned to are enough to interpret (kesiapan_kelas_per_mapel: the denominator is every
 * active class with an active academic assignment of the subject; a class is enough when the learners holding an
 * official Uji Penguasaan of its chapters reach the class distribution's minimum), and the classes not yet, by how far.
 * Counts only, never a result; the same closing note as Pimpinan's readiness (not yet enough is not a bad result).
 */
export type MapelKesiapan = {
  mapel: string; cukup: number; semua: number;
  belum: ReadonlyArray<{ kelas: string; ada: number; perlu: number }>;
};

export default function KesiapanMapel({ mapel, locale, huruf }: { mapel: readonly MapelKesiapan[]; locale: Locale; huruf: string }) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  return (
    <section className="pin-lk-bagian" data-lk="kesiapan" aria-labelledby="pin-kesiapan">
      <JudulBagian huruf={huruf} judul={s("pimpinan.kesiapan.judul")} id="pin-kesiapan" locale={locale} />
      <ul className="pin-lk-daftar" data-lk-kesiapan-mapel="">
        {mapel.map((m) => (
          <li key={m.mapel}>
            <span>{s("laporan.sekolah.mapel_cukup").replace("{mapel}", m.mapel).replace("{n}", format.number(m.cukup, locale)).replace("{m}", format.number(m.semua, locale))}</span>
            {m.belum.length > 0 ? (
              <small>{m.belum.map((r) => r.ada === 0
                ? s("laporan.sekolah.mapel_belum_ada").replace("{kelas}", r.kelas)
                : s("laporan.sekolah.mapel_belum_cukup").replace("{kelas}", r.kelas).replace("{ada}", format.number(r.ada, locale)).replace("{perlu}", format.number(r.perlu, locale))).join("; ")}</small>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="pin-lk-arti">{s("pimpinan.kesiapan.catatan")}</p>
    </section>
  );
}

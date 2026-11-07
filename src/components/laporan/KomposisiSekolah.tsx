import { format, t, type HleEvent, type Locale } from "@/lib/hle";
import { nilaiMetrik } from "@/lib/nilai-metrik";
import { kalimatJumlah, labelMetrik, type Envelope } from "@/components/bukti";
import { kunciMuncul } from "@/components/bukti/muncul";
import NilaiLaporan from "@/components/bukti/NilaiLaporan";
import { actionText } from "@/app/_intel";
import { persenJujur } from "@/components/laporan/KomposisiKelas";

/**
 * CONTOH LAPORAN 4-dekan (Daisy, «DESIGN DIRECTION APPROVED», 7 Nov): THE SCHOOL SUMMARY AS ONE COMPOSITION.
 *
 *   A «Capaian kompetensi»: one dot per domain on a 0–100% scale, high to low, PINTAR's band zones named once in a
 *     legend above the scale (R4-01); a domain below 60% is amber and names its band (G-03); R4-02's decimal. The lead
 *     names the domains below 60%.
 *   B the headline figures, each with its base («numbers never stand alone»): «Sertifikat terbit» is MC-1, the
 *     certificates issued and not revoked out of all issued (R4-03).
 *   C «Perbandingan angkatan» on the same zoned scale, captioned as a comparison of states, not a ranking.
 *   … every other figure of the school's template; «Apa berikutnya».
 *
 * School aggregates only: no class, teacher or student is named. Every value is the evaluator's envelope from
 * `generate_report`, re-authorized for this reader; a figure not shown keeps its place with how far it is and what
 * makes it appear (P14); a refused figure carries no label.
 */
type Domain = { objective_id?: string | null; code?: string; competency?: string; mean_score?: number; learners?: number };
type Angkatan = { cohort_node_id?: string; learners?: number; mean_mastery?: number };

const HURUF = "ABCDEFGHIJ";
/** PINTAR's fixed band boundaries (kesiapan.catatan: 80% and up, 60–79%, below 60%), drawn as zone lines. */
const ZONA = [0.6, 0.8] as const;
const ANGKA = ["institution.participants", "institution.net_gain", "institution.safety_gate_pass_rate", "institution.verified_credentials"];
const LABEL: Record<string, string> = {
  "metrik.kompetensi.label": "institution.competency_outcomes", "metrik.perbandingan_kohort.label": "institution.cohort_comparison",
  "metrik.peserta_institusi.label": "institution.participants", "metrik.kenaikan_institusi.label": "institution.net_gain",
  "metrik.gerbang_keselamatan.label": "institution.safety_gate_pass_rate", "metrik.kredensial.label": "institution.verified_credentials",
};

export function pilahSekolah(entries: readonly Envelope[]) {
  const per = new Map<string, Envelope>();
  const lain: Envelope[] = [];
  for (const e of entries) {
    const id = e.metric_id ?? (e.label_key ? LABEL[e.label_key] : undefined);
    if (id && Object.values(LABEL).includes(id) && !per.has(id)) per.set(id, e);
    else lain.push(e);
  }
  return { per, lain };
}

export default function KomposisiSekolah({ entries, locale, tempat = {} }: {
  entries: readonly Envelope[];
  locale: Locale;
  /** The visible name of each cohort a row names, by id. */
  tempat?: Readonly<Record<string, string>>;
}) {
  const untuk = "staff" as const;
  const s = (k: string, p: "staff" = untuk, l: Locale = locale) => t(k as HleEvent, p, { locale: l });
  const { per, lain } = pilahSekolah(entries);
  const komp = per.get("institution.competency_outcomes");
  const kohort = per.get("institution.cohort_comparison");
  const angka = ANGKA.map((m) => per.get(m)).filter((e): e is Envelope => Boolean(e));
  let n = 0;
  const huruf = () => HURUF[n++] ?? "";

  const tiada = (e: Envelope) => (
    <>
      <p className="pin-lk-arti">{s(e.statement_key ?? "laporan.metrik.tidak_dikenal")}</p>
      {kalimatJumlah(e, locale, untuk) ? <p className="pin-lk-arti">{kalimatJumlah(e, locale, untuk)}</p> : null}
      {kunciMuncul(e) ? <p className="pin-lk-arti">{s(kunciMuncul(e)!, untuk, locale)}</p> : null}
    </>
  );
  const judul = (e: Envelope, h: string) => (
    <h2 className="pin-lk-h"><span className="pin-lk-huruf" aria-hidden="true">{h}</span><span>{labelMetrik(e, untuk, locale)}</span></h2>
  );
  // the band zones, named once, above the scale (R4-01)
  const zona = (
    <p className="pin-lk-arti">{s("laporan.sekolah.zona")
      .replace("{penguatan}", s("kesiapan.butuh_pendampingan")).replace("{berkembang}", s("kesiapan.perlu_review")).replace("{mantap}", s("kesiapan.siap_sertifikasi"))}</p>
  );
  const pitaDari = (v: number) => (v < ZONA[0] ? "kesiapan.butuh_pendampingan" : v < ZONA[1] ? "kesiapan.perlu_review" : "kesiapan.siap_sertifikasi");
  const titik = (rows: Array<{ kunci: string; nama: string; v: number; sub?: string }>) => (
    <ul className="pin-lk-baris">
      {rows.map((r) => {
        const bawah = r.v < ZONA[0];
        return (
          <li key={r.kunci} data-bawah={bawah ? "" : undefined}>
            <span className="pin-lk-nama">{r.nama}{r.sub ? <small className="pin-lk-arti" style={{ display: "block" }}>{r.sub}</small> : null}</span>
            <span className="pin-lk-jalur" aria-hidden="true">
              {ZONA.map((z) => <span key={z} className="pin-lk-zona" style={{ left: `${z * 100}%` }} />)}
              <span className="pin-lk-titik" style={{ left: `${Math.max(0, Math.min(1, r.v)) * 100}%` }} />
            </span>
            <span className="pin-lk-nilai">
              {persenJujur(r.v, locale)}
              {bawah ? <small className="pin-lk-bawah">{s(pitaDari(r.v))}</small> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const domain: Domain[] = komp?.status === "ok" && Array.isArray(komp.value) ? (komp.value as Domain[]) : [];
  const urut = [...domain].filter((d) => typeof d.mean_score === "number").sort((a, b) => Number(b.mean_score) - Number(a.mean_score));
  const rendah = urut.filter((d) => Number(d.mean_score) < ZONA[0]);
  const hKomp = komp ? huruf() : "";
  const hAngka = angka.length > 0 ? huruf() : "";
  const hKohort = kohort ? huruf() : "";
  const hLain = lain.length > 0 ? huruf() : "";
  const hBerikut = huruf();

  const dasar = (e: Envelope): string | null => {
    const n2 = typeof e.sample === "number" ? e.sample : null;
    if (n2 === null) return null;
    switch (e.metric_id) {
      case "institution.net_gain": return s("laporan.komposisi.kenaikan_dari").replace("{n}", format.number(n2, locale));
      case "institution.safety_gate_pass_rate": return s("laporan.sekolah.dasar_gerbang").replace("{n}", format.number(n2, locale));
      case "institution.verified_credentials": {
        const v = Number(e.value);
        return Number.isFinite(v) ? s("laporan.sekolah.dasar_sertifikat").replace("{v}", format.number(v, locale))
          .replace("{n}", format.number(n2, locale)).replace("{d}", format.number(Math.max(0, n2 - v), locale)) : null;
      }
      default: return null;
    }
  };

  return (
    <div className="pin-lk">
      {komp ? (
        <section className="pin-lk-inti" aria-labelledby="lk-sekolah-a" data-lk="kompetensi" data-lk-entri={labelMetrik(komp, untuk, locale)}>
          <h2 className="pin-lk-h" id="lk-sekolah-a"><span className="pin-lk-huruf" aria-hidden="true">{hKomp}</span><span>{labelMetrik(komp, untuk, locale)}</span></h2>
          {komp.status === "ok" && urut.length > 0 ? (
            <>
              <p className="pin-lk-kalimat" data-lk-kalimat="">
                {rendah.length > 0
                  ? s("laporan.sekolah.perhatian").replace("{daftar}", rendah.map((d) => d.competency ?? "").filter(Boolean).join("; "))
                  : s("laporan.sekolah.semua_cukup")}
              </p>
              {zona}
              {titik(urut.map((d, i) => ({ kunci: d.objective_id ?? d.code ?? String(i), nama: d.competency ?? "—", v: Number(d.mean_score) })))}
              <p className="pin-lk-arti" data-lk-tindakan="">{actionText(komp, locale)}</p>
            </>
          ) : komp.status === "ok" ? null : tiada(komp)}
        </section>
      ) : null}

      {angka.length > 0 ? (
        <section className="pin-lk-bagian" data-lk="angka">
          <h2 className="pin-lk-h"><span className="pin-lk-huruf" aria-hidden="true">{hAngka}</span><span>{s("laporan.sekolah.angka")}</span></h2>
          <div className="pin-lk-angka-baris">
            {angka.map((e, i) => (
              <div key={e.metric_id ?? i} className="pin-lk-angka"
                data-lk-entri={e.status === "ok" || e.status === "below_minimum" || e.status === "deprecated" ? labelMetrik(e, untuk, locale) : ""}>
                {e.status === "ok" || e.status === "below_minimum" || e.status === "deprecated" ? <h3>{labelMetrik(e, untuk, locale)}</h3> : null}
                {e.status === "ok" ? (
                  <>
                    <p className="pin-lk-angka-nilai">{nilaiMetrik(e.metric_id, e.value, locale)}</p>
                    {dasar(e) ? <p>{dasar(e)}</p> : null}
                    <p data-lk-tindakan="">{actionText(e, locale)}</p>
                  </>
                ) : tiada(e)}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {kohort ? (
        <section className="pin-lk-bagian" data-lk="kohort" data-lk-entri={labelMetrik(kohort, untuk, locale)}>
          {judul(kohort, hKohort)}
          {kohort.status === "ok" && Array.isArray(kohort.value) && kohort.value.length > 0 ? (
            <>
              <p className="pin-lk-arti">{s("laporan.sekolah.kohort_arti")}</p>
              {titik((kohort.value as Angkatan[]).filter((r) => typeof r.mean_mastery === "number").map((r, i) => ({
                kunci: r.cohort_node_id ?? String(i),
                nama: (r.cohort_node_id && tempat[r.cohort_node_id]) || "—",
                v: Number(r.mean_mastery),
                sub: typeof r.learners === "number" ? `${format.number(r.learners, locale)} ${s("mengajar.bukti.murid")}` : undefined,
              })))}
              <p className="pin-lk-arti" data-lk-tindakan="">{actionText(kohort, locale)}</p>
            </>
          ) : kohort.status === "ok" ? null : tiada(kohort)}
        </section>
      ) : null}

      {lain.length > 0 ? (
        <section className="pin-lk-bagian" data-lk="lain">
          <h2 className="pin-lk-h"><span className="pin-lk-huruf" aria-hidden="true">{hLain}</span><span>{s("laporan.komposisi.lainnya")}</span></h2>
          <div className="pin-lk-angka-baris">
            {lain.map((e, i) => (
              <div key={e.metric_id ?? e.ordinal ?? i} className="pin-lk-angka"
                data-lk-entri={e.status === "ok" || e.status === "below_minimum" || e.status === "deprecated" ? labelMetrik(e, untuk, locale) : ""}>
                {e.status === "ok" || e.status === "below_minimum" || e.status === "deprecated" ? <h3>{labelMetrik(e, untuk, locale)}</h3> : null}
                {e.status === "ok" ? (
                  <>
                    <NilaiLaporan entry={e} locale={locale} tempat={tempat} persona="staff" />
                    <p data-lk-tindakan="">{actionText(e, locale)}</p>
                  </>
                ) : tiada(e)}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="pin-lk-bagian" data-lk="berikutnya">
        <h2 className="pin-lk-h"><span className="pin-lk-huruf" aria-hidden="true">{hBerikut}</span><span>{s("laporan.komposisi.berikutnya")}</span></h2>
        <ul className="pin-lk-langkah">
          <li>{s("laporan.sekolah.berikutnya_kesiapan")}</li>
        </ul>
      </section>
    </div>
  );
}

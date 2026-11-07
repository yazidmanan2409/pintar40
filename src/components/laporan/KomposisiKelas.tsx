import { format, t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import { nilaiMetrik, urutkanPita } from "@/lib/nilai-metrik";
import type { JenisAnggota } from "@/lib/mengajar";
import { kalimatJumlah, labelMetrik, PopulasiKelas, type Envelope } from "@/components/bukti";
import { kunciMuncul } from "@/components/bukti/muncul";
import NilaiLaporan from "@/components/bukti/NilaiLaporan";
import { daftarKata, JudulBagian } from "@/components/laporan/tata";

/**
 * CONTOH LAPORAN 2-guru / 2b (Daisy, «DESIGN DIRECTION APPROVED», 7 Nov): THE CLASS REPORT AS ONE COMPOSITION.
 *
 * One sentence first, then the picture that shows it, then each figure in its lettered section (G-02):
 *   A «Penguasaan per topik»: the rows on one 0–100% scale with the class's target line; a row below the target is
 *     amber and says «di bawah target» in words (G-03). The lead sentence names the topics below the target, and the
 *     band and average lines sit under it.
 *   B «Sebaran hasil Uji Penguasaan»: the class's population line (CR-81: «belum mengerjakan» is a count, never a
 *     band), then one bar over the assessed, three steps of one teal, each named with its count.
 *   C «Kenaikan»: the figure, and the people it was computed from (MC-8: each learner's two tests of one chapter).
 *   D «Pemahaman keliru yang berulang»: each with its count and remedy.
 *   E «Murid yang perlu penguatan» (D-195(5)): the teacher's own class only.
 *   … every other figure the school's template carries, as before; then «Apa berikutnya».
 *
 * KESETIAAN (Daisy's fidelity check, 7 Nov): no advice line under a figure (the remedy lives in D and in «Apa
 * berikutnya» only); one heading grammar for every section, its letter read aloud; a list said as a sentence; when
 * every figure still waits for evidence, one lead says how far and the figures say it once each (2b).
 *
 * NOTHING HERE COMPUTES A FIGURE. Every value is the evaluator's envelope from `generate_report`, re-authorized for
 * THIS reader; the sentences only count and name what the envelopes hold (how many rows stop short of the target).
 * A figure not shown keeps its place with the existing sentences (P14, 2b): what it is, how far it is from appearing,
 * and what will make it appear. A metric the reader may not see carries no label (the refusal discloses nothing).
 */
type Baris = { objective_id?: string | null; code?: string; competency?: string; mean_score?: number; learners?: number };
type Keliru = { code?: string; label?: string; remediation?: string | null; occurrences?: number };

const HURUF = "ABCDEFGHIJ";
const PITA: Record<string, "mantap" | "berkembang" | "penguatan"> = {
  "kesiapan.siap_sertifikasi": "mantap",
  "kesiapan.perlu_review": "berkembang",
  "kesiapan.butuh_pendampingan": "penguatan",
};

export const METRIK_KOMPOSISI = ["class.topic_mastery", "class.readiness_distribution", "class.net_gain", "class.misconceptions"] as const;

/** The class's envelopes by metric; an entry without an id is matched by its label key. */
export function pilahEntri(entries: readonly Envelope[]): { per: Map<string, Envelope>; lain: Envelope[] } {
  const LABEL: Record<string, string> = {
    "metrik.topik.label": "class.topic_mastery", "metrik.kesiapan.label": "class.readiness_distribution",
    "metrik.kenaikan.label": "class.net_gain", "metrik.miskonsepsi.label": "class.misconceptions",
    "metrik.pemahaman.label": "class.comprehension", "metrik.peserta.label": "class.participants",
  };
  const per = new Map<string, Envelope>();
  const lain: Envelope[] = [];
  for (const e of entries) {
    const id = e.metric_id ?? (e.label_key ? LABEL[e.label_key] : undefined);
    if (id && (METRIK_KOMPOSISI as readonly string[]).includes(id) && !per.has(id)) per.set(id, e);
    else { if (id === "class.comprehension" && !per.has(id)) per.set(id, e); lain.push(e); }
  }
  return { per, lain };
}

/** The topics below the target, in the evaluator's own order; none without a target. */
export function diBawahTarget(baris: readonly Baris[], target: number | null): Baris[] {
  if (target === null) return [];
  return baris.filter((b) => typeof b.mean_score === "number" && b.mean_score < target);
}

/**
 * R4-02 (CONTOH LAPORAN, 7 Nov): A VALUE NEVER ROUNDS ACROSS A LINE THE READER JUDGES BY. 59,6% shown as «60%» sits in
 * «Perlu penguatan» while reading as its boundary; 74,8% shown as «75%» is below a 75% target while reading as on it.
 * Where whole-percent rounding would carry a value across PINTAR's band boundaries (60%, 80%) or the class's target,
 * the value shows one decimal; everywhere else, whole percents as before. No band or rule changes.
 */
export function persenJujur(x: number, locale: Locale, garis: ReadonlyArray<number | null> = []): string {
  const bulat = Math.round(x * 100) / 100;
  const lewat = [0.6, 0.8, ...garis].some((g) => g !== null && g !== undefined && (x < g) !== (bulat < g));
  return lewat
    ? new Intl.NumberFormat(locale === "en" ? "en-GB" : "id-ID", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(x)
    : format.percent(x, locale);
}

export default function KomposisiKelas({ entries, locale, persona, jenis, target, namaKelas, buktiHref, tempat = {}, penguatan = null, muridHref = null }: {
  entries: readonly Envelope[];
  locale: Locale;
  persona: Persona;
  jenis: JenisAnggota;
  /** The class's one sealed Uji Penguasaan mark (a fraction), or null when there is not exactly one. */
  target: number | null;
  namaKelas: string;
  /** «Lihat bukti», for a reader who teaches the class; null otherwise (the step is then said, not linked). */
  buktiHref: string | null;
  /** The visible name of each place a row names (cohort rows), by id. */
  tempat?: Readonly<Record<string, string>>;
  /** D-195(5): the class's learners in the lowest band, by name (the teacher's only); null draws no section E. */
  penguatan?: ReadonlyArray<{ id: string; nama: string; ulang: readonly string[]; benar?: number | null; total?: number | null; soalWajibTepat?: boolean | null }> | null;
  /** The teacher's view of one learner, as `${muridHref}/${id}`; null: names are not links. */
  muridHref?: string | null;
}) {
  const s = (k: string, p: Persona = persona, l: Locale = locale) => t(k as HleEvent, p, { locale: l });
  const untuk = persona === "educator" || persona === "staff" ? persona : "staff";
  const persen = (x: number) => format.percent(x, locale);
  const { per: m, lain: sisa } = pilahEntri(entries);
  const topik = m.get("class.topic_mastery");
  const pita = m.get("class.readiness_distribution");
  const naik = m.get("class.net_gain");
  const keliru = m.get("class.misconceptions");
  const paham = m.get("class.comprehension");
  const kepala = (h: string, judul: string, id?: string) => <JudulBagian huruf={h} judul={judul} id={id} persona={untuk} locale={locale} />;
  // the comprehension figure is said in A's lead when it is shown; otherwise it keeps its own place below
  const dalamKalimat = paham?.status === "ok" && Number.isFinite(Number(paham.value))
    && topik?.status === "ok" && Array.isArray(topik.value) && topik.value.length > 0;
  // KESETIAAN #9: the participants are B's population line; no second «Peserta» tile repeats it
  const adaPopulasi = Boolean(pita?.population);
  const lain = sisa.filter((e) => !(e === paham && dalamKalimat)
    && !(adaPopulasi && (e.metric_id === "class.participants" || e.label_key === "metrik.peserta.label")));
  let n = 0;
  const huruf = () => HURUF[n++] ?? "";

  // 2b (KESETIAAN #11): every figure still waits for evidence — one lead says how far; each figure says it once
  const komposisi = [topik, pita, naik, keliru].filter((e): e is Envelope => Boolean(e));
  const tertahan = (e: Envelope) => e.status === "below_minimum";
  const semuaTertahan = komposisi.length > 0 && komposisi.every(tertahan) && [...lain].every((e) => e.status !== "ok");
  const pop = pita?.population as { placed?: number; assessed?: number } | undefined;
  const perlu = komposisi.map((e) => e.needed).find((x): x is number => typeof x === "number");

  // the absence in a figure's place: what it is, how far, what makes it appear (P14; 2b) — one line when the lead says the rest
  const tiada = (e: Envelope) => semuaTertahan ? (
    <p className="pin-lk-arti" data-lk-tiada="">{[s(e.statement_key ?? "laporan.metrik.tidak_dikenal"), kalimatJumlah(e, locale, untuk, jenis)].filter(Boolean).join(" ")}</p>
  ) : (
    <>
      <p className="pin-lk-arti">{s(e.statement_key ?? "laporan.metrik.tidak_dikenal")}</p>
      {kalimatJumlah(e, locale, untuk, jenis) ? <p className="pin-lk-arti">{kalimatJumlah(e, locale, untuk, jenis)}</p> : null}
      {kunciMuncul(e) ? <p className="pin-lk-arti">{s(kunciMuncul(e)!, untuk, locale)}</p> : null}
    </>
  );

  const baris: Baris[] = topik?.status === "ok" && Array.isArray(topik.value) ? (topik.value as Baris[]) : [];
  const bawah = diBawahTarget(baris, target);
  const sebaran = pita?.status === "ok" && pita.value && typeof pita.value === "object"
    ? urutkanPita(Object.entries(pita.value as Record<string, number>)).filter(([k]) => PITA[k]) : [];
  const dinilai = sebaran.reduce((a, [, c]) => a + Number(c), 0);
  const hitung = (p: string) => Number(sebaran.find(([k]) => PITA[k] === p)?.[1] ?? 0);

  // the lead sentence: counted from the rows, with no cause and no advice
  let kalimat: string | null = null;
  if (baris.length > 0) {
    if (target !== null && bawah.length > 0) {
      kalimat = s("laporan.komposisi.topik_di_bawah").replace("{n}", format.number(bawah.length, locale))
        .replace("{m}", format.number(baris.length, locale))
        .replace("{daftar}", daftarKata(bawah.map((b) => b.competency ?? ""), locale));
    } else if (target !== null) {
      kalimat = s("laporan.komposisi.topik_semua").replace("{target}", persen(target));
    } else {
      const rendah = [...baris].sort((a, b) => Number(a.mean_score) - Number(b.mean_score))[0];
      if (rendah?.competency) kalimat = s("laporan.komposisi.topik_terendah").replace("{nama}", rendah.competency);
    }
  }
  const sub: Array<{ teks: string; entri?: string }> = [];
  if (dinilai > 0) {
    sub.push({ teks: s("laporan.komposisi.pita_ringkas").replace("{baik}", format.number(hitung("mantap") + hitung("berkembang"), locale))
      .replace("{n}", format.number(dinilai, locale)).replace("{kurang}", format.number(hitung("penguatan"), locale))
      .replace("{mantap}", s("kesiapan.siap_sertifikasi")).replace("{berkembang}", s("kesiapan.perlu_review")) });
  }
  if (dalamKalimat && paham) {
    sub.push({ teks: s("laporan.komposisi.rata_rata").replace("{label}", labelMetrik(paham, untuk, locale))
      .replace("{nilai}", persenJujur(Number(paham.value), locale, [target])), entri: labelMetrik(paham, untuk, locale) });
  }

  const hLead = semuaTertahan ? huruf() : "";
  const hTopik = topik ? huruf() : "";
  const hPita = pita ? huruf() : "";
  const hNaik = naik ? huruf() : "";
  const hKeliru = keliru ? huruf() : "";
  // E: only beside a band figure that is shown, so a name never appears where the class's bands do not
  const adaPenguatan = penguatan !== null && pita?.status === "ok" && dinilai > 0;
  const hPenguatan = adaPenguatan ? huruf() : "";
  const hLain = lain.length > 0 ? huruf() : "";
  const hBerikut = huruf();
  // the ticks the target label would sit on are left out (#10: the label is on the scale, at the target line)
  const centang = [0, 0.2, 0.4, 0.6, 0.8, 1].filter((x) => target === null || Math.abs(x - target) >= 0.1);

  return (
    <div className="pin-lk">
      {semuaTertahan ? (
        <section className="pin-lk-bagian" data-lk="tertahan" aria-labelledby="lk-tertahan">
          {kepala(hLead, s("laporan.komposisi.tertahan_judul"), "lk-tertahan")}
          <div className="pin-lk-inti">
            <p className="pin-lk-kalimat" data-lk-kalimat="">{s("laporan.komposisi.tertahan").replace("{kelas}", namaKelas)}</p>
            {typeof pop?.assessed === "number" && typeof pop?.placed === "number" && typeof perlu === "number" ? (
              <p className="pin-lk-kalimat-sub">{s("laporan.komposisi.tertahan_sub").replace("{n}", format.number(pop.assessed, locale))
                .replace("{m}", format.number(pop.placed, locale)).replace("{perlu}", format.number(perlu, locale))}</p>
            ) : null}
            {pita ? <PopulasiKelas populasi={pita.population} locale={locale} /> : null}
          </div>
        </section>
      ) : null}

      {topik ? (
        <section className="pin-lk-bagian" aria-labelledby="lk-a" data-lk="topik" data-lk-entri={labelMetrik(topik, untuk, locale)}>
          {kepala(hTopik, labelMetrik(topik, untuk, locale), "lk-a")}
          {topik.status === "ok" && baris.length > 0 ? (
            <div className="pin-lk-inti">
              {kalimat ? <p className="pin-lk-kalimat" data-lk-kalimat="">{kalimat}</p> : null}
              {sub.length > 0 ? (
                <p className="pin-lk-kalimat-sub">
                  {sub.map((x, i) => <span key={i} data-lk-entri={x.entri}>{i > 0 ? " " : ""}{x.teks}</span>)}
                </p>
              ) : null}
              <div className="pin-lk-gambar">
                <div className="pin-lk-skala" aria-hidden="true">
                  <span />
                  <div className="pin-lk-skala-garis">
                    {centang.map((x) => (
                      <span key={x} style={{ left: `${x * 100}%` }} data-antara={x > 0 && x < 1 ? "" : undefined}>{persen(x)}</span>
                    ))}
                    {target !== null ? (
                      <span className="pin-lk-skala-target" style={{ left: `${target * 100}%` }}>
                        {s("laporan.komposisi.target").replace("{p}", persen(target))}
                      </span>
                    ) : null}
                  </div>
                  <span />
                </div>
                <ul className="pin-lk-baris">
                  {baris.map((b, i) => {
                    const v = Number(b.mean_score);
                    const kurang = target !== null && v < target;
                    return (
                      <li key={b.objective_id ?? b.code ?? i} data-bawah={kurang ? "" : undefined}>
                        <span className="pin-lk-nama">{b.competency}</span>
                        <span className="pin-lk-jalur" aria-hidden="true">
                          <span className="pin-lk-isi" style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%` }} />
                          {target !== null ? <span className="pin-lk-target" style={{ left: `${target * 100}%` }} /> : null}
                        </span>
                        <span className="pin-lk-nilai">
                          {Number.isFinite(v) ? persenJujur(v, locale, [target]) : "—"}
                          {kurang ? <small className="pin-lk-bawah">{s("mengajar.murid1.di_bawah_target")}</small> : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {target !== null ? <p className="pin-lk-arti">{s("laporan.komposisi.target_arti").replace("{p}", persen(target))}</p> : null}
            </div>
          ) : topik.status === "ok" ? null : tiada(topik)}
        </section>
      ) : null}

      {pita ? (
        <section className="pin-lk-bagian" data-lk="pita" data-lk-entri={labelMetrik(pita, untuk, locale)}>
          {kepala(hPita, labelMetrik(pita, untuk, locale))}
          {pita.meaning_key && !semuaTertahan ? <p className="pin-lk-arti">{s(pita.meaning_key)}</p> : null}
          {semuaTertahan ? null : <PopulasiKelas populasi={pita.population} locale={locale} />}
          {pita.status === "ok" && dinilai > 0 ? (
            <div className="pin-lk-pita">
              <p className="pin-lk-arti">{s("kesiapan.pita.judul").replace("{n}", format.number(dinilai, locale))}</p>
              <div className="pin-lk-pita-batang" aria-hidden="true">
                {(["mantap", "berkembang", "penguatan"] as const).map((p) => hitung(p) > 0 ? (
                  <span key={p} data-pita={p} style={{ flex: hitung(p) }}>{format.number(hitung(p), locale)}</span>
                ) : null)}
              </div>
              <ul className="pin-lk-pita-ket">
                {sebaran.map(([k, c]) => (
                  <li key={k}><i data-pita={PITA[k]} aria-hidden="true" />{s(k)} <strong>{s("laporan.komposisi.pita_ket")
                    .replace("{n}", format.number(Number(c), locale)).replace("{p}", persen(Number(c) / dinilai))}</strong></li>
                ))}
              </ul>
              <p className="pin-lk-arti">{s("kesiapan.catatan")}</p>
            </div>
          ) : pita.status === "ok" ? null : tiada(pita)}
        </section>
      ) : null}

      {naik ? (
        <section className="pin-lk-bagian" data-lk="kenaikan" data-lk-entri={labelMetrik(naik, untuk, locale)}>
          {kepala(hNaik, labelMetrik(naik, untuk, locale))}
          {naik.meaning_key && !semuaTertahan ? <p className="pin-lk-arti">{s(naik.meaning_key)}</p> : null}
          {naik.status === "ok" && Number.isFinite(Number(naik.value)) ? (
            <div className="pin-lk-angka-baris">
              <div className="pin-lk-angka">
                <p className="pin-lk-angka-nilai">{nilaiMetrik("class.net_gain", Number(naik.value), locale)}</p>
                {typeof naik.sample === "number" ? (
                  <p>{s("laporan.komposisi.kenaikan_dari").replace("{n}", format.number(naik.sample, locale))}</p>
                ) : null}
              </div>
            </div>
          ) : naik.status === "ok" ? null : tiada(naik)}
        </section>
      ) : null}

      {keliru ? (
        <section className="pin-lk-bagian" data-lk="keliru" data-lk-entri={labelMetrik(keliru, untuk, locale)}>
          {kepala(hKeliru, labelMetrik(keliru, untuk, locale))}
          {keliru.meaning_key && !semuaTertahan ? <p className="pin-lk-arti">{s(keliru.meaning_key)}</p> : null}
          {keliru.status === "ok" && Array.isArray(keliru.value) && keliru.value.length > 0 ? (
            <ul className="pin-lk-daftar">
              {(keliru.value as Keliru[]).map((k, i) => (
                <li key={k.code ?? i}>
                  <span>{k.label}</span>
                  <span className="pin-lk-nilai">{format.number(Number(k.occurrences ?? 0), locale)} {s("mengajar.bukti.kali")}</span>
                  {k.remediation ? <p className="pin-lk-saran">{s("laporan.komposisi.saran").replace("{saran}", k.remediation)}</p> : null}
                </li>
              ))}
            </ul>
          ) : keliru.status === "ok" ? null : tiada(keliru)}
        </section>
      ) : null}

      {adaPenguatan && penguatan ? (
        <section className="pin-lk-bagian" data-lk="penguatan" aria-labelledby="lk-penguatan">
          {kepala(hPenguatan, s("laporan.komposisi.penguatan_judul"), "lk-penguatan")}
          <p className="pin-lk-arti">{s("laporan.komposisi.penguatan_arti").replace("{pita}", s("kesiapan.butuh_pendampingan"))}</p>
          {penguatan.length === 0 ? (
            <p className="pin-lk-arti">{s("laporan.komposisi.penguatan_nihil").replace("{pita}", s("kesiapan.butuh_pendampingan"))}</p>
          ) : (
            <ul className="pin-lk-daftar" data-lk-penguatan="">
              {penguatan.map((o) => (
                <li key={o.id}>
                  <span>
                    {muridHref ? <a href={`${muridHref}/${o.id}`}>{o.nama}</a> : o.nama}
                    {o.ulang.length > 0
                      ? <small>{s("laporan.komposisi.penguatan_ulang").replace("{daftar}", o.ulang.join(", "))}</small> : null}
                  </span>
                  <span className="pin-lk-nilai">
                    {typeof o.benar === "number" && typeof o.total === "number"
                      ? s("laporan.komposisi.penguatan_soal").replace("{b}", format.number(o.benar, locale)).replace("{t}", format.number(o.total, locale)) : null}
                    {o.soalWajibTepat === false ? <small className="pin-lk-bawah">{s("laporan.komposisi.soal_wajib_belum")}</small> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {lain.length > 0 ? (
        <section className="pin-lk-bagian" data-lk="lain">
          {kepala(hLain, s("laporan.komposisi.lainnya"))}
          <div className="pin-lk-angka-baris">
            {lain.map((e, i) => (
              <div key={e.metric_id ?? e.ordinal ?? i} className="pin-lk-angka"
                data-lk-entri={e.status === "ok" || e.status === "below_minimum" || e.status === "deprecated" ? labelMetrik(e, untuk, locale) : ""}>
                {e.status === "ok" || e.status === "below_minimum" || e.status === "deprecated"
                  ? <h3>{labelMetrik(e, untuk, locale)}</h3> : null}
                {e.status === "ok" ? (
                  typeof e.value === "number" || (typeof e.value === "string" && e.value.trim() !== "" && Number.isFinite(Number(e.value)))
                    ? <p className="pin-lk-angka-nilai">{nilaiMetrik(e.metric_id, e.value, locale)}</p>
                    : <NilaiLaporan entry={e} locale={locale} tempat={tempat} persona={untuk} />
                ) : tiada(e)}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="pin-lk-bagian" data-lk="berikutnya">
        {kepala(hBerikut, s("laporan.komposisi.berikutnya"))}
        <ul className="pin-lk-langkah">
          <li>
            {buktiHref
              ? <a href={buktiHref}>{s("laporan.komposisi.berikutnya_bukti").replace("{kelas}", namaKelas)}</a>
              : s("laporan.komposisi.berikutnya_bukti").replace("{kelas}", namaKelas)}
          </li>
          {semuaTertahan && typeof perlu === "number"
            ? <li>{s("laporan.komposisi.berikutnya_tertahan").replace("{perlu}", format.number(perlu, locale))}</li> : null}
          {keliru?.status === "ok" && Array.isArray(keliru.value) && keliru.value.length > 0
            ? <li>{s("laporan.komposisi.berikutnya_keliru").replace("{huruf}", hKeliru)}</li> : null}
          {adaPenguatan && penguatan && penguatan.length > 0
            ? <li>{s("laporan.komposisi.berikutnya_penguatan").replace("{huruf}", hPenguatan)}</li> : null}
        </ul>
      </section>
    </div>
  );
}

/**
 * Handbook sample, Tugas 12: render «Lihat bukti» (SS-32, and its not-yet-enough state SS-32b) and
 * «Lihat per soal» (SS-33) from the product's own components, stylesheet and screen text, with
 * FICTIONAL data. Same method as Daisy's review harness (render-screens, on the
 * ux-1/daisy-experience branch): the local Supabase stack cannot start in this container, so the page bodies
 * of src/app/mengajar/[kelas]/bukti/page.tsx and .../soal/page.tsx are restated here with the data
 * reads replaced by example envelopes. Only <Link> is replaced by <a> (no router outside Next).
 * The staff shell (navigation) is not rendered; the handbook crops to the page body.
 *
 * EVERY SCHOOL, CLASS, NAME AND NUMBER BELOW IS INVENTED.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { t, format, type HleEvent } from "@/lib/hle";
import { AngkaBerdiri, BarisKesiapan, BarisLingkup, KartuKetiadaan, KeadaanHariIni, PopulasiKelas, type Envelope, type AsesmenKelas } from "@/components/bukti";
import { labelMetrik } from "@/components/bukti/label";
import { nilaiMetrik, urutkanPita } from "@/lib/nilai-metrik";
import { actionText, omissionText } from "@/app/_intel";
import { susunBuktiSoal, type BuktiSoal } from "@/lib/soal-kelas";
import { TeksBaris } from "@/components/teks/Teks";
import KakiPintar from "@/components/KakiPintar";

const OUT = process.argv[2];
if (!OUT || !existsSync(join(OUT, "pintar.css"))) { console.error("run stylesheet first"); process.exit(2); }
const css = readFileSync(join(OUT, "pintar.css"), "utf8");
const locale = "id" as const;
const s = (k: HleEvent) => t(k, "educator", { locale });
const n = (x: number) => format.number(x, locale);

const KELAS = "kelas-7b";
const SCOPE = { institution: "SMP Peragaan Nusantara", path: ["Kelas 7B"], period: "Tahun ajaran 2026/2027" };
const MURID = 28;
const ZONA = "Asia/Jakarta";

type Bagian = { objective_id: string | null; code: string; competency: string; title?: string | null; mean_score: number | null; learners: number; needed?: number | null };
type Keliru = { code: string; label: string; remediation: string | null; occurrences: number };

function Bukti({ asesmen, paham, naik, topik, keliru, siap }: {
  asesmen: AsesmenKelas[]; paham: Envelope; naik: Envelope; topik: Envelope; keliru: Envelope; siap: Envelope;
}) {
  const minimum: Record<string, number> = { "class.comprehension": 5, "class.net_gain": 5 };
  const withMin = (e: Envelope | undefined, metric: string) => (e ? ({ ...e, needed: e.needed ?? minimum[metric] } as Envelope) : undefined);
  function angka(e: Envelope | undefined, metric: string, nilai: (v: number) => string) {
    if (!e) return null;
    if (e.status !== "ok") return <KartuKetiadaan key={metric} entry={e} locale={locale} />;
    const v = typeof e.value === "number" ? e.value : Number(e.value);
    return <AngkaBerdiri key={metric} entry={withMin(e, metric)!} value={nilai(v)} action={actionText(e, locale)} locale={locale} />;
  }
  const sebaran = siap && siap.status === "ok" && siap.value && typeof siap.value === "object"
    ? urutkanPita(Object.entries(siap.value as Record<string, number>)) : [];
  const totalSiap = sebaran.reduce((x, [, c]) => x + Number(c), 0);
  const semuaBagian: Bagian[] = topik && topik.status === "ok" && Array.isArray(topik.value) ? (topik.value as Bagian[]) : [];
  const bagian = semuaBagian.filter((b) => typeof b.mean_score === "number");
  const salahPaham = keliru && keliru.status === "ok" && Array.isArray(keliru.value) ? (keliru.value as Keliru[]) : [];
  return (
    <main id="isi" className="pin-col">
      <a className="pin-back" href="#">← Kelas 7B</a>
      <BarisLingkup scope={SCOPE} locale={locale} />
      <div className="pin-head">
        <p className="pin-eyebrow">{s("mengajar.bukti.eyebrow")} · Kelas 7B</p>
        <h1 className="pin-h1">{s("mengajar.bukti.judul")}</h1>
        <p className="pin-intro">{s("mengajar.bukti.intro")}</p>
      </div>
      <div className="pin-sec" data-ann="keadaan">
        <h2>{s("mengajar.bukti.keadaan")}</h2>
        <KeadaanHariIni asesmen={asesmen} murid={MURID} locale={locale} kelas={KELAS} jenis="LEARNER" zona={ZONA} />
      </div>
      <div className="pin-sec" data-ann="simpulan">
        <h2>{s("mengajar.bukti.simpulan")}</h2>
        <p className="pin-intro" data-memutuskan="">{s("laporan.anda_memutuskan")}</p>
        <div className="pin-grid2" data-ann="angka">
          {angka(paham, "class.comprehension", (v) => nilaiMetrik("class.comprehension", v, locale))}
          {angka(naik, "class.net_gain", (v) => nilaiMetrik("class.net_gain", v, locale))}
        </div>
        {topik.status === "ok" && bagian.length > 0 ? (
          <div className="pin-metric" data-ann="bagian">
            <span className="pin-ml">{s("mengajar.bukti.bagian")}</span>
            <div className="pin-readiness">
              {bagian.map((b) => (
                <BarisKesiapan key={b.objective_id ?? b.code}
                  label={b.title && b.title.trim() !== "" ? b.title : b.competency}
                  pernyataan={b.title && b.title.trim() !== "" && b.title.trim() !== b.competency.trim() ? b.competency : undefined}
                  count={Math.round(Number(b.mean_score) * 100)} total={100} locale={locale} />
              ))}
            </div>
            <span className="pin-ma">{actionText(topik, locale)}</span>
          </div>
        ) : <div data-ann="bagian"><KartuKetiadaan entry={topik} locale={locale} /></div>}
        {keliru.status === "ok" && salahPaham.length > 0 ? (
          <div className="pin-metric" data-ann="keliru">
            <span className="pin-ml">{s("mengajar.bukti.keliru")}</span>
            <ul className="pin-keliru">
              {salahPaham.map((k) => (
                <li key={k.code}>
                  <span className="pin-kl">{k.label}</span>
                  <span className="pin-ms pin-num">{n(k.occurrences)} {s("mengajar.bukti.kali")}</span>
                  {k.remediation ? <span className="pin-kr">{k.remediation}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : <div data-ann="keliru"><KartuKetiadaan entry={keliru} locale={locale} /></div>}
        {siap.status === "ok" && sebaran.length > 0 ? (
          <div className="pin-metric" data-ann="sebaran">
            <span className="pin-ml">{labelMetrik(siap, "educator", locale)}</span>
            <div className="pin-readiness">
              {sebaran.map(([tier, c]) => <BarisKesiapan key={tier} tierKey={tier} count={Number(c)} total={totalSiap} locale={locale} />)}
            </div>
            <span className="pin-mm">{s("kesiapan.catatan")}</span>
            <PopulasiKelas populasi={siap.population} locale={locale} />
            <span className="pin-ma">{actionText(siap, locale)}</span>
          </div>
        ) : (
          <div data-ann="sebaran">
            <KartuKetiadaan entry={siap} action={omissionText(siap, locale)} locale={locale} />
            <PopulasiKelas populasi={siap.population} locale={locale} />
          </div>
        )}
      </div>
      <p className="pin-foot">{s("mengajar.bukti.kaki")}</p>
      <KakiPintar />
    </main>
  );
}

function Soal({ judul, bukti }: { judul: string; bukti: BuktiSoal }) {
  const soal = susunBuktiSoal(bukti);
  return (
    <main id="isi" className="pin-col">
      <a className="pin-back" href="#">← {s("mengajar.soal.kembali")}</a>
      <BarisLingkup scope={SCOPE} locale={locale} />
      <div className="pin-head">
        <p className="pin-eyebrow">{judul}</p>
        <h1 className="pin-h1">{s("mengajar.soal.judul")}</h1>
        <p className="pin-intro">{s("mengajar.soal.arti")}</p>
        <p className="pin-meta" data-ann="terkumpul">{s("mengajar.soal.terkumpul")} · {n(bukti.sittings)}</p>
      </div>
      <ol className="pin-soal-kelas">
        {soal.map(({ soal: q, pilihan, perluBantuan }, i) => (
          <li key={q.item_id} className="pin-sec pin-soal-baris" data-ann={`soal-${i}`}>
            {q.stimulus ? <p className="pin-meta"><TeksBaris teks={q.stimulus} /></p> : null}
            <p className="pin-soal-tanya"><TeksBaris teks={q.stem} /></p>
            <p className="pin-soal-tepat" data-ann={`tepat-${i}`}>{n(q.right)} {s("mengajar.soal.dari")} {n(q.presented)} {s("mengajar.soal.tepat")}</p>
            <ul className="pin-soal-opsi" data-ann={`opsi-${i}`}>
              {q.options.map((o) => (
                <li key={o.label} className={o.is_key ? "pin-opsi-kunci" : undefined}>
                  <span>{o.label}. <TeksBaris teks={o.body} /></span>
                  {o.is_key ? <strong> · {s("mengajar.soal.kunci")}</strong> : null}
                  <span className="pin-num"> · {n(pilihan[o.label] ?? 0)} {s("mengajar.bukti.murid")}</span>
                </li>
              ))}
            </ul>
            {perluBantuan.length === 0 ? <p className="pin-meta">{s("mengajar.soal.semua_tepat")}</p> : (
              <div className="pin-soal-bantuan" data-ann={`bantuan-${i}`}>
                <p className="pin-ml">{s("mengajar.soal.bantuan")}</p>
                <ul>{perluBantuan.map((m) => <li key={m.nama}>{m.nama} · {m.pilihan ?? s("mengajar.soal.tidak_dijawab")}</li>)}</ul>
              </div>
            )}
          </li>
        ))}
      </ol>
      <KakiPintar />
    </main>
  );
}

// ── fictional class: Kelas 7B, Matematika Bab 3 Pecahan ─────────────────────────────────────────
const UJI: AsesmenKelas = { id: "uji-bab3", judul: "Matematika · Bab 3: Pecahan", keadaan: "CLOSED", mode: "POST_TEST",
  dibuka: "2026-10-05T07:00:00+07:00", ditutup: "2026-10-16T15:00:00+07:00", mengumpulkan: 24, mulai: 24 };
const ok = (metric: string, label: string, meaning: string, value: unknown, sample: number, extra: Partial<Envelope> = {}): Envelope =>
  ({ status: "ok", metric_id: metric, readiness: "SUFFICIENT_EVIDENCE", label_key: label, meaning_key: meaning, value, sample, ...extra });

const cukup = {
  asesmen: [UJI],
  paham: ok("class.comprehension", "metrik.pemahaman.label", "metrik.pemahaman.arti", 0.64, 24),
  naik: ok("class.net_gain", "metrik.kenaikan.label", "metrik.kenaikan.arti", 0.21, 22),
  topik: ok("class.topic_mastery", "metrik.topik.label", "metrik.topik.arti", [
    { objective_id: "o1", code: "M7.3.2", competency: "Menjumlahkan dua pecahan yang penyebutnya berbeda.", title: "Menjumlahkan pecahan berpenyebut berbeda", mean_score: 0.47, learners: 24 },
    { objective_id: "o2", code: "M7.3.3", competency: "Membandingkan dua pecahan.", title: "Membandingkan pecahan", mean_score: 0.66, learners: 24 },
    { objective_id: "o3", code: "M7.3.1", competency: "Menyederhanakan pecahan ke bentuk paling sederhana.", title: "Menyederhanakan pecahan", mean_score: 0.83, learners: 24 },
  ], 24),
  keliru: ok("class.misconceptions", "metrik.miskonsepsi.label", "metrik.miskonsepsi.arti", [
    { code: "PCH-01", label: "Menjumlahkan pembilang dengan pembilang dan penyebut dengan penyebut", remediation: "Tunjukkan dengan pita pecahan mengapa penyebut perlu disamakan lebih dulu.", occurrences: 11 },
  ], 24),
  siap: ok("class.readiness_distribution", "metrik.kesiapan.label", "metrik.kesiapan.arti",
    { "kesiapan.butuh_pendampingan": 9, "kesiapan.perlu_review": 9, "kesiapan.siap_sertifikasi": 6 }, 24,
    { population: { placed: 28, assessed: 24, not_yet: 4 } }),
};
const kurang = (metric: string, label: string, meaning: string, have: number, extra: Partial<Envelope> = {}): Envelope =>
  ({ status: "below_minimum", metric_id: metric, readiness: "INSUFFICIENT_EVIDENCE", statement_key: "laporan.metrik.belum_cukup_data",
     label_key: label, meaning_key: meaning, have, needed: 5, ...extra });
const awal = {
  asesmen: [{ ...UJI, keadaan: "OPEN", ditutup: "2026-10-16T15:00:00+07:00", mengumpulkan: 3, mulai: 5 }],
  paham: kurang("class.comprehension", "metrik.pemahaman.label", "metrik.pemahaman.arti", 3),
  naik: kurang("class.net_gain", "metrik.kenaikan.label", "metrik.kenaikan.arti", 3),
  topik: kurang("class.topic_mastery", "metrik.topik.label", "metrik.topik.arti", 3),
  keliru: kurang("class.misconceptions", "metrik.miskonsepsi.label", "metrik.miskonsepsi.arti", 3),
  siap: kurang("class.readiness_distribution", "metrik.kesiapan.label", "metrik.kesiapan.arti", 3, { population: { placed: 28, assessed: 3, not_yet: 25 } }),
};

// per-question evidence: 24 handed-in sheets, 3 questions shown
const NAMA = ["Adit Pratama","Bunga Lestari","Citra Maharani","Dimas Saputra","Eka Wulandari","Fajar Nugroho","Gita Anjani","Hana Rahmawati",
  "Indra Kurniawan","Joko Santoso","Kirana Putri","Laras Ayuningtyas","Made Wirawan","Nadia Safitri","Oki Firmansyah","Putri Handayani",
  "Rafi Hidayat","Sekar Arum","Tegar Ramadhan","Umi Kalsum","Vino Mahendra","Wulan Sari","Yoga Pradana","Zahra Amelia"];
const Q1 = { item_id: "q1", stimulus: null, stem: "Hasil dari 1/2 + 1/3 adalah …",
  options: [{ label: "A", body: "2/5", is_key: false }, { label: "B", body: "5/6", is_key: true }, { label: "C", body: "2/6", is_key: false }, { label: "D", body: "1/6", is_key: false }],
  presented: 24, answered: 24, right: 11 };
const Q2 = { item_id: "q2", stimulus: null, stem: "Manakah yang lebih besar: 3/4 atau 2/3?",
  options: [{ label: "A", body: "3/4", is_key: true }, { label: "B", body: "2/3", is_key: false }, { label: "C", body: "Keduanya sama besar", is_key: false }],
  presented: 24, answered: 23, right: 16 };
const Q3 = { item_id: "q3", stimulus: null, stem: "Bentuk paling sederhana dari 6/8 adalah …",
  options: [{ label: "A", body: "3/4", is_key: true }, { label: "B", body: "6/8", is_key: false }, { label: "C", body: "2/3", is_key: false }],
  presented: 24, answered: 24, right: 20 };
// who chose what (fictional): q1 wrong = 13 (9×A, 3×C, 1×D); q2 wrong = 8 (6×B, 1×C, 1 blank); q3 wrong = 4 (3×B, 1×C)
const q1 = Object.fromEntries(NAMA.map((x, i) => [x, i < 9 ? "A" : i < 12 ? "C" : i < 13 ? "D" : "B"]));
const q2 = Object.fromEntries(NAMA.map((x, i) => [x, [1,4,8,10,14,19].includes(i) ? "B" : i === 22 ? "C" : i === 6 ? null : "A"]));
const q3 = Object.fromEntries(NAMA.map((x, i) => [x, [2,9,17].includes(i) ? "B" : i === 12 ? "C" : "A"]));
const BUKTI: BuktiSoal = {
  sittings: 24,
  questions: [Q3, Q1, Q2],
  learners: NAMA.map((name, i) => ({ person_id: `p${i}`, name, answers: [
    { item_id: "q1", chosen: q1[name], right: q1[name] === "B" },
    { item_id: "q2", chosen: q2[name], right: q2[name] === "A" },
    { item_id: "q3", chosen: q3[name], right: q3[name] === "A" },
  ] })),
};

const page = (body: React.ReactElement) =>
  `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style>` +
  `<style>body{background:var(--pin-bg,#fff)} </style></head><body>${renderToStaticMarkup(body)}</body></html>`;
writeFileSync(join(OUT, "ss32-lihat-bukti.html"), page(<Bukti {...cukup} />));
writeFileSync(join(OUT, "ss32b-belum-cukup.html"), page(<Bukti {...awal} />));
writeFileSync(join(OUT, "ss33-lihat-per-soal.html"), page(<Soal judul={UJI.judul} bukti={BUKTI} />));
console.log("rendered 3 pages to", OUT);

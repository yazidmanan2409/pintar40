// Presentation renders (Daisy, 9 Nov): the BUILT report components inside their page frame, with a simulated class that
// uses the demonstration package's own objectives, target (60%) and misconception codes. Read-only; never committed here.
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, readFileSync } from "node:fs";
import KomposisiKelas from "@/components/laporan/KomposisiKelas";
import KisiTopik from "@/components/laporan/KisiTopik";
import KomposisiSekolah from "@/components/laporan/KomposisiSekolah";
import KepalaCetak from "@/components/laporan/KepalaCetak";
import AksiLaporan from "@/components/laporan/AksiLaporan";
import { BarisLingkup } from "@/components/bukti";
import { t } from "@/lib/hle";
const out = process.argv[2];
const ok = (metric_id: string, label: string, value: unknown, extra: object = {}) => ({ status: "ok", metric_id, label_key: `metrik.${label}.label`, meaning_key: `metrik.${label}.arti`, value, readiness: "SUFFICIENT_EVIDENCE", ...extra });
const kurang = (metric_id: string, label: string, have: number, extra: object = {}) => ({ status: "below_minimum", metric_id, label_key: `metrik.${label}.label`, meaning_key: `metrik.${label}.arti`, statement_key: "laporan.metrik.belum_cukup_data", readiness: "INSUFFICIENT_EVIDENCE", have, needed: 5, ...extra });
const O = ["Menentukan pecahan senilai dengan mengali", "Menentukan pecahan senilai dengan membagi"];
const topik = (v: number[], n = 29) => v.map((x, i) => ({ objective_id: `o${i}`, competency: O[i], mean_score: x, learners: n }));
const pop = { placed: 32, assessed: 29, not_yet: 3 };
const kelas = [
  ok("class.topic_mastery", "topik", topik([0.83, 0.58]), { sample: 29 }),
  ok("class.readiness_distribution", "kesiapan", { "kesiapan.siap_sertifikasi": 17, "kesiapan.perlu_review": 7, "kesiapan.butuh_pendampingan": 5 }, { population: pop, sample: 29 }),
  ok("class.net_gain", "kenaikan", 0.21, { sample: 29 }),
  ok("class.misconceptions", "miskonsepsi", [{ code: "MK-PCH-02", label: "Menambah alih-alih mengali", remediation: "Bandingkan hasilnya dengan gambar; nilainya berubah.", occurrences: 9 }], { sample: 29 }),
  ok("class.comprehension", "pemahaman", 0.72, { sample: 29 }),
  ok("class.participants", "peserta", 29, { sample: 29 }),
];
const sedikit = [
  kurang("class.topic_mastery", "topik", 4), kurang("class.readiness_distribution", "kesiapan", 4, { population: { placed: 32, assessed: 4, not_yet: 28 } }),
  kurang("class.net_gain", "kenaikan", 4), kurang("class.misconceptions", "miskonsepsi", 4), kurang("class.comprehension", "pemahaman", 4), ok("class.participants", "peserta", 4, { sample: 4 }),
];
const rnd = (a: number, b: number, i: number) => a + ((i * 37) % 100) / 100 * (b - a);
const titik = [...Array(17)].map((_, i) => ({ mastery: rnd(0.8, 1, i), pita: "mantap" as const })).concat([...Array(7)].map((_, i) => ({ mastery: rnd(0.6, 0.79, i), pita: "berkembang" as const })), [...Array(5)].map((_, i) => ({ mastery: rnd(0.25, 0.55, i), pita: "penguatan" as const })));
const membagi = [O[1]];
const penguatan = [["Bima Pratama", 3, true], ["Citra Ayu", 3, true], ["Dimas Saputra", 2, false], ["Fajar Nugraha", 3, true], ["Gita Lestari", 1, false]].map(([nama, benar, wajib], i) => ({ id: `m${i}`, nama: nama as string, ulang: membagi, benar: benar as number, total: 6, soalWajibTepat: wajib as boolean }));
const kolom = [["5A", [0.83, 0.58]], ["5B", [0.88, 0.71]], ["5C", [0.79, 0.55]], ["5D", [0.9, 0.57]], ["5E", null]].map(([nama, v], i) => ({ id: `k${i}`, nama: `Kelas ${nama}`, target: 0.6, peserta: 29, terdaftar: 32, topik: v ? ok("class.topic_mastery", "topik", topik(v as number[])) : kurang("class.topic_mastery", "topik", 3) }));
const R = [["Bilangan cacah", 0.81], ["Pecahan", 0.69], ["Pengukuran", 0.74], ["Geometri", 0.66], ["Data", 0.57]] as const;
const sekolah = [
  ok("institution.competency_outcomes", "kompetensi", R.map(([c, v], i) => ({ objective_id: `r${i}`, competency: c, mean_score: v, learners: 412 }))),
  ok("institution.participants", "peserta_institusi", 412, { sample: 412 }),
  ok("institution.net_gain", "kenaikan_institusi", 0.17, { sample: 412 }),
  ok("institution.safety_gate_pass_rate", "gerbang_keselamatan", 0.84, { sample: 824 }),
  ok("institution.verified_credentials", "kredensial", 386, { sample: 390 }),
  ok("institution.cohort_comparison", "perbandingan_kohort", [{ cohort_node_id: "c4", learners: 136, mean_mastery: 0.74 }, { cohort_node_id: "c5", learners: 142, mean_mastery: 0.71 }, { cohort_node_id: "c6", learners: 134, mean_mastery: 0.58 }]),
];
const tempat = { c4: "Angkatan 4", c5: "Angkatan 5", c6: "Angkatan 6" };
const css = ["src/app/globals.css", "src/app/experience.css"].map((f) => readFileSync(f, "utf8")).join("\n").replace(/url\("\/fonts\//g, `url("file://${process.cwd()}/public/fonts/`);
const S = "SD Cendekia Nusantara (sekolah peragaan)";
const bingkai = (judul: string, h1: string, tempatNama: string | null, kembali: string, cakupan: string) => renderToStaticMarkup(<>
  <BarisLingkup scope={{ institution: S, path: tempatNama ? [tempatNama] : [], period: "2026/27" }} locale="id" />
  <div className="pin-head"><p className="pin-eyebrow">{judul}</p><h1 className="pin-h1">{h1}</h1><p className="pin-intro">{cakupan}</p></div>
  <AksiLaporan kembali={kembali} ke="/mengajar" cetak={t("laporan.cetak" as any, "staff", { locale: "id" })} />
</>);
const halaman = (b: string, isi: string) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css} body{background:var(--surface-0)}</style></head><body><main id="isi" class="pin-col">${b}${isi}</main></body></html>`;
const r = (el: any) => renderToStaticMarkup(el);
const cak = t("laporan.cakupan.kelas" as any, "educator", { locale: "id" }).replace("{waktu}", "9 Nov 2026, 07.30 WIB");
const cakS = t("laporan.cakupan.sekolah" as any, "staff", { locale: "id" }).replace("{waktu}", "9 Nov 2026, 07.30 WIB");
const rk = t("laporan.kelas.judul" as any, "educator", { locale: "id" });
writeFileSync(`${out}/kelas.html`, halaman(bingkai(rk, "5A · Matematika", "5A", "Mengajar", cak), r(<KomposisiKelas entries={kelas as any} locale="id" persona="educator" jenis="LEARNER" target={0.6} namaKelas="5A" buktiHref="/mengajar/x/bukti" penguatan={penguatan} muridHref="/mengajar/x/murid" titik={titik} awalAkhir={{ awal: 0.51, akhir: 0.72, pasangan: 29 }} />)));
writeFileSync(`${out}/kelas-sedikit.html`, halaman(bingkai(rk, "5A · Matematika", "5A", "Mengajar", cak), r(<KomposisiKelas entries={sedikit as any} locale="id" persona="educator" jenis="LEARNER" target={0.6} namaKelas="5A" buktiHref="/mengajar/x/bukti" />)));
writeFileSync(`${out}/kisi.html`, halaman(bingkai("Pimpinan", "Matematika · Angkatan 5", null, "Pimpinan", cak.replace("kelas ini", "kelas-kelas ini")), r(<KisiTopik kolom={kolom as any} locale="id" />)));
writeFileSync(`${out}/sekolah.html`, halaman(bingkai("Ringkasan Sekolah", "SD Cendekia Nusantara", null, "Pimpinan", cakS), r(<KomposisiSekolah entries={sekolah as any} locale="id" tempat={tempat} />)));
console.log("ok");

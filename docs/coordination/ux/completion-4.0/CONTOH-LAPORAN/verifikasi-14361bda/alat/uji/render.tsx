// Design-fidelity harness (Daisy, 7 Nov): renders the BUILT report components with the approved specimens' figures,
// as metric_evaluate envelopes. Read-only use of the engineering branch; nothing here is committed to it.
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, readFileSync } from "node:fs";
import KomposisiKelas from "@/components/laporan/KomposisiKelas";
import KisiTopik from "@/components/laporan/KisiTopik";
import KomposisiSekolah from "@/components/laporan/KomposisiSekolah";
const out = process.argv[2];
const ok = (metric_id: string, label: string, value: unknown, extra: object = {}) => ({ status: "ok", metric_id, label_key: `metrik.${label}.label`, meaning_key: `metrik.${label}.arti`, value, readiness: "SUFFICIENT_EVIDENCE", ...extra });
const kurang = (metric_id: string, label: string, have: number, extra: object = {}) => ({ status: "below_minimum", metric_id, label_key: `metrik.${label}.label`, meaning_key: `metrik.${label}.arti`, statement_key: "laporan.metrik.belum_cukup_data", readiness: "INSUFFICIENT_EVIDENCE", have, needed: 5, ...extra });
const T7 = ["Pecahan senilai", "Menyederhanakan pecahan", "Membandingkan pecahan", "Penjumlahan dan pengurangan pecahan", "Pecahan campuran"];
const topik = (v: number[]) => v.map((x, i) => ({ objective_id: `t${i}`, competency: T7[i], mean_score: x / 100, learners: 29 }));
const pop = { placed: 32, assessed: 29, not_yet: 3 };
const guru = [
  ok("class.topic_mastery", "topik", topik([87, 90, 79, 61, 57]), { sample: 29 }),
  ok("class.readiness_distribution", "kesiapan", { "kesiapan.siap_sertifikasi": 17, "kesiapan.perlu_review": 7, "kesiapan.butuh_pendampingan": 5 }, { population: pop, sample: 29 }),
  ok("class.net_gain", "kenaikan", 0.20, { sample: 29 }),
  ok("class.misconceptions", "miskonsepsi", [{ code: "M-PEC-02", label: "Menjumlahkan pembilang dengan pembilang dan penyebut dengan penyebut", remediation: "Mulai dari gambar: tunjukkan dengan pita pecahan bahwa 1/2 + 1/3 lebih dari 1/2, lalu samakan penyebut sebelum menjumlahkan.", occurrences: 13 }], { sample: 29 }),
  ok("class.comprehension", "pemahaman", 0.748, { sample: 29 }),
  ok("class.participants", "peserta", 29, { sample: 29 }),
];
const guru2b = [
  kurang("class.topic_mastery", "topik", 4), kurang("class.readiness_distribution", "kesiapan", 4, { population: { placed: 33, assessed: 4, not_yet: 29 } }),
  kurang("class.net_gain", "kenaikan", 4), kurang("class.misconceptions", "miskonsepsi", 4), kurang("class.comprehension", "pemahaman", 4), ok("class.participants", "peserta", 4, { sample: 4 }),
];
const kelas5: Array<[string, number[] | null]> = [["Kelas 7A", [87, 90, 79, 61, 57]], ["Kelas 7B", [98, 85, 83, 74, 58]], ["Kelas 7C", [90, 66, 72, 47, 49]], ["Kelas 7D", [91, 85, 77, 69, 52]], ["Kelas 7E", null]];
const kolom = (ks: Array<[string, number[] | null]>) => ks.map(([nama, v], i) => ({ id: `k${i}`, nama, target: 0.75, topik: v ? ok("class.topic_mastery", "topik", topik(v)) : kurang("class.topic_mastery", "topik", 4) }));
const banyak: Array<[string, number[] | null]> = [...kelas5, ["Kelas 7F", [84, 80, 70, 64, 55]], ["Kelas 7G", [92, 88, 81, 72, 60]], ["Kelas 7H", [78, 71, 66, 58, 50]], ["Kelas 7I", [88, 83, 79, 70, 61]], ["Kelas 7J", [95, 91, 86, 77, 66]]];
const R = [["Data dan peluang", 76], ["Aljabar", 76], ["Zat dan perubahannya", 76], ["Bilangan", 74], ["Kerja ilmiah", 73], ["Gerak dan energi", 69], ["Listrik dan magnet", 59.6], ["Geometri dan pengukuran", 54]] as const;
const sekolah = [
  ok("institution.competency_outcomes", "kompetensi", R.map(([c, v], i) => ({ objective_id: `r${i}`, competency: c, mean_score: v / 100, learners: 300 }))),
  ok("institution.participants", "peserta_institusi", 418, { sample: 418 }),
  ok("institution.net_gain", "kenaikan_institusi", 0.19, { sample: 418 }),
  ok("institution.safety_gate_pass_rate", "gerbang_keselamatan", 0.868, { sample: 836 }),
  ok("institution.verified_credentials", "kredensial", 408, { sample: 411 }),
  ok("institution.cohort_comparison", "perbandingan_kohort", [{ cohort_node_id: "c26", learners: 242, mean_mastery: 0.74 }, { cohort_node_id: "c25", learners: 294, mean_mastery: 0.74 }, { cohort_node_id: "c24", learners: 300, mean_mastery: 0.59 }]),
];
const tempat = { c26: "Angkatan 2026 (kelas 7)", c25: "Angkatan 2025 (kelas 8)", c24: "Angkatan 2024 (kelas 9)" };
const css = ["src/app/globals.css", "src/app/experience.css"].map((f) => readFileSync(f, "utf8")).join("\n").replace(/url\("\/fonts\//g, `url("file://${process.cwd()}/public/fonts/`);
const halaman = (judul: string, eyebrow: string, h1: string, isi: string) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${judul}</title><style>${css}</style></head><body><main id="isi" class="pin-col"><div class="pin-head"><p class="pin-eyebrow">${eyebrow}</p><h1 class="pin-h1">${h1}</h1><p class="pin-intro">Angka dihitung 6 Nov 2026, 07.30 WIB dari semua bukti kelas ini sampai saat itu.</p></div>${isi}</main></body></html>`;
const r = (el: any) => renderToStaticMarkup(el);
writeFileSync(`${out}/guru.html`, halaman("Ringkasan Kelas", "Ringkasan Kelas", "Kelas 7A · Matematika", r(<KomposisiKelas entries={guru as any} locale="id" persona="educator" jenis="LEARNER" target={0.75} namaKelas="Kelas 7A" buktiHref="/mengajar/x/bukti" />)));
writeFileSync(`${out}/guru-2b.html`, halaman("Ringkasan Kelas", "Ringkasan Kelas", "Kelas 7E · Matematika", r(<KomposisiKelas entries={guru2b as any} locale="id" persona="educator" jenis="LEARNER" target={0.75} namaKelas="Kelas 7E" buktiHref="/mengajar/x/bukti" />)));
writeFileSync(`${out}/kadep.html`, halaman("Pimpinan", "Pimpinan", "Matematika", r(<KisiTopik kolom={kolom(kelas5) as any} locale="id" />)));
writeFileSync(`${out}/kadep-10.html`, halaman("Pimpinan", "Pimpinan", "Matematika (10 kelas)", r(<KisiTopik kolom={kolom(banyak) as any} locale="id" />)));
writeFileSync(`${out}/dekan.html`, halaman("Ringkasan Sekolah", "Ringkasan Sekolah", "SMP Cahaya Kaliandra", r(<KomposisiSekolah entries={sekolah as any} locale="id" tempat={tempat} />)));
console.log("rendered");

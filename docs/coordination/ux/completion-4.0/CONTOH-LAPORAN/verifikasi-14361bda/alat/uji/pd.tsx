// X5 fidelity harness: the BUILT KomposisiPengembangan with specimen 6's participants. Read-only; never committed.
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, readFileSync } from "node:fs";
import KomposisiPengembangan from "@/components/laporan/KomposisiPengembangan";
import KepalaCetak from "@/components/laporan/KepalaCetak";
import AksiLaporan from "@/components/laporan/AksiLaporan";
import { BarisLingkup } from "@/components/bukti";
import { t } from "@/lib/hle";
const out = process.argv[2];
const J = "Merancang Asesmen Formatif di Kelas";
type R = [string, boolean, boolean, string, number, string, number | null, boolean, boolean];
// nama, aktif, mulai, pemetaan, pelajaran, penguasaan, hasil, tercapai, selesai
const rows: R[] = [
  ["Andi Nugroho", true, true, "SELESAI", 5, "SELESAI", 0.85, true, true], ["Budi Santoso", true, true, "SELESAI", 5, "SELESAI", 0.8, true, true],
  ["Citra Lestari", true, true, "SELESAI", 4, "BELUM", null, false, false], ["Dian Purnama", true, true, "SELESAI", 5, "SELESAI", 0.65, false, true],
  ["Eko Prasetyo", true, true, "SELESAI", 5, "SELESAI", 0.9, true, true], ["Fransiska Ayu", true, true, "SELESAI", 2, "BELUM", null, false, false],
  ["Gilang Ramadhan", true, false, "BELUM", 0, "BELUM", null, false, false], ["Hesti Wulandari", true, true, "SELESAI", 5, "SELESAI", 0.75, true, true],
  ["Imam Syafii", false, false, "BELUM", 0, "BELUM", null, false, false], ["Juwita Sari", true, true, "SELESAI", 3, "BELUM", null, false, false],
  ["Kartika Dewi", true, true, "SELESAI", 5, "SELESAI", 0.8, true, true], ["Lusi Handayani", true, true, "SEDANG", 1, "BELUM", null, false, false],
];
const isi = (kolom: "FULL" | "COMPLETION") => ({ simpul: "pd", nama: "PD", kolom, peserta: rows.map(([nama, aktif, mulai, pem, pel, peng, h, ter, sel], i) => ({
  id: `p${i}`, nama, terdaftar: aktif ? "ACTIVE" : "PENDING",
  paket: [{ id: "k1", judul: J, mulai, pemetaan: pem, penguasaan: peng, selesai: sel, ...(kolom === "FULL" ? { pelajaran: { selesai: pel, jumlah: 5 }, hasil: h == null ? null : { penguasaan: h, tercapai: ter } } : {}) }] })) });
const css = ["src/app/globals.css", "src/app/experience.css"].map((f) => readFileSync(f, "utf8")).join("\n").replace(/url\("\/fonts\//g, `url("file://${process.cwd()}/public/fonts/`);
const hle = readFileSync("src/lib/hle.ts", "utf8");
const kepala = { tempat: "Pengembangan profesi guru", sekolah: "SMP Cahaya Kaliandra", periode: "TA 2026/2027" };
const judul = t("laporan.kelas.judul" as any, "staff", { locale: "id" });
const bingkai = renderToStaticMarkup(<>
  <KepalaCetak bagian={[judul, kepala.tempat, kepala.sekolah, kepala.periode]} />
  <BarisLingkup scope={{ institution: kepala.sekolah, path: [kepala.tempat], period: kepala.periode }} locale="id" />
  <div className="pin-head"><p className="pin-eyebrow">{judul}</p><h1 className="pin-h1">{kepala.tempat}</h1>
    <p className="pin-intro" data-pd-arti="">{t("laporan.kelas.pd_arti" as any, "staff", { locale: "id" })}</p></div>
  <AksiLaporan kembali="Pimpinan" ke="/pimpinan" cetak={t("laporan.cetak" as any, "staff", { locale: "id" })} />
</>);
const halaman = (isiHtml: string) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ringkasan Kelas</title><style>${css}</style></head><body><main id="isi" class="pin-col" data-ringkasan="pengembangan">${bingkai}${isiHtml}</main></body></html>`;
writeFileSync(`${out}/pd-penuh.html`, halaman(renderToStaticMarkup(<KomposisiPengembangan isi={isi("FULL") as any} locale="id" />)));
writeFileSync(`${out}/pd-admin.html`, halaman(renderToStaticMarkup(<KomposisiPengembangan isi={isi("COMPLETION") as any} locale="id" />)));
console.log("ok", hle.length > 0);

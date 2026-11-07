import type { Metadata } from "next";
import { t, type HleEvent, type Persona } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";

/**
 * W3.1 (Batch 2; WCAG 2.4.2): every page names itself in the browser tab, «<the page> · PINTAR»
 * (Daisy's journeys, `buat-perjalanan.mts`: «Studio · PINTAR»). The root layout holds the template.
 *
 * The title is the page's own heading where that heading is copy; where the heading is data (a
 * class's, a learner's or a package's name), the title is the PLACE instead. A shared computer's
 * tab bar and its history never carry a person's name.
 *
 * One map, so a guard test (UX2-JUDUL-01) can hold every page.tsx to it.
 */
type Judul = { kunci: HleEvent; untuk: Persona };

export const JUDUL_HALAMAN: Record<string, Judul> = {
  "/": { kunci: "entry.title", untuk: "public" },
  "/aktifkan": { kunci: "aktifkan.judul", untuk: "public" },
  "/aktivasi": { kunci: "aktivasi.judul", untuk: "staff" },
  "/aktivasi/orang": { kunci: "orang.judul", untuk: "staff" },
  "/akun": { kunci: "akun.judul", untuk: "staff" },
  "/auth/callback": { kunci: "auth.title", untuk: "public" },
  "/belajar": { kunci: "nav.belajar", untuk: "learner" },
  "/belajar/[tugas]": { kunci: "nav.belajar", untuk: "learner" },
  "/belajar/[tugas]/hasil": { kunci: "hasil.title", untuk: "learner" },
  "/belajar/[tugas]/lanjut": { kunci: "siklus.berikutnya", untuk: "learner" },
  "/belajar/[tugas]/pelajaran/[pelajaran]": { kunci: "nav.belajar", untuk: "learner" },
  "/belajar/[tugas]/pemetaan": { kunci: "nav.belajar", untuk: "learner" },
  "/belajar/[tugas]/penguasaan": { kunci: "nav.belajar", untuk: "learner" },
  "/belajar/[tugas]/peta": { kunci: "map.title", untuk: "learner" },
  "/belajar/[tugas]/sertifikat": { kunci: "sertifikat.judul", untuk: "learner" },
  "/belajar/asesmen/[penugasan]": { kunci: "nav.belajar", untuk: "learner" },
  "/belajar/sertifikat": { kunci: "sertifikat.daftar.judul", untuk: "learner" },
  "/belajar/hasil": { kunci: "hasilbelajar.judul", untuk: "learner" },
  "/belajar/umpan-balik/[siklus]": { kunci: "nav.belajar", untuk: "learner" },
  "/dekan/ringkasan": { kunci: "laporan.institusi.judul", untuk: "staff" },
  "/edukator/ringkasan": { kunci: "laporan.kelas.judul", untuk: "educator" },
  "/evaluasi": { kunci: "evaluasi.judul", untuk: "staff" },
  "/id/[pintarId]": { kunci: "idpage.judul", untuk: "public" },
  "/konfigurasi": { kunci: "config.title", untuk: "staff" },
  "/konfigurasi/[bagian]": { kunci: "config.title", untuk: "staff" },
  "/konfigurasi/sertifikat": { kunci: "sertifikat.kelola.judul", untuk: "staff" },
  "/konfigurasi/email-uji": { kunci: "emailuji.judul", untuk: "staff" },
  "/konfigurasi/keamanan": { kunci: "keamanan.judul", untuk: "staff" },
  "/lapor": { kunci: "lapor.judul", untuk: "staff" },
  "/lapor/saya": { kunci: "lapor.saya.judul", untuk: "staff" },
  "/masuk": { kunci: "auth.title", untuk: "public" },
  "/masuk/lupa": { kunci: "lupa.judul", untuk: "public" },
  "/mengajar": { kunci: "nav.kelas", untuk: "educator" },
  "/mengajar/[kelas]": { kunci: "nav.kelas", untuk: "educator" },
  "/mengajar/[kelas]/bukti": { kunci: "mengajar.bukti.judul", untuk: "educator" },
  "/mengajar/[kelas]/langkah": { kunci: "mengajar.langkah.judul", untuk: "educator" },
  "/mengajar/[kelas]/murid/[orang]": { kunci: "nav.kelas", untuk: "educator" },
  "/mengajar/[kelas]/siapa": { kunci: "mengajar.siapa.judul", untuk: "educator" },
  "/mengajar/[kelas]/siapkan": { kunci: "mengajar.siap.pilih", untuk: "educator" },
  "/mengajar/[kelas]/soal": { kunci: "mengajar.soal.judul", untuk: "educator" },
  "/mengajar/[kelas]/uji-cepat": { kunci: "mengajar.cepat.hidup.judul", untuk: "educator" },
  "/mengajar/[kelas]/uji-cepat/hasil": { kunci: "mengajar.cepat.hasil.judul", untuk: "educator" },
  "/mengajar/[kelas]/ulang": { kunci: "mengajar.ulang.judul", untuk: "educator" },
  "/mengajar/[kelas]/umpan-balik": { kunci: "nav.kelas", untuk: "educator" },
  "/pemeliharaan": { kunci: "pemeliharaan.darurat.judul", untuk: "public" },
  "/pendataan": { kunci: "pendataan.judul", untuk: "staff" },
  "/pendataan/[pekerjaan]": { kunci: "nav.pendataan", untuk: "staff" },
  "/pengembangan/[simpul]": { kunci: "pengembangan.judul", untuk: "staff" },
  "/perangkat": { kunci: "perangkat.judul", untuk: "public" },
  // a refused reader gets the title too, so a gated home is titled by its place, never by its own heading (UX1-PIMPINAN-AKSES-01)
  "/pimpinan": { kunci: "nav.pimpinan", untuk: "staff" },
  "/pimpinan/[simpul]": { kunci: "nav.pimpinan", untuk: "staff" },
  "/pimpinan/[simpul]/murid": { kunci: "pimpinan.murid.judul", untuk: "staff" },
  "/pimpinan/[simpul]/murid/[orang]": { kunci: "nav.pimpinan", untuk: "staff" },
  "/pimpinan/[simpul]/umpan-balik": { kunci: "nav.pimpinan", untuk: "staff" },
  "/pimpinan/[simpul]/umpan-balik/[siklus]": { kunci: "nav.pimpinan", untuk: "staff" },
  "/pimpinan/[simpul]/umpan-balik/kelas/[kelas]": { kunci: "nav.pimpinan", untuk: "staff" },
  "/studio": { kunci: "studio.paket.judul", untuk: "staff" },
  "/studio/bank": { kunci: "studio.bank.judul", untuk: "staff" },
  "/studio/definisi": { kunci: "studio.definisi.judul", untuk: "staff" },
  "/studio/integritas": { kunci: "studio.integritas.judul", untuk: "staff" },
  "/studio/kanonik": { kunci: "studio.kanonik.judul", untuk: "staff" },
  "/studio/kanonik/[terbitan]": { kunci: "studio.kanonik.judul", untuk: "staff" },
  "/studio/paket/[course]": { kunci: "nav.studio", untuk: "staff" },
  "/studio/pratinjau/[pelajaran]": { kunci: "nav.studio", untuk: "staff" },
  "/studio/tinjau": { kunci: "studio.tinjau.judul", untuk: "staff" },
  "/studio/unggah": { kunci: "studio.unggah.judul", untuk: "staff" },
  "/terkunci": { kunci: "kunci.judul", untuk: "public" },
  "/verifikasi/[token]": { kunci: "verifikasi.judul", untuk: "public" },
};

const MEREK = /\bPINTAR\b/;

/** The page's title in the reader's language; one that already says PINTAR stands alone. */
export function judulDari(rute: string, locale: "id" | "en"): Metadata["title"] {
  const j = JUDUL_HALAMAN[rute];
  if (!j) throw new Error(`judul-halaman: no title for ${rute}`);
  const kata = t(j.kunci, j.untuk, { locale });
  return MEREK.test(kata) ? { absolute: kata } : kata;
}

/**
 * W3.13 (Daisy, J6Peragaan, F9): INSIDE THE DEMONSTRATION ROOM THE TITLE SAYS WHERE YOU ARE. The band says «MODE
 * PERAGAAN» on the screen; the browser tab, the window list and a screen reader's page announcement said only the
 * page's own name («Belajar · PINTAR»). So every page's title is prefixed with the band's own words while an
 * evaluation persona is held: «MODE PERAGAAN · Belajar · PINTAR». Pure, so the guard can hold it.
 */
export function judulDalamPeragaan(judul: Metadata["title"], mode: string | null): Metadata["title"] {
  if (!mode || judul == null) return judul;
  if (typeof judul === "string") return `${mode} · ${judul}`;
  if ("absolute" in judul && typeof judul.absolute === "string") return { absolute: `${mode} · ${judul.absolute}` };
  return judul;
}

/** `export const generateMetadata = judulHalaman("/studio/bank");` in a page. */
export function judulHalaman(rute: string) {
  return async (): Promise<Metadata> => {
    // the evaluation session is read where the band reads it (one cached read per request); imported here, at run
    // time, because that module is server-only and this map is also read by the guards
    const { evaluationState } = await import("@/lib/evaluation");
    const [locale, peragaan] = await Promise.all([currentLocale(), evaluationState().catch(() => null)]);
    const mode = peragaan ? t("evaluasi.mode", "staff", { locale }) : null;
    return { title: judulDalamPeragaan(judulDari(rute, locale), mode) };
  };
}

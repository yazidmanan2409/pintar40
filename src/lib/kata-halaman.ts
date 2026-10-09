import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";

/**
 * A page's place in words (D-140(c): no raw path or id on a screen). «Laporkan masalah» carries the page the reader
 * came from so engineering can find it; the reader sees the place it belongs to, never `/pimpinan/<id>/murid`.
 * The most specific place first; anything not listed is «Halaman lain di PINTAR».
 */
const TEMPAT: ReadonlyArray<readonly [RegExp, HleEvent]> = [
  [/^\/$/, "lapor.halaman.awal"],
  [/^\/konfigurasi\/keamanan(\/|$)/, "keamanan.judul"],
  [/^\/konfigurasi\/email-uji(\/|$)/, "emailuji.judul"],
  [/^\/konfigurasi(\/|$)/, "nav.konfigurasi"],
  [/^\/pimpinan(\/|$)/, "nav.pimpinan"],
  [/^\/dekan\/ringkasan(\/|$)/, "laporan.institusi.judul"],
  [/^\/edukator\/ringkasan(\/|$)/, "laporan.kelas.judul"],
  [/^\/mengajar(\/|$)/, "nav.kelas"],
  [/^\/belajar\/sertifikat(\/|$)/, "nav.sertifikat"],
  [/^\/belajar(\/|$)/, "nav.belajar"],
  [/^\/pendataan(\/|$)/, "nav.pendataan"],
  [/^\/aktivasi(\/|$)/, "nav.aktivasi"],
  [/^\/studio(\/|$)/, "nav.studio"],
  [/^\/akun(\/|$)/, "akun.judul"],
];

export function kataHalaman(halaman: string, locale: Locale, persona: Persona = "staff"): string {
  const jalan = halaman.split(/[?#]/)[0];
  const cocok = TEMPAT.find(([re]) => re.test(jalan));
  return t(cocok ? cocok[1] : "lapor.halaman.lain", persona, { locale });
}

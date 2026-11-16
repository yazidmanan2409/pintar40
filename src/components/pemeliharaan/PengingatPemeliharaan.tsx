"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { t, type Locale } from "@/lib/hle";
import {
  HALAMAN_PEMELIHARAAN, jamJendela, jendelaDiHalaman, jendelaUtama, menitTersisa, permukaanAsesmen, tahapBerikutMs,
  tahapPeringatan, type StatusSaya,
} from "@/lib/pemeliharaan-kontrak";

/**
 * #148 (D-094(c)(d)(e), D-100(b)): THE MAINTENANCE LINE, timed by the browser.
 *
 * The status arrives once with the page (no polling). From T-60 the line says when PINTAR goes into maintenance, in
 * words that fit the surface: on an assessment, that a sitting under way can still be finished and handed in, and
 * that an answer counts once «Tersimpan» shows; elsewhere, to finish and leave. From T-15, that no new assessment
 * starts. The three notices (60, 30, 15) are announced once each; the minutes shown follow the clock. At T=0 a reader
 * the window stops goes to the maintenance page, which the server would send them to on their next request anyway; a
 * sitting under way and the window's own administrators stay. A reader the database already stops goes there at once.
 * Live notices are one line each.
 *
 * A2b (R-1; Daisy, A2B-C2W-KATA.md): a class or school window is work-scoped (cakupan TEMPAT). It never sends anyone
 * to the maintenance page; its line names the class (or school) and says that only its work is paused, and it is not
 * shown on another class's own pages. Every time is in the window's school's zone (D8), never a fixed «WIB».
 */
export default function PengingatPemeliharaan({ locale, status }: { locale: Locale; status: StatusSaya }) {
  const path = usePathname() ?? "/";
  // the database's clock as it answered: the first render reads it on the server and in the browser alike, and from
  // then on this browser's clock moves it, offset once by the difference measured as the page arrived
  const [kini, setKini] = useState<number | null>(() => (status.sekarang ? Date.parse(status.sekarang) : null));
  const utama = jendelaUtama(status);
  const jendela = utama && jendelaDiHalaman(utama, path) ? utama : null;
  const kecuali = path === HALAMAN_PEMELIHARAAN;

  useEffect(() => {
    if (kecuali) return;
    if (status.terhenti) {
      window.location.replace(HALAMAN_PEMELIHARAAN);
      return;
    }
    if (!jendela || jendela.jenis !== "PLANNED" || jendela.keadaan === "AKTIF") return;
    const selisih = status.sekarang ? Date.parse(status.sekarang) - Date.now() : 0;
    const jam = () => Date.now() + selisih;
    // the minutes on screen follow the clock; the timer is this browser's own, nothing is asked of the server
    const detik = window.setInterval(() => setKini(jam()), 30_000);
    let tahap: number | undefined;
    const jadwal = () => {
      const tunggu = tahapBerikutMs(jendela.mulai, jam());
      if (tunggu === null) return;
      tahap = window.setTimeout(() => {
        setKini(jam());
        if (tahapPeringatan(jendela.mulai, jam()) === 0) {
          // A2b (R-1): only a person-level window stops its reader; a work-scoped one only pauses its place's work
          if (jendela.cakupan === "ORANG" && !jendela.berjalan && !jendela.menguasai) window.location.replace(HALAMAN_PEMELIHARAAN);
          return;
        }
        jadwal();
      }, tunggu + 250);
    };
    jadwal();
    return () => { window.clearInterval(detik); if (tahap) window.clearTimeout(tahap); };
  }, [kecuali, status.terhenti, status.sekarang, jendela]);

  if (kecuali) return null;
  const s = (k: Parameters<typeof t>[0]) => t(k, "learner", { locale });
  const baris: React.ReactNode[] = [];

  if (jendela && jendela.jenis === "PLANNED" && kini !== null) {
    const tahap = jendela.keadaan === "AKTIF" ? 0 : tahapPeringatan(jendela.mulai, kini);
    const asesmen = permukaanAsesmen(path);
    const tempat = jendela.cakupan === "TEMPAT";
    // A2b: the class (or school) a work-scoped window is for, in its words
    const untuk = jendela.kelas ? s("pemeliharaan.tempat.kelas").replace("{kelas}", jendela.kelas.join(", "))
      : s("pemeliharaan.tempat.sekolah").replace("{sekolah}", jendela.sekolah ?? "");
    if (tahap === 0 && tempat) {
      baris.push(
        <p key="aktif">
          <strong>{s("pemeliharaan.tempat.berlangsung").replace("{untuk}", untuk)}</strong>{" "}
          {s("pemeliharaan.tempat.arti")}{" "}
          {jendela.selesai ? <>{s("pemeliharaan.pita.selesai_kira")} {jamJendela(jendela.selesai, jendela)}.</> : null}
        </p>,
      );
    } else if (tahap === 0) {
      baris.push(
        <p key="aktif">
          <strong>{s("pemeliharaan.pita.berlangsung")}</strong>{" "}
          {jendela.menguasai ? s("pemeliharaan.pita.menguasai") : jendela.berjalan ? s("pemeliharaan.pita.berjalan") : null}
        </p>,
      );
    } else if (tahap !== null) {
      baris.push(
        <p key="menjelang">
          <strong>{s("pemeliharaan.pita.dalam")} {menitTersisa(jendela.mulai, kini)} {s("pemeliharaan.pita.menit")}.</strong>{" "}
          {tempat ? s("pemeliharaan.tempat.pukul").replace("{untuk}", untuk) : s("pemeliharaan.pita.pukul")} {jamJendela(jendela.mulai, jendela)}.{" "}
          {jendela.selesai ? <>{s("pemeliharaan.pita.selesai_kira")} {jamJendela(jendela.selesai, jendela)}. </> : null}
          {asesmen ? s("pemeliharaan.pita.asesmen") : tempat ? s("pemeliharaan.tempat.biasa") : s("pemeliharaan.pita.biasa")}{" "}
          {tahap === 15 ? s("pemeliharaan.pita.asesmen_baru") : null}
        </p>,
      );
    }
    if (tahap !== null && jendela.pesan) baris.push(<p key="pesan">{jendela.pesan}</p>);
  }
  for (const n of status.pengumuman) {
    baris.push(<p key={n.id}><strong>{s("pemeliharaan.pita.pengumuman")}:</strong> {n.pesan}</p>);
  }
  if (baris.length === 0) return null;
  const tahapUmum = jendela && jendela.jenis === "PLANNED" && kini !== null ? tahapPeringatan(jendela.mulai, kini) : null;

  return (
    <div className="pin-msg pin-msg-note" data-pemeliharaan="1">
      {baris}
      {/* each of the three notices is announced once, not every minute the line changes */}
      <span className="sr-only" role="status" aria-live="polite">
        {tahapUmum === 60 || tahapUmum === 30 || tahapUmum === 15
          ? `${s("pemeliharaan.pita.dalam")} ${tahapUmum} ${s("pemeliharaan.pita.menit")}.` : ""}
      </span>
    </div>
  );
}

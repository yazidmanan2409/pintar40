"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { t, type Locale } from "@/lib/hle";
import {
  BACA_ULANG_MAKS, barisAlasan, HALAMAN_PEMELIHARAAN, jamJendela, jamPenuh, kapitalAwal, jendelaDiHalaman, jendelaDiumumkan, jendelaUtama, menitTersisa,
  permukaanAsesmen, tahapBerikutMs, tahapPeringatan, tahapSetelahBaca, type StatusSaya,
} from "@/lib/pemeliharaan-kontrak";
import { bacaUlangStatusSaya } from "@/app/pemeliharaan/actions";

/**
 * #148 (D-094(c)(d)(e), D-100(b)): THE MAINTENANCE LINE, timed by the browser.
 *
 * The status arrives with the page. From T-60 the line says when maintenance begins, in words that fit the surface: on
 * an assessment, that a sitting under way can still be finished and handed in, and that an answer counts once
 * «Tersimpan» shows; elsewhere, to finish and leave. From T-15, that no new assessment starts. The three notices (60,
 * 30, 15) are announced once each; the minutes shown follow the clock. At T=0 a reader the window stops goes to the
 * maintenance page; a sitting under way and the window's own administrators stay. A reader the database already stops
 * goes there at once. Live notices are one line each.
 *
 * A2b (R-1; Daisy, A2B-C2W-KATA.md): a class or school window is work-scoped (cakupan TEMPAT). It never sends anyone
 * to the maintenance page; its line names the class (or school) and says that only its work is paused, and it is not
 * shown on another class's own pages. Every time is in the window's school's zone (D8), never a fixed «WIB».
 *
 * A2b (the Chief Architect's R-B, e15fe966): each stage is shown only after the status is read again at its boundary:
 * one read per boundary (at most BACA_ULANG_MAKS per window per open page), only while a planned window is announced,
 * never on an interval. An extension or an early end is therefore shown at the next stage, and a stale stage never
 * shows. A read that fails shows nothing new: the stage on screen stays.
 */
export default function PengingatPemeliharaan({ locale, status: awal }: { locale: Locale; status: StatusSaya }) {
  const path = usePathname() ?? "/";
  const [status, setStatus] = useState<StatusSaya>(awal);
  // the database's clock as it answered: the first render reads it on the server and in the browser alike, and from
  // then on this browser's clock moves it, offset once by the difference measured as the page arrived
  const [kini, setKini] = useState<number | null>(() => (awal.sekarang ? Date.parse(awal.sekarang) : null));
  const utama = jendelaUtama(status);
  const jendela = utama && jendelaDiHalaman(utama, path) ? utama : null;
  // the stage on screen: set as the page arrives, then only by a boundary's successful read (R-B)
  const [tahap, setTahap] = useState<60 | 30 | 15 | 0 | null>(() => {
    const j = jendelaUtama(awal);
    if (!j || j.jenis !== "PLANNED" || !awal.sekarang) return null;
    return j.keadaan === "AKTIF" ? 0 : tahapPeringatan(j.mulai, Date.parse(awal.sekarang));
  });
  const bacaan = useRef(0);
  // each boundary's read, failed or not, re-arms the next boundary (and only the next)
  const [putaran, setPutaran] = useState(0);
  // R-B (the owner's ruling, PLAN c82444b8): after a failed re-read the minutes stop and the last-known start is shown
  const [gagal, setGagal] = useState(false);
  // the database's clock at the last successful read: Daisy's {jam_baca} (A2B-RA-KALIMAT.md §4)
  const [bacaTerakhir, setBacaTerakhir] = useState<string | null>(awal.sekarang);
  const kecuali = path === HALAMAN_PEMELIHARAAN;

  useEffect(() => {
    if (kecuali) return;
    if (status.terhenti) {
      window.location.replace(HALAMAN_PEMELIHARAAN);
      return;
    }
    const selisih = awal.sekarang ? Date.parse(awal.sekarang) - Date.now() : 0;
    const jam = () => Date.now() + selisih;
    if (!jendelaDiumumkan(jendela, jam())) return;
    // the minutes on screen follow the clock: this browser's own timer, which asks the server nothing; it stops once a
    // re-read has failed (the owner's ruling), so a countdown never runs on a start that may have moved
    const detik = gagal ? undefined : window.setInterval(() => setKini(jam()), 30_000);
    // R-B: one timeout, for the next boundary only; at it, one read, then the stage that read gives
    let batas: number | undefined;
    const tunggu = tahapBerikutMs(jendela.mulai, jam());
    if (tunggu !== null && bacaan.current < BACA_ULANG_MAKS) {
      batas = window.setTimeout(async () => {
        bacaan.current += 1;
        // a read the browser cannot complete (no connection: the server action's request fails and the call throws) is a
        // failed read too, not only a server-side null: found in Daisy's batch 1 capture, where the countdown ran on
        const baru = await bacaUlangStatusSaya().catch(() => null);
        setKini(jam());
        setTahap((sebelum) => tahapSetelahBaca(sebelum, baru, jam()));
        setPutaran((n) => n + 1);
        setGagal(!baru);
        if (!baru) return;   // a failed read shows nothing new: the stage on screen stays
        setStatus(baru);
        setBacaTerakhir(baru.sekarang);
        const j = jendelaUtama(baru);
        // A2b (R-1): only a person-level window stops its reader at T=0; a work-scoped one only pauses its place's work
        if (baru.terhenti || (j && j.cakupan === "ORANG" && j.jenis === "PLANNED" && tahapSetelahBaca(null, baru, jam()) === 0
            && !j.berjalan && !j.menguasai)) {
          window.location.replace(HALAMAN_PEMELIHARAAN);
        }
      }, tunggu + 250);
    }
    return () => { if (detik) window.clearInterval(detik); if (batas) window.clearTimeout(batas); };
    // a boundary's read re-arms the next boundary; the status read replaces the window
  }, [kecuali, status.terhenti, awal.sekarang, jendela, putaran, gagal]);

  if (kecuali) return null;
  const s = (k: Parameters<typeof t>[0]) => t(k, "learner", { locale });
  const baris: React.ReactNode[] = [];

  if (jendela && jendela.jenis === "PLANNED" && kini !== null) {
    const asesmen = permukaanAsesmen(path);
    const tempat = jendela.cakupan === "TEMPAT";
    // A2b: the class (or school) a work-scoped window is for, in its words
    const untuk = jendela.kelas ? s("pemeliharaan.tempat.kelas").replace("{kelas}", jendela.kelas.join(", "))
      : s("pemeliharaan.tempat.sekolah").replace("{sekolah}", jendela.sekolah ?? "");
    if (tahap === 0 && tempat) {
      baris.push(
        <p key="aktif">
          <strong>{s("pemeliharaan.tempat.berlangsung").replace("{untuk}", untuk)}</strong>{" "}
          {kapitalAwal(s("pemeliharaan.tempat.arti").replace("{untuk}", untuk))}{" "}
          {jendela.selesai ? <>{s("pemeliharaan.pita.selesai_kira")} {jamPenuh(jendela.selesai, jendela, kini, locale)}.</> : null}
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
          {/* after a failed re-read, no countdown: the last-known start, as of the last read (R-B; Daisy §4) */}
          {gagal ? <><strong>{(jendela.kelas ? s("pemeliharaan.basi.kelas").replace("{kelas}", jendela.kelas.join(", "))
              : tempat ? s("pemeliharaan.basi.sekolah") : s("pemeliharaan.basi.platform"))
              .replace("{jam_baca}", bacaTerakhir ? jamJendela(bacaTerakhir, jendela) : "—").replace("{jam}", jamPenuh(jendela.mulai, jendela, kini, locale))}</strong>{" "}</>
            : <><strong>{s("pemeliharaan.pita.dalam")} {menitTersisa(jendela.mulai, kini)} {s("pemeliharaan.pita.menit")}.</strong>{" "}</>}
          {/* while the last-check line shows, the stage's own start sentence is dropped: it would repeat the start (Daisy, C-2) */}
          {gagal ? null : <>{tempat ? s("pemeliharaan.tempat.pukul").replace("{untuk}", untuk) : s("pemeliharaan.pita.pukul")} {jamPenuh(jendela.mulai, jendela, kini, locale)}.{" "}</>}
          {jendela.selesai ? <>{s("pemeliharaan.pita.selesai_kira")} {jamPenuh(jendela.selesai, jendela, kini, locale)}. </> : null}
          {asesmen ? s("pemeliharaan.pita.asesmen") : tempat ? s("pemeliharaan.tempat.biasa").replace("{untuk}", untuk) : s("pemeliharaan.pita.biasa")}{" "}
          {tahap === 15 ? s("pemeliharaan.pita.asesmen_baru") : null}
        </p>,
      );
    }
    if (tahap !== null && jendela.pesan) baris.push(<p key="pesan">{jendela.pesan}</p>);
    // A2b D2 (Daisy, B1): the planned window's reason, «Alasan: {alasan}» (pemeliharaan.alasan.baris)
    const alasan = tahap !== null ? barisAlasan(jendela, s) : null;
    if (alasan) baris.push(<p key="alasan">{alasan}</p>);
  }
  for (const n of status.pengumuman) {
    baris.push(<p key={n.id}><strong>{s("pemeliharaan.pita.pengumuman")}:</strong> {n.pesan}</p>);
  }
  if (baris.length === 0) return null;

  return (
    <div className="pin-msg pin-msg-note" data-pemeliharaan="1">
      {baris}
      {/* each of the three notices is announced once, not every minute the line changes */}
      <span className="sr-only" role="status" aria-live="polite">
        {tahap === 60 || tahap === 30 || tahap === 15
          ? `${s("pemeliharaan.pita.dalam")} ${tahap} ${s("pemeliharaan.pita.menit")}.` : ""}
      </span>
    </div>
  );
}

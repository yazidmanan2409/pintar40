"use client";
/**
 * A3 (Daisy A3-KODE-PEMULIHAN.md §1, §2.3): the player's quiet line after a recovery. A recovery a teacher allowed
 * warns before the next loop (D-2: signing out and in again needs another permission), on every opening while the
 * sitting goes on; one the learner made themselves (low-stakes) is said once, on the page the recovery returned to.
 * role="status": nothing went wrong.
 */
import { useEffect, useState } from "react";
import { t, type Locale } from "@/lib/hle";
import { TANDA_LANJUT } from "./LanjutkanDiSini";

export default function BarisLanjut({ sesi, izinDipakai, locale }: { sesi: string; izinDipakai: boolean; locale: Locale }) {
  const [sendiri, setSendiri] = useState(false);
  useEffect(() => {
    if (izinDipakai) return;
    let ada = false;
    try { ada = window.sessionStorage.getItem(TANDA_LANJUT(sesi)) === "1"; window.sessionStorage.removeItem(TANDA_LANJUT(sesi)); } catch { /* none */ }
    // read once, after the first paint: the line belongs to this page only
    if (ada) { const id = window.setTimeout(() => setSendiri(true), 0); return () => window.clearTimeout(id); }
  }, [izinDipakai, sesi]);
  if (!izinDipakai && !sendiri) return null;
  return (
    <p className="pin-mm" role="status" data-lanjut={izinDipakai ? "guru" : "sendiri"}>
      {t(izinDipakai ? "pengerjaan.pulih.guru" : "pengerjaan.pulih.sendiri", "learner", { locale })}
    </p>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Locale } from "@/lib/hle";
import { BATAS_SESI, COOKIE_JAGA, HALAMAN_TERKUNCI } from "@/lib/penjaga-sesi-kontrak";

/**
 * THE INACTIVITY CLOCK ON A SHARED COMPUTER (BOB-29, Gate 6; IDENTITY-4.0 C4, §7; D-085 T1).
 *
 * On every page (the root layout), for a session the proxy marked SHARED or CARD (the `pintar_jaga` cookie); it
 * does nothing for anybody else. It is the courtesy half: the server locks at 5 minutes whatever this does
 * (sesi_keadaan, and PostgREST's pre-request refuses a locked session's data). What it adds:
 *
 *  - ACTIVITY REACHES THE SERVER: a key, a click, a touch, a scroll, the pointer moving, or a video or sound playing
 *    on the visible page, at most once a minute (/api/sesi/detak), and always within the minute after the last one.
 *  - ONE CLOCK FOR EVERY TAB: the latest activity is shared through localStorage, so reading in one tab keeps the
 *    others open; a lock in one tab sends every tab to «PINTAR terkunci» (BroadcastChannel).
 *  - A WARNING at 4 minutes, «Saya masih di sini», announced politely.
 *  - THE LOCK at 5 minutes, measured on this computer's clock (so a laptop that slept locks when it wakes): the
 *    session is locked on the server first (/api/sesi/kunci; the server's record can trail by up to the minute),
 *    then the page goes to «PINTAR terkunci» with a full load, so nothing of the person stays on screen.
 *  - BACK AND FORWARD (every computer, CR-90): a page restored from the browser's back-forward cache is reloaded, so
 *    the proxy decides again.
 *
 * Nothing here unlocks; nothing here needs a phone or any other device (owner, 4 Oct).
 */
const KUNCI_AKTIVITAS = "pintar-aktivitas";
const KANAL = "pintar-sesi";
const PERISTIWA = ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"] as const;

function modeLayar(): "SHARED" | "CARD" | null {
  const m = document.cookie.split("; ").find((k) => k.startsWith(`${COOKIE_JAGA}=`))?.slice(COOKIE_JAGA.length + 1);
  return m === "SHARED" || m === "CARD" ? m : null;
}

export default function PenjagaSesi({ locale }: { locale: Locale }) {
  // the warning, when it shows, carries the session's mode (whose words: a learner's or a staff person's)
  const [peringatan, setPeringatan] = useState<"SHARED" | "CARD" | null>(null);
  const aktifRef = useRef<() => void>(() => undefined);

  // CR-90 (BD-11, J2.9 «the next person never continues as the last»): a page restored from the browser's back-forward
  // cache is reloaded on EVERY computer, whatever its mode, so the proxy decides again with today's cookies. Until 7 Oct
  // only a shared or card session did this, so on a computer declared personal, Back after «Keluar» could show a page
  // of the session that had ended. Every page is sent no-store as well; this does not depend on how a browser honours it.
  useEffect(() => {
    const pulih = (e: PageTransitionEvent) => { if (e.persisted) window.location.reload(); };
    window.addEventListener("pageshow", pulih);
    return () => window.removeEventListener("pageshow", pulih);
  }, []);

  useEffect(() => {
    const m = modeLayar();
    if (!m || window.location.pathname === HALAMAN_TERKUNCI) return;
    const kanal = typeof BroadcastChannel === "function" ? new BroadcastChannel(KANAL) : null;
    let lokal = Date.now();
    let disimpan = 0;
    let terkirim = Date.now(); // the page load itself reached the server as activity (src/proxy.ts)
    let tertunda = false;
    let selesai = false;

    const baca = () => { try { return Number(window.localStorage.getItem(KUNCI_AKTIVITAS)) || 0; } catch { return 0; } };
    const simpan = (w: number) => { try { window.localStorage.setItem(KUNCI_AKTIVITAS, String(w)); } catch { /* private window */ } disimpan = w; };
    const terakhir = () => Math.max(lokal, baca());

    const keTerkunci = async (kunciDulu: boolean) => {
      if (selesai) return;
      selesai = true;
      if (kunciDulu) {
        try { await fetch("/api/sesi/kunci", { method: "POST", cache: "no-store" }); } catch { /* the server locks by itself */ }
        kanal?.postMessage("kunci");
      }
      const lanjut = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`${HALAMAN_TERKUNCI}?lanjut=${encodeURIComponent(lanjut)}`);
    };

    const kirimDetak = async () => {
      terkirim = Date.now();
      tertunda = false;
      try {
        const r = await fetch("/api/sesi/detak", { method: "POST", cache: "no-store" });
        if (r.status === 423) void keTerkunci(false);
        else if (r.status === 401) window.location.reload();
      } catch { /* offline: the next activity tries again */ }
    };

    const aktif = () => {
      if (selesai) return;
      const kini = Date.now();
      lokal = kini;
      if (kini - disimpan >= 5_000) simpan(kini);
      setPeringatan(null);
      if (kini - terkirim >= BATAS_SESI.detakDetik * 1000) void kirimDetak();
      else tertunda = true;
    };
    aktifRef.current = aktif;

    const periksa = () => {
      if (selesai) return;
      const kini = Date.now();
      if (document.visibilityState === "visible"
          && Array.from(document.querySelectorAll("video, audio")).some((x) => !(x as HTMLMediaElement).paused && !(x as HTMLMediaElement).ended)) {
        aktif();
      }
      if (tertunda && kini - terkirim >= BATAS_SESI.detakDetik * 1000) void kirimDetak();
      const diam = kini - terakhir();
      if (diam >= BATAS_SESI.kunciDetik * 1000) void keTerkunci(true);
      else setPeringatan(diam >= BATAS_SESI.peringatanDetik * 1000 ? m : null);
    };

    simpan(lokal);
    for (const e of PERISTIWA) window.addEventListener(e, aktif, { passive: true, capture: true });
    const jam = window.setInterval(periksa, 5_000);
    document.addEventListener("visibilitychange", periksa);
    const pesan = (e: MessageEvent) => { if (e.data === "kunci") void keTerkunci(false); };
    kanal?.addEventListener("message", pesan);
    return () => {
      for (const e of PERISTIWA) window.removeEventListener(e, aktif, { capture: true });
      window.clearInterval(jam);
      document.removeEventListener("visibilitychange", periksa);
      kanal?.removeEventListener("message", pesan);
      kanal?.close();
    };
  }, []);

  if (!peringatan) return null;
  const persona = peringatan === "CARD" ? "learner" : "staff";
  return (
    <div className="pin-jaga" role="status">
      <p>{t("jaga.peringatan", persona, { locale })}</p>
      <button type="button" className="pin-mbtn pin-mbtn-1" onClick={() => aktifRef.current()}>{t("jaga.masih", persona, { locale })}</button>
    </div>
  );
}

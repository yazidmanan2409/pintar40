"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import Ikon from "@/components/Ikon";
import Dialog from "@/components/Dialog";
import BarisHasil from "@/components/BarisHasil";

/**
 * W3.5 · THE ACCOUNT MENU (Batch 2; Daisy, components/Menu, Identity; JQ2(a)). A staff member's own name opens it:
 * Akun saya, Laporan saya (CR-78), and «Keluar dari semua perangkat…», last and destructive, which asks in the one
 * Dialog and never acts directly. «Keluar» stays visible beside it on every screen (D-009); a learner has no menu (S15).
 *
 * Keyboard: the button has aria-haspopup, aria-expanded and aria-controls; on open the first item takes focus; arrow
 * keys move, Home and End go to the ends; Esc, Tab or a press outside closes it, and Esc returns focus to the button.
 */
export default function MenuAkun({ locale, nama, children }: { locale: Locale; nama: string; children: React.ReactNode }) {
  const s = useCallback((k: HleEvent) => t(k, "staff", { locale }), [locale]);
  const [buka, setBuka] = useState(false);
  const [tanya, setTanya] = useState(false);
  const [keadaan, setKeadaan] = useState<"diam" | "sibuk" | "gagal">("diam");
  const tombol = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const butir = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  const tutup = (kembali: boolean) => { setBuka(false); if (kembali) tombol.current?.focus(); };

  useEffect(() => {
    if (!buka) return;
    butir()[0]?.focus();
    const luar = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!menu.current?.contains(n) && !tombol.current?.contains(n)) setBuka(false);
    };
    document.addEventListener("pointerdown", luar);
    return () => document.removeEventListener("pointerdown", luar);
  }, [buka]);

  function tombolMenu(e: React.KeyboardEvent<HTMLDivElement>) {
    const semua = butir();
    const i = semua.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); semua[(i + 1) % semua.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); semua[(i - 1 + semua.length) % semua.length]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); semua[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); semua[semua.length - 1]?.focus(); }
    else if (e.key === "Escape") { e.preventDefault(); tutup(true); }
    else if (e.key === "Tab") { setBuka(false); }
  }

  async function keluarSemua() {
    setKeadaan("sibuk");
    let ok = false;
    try {
      const r = await fetch("/api/sesi/keluar-semua", { method: "POST", cache: "no-store" });
      ok = r.ok && ((await r.json().catch(() => null)) as { ok?: unknown } | null)?.ok === true;
    } catch {
      ok = false;
    }
    if (ok) { window.location.replace("/masuk"); return; }
    setKeadaan("gagal");
  }

  return (
    <span className="pin-menu-induk">
      <button
        ref={tombol} type="button" className="pin-menu-tombol"
        aria-haspopup="menu" aria-expanded={buka} aria-controls="pin-menu-akun"
        onClick={() => setBuka((b) => !b)}
        onKeyDown={(e) => { if (e.key === "ArrowDown" && !buka) { e.preventDefault(); setBuka(true); } }}
      >
        {children}
        <Ikon nama="chevron-down" kelas="pin-chevron" />
      </button>
      <div ref={menu} id="pin-menu-akun" className="pin-menu" role="menu" aria-label={nama} hidden={!buka} onKeyDown={tombolMenu}>
        <a role="menuitem" className="pin-menu-butir" href="/akun" tabIndex={-1}>{s("sesi.akun")}</a>
        <a role="menuitem" className="pin-menu-butir" href="/lapor/saya" tabIndex={-1}>{s("lapor.saya.buka")}</a>
        <hr className="pin-menu-pisah" />
        <button role="menuitem" type="button" className="pin-menu-butir pin-menu-bahaya" tabIndex={-1}
          onClick={() => { setBuka(false); setKeadaan("diam"); setTanya(true); }}>
          {s("sesi.menu.semua")}
        </button>
      </div>
      <Dialog
        terbuka={tanya} idJudul="pin-dialog-semua" judul={s("akun.semua.yakin")}
        onTutup={() => { setTanya(false); }}
        aksi={
          <>
            <button type="button" className="pin-btn" autoFocus onClick={() => setTanya(false)} disabled={keadaan === "sibuk"}>
              {s("akun.semua.batal")}
            </button>
            <button type="button" className="pin-btn pin-bahaya-pasti" onClick={() => void keluarSemua()} disabled={keadaan === "sibuk"}
              aria-busy={keadaan === "sibuk" ? "true" : undefined}>
              {s("akun.semua.ya")}
            </button>
          </>
        }
      >
        <p>{s("akun.semua.arti")}</p>
        {keadaan === "gagal" ? <BarisHasil nada="gagal">{s("akun.semua.gagal")}</BarisHasil> : null}
      </Dialog>
    </span>
  );
}

"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { t, type Locale } from "@/lib/hle";
import { BATAS_TANGKAPAN, namaTangkapan } from "@/lib/lapor-masalah-kontrak";
import BidangBerkas from "@/components/bentuk/BidangBerkas";

/**
 * DAISY-12: the optional screenshot. The picture goes straight to PINTAR's private storage through the one signed
 * upload route, under the reporter's own folder (the route decides the folder, never this component); the form then
 * carries only its path. Nothing is sent until a picture is chosen, and a failed upload leaves the report sendable
 * without one.
 */
export default function TangkapanLayar({ locale }: { locale: Locale }) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "staff", { locale });
  const [jalur, setJalur] = useState<string>("");
  const [keadaan, setKeadaan] = useState<"kosong" | "naik" | "siap" | "gagal" | "besar">("kosong");

  async function pilih(f: File | undefined) {
    setJalur("");
    if (!f) { setKeadaan("kosong"); return; }
    const nama = namaTangkapan(crypto.randomUUID(), f.type);
    if (!nama) { setKeadaan("gagal"); return; }
    if (f.size > BATAS_TANGKAPAN) { setKeadaan("besar"); return; }
    setKeadaan("naik");
    try {
      const r = await fetch("/api/assets/upload-url", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: nama }),
      });
      if (!r.ok) { setKeadaan("gagal"); return; }
      const { path, token } = (await r.json()) as { path: string; token: string };
      const klien = supabaseBrowser();
      const { error } = await klien.storage.from("assets").uploadToSignedUrl(path, token, f, { contentType: f.type });
      if (error) { setKeadaan("gagal"); return; }
      setJalur(path);
      setKeadaan("siap");
    } catch {
      setKeadaan("gagal");
    }
  }

  return (
    <div className="pin-lapor-isian">
      {/* W3.3 / the /lapor axe finding (`label`, critical): the field's own label now names the input */}
      <BidangBerkas id="lapor-tangkapan" label={s("lapor.tangkapan")} locale={locale}
        accept="image/png,image/jpeg,image/webp" onPilih={(fs) => pilih(fs[0])} />
      <input type="hidden" name="tangkapan" value={jalur} />
      <p className="pin-hint" aria-live="polite">
        {keadaan === "naik" ? s("lapor.tangkapan.naik") : keadaan === "siap" ? s("lapor.tangkapan.siap")
          : keadaan === "gagal" ? s("lapor.tangkapan.gagal") : keadaan === "besar" ? s("lapor.tangkapan.besar") : s("lapor.tangkapan.arti")}
      </p>
    </div>
  );
}

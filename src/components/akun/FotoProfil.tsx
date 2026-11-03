"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { BATAS_FOTO, jalurFotoBaru } from "@/lib/foto-profil-kontrak";
import BidangBerkas from "@/components/bentuk/BidangBerkas";
import BarisHasil from "@/components/BarisHasil";
import { simpanFotoAksi } from "@/app/akun/actions";

type Keadaan = "diam" | "naik" | "ok" | "hapus" | "gagal" | "besar" | "jenis";

/**
 * W2.8 (Batch 4, CR-07, J8.8): «Foto profil» on «Akun saya». The picture goes to PINTAR's private storage through the
 * one signed upload route, under the person's own folder (the route refuses any other); the server action then keeps
 * its path on the person, only if the file is really there. Shown back through a short-lived signed URL; never on a
 * certificate. «Hapus foto» removes it from the profile.
 */
export default function FotoProfil({ locale, personId, url }: { locale: Locale; personId: string; url: string | null }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const router = useRouter();
  const [keadaan, setKeadaan] = useState<Keadaan>("diam");

  async function pilih(f: File | undefined) {
    if (!f) return;
    const jalur = jalurFotoBaru(personId, crypto.randomUUID(), f.type);
    if (!jalur) { setKeadaan("jenis"); return; }
    if (f.size > BATAS_FOTO) { setKeadaan("besar"); return; }
    setKeadaan("naik");
    try {
      const r = await fetch("/api/assets/upload-url", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: jalur }),
      });
      if (!r.ok) { setKeadaan("gagal"); return; }
      const { path, token } = (await r.json()) as { path: string; token: string };
      const { error } = await supabaseBrowser().storage.from("assets").uploadToSignedUrl(path, token, f, { contentType: f.type });
      if (error) { setKeadaan("gagal"); return; }
      const hasil = await simpanFotoAksi(path);
      if (!hasil.ok) { setKeadaan("gagal"); return; }
      setKeadaan("ok");
      router.refresh();
    } catch {
      setKeadaan("gagal");
    }
  }

  async function hapus() {
    setKeadaan("naik");
    const hasil = await simpanFotoAksi(null).catch(() => null);
    if (!hasil?.ok) { setKeadaan("gagal"); return; }
    setKeadaan("hapus");
    router.refresh();
  }

  const galat = keadaan === "besar" ? s("akun.foto.besar") : keadaan === "jenis" ? s("akun.foto.jenis") : null;

  return (
    <section className="pin-sec" id="foto" aria-labelledby="foto-judul">
      <h2 id="foto-judul">{s("akun.foto.judul")}</h2>
      <p className="pin-meta">{s("akun.foto.arti")}</p>
      <div className="pin-foto-profil">
        {url
          // eslint-disable-next-line @next/next/no-img-element -- a short-lived signed URL; the image optimiser cannot fetch it
          ? <img className="pin-foto" src={url} alt={s("akun.foto.alt")} width={96} height={96} data-foto-profil />
          : <span className="pin-foto pin-foto-kosong" aria-hidden="true" />}
        <div className="pin-foto-aksi">
          <BidangBerkas id="foto-profil" label={s(url ? "akun.foto.ganti" : "akun.foto.pilih")} locale={locale}
            accept="image/png,image/jpeg,image/webp" batas={s("akun.foto.batas")} galat={galat}
            disabled={keadaan === "naik"} onPilih={(fs) => pilih(fs[0])} />
          {url ? (
            <span className="pin-actions">
              <button type="button" className="pin-btn" onClick={hapus} disabled={keadaan === "naik"}>{s("akun.foto.hapus")}</button>
            </span>
          ) : null}
          <div>
            {keadaan === "naik" ? <p className="pin-hint" role="status">{s("akun.foto.naik")}</p>
              : keadaan === "ok" ? <BarisHasil nada="ok">{s("akun.foto.ok")}</BarisHasil>
              : keadaan === "hapus" ? <BarisHasil nada="ok">{s("akun.foto.dihapus")}</BarisHasil>
              : keadaan === "gagal" ? <BarisHasil nada="gagal">{s("akun.foto.gagal")}</BarisHasil> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

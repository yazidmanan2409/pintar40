"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Locale } from "@/lib/hle";
import TombolKirim from "@/components/TombolKirim";
import { cabutSertifikatAksi } from "@/app/konfigurasi/sertifikat/actions";

/**
 * W2.5 (Batch 5; CR-05): «CABUT SERTIFIKAT», as Daisy rules a consequential act that needs a reason (components/
 * Confirmation; 11-validation §3 GQ5): a form in the page, never the Dialog. Set it up (the reason), see what will
 * happen, then do it: «Lanjutkan» changes nothing, it puts the confirmation in the place of the action area. The
 * destructive form: the panel's edge and the act's button are status-blocked, the button names the act with the
 * certificate's number, focus starts on «Batal», and the panel says what stays safe. The database decides
 * (revoke_certificate); the answer is said under the form after the page returns.
 */
export default function FormCabut({ locale, id, nomor }: { locale: Locale; id: string; nomor: string }) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "staff", { locale });
  const [yakin, setYakin] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const lanjut = useRef<HTMLButtonElement>(null);
  const batal = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (yakin) batal.current?.focus(); }, [yakin]);

  return (
    <form ref={form} action={cabutSertifikatAksi} className="pin-koreksi" data-cabut={id}>
      <input type="hidden" name="sertifikat" value={id} />
      <div className="pin-bidang">
        <label htmlFor="cabut-alasan" className="pin-bidang-label">{s("sertifikat.cabut.alasan")}</label>
        <p id="cabut-alasan-petunjuk" className="pin-hint">{s("sertifikat.cabut.alasan.arti")}</p>
        <textarea id="cabut-alasan" name="alasan" className="pin-input pin-alasan-isian" required maxLength={500}
          aria-describedby="cabut-alasan-petunjuk" readOnly={yakin} />
      </div>
      {yakin ? (
        <div className="pin-konfirmasi pin-konfirmasi-bahaya" role="group" aria-labelledby="cabut-tanya" data-konfirmasi-cabut="">
          <p id="cabut-tanya" className="pin-konfirmasi-judul">{s("sertifikat.cabut.tanya")}</p>
          <p>{s("sertifikat.cabut.akibat")}</p>
          <p>{s("sertifikat.cabut.aman")}</p>
          <div className="pin-actions">
            <TombolKirim className="pin-btn pin-bahaya-pasti" sibuk={s("tombol.memproses")}>
              {s("sertifikat.cabut.tombol").replace("{nomor}", nomor)}
            </TombolKirim>
            <button ref={batal} type="button" className="pin-btn"
              onClick={() => { setYakin(false); requestAnimationFrame(() => lanjut.current?.focus()); }}>
              {s("sertifikat.cabut.batal")}
            </button>
          </div>
        </div>
      ) : (
        <span className="pin-actions">
          <button ref={lanjut} type="button" className="pin-btn pin-primary"
            onClick={() => { if (form.current?.reportValidity()) setYakin(true); }}>
            {s("sertifikat.cabut.lanjut")}
          </button>
        </span>
      )}
    </form>
  );
}

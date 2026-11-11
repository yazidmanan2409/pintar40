"use client";

import { useState } from "react";
import Dialog from "@/components/Dialog";
import type { ReactNode } from "react";

/**
 * C1w (Daisy Q6): «Konfirmasi perbaikan» goes through a confirmation dialog, «Hasil {n} sesi dihitung ulang. Hasil asli
 * tetap tersimpan.» Placed inside the act's own <form>: the first press opens THE ONE DIALOG (components/Dialog: the
 * native <dialog>, focus held, Esc closes it, focus returns to the button), and the act is the dialog's submit, which
 * belongs to the same form. Nothing is sent before the second press; the database still decides the act.
 */
export default function KonfirmasiDialog({ tombol, judul, isi, ya, batal, id }: {
  tombol: string; judul: string; isi: string;
  /** the act itself: the page's own TombolKirim (it names its busy word, DAISY-17), inside the same form */
  ya: ReactNode;
  batal: string; id: string;
}) {
  const [buka, setBuka] = useState(false);
  return (
    <>
      <button type="button" className="pin-btn pin-primary" data-konfirmasi-buka={id}
        onClick={(e) => { if (e.currentTarget.form?.reportValidity() ?? true) setBuka(true); }}>
        {tombol}
      </button>
      <Dialog terbuka={buka} judul={judul} idJudul={`${id}-judul`} onTutup={() => setBuka(false)}
        aksi={<>
          <button type="button" className="pin-btn pin-quiet" onClick={() => setBuka(false)}>{batal}</button>
          {ya}
        </>}>
        <p>{isi}</p>
      </Dialog>
    </>
  );
}

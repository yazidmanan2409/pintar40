"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import TombolKirim from "@/components/TombolKirim";

/**
 * KonfirmasiBahaya — THE ONE WAY A DESTRUCTIVE ACT IS TAKEN (Readiness B4, Daisy 8 Nov; P8 «red twice»).
 *
 * Placed inside the act's own <form>. The first press is an ordinary button: it checks the form's required fields
 * (a reason, where one is asked) and opens the confirmation in place, which says what the act does. Focus goes to
 * «Batal», the safe choice. The act itself is the confirmation's red submit (TombolKirim, so it is sent once).
 * «Batal» closes the confirmation and returns focus to the first button. Nothing is sent before the second press.
 *
 * The same shape as the certificate's revocation (FormCabut, W2.5), which this generalises. The database still
 * decides the act; this only makes the screen ask before it.
 */
export default function KonfirmasiBahaya({
  tombol, tanya, akibat, ya, batal, sibuk, id, nama, nilai, terbuka, batalKe,
}: {
  /** the first button's words: the act's name */
  tombol: ReactNode;
  /** the confirmation's question */
  tanya: string;
  /** what the act does and what it leaves */
  akibat?: ReactNode;
  /** the red button's words */
  ya: string;
  batal: string;
  /** the red button's busy word */
  sibuk: string;
  /** a stable id for the question (the act's name, made unique by the page) */
  id: string;
  /** where the form tells its act by the submit button (name="aksi" value="AKHIRI") */
  nama?: string;
  nilai?: string;
  /** A2b (Daisy, C-6): the confirmation is the act's whole panel, open at once, with its required field inside it
   *  (`akibat`); its one «Batal» then closes the panel (`batalKe`, the address without it), never a second cancel */
  terbuka?: boolean;
  batalKe?: string;
}) {
  const [yakin, setYakin] = useState(terbuka === true);
  const lanjut = useRef<HTMLButtonElement>(null);
  const tidak = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  // opened by a press, focus goes to «Batal», the safe choice; opened at once (terbuka), its own field takes focus
  useEffect(() => { if (yakin && !terbuka) tidak.current?.focus(); }, [yakin, terbuka]);
  const judul = `${id}-tanya`;

  if (!yakin) {
    return (
      <button ref={lanjut} type="button" className="pin-btn pin-bahaya" data-bahaya-buka=""
        onClick={(e) => { if (e.currentTarget.form?.reportValidity() ?? true) setYakin(true); }}>
        {tombol}
      </button>
    );
  }
  return (
    <div className="pin-konfirmasi pin-konfirmasi-bahaya" role="group" aria-labelledby={judul} data-bahaya-tanya="">
      <p id={judul} className="pin-konfirmasi-judul">{tanya}</p>
      {akibat ? <div>{akibat}</div> : null}
      <div className="pin-actions">
        <TombolKirim className="pin-btn pin-bahaya-pasti" sibuk={sibuk} name={nama} value={nilai}>{ya}</TombolKirim>
        {batalKe ? (
          <a ref={tidak} href={batalKe} className="pin-btn pin-quiet">{batal}</a>
        ) : (
          <button ref={tidak} type="button" className="pin-btn pin-quiet"
            onClick={() => { setYakin(false); requestAnimationFrame(() => lanjut.current?.focus()); }}>
            {batal}
          </button>
        )}
      </div>
    </div>
  );
}

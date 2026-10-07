"use client";

import { useEffect } from "react";
import { KUNCI_ISIAN, bacaIsian, isianDari, pulihkanIsian, type Bidang } from "@/lib/isian";

/**
 * CR-84 (3): keeps what the person sent in the form named `form`, for one press, and puts it back when the page says
 * that submission was refused (`ditolak`). Draws nothing. The rules are src/lib/isian.ts's.
 */
export default function SimpanIsian({ form, ditolak, pemilik }: { form: string; ditolak: boolean; pemilik: string }) {
  useEffect(() => {
    const f = document.getElementById(form);
    const kunci = KUNCI_ISIAN + form;
    let lalu: string | null = null;
    try {
      lalu = window.sessionStorage.getItem(kunci);
      window.sessionStorage.removeItem(kunci);
    } catch { /* storage refused: nothing is kept, nothing restored */ }
    if (!(f instanceof HTMLFormElement)) return;
    const bidang = () => [...f.elements].filter((e): e is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      e instanceof HTMLInputElement || e instanceof HTMLSelectElement || e instanceof HTMLTextAreaElement) as unknown as Bidang[];
    if (ditolak) pulihkanIsian(bidang(), bacaIsian(lalu), pemilik);
    const simpan = () => {
      try { window.sessionStorage.setItem(kunci, JSON.stringify(isianDari(bidang(), pemilik))); } catch { /* not kept */ }
    };
    f.addEventListener("submit", simpan);
    return () => f.removeEventListener("submit", simpan);
  }, [form, ditolak, pemilik]);
  return null;
}

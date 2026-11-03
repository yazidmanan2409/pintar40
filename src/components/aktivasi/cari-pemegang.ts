"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * W2.10 (Batch 4; CR-49, CAP-10): THE CARD HOLDERS ARE SEARCHED ON THE SERVER. The field types as before, and the
 * words go into the address (`?<kunci>=…`, a moment after the last key) so the page asks the database for at most
 * twenty matches; nothing sends every card holder to the browser. The section keeps its own state (a chosen row, a
 * printed card) because only the search words change.
 */
export function useCariDiAlamat(kunci: string, juga: readonly string[] = []): [string, (v: string) => void] {
  const router = useRouter();
  const jalan = usePathname();
  const sp = useSearchParams();
  const [cari, setCari] = useState(sp.get(kunci) ?? "");
  const tunda = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (tunda.current) clearTimeout(tunda.current); }, []);
  function ubah(v: string) {
    setCari(v);
    if (tunda.current) clearTimeout(tunda.current);
    tunda.current = setTimeout(() => {
      const q = new URLSearchParams(sp.toString());
      if (v.trim()) q.set(kunci, v.trim()); else q.delete(kunci);
      // W2.10: new words start a paged list from its first page (`juga`: the page parameters the search resets)
      for (const x of juga) q.delete(x);
      const s = q.toString();
      router.replace(s ? `${jalan}?${s}` : jalan, { scroll: false });
    }, 250);
  }
  return [cari, ubah];
}

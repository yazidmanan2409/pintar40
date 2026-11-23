import type { ReactNode } from "react";
import { format, type HleEvent, type Locale } from "@/lib/hle";

/**
 * C3w-1 · the AI drafting's shared wording helpers, for server and client alike (no directive): Daisy's first sentence
 * in bold (**…**), and the submit gate's sentence for the server's count (C3W-1-WORDS-TAMBAHAN §3).
 */
export function Tebal({ teks }: { teks: string }): ReactNode {
  const m = /^\*\*(.+?)\*\*\s*(.*)$/.exec(teks);
  return m ? <><strong>{m[1]}</strong> {m[2]}</> : teks;
}

export function kalimatBelumDiterima(n: number, s: (k: HleEvent) => string, locale: Locale): string {
  return n === 1 ? s("galat.ai_belum_diterima_satu") : s("galat.ai_belum_diterima").replace("{n}", format.number(n, locale));
}

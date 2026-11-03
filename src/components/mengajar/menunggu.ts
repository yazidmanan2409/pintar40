import { format, type HleEvent, type Locale } from "@/lib/hle";
import type { Menunggu } from "@/lib/pengajar";

/**
 * UX-37: HOW ONE WAITING ACT IS SAID, in the words «Yang bisa Anda lakukan sekarang» (/langkah) already uses, so the
 * home and /langkah name the same act the same way. The act itself is decided once, by `menungguKelas`.
 */
export function kataMenunggu(
  m: Menunggu,
  s: (k: HleEvent) => string,
  locale: Locale,
  kataMurid: HleEvent = "mengajar.bukti.murid",
): { judul: string; sebab: string } {
  switch (m.key) {
    case "f1":
      return {
        judul: `${s("mengajar.langkah.f1")} — ${format.number(m.belum, locale)} ${s(kataMurid)}`,
        sebab: s("mengajar.langkah.f1w"),
      };
    case "f4":
      return { judul: s("mengajar.langkah.f4"), sebab: s("mengajar.langkah.f4w") };
  }
}

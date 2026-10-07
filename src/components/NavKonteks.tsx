import Link from "next/link";
import TandaTautan from "@/components/TandaTautan";
import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import { permukaanKonteks } from "@/lib/konteks";
import { konteksSaya, tempatSaya } from "@/lib/konteks-server";
import { peranSaya } from "@/lib/tur-negara";
import { istilah } from "@/lib/istilah-menunggu";
import TabTempat, { tawarkanStudio, tempatDariPeran, type Tempat } from "./TabTempat";

/** Each surface's existing tab word (no new words, D-128(g)). */
const LABEL: Record<string, HleEvent> = {
  "/belajar": "nav.belajar",
  "/mengajar": "nav.kelas",
  "/pimpinan": "nav.pimpinan",
  "/konfigurasi": "nav.konfigurasi",
  "/pendataan": "nav.pendataan",
  "/aktivasi": "nav.aktivasi",
  "/studio": "nav.studio",
};

/**
 * L3 · THE SHELL'S NAVIGATION, FROM THE WORKING CONTEXT (CR-83; D-127 Q1; D-132 §2.4, §2.6).
 *
 * The tabs are the active context's own surfaces, in its place, by the grants that give its purpose there
 * (permukaanKonteks): Mengajar · SD B offers Kelas and Studio, never Konfigurasi because the same person also
 * administers somewhere. Beside them, the context's place by its name and, for a person who holds more than one
 * purpose · place, the one way to change it: «Mau ke mana hari ini?», the chooser (`/`). There is no switch anywhere
 * else, and no tab leads into another context. This is the plain, functional control; its look is Daisy's (CR-54 S2).
 *
 * Mengelola's own short name (context.manage_label) is a semantic key awaiting Dr Gladys's words (D-132(m)) and
 * draws nothing until then; the place's name and the tabs say where the person is.
 *
 * Without a context (an evaluation persona, C10, or a session not yet given one) the tabs are the reader's roles'
 * places, as before L3. A tab decides nothing either way: each surface's own guard and the database decide.
 *
 * Called and awaited by the shell that draws it (`{await navKonteks(…)}`), never mounted as its own async component:
 * a component that waits on its own is streamed after the page and moved into place by script, so without script
 * the tabs would never show.
 */
export async function navKonteks({
  locale,
  persona,
  kecuali = [],
  kelas,
}: {
  locale: Locale;
  persona: Persona;
  /** The surfaces the calling shell already draws. */
  kecuali?: readonly string[];
  /** For a page outside the Experience shell, which styles its own links. */
  kelas?: string;
}) {
  const k = await konteksSaya();
  if (k?.keadaan !== "ADA") {
    const peran = await peranSaya();
    return (
      <TabTempat tempat={tempatDariPeran(peran)} kecuali={kecuali as Tempat[]} locale={locale} persona={persona}
        kelas={kelas} studio={tawarkanStudio(peran) && !kecuali.includes("/studio")} />
    );
  }
  const lain = (await tempatSaya()).length > 1;
  const tempat = k.platform ? t("config.pemeliharaan.platform", "staff", { locale }) : k.nama;
  const namaTujuan = k.tujuan === "MENGELOLA" ? istilah("context.manage_label") : null;
  return (
    <>
      {permukaanKonteks(k).filter((x) => !kecuali.includes(x)).map((href) => (
        <Link key={href} href={href} className={kelas}>
          {t(LABEL[href], persona, { locale })}
          <TandaTautan />
        </Link>
      ))}
      {tempat || namaTujuan ? (
        <span className={kelas} data-konteks-tempat="">{[namaTujuan, tempat].filter(Boolean).join(" · ")}</span>
      ) : null}
      {lain ? (
        <Link href="/" className={kelas} data-konteks-pilih="">
          {t("entry.title", "public", { locale })}
          <TandaTautan />
        </Link>
      ) : null}
    </>
  );
}

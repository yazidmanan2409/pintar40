import Link from "next/link";
import { LABEL_TEMPAT } from "@/lib/nama-tempat";
import TandaTautan from "@/components/TandaTautan";
import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import { permukaanKonteks } from "@/lib/konteks";
import { konteksSaya, tempatSaya } from "@/lib/konteks-server";
import { peranSaya } from "@/lib/tur-negara";
import { istilah } from "@/lib/istilah-menunggu";
import TabTempat, { tawarkanStudio, tempatDariPeran, type Tempat } from "./TabTempat";
import ItemNav from "./ItemNav";
import Ikon from "./Ikon";

/** Each surface's existing tab word (no new words, D-128(g)): the one table back links read too (E-K1). */
const LABEL: Readonly<Record<string, HleEvent>> = LABEL_TEMPAT;

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
  bentuk,
  kini,
}: {
  locale: Locale;
  persona: Persona;
  /** The place the reader is in (or the parent of the page they are on), marked `aria-current` in the navigation. */
  kini?: string;
  /** The surfaces the calling shell already draws. */
  kecuali?: readonly string[];
  /** For a page outside the Experience shell, which styles its own links. */
  kelas?: string;
  /** "nav": the staff navigation's items (D-138 step 3); the place and the chooser keep their data hooks. */
  bentuk?: "nav";
}) {
  const k = await konteksSaya();
  if (k?.keadaan !== "ADA") {
    const peran = await peranSaya();
    return (
      <TabTempat tempat={tempatDariPeran(peran)} kecuali={kecuali as Tempat[]} locale={locale} persona={persona}
        kelas={kelas} studio={tawarkanStudio(peran) && !kecuali.includes("/studio")} bentuk={bentuk} kini={kini} />
    );
  }
  const lain = (await tempatSaya()).length > 1;
  const tempat = k.platform ? t("config.pemeliharaan.platform", "staff", { locale }) : k.nama;
  const namaTujuan = k.tujuan === "MENGELOLA" ? istilah("context.manage_label") : null;
  if (bentuk === "nav") {
    // E2 (D-169(c)): in the staff shell the context's place and the chooser are the context control at the top of the
    // navigation (blokKonteks), drawn by the shell; the navigation's items are the places alone.
    return (
      <>
        {permukaanKonteks(k).filter((x) => !kecuali.includes(x)).map((href) => (
          <ItemNav key={href} href={href} label={t(LABEL[href], persona, { locale })} kini={href === kini} />
        ))}
      </>
    );
  }
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

/** The place's initials for the rail's context item: drawn, never read (the full name is the item's name). */
export function inisialTempat(nama: string): string {
  const kata = nama.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  return kata.slice(0, 2).map((w) => w[0]!.toLocaleUpperCase("id")).join("");
}

/**
 * E2 (D-169(c)) with E1 (D-170(c)): THE CONTEXT CONTROL, at the top of every staff shell's navigation.
 *
 * Expanded, one quiet block: the purpose's short name as an eyebrow («Mengajar» `nav.kelas`, «Belajar»
 * `nav.pembelajaran`; for Mengelola G1's slot `context.manage_label`, which draws nothing until Dr Gladys's words
 * exist), the place (the school, or «Seluruh platform»), and «Mau ke mana hari ini?» to `/` only for a person who holds
 * more than one context: the one way to change it.
 *
 * In the rail, one 44 px item: the place's initials (drawn, `aria-hidden`), its own visually hidden text and tooltip
 * «Mau ke mana hari ini? · {purpose} · {place}», the chooser link. For a person with one context it is absent (E1 §1).
 * Without a working context (an evaluation persona, C10) there is no control, as before.
 */
export async function blokKonteks({ locale }: { locale: Locale }) {
  const k = await konteksSaya();
  if (k?.keadaan !== "ADA") return null;
  const lain = (await tempatSaya()).length > 1;
  const tempat = k.platform ? t("config.pemeliharaan.platform", "staff", { locale }) : k.nama;
  const tujuan = k.tujuan === "MENGELOLA" ? istilah("context.manage_label")
    : t(k.tujuan === "BELAJAR" ? "nav.pembelajaran" : "nav.kelas", "educator", { locale });
  const pilih = t("entry.title", "public", { locale });
  const railNama = [pilih, tujuan, tempat].filter(Boolean).join(" · ");
  return (
    <div className="pin-konteks-kontrol" data-konteks-blok="">
      <div className="pin-konteks-blok">
        {tujuan ? <span className="pin-konteks-tujuan">{tujuan}</span> : null}
        {tempat ? <strong className="pin-konteks-tempat" data-konteks-tempat="">{tempat}</strong> : null}
        {lain ? (
          <Link href="/" className="pin-konteks-pilih" data-konteks-pilih="">
            {pilih}
            <Ikon nama="chevron-right" />
            <TandaTautan />
          </Link>
        ) : null}
      </div>
      {lain ? (
        <Link href="/" className="pin-nav-item pin-konteks-rail" data-tip-host="" data-konteks-rail="">
          <span className="pin-konteks-inisial" aria-hidden="true">{inisialTempat(tempat ?? "")}</span>
          <span className="pin-nav-label">{railNama}</span>
          <span className="pin-nav-tip" aria-hidden="true">{railNama}</span>
        </Link>
      ) : null}
    </div>
  );
}

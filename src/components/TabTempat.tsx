import Link from "next/link";
import { t, type Locale, type Persona } from "@/lib/hle";
import { daftarTempat, type Tempat } from "./tempat";

export { tempatDariPeran, tawarkanStudio, type Tempat } from "./tempat";

/**
 * The tabs for the places a person holds, less the ones the calling shell
 * already draws (DAISY-03), then Studio when their roles are offered it
 * (DAISY-11, D-021). Which places, and why a tab decides nothing, is explained
 * in ./tempat.ts; this only turns that list into links.
 */
export default function TabTempat({
  tempat,
  kecuali = [],
  locale,
  persona,
  kelas,
  studio = false,
}: {
  tempat: readonly Tempat[];
  kecuali?: readonly Tempat[];
  locale: Locale;
  persona: Persona;
  /** For a page outside the Experience shell, which styles its own links. */
  kelas?: string;
  /** tawarkanStudio of the reader's roles: whether to end with the Studio tab. */
  studio?: boolean;
}) {
  return (
    <>
      {daftarTempat(tempat, kecuali, locale, persona).map(({ href, label }) => (
        <Link key={href} href={href} className={kelas}>
          {label}
        </Link>
      ))}
      {studio ? (
        <Link href="/studio" className={kelas}>
          {t("nav.studio", persona, { locale })}
        </Link>
      ) : null}
    </>
  );
}

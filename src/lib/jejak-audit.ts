import { allKeys, t, type HleEvent, type Locale, type Persona } from "@/lib/hle";

/**
 * THE AUDIT TRAIL IN WORDS (D-138(c), D-140(c)). An audit row holds the database's own action code
 * («role.granted», «RELEASE_PUBLISHED») and the table it touched; a school administrator reading Jejak audit is
 * shown neither. The action has its own words when the copy table has them; otherwise the words of its area (the
 * part before the dot, or the code family before the first underscore); otherwise «Perubahan tercatat». The record
 * is named by its kind, never by its table or its id.
 */
const KUNCI = new Set<string>(allKeys());

function ada(k: string): k is HleEvent {
  return KUNCI.has(k);
}

export function kataAksiAudit(aksi: string | null, locale: Locale, persona: Persona = "staff"): string {
  const a = aksi ?? "";
  const ranah = a.includes(".") ? a.split(".")[0] : a.split("_")[0];
  const k = `audit.aksi.${a}`;
  if (ada(k)) return t(k, persona, { locale });
  const r = `audit.ranah.${ranah}`;
  if (ada(r)) return t(r, persona, { locale });
  return t("audit.aksi.lain", persona, { locale });
}

export function kataTabelAudit(tabel: string | null, locale: Locale, persona: Persona = "staff"): string | null {
  const k = `audit.tabel.${tabel ?? ""}`;
  return ada(k) ? t(k, persona, { locale }) : null;
}

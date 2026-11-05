import { allKeys, t, type HleEvent, type Locale, type Persona } from "@/lib/hle";

const KUNCI = new Set<string>(allKeys() as string[]);

/**
 * E-C1-1 / E-C1-3 (D-168): A FIGURE'S NAME, NEVER A KEY AND NEVER NOTHING. A report entry names itself by its
 * `label_key`, a key the database holds. A key the copy table does not have (a measure added before its words), or no
 * key at all, used to draw an empty heading or the copy table's dash; it now reads as the one sentence that says the
 * measure has no name yet. Every surface that names an entry asks here.
 */
export function labelMetrik(e: { label_key?: string | null }, persona: Persona, locale: Locale): string {
  const k = e.label_key && KUNCI.has(e.label_key) ? (e.label_key as HleEvent) : "laporan.metrik.tanpa_nama";
  return t(k, persona, { locale });
}

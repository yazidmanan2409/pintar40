/**
 * D2-R (R-h, ruling 74): THE RESULT-SIDE FORBIDDEN-KEY CHECK.
 *
 * `sanitize` (INV-01) guards an item on its way to the player. This guards a RESULT on its way to a page: a certifying
 * sitting's result (the sitting captured `bersertifikasi` when it started) discloses counts only, so a payload or a
 * row that carries a mark, a key, an explanation or a mastery figure per objective is a defect in the database's
 * projection, and the page is refused rather than shown it. The database already withholds all of these
 * (20270124100000); this is the second line, as `sanitize` is for items. A non-certifying result (Pemetaan Awal, Uji
 * Cepat, practice) keeps its explanations and passes untouched.
 *
 * A field present but empty (null) carries nothing and passes: the reading map's row type keeps its `alasan` column.
 */
export const RESULT_FORBIDDEN_FIELDS = ["benar", "alasan", "arah", "kunci", "is_correct", "rationale"] as const;
/** Sharon §7.2: per_domain keeps its sections, never a number for one (penguasaan is a score in all but name). */
export const PER_DOMAIN_FORBIDDEN_FIELDS = ["penguasaan", "benar", "total"] as const;

export class ResultDisclosureError extends Error {
  constructor(field: string) {
    super(`a certifying result carried "${field}"; it discloses counts only (D2-R, ruling 74)`);
    this.name = "ResultDisclosureError";
  }
}

export function jagaHasil<T>(x: T, bersertifikasi: boolean | null | undefined): T {
  if (!bersertifikasi) return x;
  const periksa = (o: unknown) => {
    if (!o || typeof o !== "object") return;
    for (const k of RESULT_FORBIDDEN_FIELDS) {
      const v = (o as Record<string, unknown>)[k];
      if (v !== undefined && v !== null) throw new ResultDisclosureError(k);
    }
    const pd = (o as Record<string, unknown>).per_domain;
    if (pd && typeof pd === "object") {
      for (const bagian of Object.values(pd as Record<string, unknown>)) {
        for (const k of PER_DOMAIN_FORBIDDEN_FIELDS) {
          const v = bagian && typeof bagian === "object" ? (bagian as Record<string, unknown>)[k] : undefined;
          if (v !== undefined && v !== null) throw new ResultDisclosureError(`per_domain.${k}`);
        }
      }
    }
  };
  if (Array.isArray(x)) x.forEach(periksa); else periksa(x);
  return x;
}

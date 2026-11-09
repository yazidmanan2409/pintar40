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

/**
 * E7 (owner, 9 Nov; ACCOUNT-LIFECYCLE-INVENTORY.md §5): WHO ACTED AND WHY, from the row's own summary. Only the keys
 * written for this purpose are read: the reason in words (reason, explanation, revoked_reason), a reason code with words
 * of its own (audit.alasan.<code>), the effective date, and the role the actor acted in (audit_write's actor_role). Nothing
 * else in a summary reaches the screen: it may hold ids, mappings or counts that are not a reader's business.
 */
export type AlasanAudit = { alasan: string | null; berlaku: string | null; peran: string | null };

export function alasanAudit(summary: unknown, locale: Locale, persona: Persona = "staff"): AlasanAudit {
  const s = summary && typeof summary === "object" && !Array.isArray(summary) ? (summary as Record<string, unknown>) : {};
  const teks = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 300) : null);
  const kode = teks(s.reason_code);
  const kunciKode = kode ? `audit.alasan.${kode.toLowerCase()}` : "";
  const kataKode = kode && ada(kunciKode) ? t(kunciKode, persona, { locale }) : null;
  const bebas = teks(s.reason) ?? teks(s.explanation) ?? teks(s.revoked_reason);
  const alasan = [kataKode, bebas].filter(Boolean).join(" · ") || null;
  const berlaku = typeof s.effective_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.effective_date) ? s.effective_date : null;
  const r = teks(s.actor_role);
  const kunciPeran = r ? `role.${r}` : "";
  return { alasan, berlaku, peran: r && ada(kunciPeran) ? t(kunciPeran, persona, { locale }) : null };
}

/**
 * K1 (Daisy, TINJAUAN-KENAIKAN-KELAS-DIBANGUN; Sharon: «fold, don't hide»): ONE YEAR-END RUN READS AS ONE ENTRY. A
 * kenaikan run writes its one promotion.applied row and, beside it, a row for each enrolment it ended or opened; every
 * one of them carries the run's id (summary.run_id, written by audit_write while the run holds pintar.audit_run). On a
 * page that holds the run's own row, the rows of the same run are folded under it, counted, never dropped; a row whose
 * run's own row is on another page is drawn as itself and says it belongs to a run. Linked by the recorded id only,
 * never by time.
 */
export type BarisJejak = { id: string | number; action: string | null; summary: unknown };
export type HasilLipat<T extends BarisJejak> = { baris: T[]; anak: Map<T["id"], T[]>; bagianRun: Set<T["id"]> };

const runDari = (summary: unknown): string | null => {
  const s = summary && typeof summary === "object" && !Array.isArray(summary) ? (summary as Record<string, unknown>) : {};
  return typeof s.run_id === "string" && s.run_id ? s.run_id : null;
};

export function lipatKenaikan<T extends BarisJejak>(rows: T[]): HasilLipat<T> {
  const induk = new Map<string, T>();
  for (const r of rows) {
    const run = runDari(r.summary);
    if (run && r.action === "promotion.applied" && !induk.has(run)) induk.set(run, r);
  }
  const anak = new Map<T["id"], T[]>();
  const bagianRun = new Set<T["id"]>();
  const baris: T[] = [];
  for (const r of rows) {
    const run = runDari(r.summary);
    const p = run ? induk.get(run) : undefined;
    if (run && p && p !== r) { anak.set(p.id, [...(anak.get(p.id) ?? []), r]); continue; }
    if (run && !p) bagianRun.add(r.id);
    baris.push(r);
  }
  return { baris, anak, bagianRun };
}

/** The learners a promotion.applied row names (its summary's outcomes), each with the decision as written. */
export type HasilRun = { person_id: string; keputusan: string; alasan: string | null };
export function hasilRun(summary: unknown): HasilRun[] {
  const s = summary && typeof summary === "object" && !Array.isArray(summary) ? (summary as Record<string, unknown>) : {};
  const o = Array.isArray(s.outcomes) ? s.outcomes : [];
  return o.flatMap((x) => {
    const h = x && typeof x === "object" ? (x as Record<string, unknown>) : {};
    return typeof h.person_id === "string" && typeof h.keputusan === "string"
      ? [{ person_id: h.person_id, keputusan: h.keputusan, alasan: typeof h.alasan === "string" ? h.alasan : null }] : [];
  });
}

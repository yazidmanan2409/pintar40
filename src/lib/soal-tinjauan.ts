/**
 * D-088(h) (Yazid, 2 Oct) — A REVIEWER SEES WHAT THEY APPROVE.
 *
 * Studio's package page showed a chapter's state, its quality findings and the
 * publish steps, and its preview is by design (§5) the learner's sanitised view,
 * with no question in it. So the person who approves a chapter never saw its
 * questions (cross-check EDU-J12). Yazid ruled that authorised Studio staff see
 * the school's questions, their options, the key and each option's rationale
 * before approving; the learner preview stays sanitised.
 *
 * Nothing is granted here. The questions and options are read with the reader's
 * own client, under the tables' own row security: CAN_DRAFT in the item's
 * school (`items_select`, `item_options_select`). Every role that may approve
 * (CAN_REVIEW) holds CAN_DRAFT, so the reviewer reads exactly what an author of
 * that school may already read; anyone else reads nothing.
 */

import { pitaKesulitan } from "@/lib/unggah-kontrak";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

/** E-A1-1: the misconception an option is coded with, named as the school's taxonomy names it (the code when unnamed). */
export type MiskonsepsiOpsi = { kode: string; nama: string | null };
export type OpsiTinjauan = { label: string; isi: string; kunci: boolean;
  /** F1-R1b: null when a confirmed key correction withdrew it (INV-03 as amended, ADR-0025) */
  alasan: string | null; miskonsepsi?: MiskonsepsiOpsi };
export type SoalTinjauan = {
  id: string;
  /** PRE_TEST / POST_TEST when the item belongs to the cycle's tests, else null */
  peran: string | null;
  bank: string;
  stimulus: string | null;
  pertanyaan: string;
  /** E-A1-1: the author's predicted difficulty as its band (the database's rule, pitaKesulitan), never the number. */
  pita: "MUDAH" | "SEDANG" | "SULIT" | null;
  opsi: OpsiTinjauan[];
};
export type PelajaranTinjauan = { id: string; judul: string; soal: SoalTinjauan[] };

type Modul = { id: string; ordinal: number };
type Pelajaran = { id: string; module_id: string; ordinal: number; title: string };
type Item = { id: string; lesson_id: string; cycle_role: string | null; bank_type: string; stimulus: string | null; stem: string; created_at: string; predicted_difficulty?: number | null };
type Opsi = { item_id: string; label: string; body: string; is_correct: boolean; rationale: string | null; misconception_code?: string | null };

const PERAN_URUT: Record<string, number> = { PRE_TEST: 0, POST_TEST: 1 };

/**
 * The questions of one package, as a reviewer reads them: lessons in the
 * package's order (module, then lesson), each lesson's questions with the
 * Pemetaan Awal's first, then the Uji Penguasaan's, then practice; options A–E
 * with the key marked and each option's rationale. A lesson with no question is
 * left out. Pure, so it is tested without a database.
 */
export function susunSoal(
  modul: readonly Modul[],
  pelajaran: readonly Pelajaran[],
  item: readonly Item[],
  opsi: readonly Opsi[],
  /** The school's misconception names by code, as the reader may read them. */
  namaMiskonsepsi: ReadonlyMap<string, string> = new Map(),
): PelajaranTinjauan[] {
  const urutModul = new Map(modul.map((m) => [m.id, m.ordinal]));
  const opsiPer = new Map<string, Opsi[]>();
  for (const o of opsi) opsiPer.set(o.item_id, [...(opsiPer.get(o.item_id) ?? []), o]);
  return [...pelajaran]
    .sort((a, b) => (urutModul.get(a.module_id) ?? 0) - (urutModul.get(b.module_id) ?? 0) || a.ordinal - b.ordinal)
    .map((l) => ({
      id: l.id,
      judul: l.title,
      soal: item
        .filter((i) => i.lesson_id === l.id)
        .sort((a, b) => (PERAN_URUT[a.cycle_role ?? ""] ?? 2) - (PERAN_URUT[b.cycle_role ?? ""] ?? 2)
          || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
        .map((i) => ({
          id: i.id,
          peran: i.cycle_role,
          bank: i.bank_type,
          stimulus: i.stimulus,
          pertanyaan: i.stem,
          pita: pitaKesulitan(i.predicted_difficulty),
          opsi: (opsiPer.get(i.id) ?? [])
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((o) => ({
              label: o.label, isi: o.body, kunci: o.is_correct, alasan: o.rationale,
              miskonsepsi: o.misconception_code ? { kode: o.misconception_code, nama: namaMiskonsepsi.get(o.misconception_code) ?? null } : undefined,
            })),
        })),
    }));
  // A1 (D-166(b)): a lesson with no question stays, listed as «(0 soal)», so the reviewer sees the whole package
}

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

/**
 * The package's questions under the reader's own row security (CAN_DRAFT in the school).
 *
 * R3 (A1's «gagal» state): a read that fails is said to have failed, never shown as a shorter list, since «a partial
 * list could be mistaken for the whole» and the reviewer approves what they were shown. Every query's error is
 * checked, and the questions are read a thousand at a time, so no package is cut at a limit.
 */
export type HasilSoalPaket = { ok: true; pelajaran: PelajaranTinjauan[] } | { ok: false };
export async function soalPaket(c: Db, course: string): Promise<HasilSoalPaket> {
  const gagal: HasilSoalPaket = { ok: false };
  const m = await c.from("modules").select("id, ordinal").eq("course_id", course);
  if (m.error) return gagal;
  const modul = rows<Modul>(m.data);
  if (modul.length === 0) return { ok: true, pelajaran: [] };
  const p = await c.from("lessons").select("id, module_id, ordinal, title").in("module_id", modul.map((x) => x.id));
  if (p.error) return gagal;
  const pelajaran = rows<Pelajaran>(p.data);
  if (pelajaran.length === 0) return { ok: true, pelajaran: [] };
  const item: Item[] = [];
  for (let dari = 0; ; dari += 1000) {
    const r = await c.from("items").select("id, lesson_id, cycle_role, bank_type, stimulus, stem, created_at, predicted_difficulty")
      .in("lesson_id", pelajaran.map((l) => l.id)).order("id").range(dari, dari + 999);
    if (r.error) return gagal;
    const isi = rows<Item>(r.data);
    item.push(...isi);
    if (isi.length < 1000) break;
  }
  const opsi: Opsi[] = [];
  // the option rows are read a hundred questions at a time, so the request stays short however big the package
  for (let i = 0; i < item.length; i += 100) {
    const r = await c.from("item_options").select("item_id, label, body, is_correct, rationale, misconception_code")
      .in("item_id", item.slice(i, i + 100).map((x) => x.id));
    if (r.error) return gagal;
    opsi.push(...rows<Opsi>(r.data));
  }
  // E-A1-1: the codes' names, from the school's taxonomy under the same row security (CAN_DRAFT in the school)
  const kode = [...new Set(opsi.map((o) => o.misconception_code).filter((x): x is string => typeof x === "string" && x !== ""))];
  const nama = new Map<string, string>();
  for (let i = 0; i < kode.length; i += 100) {
    const r = await c.from("misconception_taxonomy").select("code, label").in("code", kode.slice(i, i + 100));
    if (r.error) return gagal;
    for (const x of rows<{ code: string; label: string }>(r.data)) nama.set(x.code, x.label);
  }
  return { ok: true, pelajaran: susunSoal(modul, pelajaran, item, opsi, nama) };
}

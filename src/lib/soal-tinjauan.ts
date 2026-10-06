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

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

export type OpsiTinjauan = { label: string; isi: string; kunci: boolean; alasan: string };
export type SoalTinjauan = {
  id: string;
  /** PRE_TEST / POST_TEST when the item belongs to the cycle's tests, else null */
  peran: string | null;
  bank: string;
  stimulus: string | null;
  pertanyaan: string;
  opsi: OpsiTinjauan[];
};
export type PelajaranTinjauan = { id: string; judul: string; soal: SoalTinjauan[] };

type Modul = { id: string; ordinal: number };
type Pelajaran = { id: string; module_id: string; ordinal: number; title: string };
type Item = { id: string; lesson_id: string; cycle_role: string | null; bank_type: string; stimulus: string | null; stem: string; created_at: string };
type Opsi = { item_id: string; label: string; body: string; is_correct: boolean; rationale: string };

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
          opsi: (opsiPer.get(i.id) ?? [])
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((o) => ({ label: o.label, isi: o.body, kunci: o.is_correct, alasan: o.rationale })),
        })),
    }))
    .filter((l) => l.soal.length > 0);
}

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

/** The package's questions under the reader's own row security (CAN_DRAFT in the school). */
export async function soalPaket(c: Db, course: string): Promise<PelajaranTinjauan[]> {
  const modul = rows<Modul>((await c.from("modules").select("id, ordinal").eq("course_id", course)).data);
  if (modul.length === 0) return [];
  const pelajaran = rows<Pelajaran>((await c.from("lessons").select("id, module_id, ordinal, title")
    .in("module_id", modul.map((m) => m.id))).data);
  if (pelajaran.length === 0) return [];
  const item = rows<Item>((await c.from("items").select("id, lesson_id, cycle_role, bank_type, stimulus, stem, created_at")
    .in("lesson_id", pelajaran.map((l) => l.id)).limit(2000)).data);
  const opsi: Opsi[] = [];
  // the option rows are read a hundred questions at a time, so the request stays short however big the package
  for (let i = 0; i < item.length; i += 100) {
    const potong = item.slice(i, i + 100).map((x) => x.id);
    opsi.push(...rows<Opsi>((await c.from("item_options").select("item_id, label, body, is_correct, rationale")
      .in("item_id", potong)).data));
  }
  return susunSoal(modul, pelajaran, item, opsi);
}

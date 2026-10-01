/**
 * W3 (R1) — WHAT THE LEARNER SEES CHOSEN IS WHAT IS HANDED IN.
 *
 * In the Uji Penguasaan an answer is taken with «Simpan jawaban ini»; choosing
 * alone draws the option as chosen and sends nothing (§4: no auto-commit). A
 * choice left unsaved was silently dropped at «Kumpulkan»: the screen showed it
 * chosen while the server held nothing for that question, or an older answer
 * (journey cross-check W3). «Kumpulkan», once the learner confirms it, now takes
 * every such choice through the same outbox as «Simpan jawaban ini» before it
 * finishes. A reload opens the first question without a saved answer instead of
 * question 1.
 */
export type Answer = { posisi: number } | { posisi: number[] };

/** One answer the learner took and the server has not yet acknowledged. */
export type Entry = { presentedItemId: string; clientSeq: number; value: Answer };

export function sameAnswer(a: Answer | undefined, b: Answer): boolean {
  if (!a) return false;
  const norm = (x: Answer) => (Array.isArray((x as { posisi: number[] }).posisi)
    ? [...(x as { posisi: number[] }).posisi].sort((p, q) => p - q).join(",")
    : String((x as { posisi: number }).posisi));
  return norm(a) === norm(b);
}

/**
 * The choices on screen that are not the learner's latest taken answer: the
 * newest one still held in the outbox, else the one the server accepted. These
 * are what «Kumpulkan» takes before it finishes, in paper order.
 */
export function belumDisimpan(
  urutan: string[],
  pilihan: Record<string, Answer>,
  diterima: Record<string, Answer>,
  tertahan: Entry[],
): { presentedItemId: string; value: Answer }[] {
  const terbaru = new Map<string, Entry>();
  for (const e of tertahan) {
    const ada = terbaru.get(e.presentedItemId);
    if (!ada || e.clientSeq > ada.clientSeq) terbaru.set(e.presentedItemId, e);
  }
  const out: { presentedItemId: string; value: Answer }[] = [];
  for (const id of urutan) {
    const v = pilihan[id];
    if (!v) continue;
    const diambil = terbaru.get(id)?.value ?? diterima[id];
    if (!sameAnswer(diambil, v)) out.push({ presentedItemId: id, value: v });
  }
  return out;
}

/** Where an opened (or reopened) test starts: the first question without a saved answer; the last when every one has one. */
export function soalAwal(urutan: string[], diterima: Record<string, Answer>): number {
  const i = urutan.findIndex((id) => !diterima[id]);
  return i >= 0 ? i : Math.max(0, urutan.length - 1);
}

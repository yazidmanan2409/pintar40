"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { sekolahDari, wajibDalamKonteks } from "@/lib/konteks-server";
import { siklus } from "@/lib/umpanbalik";
import { sebabBuka, sebabTutup, type SebabBuka, type SebabTutup } from "@/lib/umpanbalik-kontrak";

/**
 * MANAGEMENT ENDS COLLECTION FOR ONE ROUND.
 *
 * ═══ WHAT THIS FUNCTION DELIBERATELY NEVER LEARNS ═══
 *
 * `close_feedback_cycle` returns the state the round became. THIS DISCARDS IT.
 *
 * That is not tidiness. The endpoint decides PUBLISHED or WITHHELD by counting
 * consumed opportunities against the threshold version the cycle bound, and it
 * does that inside one transaction with the number never leaving it. A client
 * that read the returned state would have learned something real about how many
 * people answered — not the count, but which side of it the round fell on, which
 * is the same information a threshold exists to withhold and is exactly what
 * "below the anonymity floor" means.
 *
 * So this returns a REASON about the request and nothing about the result. What
 * the round became is then discovered the way it is discovered at any other
 * moment: the page re-renders and asks `feedback_result`, which is the one path
 * from a cycle to a number and the one place that decides whether this reader
 * may have it. The client therefore cannot compute the outcome, because it never
 * holds the inputs — and could not be made to without changing this file.
 *
 * ═══ NOTHING HERE IS AUTHORIZATION ═══
 *
 * `close_feedback_cycle` asks, in the database and from the caller's own
 * session: is this person Management over that class, are they not its subject,
 * and is the round still open. All three are re-asked on every call. This file
 * adds no check of its own and could not usefully add one — a surface that
 * decided it first would be a surface that could get it wrong in the permissive
 * direction.
 *
 * ═══ AND AN UNCERTAIN PRESS IS RESOLVED BY LOOKING ═══
 *
 * Closing is terminal, so a lost acknowledgement is the worst moment to guess.
 * When the outcome is not one WP7B named, this re-reads the round itself: a
 * state that is no longer OPEN means the close committed whatever the browser
 * saw, and a state that is still OPEN means it did not. Only when that read
 * cannot be made at all does the reader get "nothing is known", and then they
 * are pointed at the page rather than at the button. There is no retry here, no
 * request token and no client-side idempotency: WP7B's own `state <> 'OPEN'`
 * refusal is the only exactly-once mechanism, and a second one could only
 * disagree with it.
 *
 * The one thing asked before the call is not authorization either: §2.11 (D-132(k)), the round's school is the active
 * context's, or the act is not taken in this context. It narrows; it never permits.
 */
export async function tutupPutaranAksi(siklusId: string): Promise<SebabTutup> {
  await wajibDalamKonteks({ sekolah: await sekolahDari("siklus", siklusId) });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const c = (await supabaseServer()) as any;
  // The return value is not destructured, not inspected and not returned. The
  // only thing taken from this call is whether it raised.
  const { error } = await c.rpc("close_feedback_cycle", { p_cycle: siklusId });
  if (!error) return "tertutup";

  const sebab = sebabTutup(error.message);
  if (sebab !== "tak_pasti") return sebab;
  return await pastikan(siklusId);
}

/**
 * Where the round actually stands, for a press whose fate is unknown. Reads the
 * cycle's own row under the policy that already governs it — no count, no
 * threshold, no responses, and no opportunity row.
 */
async function pastikan(siklusId: string): Promise<SebabTutup> {
  const kini = await siklus(siklusId);
  // The row is gone or unreadable: that is not evidence either way.
  if (!kini) return "tak_pasti";
  return kini.keadaan === "OPEN" ? "belum_tertutup" : "sudah_tertutup";
}

/**
 * MANAGEMENT ASKS A CLASS ABOUT ONE OF ITS TEACHERS.
 *
 * ═══ DISCOVERY GOT US A NAME; IT GOT US NOTHING ELSE ═══
 *
 * The educator this is called with came from `feedback_subjects_for_class`,
 * which reads the same subject rule this endpoint enforces — but ADR-0023
 * §Decision 3 is explicit that the list is ADVISORY. No token travels from the
 * read to the write, nothing is cached, and this function asserts nothing about
 * the subject on its way past. `open_feedback_cycle` re-authorizes the caller
 * and re-validates the educator, the class, its period, its activity and its
 * academic context on every single call, and it is allowed to refuse something
 * it listed a moment ago. That is the contract working.
 *
 * So each refusal gets its own sentence: an assignment that ended, authority
 * withdrawn, a colleague who opened the round first, a class reached by
 * professional-development material. None of them is worked around. The
 * surface does not look for a different class, does not infer context of its
 * own, does not retry, and never reports a refusal as a success.
 *
 * ═══ AND THE NEW CYCLE'S ID IS DISCARDED ═══
 *
 * `open_feedback_cycle` returns it. This returns a reason instead, and the page
 * re-reads its own rounds — the same discipline the close path uses, for the
 * same reason: what exists afterwards is the database's account of it, not a
 * value this call happened to carry back.
 */
export async function bukaPutaranAksi(
  kelas: string,
  subjek: string,
): Promise<SebabBuka> {
  // §2.11 (D-132(k)): the class's school is the active context's; a narrowing, the database still decides
  await wajibDalamKonteks({ sekolah: await sekolahDari("simpul", kelas) });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const c = (await supabaseServer()) as any;
  const { error } = await c.rpc("open_feedback_cycle", {
    p_node: kelas,
    p_subject_person_id: subjek,
  });
  if (!error) return "dibuka";
  return sebabBuka(error.message);
}

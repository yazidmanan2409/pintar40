"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { siklusSaya } from "@/lib/umpanbalik";
import { sebabKirim, type Jawaban, type SebabKirim } from "@/lib/umpanbalik-kontrak";

/**
 * SENDING ONE ANONYMOUS SHEET, AND FINDING OUT WHAT HAPPENED TO IT.
 *
 * ═══ THE ENDPOINT IS THE ONLY IDEMPOTENCY MECHANISM ═══
 *
 * §7 forbids the frontend inventing its own. It does not have one: there is no
 * request id here, no client-generated token, no "have I sent this already"
 * flag kept beside the database's, and no retry loop. Exactly-once belongs to
 * WP7B and is enforced where it can actually be enforced — `update … where not
 * consumed` takes the row lock, so a retry after a lost acknowledgement, a
 * double press and a second tab committing concurrently all match zero rows and
 * are refused by name. A second mechanism here could only ever disagree with
 * that one.
 *
 * ═══ AND AN UNCERTAIN PRESS IS RESOLVED BY LOOKING, NOT BY GUESSING ═══
 *
 * A call can succeed at the database and still lose its answer on the way back:
 * a dropped tunnel, a slept laptop, a proxy timeout. The learner must not be
 * told to send again blindly — so when the outcome is not one WP7B named, this
 * re-reads the learner's OWN durable state and lets it decide.
 *
 * That read is authoritative because of how WP7B writes. The eligibility flip
 * and the answers commit in ONE transaction, so `already_answered` afterwards
 * is the same fact as "the answers are stored": there is no window in which one
 * is true and the other is not. Which gives four honest answers instead of one
 * vague one — it landed, it did not land and may be sent again, the round has
 * closed, or the database could not be reached at all and the learner is
 * pointed at the page rather than at the button.
 *
 * ═══ WHAT THIS FILE NEVER DOES ═══
 *
 * It writes no audit row — `submit_feedback` deliberately writes none, because
 * an audit row here would be the respondent standing next to their answers, and
 * one added at this layer would be exactly the same row. It reads no response.
 * It counts nothing. And it returns a reason rather than a sentence, so the
 * words stay in the copy table where every other sentence in PINTAR lives.
 */
export async function kirimUmpanBalikAksi(
  siklus: string,
  jawaban: Jawaban,
): Promise<SebabKirim> {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const c = (await supabaseServer()) as any;
  const { error } = await c.rpc("submit_feedback", { p_cycle: siklus, p_answers: jawaban });
  if (!error) return "tercatat";

  const sebab = sebabKirim(error.message);
  // WP7B named this outcome, so it is already the truth and needs no second
  // opinion. Only the unrecognised case is worth a round trip.
  if (sebab !== "tak_pasti") return sebab;
  return await pastikan(siklus);
}

/**
 * Where the learner's own state actually stands, for a press whose fate is
 * unknown. Never consults a response, a count or anybody else's row:
 * `my_feedback_cycles` takes no person, because the person is the session.
 */
async function pastikan(siklus: string): Promise<SebabKirim> {
  const daftar = await siklusSaya();
  if (daftar === null) return "tak_pasti";
  const ini = daftar.find((s) => s.id === siklus);
  // Gone from the learner's own open cycles: the round closed. That is the
  // calmest true statement available, and it is the same one they would get by
  // opening the page again.
  if (!ini) return "tutup";
  return ini.sudahDijawab ? "sudah" : "belum_terkirim";
}

/**
 * The learner's own state for one cycle, asked for directly. The form uses it
 * on mount-free recovery paths — reopening after an interruption — so a page
 * that was left open does not offer to send a sheet that has already been sent.
 */
export async function keadaanSaya(siklus: string): Promise<SebabKirim> {
  return await pastikan(siklus);
}

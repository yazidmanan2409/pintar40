"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { sekolahDari, wajibDalamKonteks } from "@/lib/konteks-server";

/**
 * THE ONE WRITE THE MANAGEMENT SURFACE MAKES.
 *
 * It calls `advance_management_decision` and does nothing else. Every rule about
 * the move lives in that function: who may make it (a Management role standing
 * over the decision's node), which transitions exist, that DECIDED carries an
 * outcome and no other state does, and that the audit row and the state change
 * are written in the same transaction. This action validates the SHAPE of what
 * the form sent and then gets out of the way.
 *
 * WHY THE VALUES ARE CHECKED AGAINST A LIST HERE TOO. A server action is
 * reachable by a caller that never rendered the form, so the state and the
 * outcome are untrusted strings however they were drawn. The check is not a
 * second authorization — the database would refuse an unknown enum value with
 * an error either way — it is so a bad request comes back as the surface's own
 * "not recorded, try once more" rather than as an unhandled Postgres error page.
 * Nothing here decides WHETHER the move is allowed.
 *
 * NO AUTOMATIC ANYTHING. There is no rule in this file that advances a decision
 * on a threshold, a schedule or a count, because there is no such rule anywhere:
 * `advance_management_decision`'s own comment is that "a state change here is
 * always a person", and this action exists to be the person's hand.
 */

const KEADAAN = new Set(["UNDER_REVIEW", "DECIDED"]);
const HASIL = new Set(["NO_FURTHER_ACTION", "LEARNER_SUPPORT_ARRANGED", "ESCALATED_TO_INSTITUTION"]);

export async function putuskanAksi(formData: FormData): Promise<void> {
  const id = String(formData.get("keputusan") ?? "").trim();
  const ke = String(formData.get("ke") ?? "").trim();
  const catatan = String(formData.get("catatan") ?? "").trim();
  const hasilRaw = String(formData.get("hasil") ?? "").trim();

  // DECIDED carries an outcome and no other state carries one — the same
  // constraint the table itself declares, so a malformed submission is refused
  // before it becomes a failed round trip.
  const hasil = ke === "DECIDED" ? hasilRaw : "";
  const bentukBenar =
    id.length > 0 && KEADAAN.has(ke) && (ke !== "DECIDED" || HASIL.has(hasil));

  // DAISY-18: the answer names the card it belongs to, which the reader sent
  const kartu = `keputusan=${encodeURIComponent(id)}`;
  if (!bentukBenar) redirect(`/pimpinan?galat=1&${kartu}`);
  // §2.11 (D-132(k)): a decision of the active context's school only; a narrowing, the database still decides
  await wajibDalamKonteks({ sekolah: await sekolahDari("keputusan", id) });

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("advance_management_decision", {
    p_decision: id,
    p_to: ke,
    p_outcome: ke === "DECIDED" ? hasil : null,
    p_note: catatan.length > 0 ? catatan : null,
  });

  // ONE FAILURE FOR EVERY REFUSAL. A decision in the next department, a decision
  // that is already decided and a uuid that is nobody all come back the same
  // way, because telling them apart would answer questions about decisions this
  // reader is not entitled to know exist.
  if (error) redirect(`/pimpinan?galat=1&${kartu}`);

  revalidatePath("/pimpinan");
  redirect(`/pimpinan?hasil=ok&${kartu}`);
}

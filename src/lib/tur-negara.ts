import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { peranAktif, type HibahPeran, type Keadaan, type TurKey } from "@/lib/tur";

/**
 * THE TOUR'S DURABLE STATE — read and written only through Bob's contract.
 *
 * WHOSE STATE IT IS. None of the four functions takes a person: the person is
 * the session, and there is no parameter to pass an identity through. That is
 * what makes a shared classroom tablet safe — the next child to sign in is a
 * different session, so they get their own first tour, and nothing about the
 * previous child can reach them. It is also why none of this may live in
 * `localStorage`, a cookie or `sessionStorage`: every one of those belongs to
 * the DEVICE, and a device-scoped answer to "has this person seen the tour" is
 * wrong on exactly the machine PINTAR is most used on.
 *
 * Ephemeral view state — which step is on screen, whether the card is open —
 * stays in the client component where it belongs. It never becomes the durable
 * answer to whether the tour should be presented.
 *
 * WHAT IS NOT HERE. `current_tour_version` is deliberately internal to the
 * database and is not called: the version a person is being measured against
 * comes back inside `my_tour_state`, and a surface that resolved it separately
 * could disagree with the row it is about to write.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

async function db(): Promise<any> {
  return (await supabaseServer()) as unknown as any;
}

/**
 * The person's state for one tour. `null` when the tour is not declared, when
 * there is no person in the session, or when the read fails — and every caller
 * treats null as "do not present", so a failure is quiet rather than a tour
 * that appears when it should not.
 */
export async function keadaanTur(kunci: TurKey): Promise<Keadaan | null> {
  const c = await db();
  const { data, error } = await c.rpc("my_tour_state", { p_tour_key: kunci });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? (row as Keadaan) : null;
}

/**
 * Record one AUTOMATIC presentation. Called at the moment the tour actually
 * opens by itself, never when it is replayed from Help — replay is deliberate
 * assistance and must not spend an automatic presentation or push the person
 * toward the cap.
 */
export async function catatTampil(kunci: TurKey): Promise<void> {
  const c = await db();
  await c.rpc("note_tour_presented", { p_tour_key: kunci });
}

/** The person reached the end. Stops automatic presentation; replay remains. */
export async function selesaikanTur(kunci: TurKey): Promise<void> {
  const c = await db();
  await c.rpc("complete_tour", { p_tour_key: kunci });
}

/**
 * The person ticked "don't show this tour again". Stops AUTOMATIC presentation
 * only: Help still offers it, because suppression is a decision about being
 * interrupted, not a decision to lose the map. The contract has no reset verb
 * and this layer adds none.
 */
export async function bungkamTur(kunci: TurKey): Promise<void> {
  const c = await db();
  await c.rpc("suppress_tour", { p_tour_key: kunci });
}

/**
 * The roles this person holds right now, for the seniority rule in §H-3.
 *
 * It asks for roles and nothing else. The answer decides which MAP somebody is
 * shown; it decides nothing about what they may do, and it could not — every
 * action on every page is authorized again in the database from the caller's
 * own session, and a tour that skipped the check would still be looking at a
 * page that refuses.
 *
 * An empty list on failure, which means no tour: the map is the thing PINTAR
 * declines to guess at.
 */
export async function peranSaya(): Promise<string[]> {
  const c = await db();
  const { data: aku } = await c.rpc("current_person_id");
  if (!aku) return [];
  const { data, error } = await c
    .from("role_assignments")
    .select("role, valid_from, valid_until, revoked_at")
    .eq("person_id", aku);
  if (error) return [];
  return peranAktif((data ?? []) as HibahPeran[], new Date());
}

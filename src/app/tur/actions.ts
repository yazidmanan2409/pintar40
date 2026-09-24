"use server";

import { TUR_BELAJAR, TUR_PENGAJAR, type TurKey } from "@/lib/tur";
import * as negara from "@/lib/tur-negara";

/**
 * THE TOUR'S THREE COMMITMENTS — and there are exactly three, because the
 * backend contract declares exactly three verbs a client may call.
 *
 * WHAT THESE ARE NOT. None of them is authorization and none of them is
 * evidence. They write one row of presentation state about the person in the
 * session: how many times a tour opened by itself, whether they reached the
 * end, whether they asked not to be interrupted again. Nothing here can be
 * read by a report, a certificate or a learning record, and nothing here takes
 * a person — the person is the session (INV-08), which is what makes a shared
 * classroom tablet safe.
 *
 * WHY A SERVER ACTION AND NOT A ROUTE. The tour is a client dialog: it has to
 * be, because it measures a target on screen and traps focus. A client cannot
 * hold the session's Supabase client, so the three writes come back here. Each
 * one is a POST a signed-in person could call directly, so each one validates
 * its key against the two the backend actually declares rather than handing an
 * arbitrary string to the database.
 *
 * WHAT IS DELIBERATELY ABSENT.
 *   · No `revalidatePath`. These writes change nothing the page renders, and
 *     re-rendering the landing underneath an open dialog would move the target
 *     the spotlight is measuring. The tour closes on its own terms.
 *   · No redirect. A tour never navigates (§A).
 *   · No reset verb. The contract has none, and Help replay is not a reset:
 *     replay deliberately calls NOTHING here, because being helped on purpose
 *     must not spend an automatic presentation, un-finish a finished tour, or
 *     undo a person's decision not to be interrupted.
 */

/**
 * The only two tour identities that exist. An unknown key is dropped here
 * rather than passed on: `my_tour_state` would return nothing for it anyway,
 * but a write verb should never be reachable with a caller-chosen key.
 */
function kunciSah(kunci: string): TurKey | null {
  return kunci === TUR_BELAJAR || kunci === TUR_PENGAJAR ? kunci : null;
}

/**
 * One AUTOMATIC presentation happened. Called by the dialog at the moment it
 * opens by itself — never on replay, and never on an arrival that was held
 * back (a deep link, a running Quick Assessment), because an arrival that did
 * not show the tour has not spent one of the person's three.
 */
export async function catatTampilTur(kunci: string): Promise<void> {
  const k = kunciSah(kunci);
  if (k) await negara.catatTampil(k);
}

/** The person reached the end. Automatic presentation stops; Help still offers it. */
export async function selesaikanTurAksi(kunci: string): Promise<void> {
  const k = kunciSah(kunci);
  if (k) await negara.selesaikanTur(k);
}

/**
 * The person ticked "don't show this tour again". Automatic presentation
 * stops. This is a decision about being interrupted, not a decision to lose
 * the map — Help keeps offering the tour, and this action has no opposite.
 */
export async function bungkamTurAksi(kunci: string): Promise<void> {
  const k = kunciSah(kunci);
  if (k) await negara.bungkamTur(k);
}

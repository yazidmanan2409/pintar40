import type { DisplayRole } from "@/lib/auth";

/**
 * WHERE A PERSON LANDS WHEN NOTHING ELSE SAYS WHERE.
 *
 * Authentication answers "who", not "where". When the sign-in flow carries a
 * destination, that destination wins; when it does not — a first sign-in, a
 * link whose destination was refused by the L-1 narrowing, a fresh link asked
 * for after an expired one — the person still has to arrive somewhere, and it
 * should be the part of PINTAR their role actually uses.
 *
 * HOW THIS REACHES THE REDIRECT, AND WHY IT CHANGES NOTHING ABOUT L-1.
 * `tujuanInternal(raw, fallback)` already takes the fallback as a parameter.
 * So this is passed AS that fallback and the destination contract is untouched:
 * a valid internal destination still wins, an off-origin one is still refused,
 * and the only thing that changes is what a refusal falls back to. There is no
 * second narrowing here and no way for a role to widen what is accepted.
 *
 * IT IS NOT AUTHORIZATION, and cannot be. `displayRole` comes from
 * `my_profile`, is display-only by construction (FABLE-01 §4), and every route
 * it names re-checks the caller's authority in the database on arrival. Sending
 * somebody to a door does not open it: a person routed here to `/mengajar` who
 * holds no teaching grant sees an empty teaching context, exactly as they would
 * if they had typed the address.
 *
 * WHY THE SENIOR ROLES GO TO `/`. Entry-by-purpose is a real destination, not a
 * placeholder: a Head of Department or a Dean has no single home surface built
 * yet, and inventing a route for them here would be inventing a product
 * decision in a redirect. `/` asks the one question they actually have.
 */
export function berandaPeran(peran: DisplayRole): string {
  switch (peran) {
    case "STUDENT":
      return "/belajar";
    case "EDUCATOR":
      return "/mengajar";
    case "INSTITUTION_ADMIN":
    case "SYSTEM_ADMIN":
      return "/konfigurasi";
    // HEAD_OF_DEPARTMENT, DEAN and an unknown role: entry by purpose.
    default:
      return "/";
  }
}

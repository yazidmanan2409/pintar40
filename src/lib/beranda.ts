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
 * WP4 GAVE THE TWO MANAGEMENT ROLES A HOME, AND THIS LINE CHANGED WITH IT.
 * Until WP4 a Head of Department and a Dean went to `/`, because neither had a
 * home surface and inventing a route for them here would have been inventing a
 * product decision in a redirect. `/pimpinan` is now that surface, so the
 * redirect names it. Nothing else about the contract moved: this is still only
 * `tujuanInternal`'s fallback parameter, a carried destination still wins, and
 * `/pimpinan` re-decides on arrival through `management_scope_over_node` — so a
 * person who lands there without Management scope meets the one refusal page,
 * exactly as they would by typing the address.
 *
 * INSTITUTION_ADMIN AND SYSTEM_ADMIN ARE DELIBERATELY NOT SENT THERE. They
 * outrank both Management roles and hold no Management authority: WP2's
 * `management_scope_over_node` refuses them by name, so routing them to
 * `/pimpinan` would be routing them to a refusal. `/konfigurasi` is their
 * surface and it still is.
 */
export function berandaPeran(peran: DisplayRole): string {
  switch (peran) {
    case "STUDENT":
      return "/belajar";
    case "EDUCATOR":
      return "/mengajar";
    case "HEAD_OF_DEPARTMENT":
    case "DEAN":
      return "/pimpinan";
    case "INSTITUTION_ADMIN":
    case "SYSTEM_ADMIN":
      return "/konfigurasi";
    // An unknown role, and nobody at all: entry by purpose.
    default:
      return "/";
  }
}

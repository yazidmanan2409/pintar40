import "server-only";

/**
 * BOB-25: Gate 2E's deliverability proof, UJI_PENGIRIMAN. It is sent only to a
 * platform admin's chosen inbox (route: /api/email/uji), never to a user.
 *
 * Its email is DAISY-19's, in the PINTAR frame (src/components/email/uji.ts),
 * which makes it the M6 render (D-079: Bob owns the pipe, Daisy owns the
 * email). This module keeps the route's import where it was.
 */
export { templatUjiPengiriman } from "@/components/email/uji";

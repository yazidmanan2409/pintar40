/**
 * WHO IS SIGNED IN, AS THE PROXY ASKS IT ON EVERY REQUEST: Auth's own server decides (`getUser()`).
 *
 * The proxy skips the database's session check (`sesi_periksa`) for a session this server signed as PERSONAL
 * (`pribadiTersimpan`, src/lib/penjaga-sesi.ts). On such a computer, Auth's answer is what refuses a session that has
 * ended: a password replaced elsewhere (D-101(3), KREDENSIAL_DIGANTI), «Keluar semua», a revoked session. Auth's
 * server answers that the session is gone, and the proxy treats the request as signed out at once.
 *
 * W9.19 (6 Nov) replaced this with a local check of the token's signature (`getClaims()`). On staging that let an
 * ended PERSONAL session through until its token expired: the Golden School walk's GS-21 R2 and R3
 * (run 42195722895, main 4d325a33). The token still verified; Auth was no longer asked. The owner's ruling of 6 Nov
 * keeps session enforcement immediate, so the read goes back to Auth's server, as it was before W9.19. Held by
 * W919-CABUT-01: a token signed by the project's own published key, whose session Auth reports gone, is nobody.
 *
 * Only the fields the proxy reads are returned: the person's auth id and their address.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type PenggunaProksi = { id: string; email: string | undefined };

export async function penggunaTerverifikasi(supabase: Pick<SupabaseClient, "auth">): Promise<PenggunaProksi | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
}

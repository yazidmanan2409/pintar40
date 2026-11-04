import "server-only";
import { supabaseService } from "@/lib/supabase/service";

/**
 * R0-5 (W2.12, RV-8, one rule for every kind of lesson medium): the address a lesson's medium is offered at, or null
 * when the reader may not read it OR the file is not there. The player says an unavailable recording in words; a
 * PDF was still drawn as «Buka ringkasan» and opened the route's raw «not_found» answer when its file was missing.
 * The existence check runs only after the reader's own permission (`boleh`), so it tells nobody else anything; the
 * route asks both again when the file is fetched.
 */
export async function alamatMedia(path: string, boleh: boolean): Promise<string | null> {
  if (!boleh) return null;
  const { data, error } = await supabaseService().storage.from("assets").createSignedUrl(path, 60);
  if (error || !data) return null;
  return `/api/assets/read-url?path=${encodeURIComponent(path)}&alih=1`;
}

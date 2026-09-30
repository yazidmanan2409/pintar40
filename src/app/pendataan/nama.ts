import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { kumpulkanNama } from "@/components/pendataan/kumpulkanNama";
import type { NamaDicatat } from "@/components/pendataan/DaftarNama";

/**
 * D-077(3), DAISY-20: every name an intake will record, read before the one
 * approval, through BOB-26's `import_preview_names(p_job, p_after, p_limit)`:
 * `{ baris, nama, peran, baru }` for every row, under the same authority as
 * `import_preview` (the job's school admin). The paging and the all-or-nothing
 * rule are `kumpulkanNama`'s; this wires the read, in the caller's own session.
 * Writes nothing and holds nothing.
 */
export async function semuaNama(pekerjaan: string): Promise<NamaDicatat[] | null> {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const c = (await supabaseServer()) as any;
  return kumpulkanNama((setelah, batas) => c.rpc("import_preview_names", { p_job: pekerjaan, p_after: setelah, p_limit: batas }));
}

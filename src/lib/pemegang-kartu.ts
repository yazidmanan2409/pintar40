import type { SupabaseClient } from "@supabase/supabase-js";

export type PemegangKartuBaris = { person_id: string; display_name: string; institutional_id: string; card_last4: string };

/** The words of a search, made safe for PostgREST's quoted or-filter value (no quote, backslash or wildcard of the reader's own). */
export function kataAman(kata: string | string[] | undefined): string {
  const v = String((Array.isArray(kata) ? kata[0] : kata) ?? "");
  return v.replace(/["\\*%]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

/**
 * W2.10 (Batch 4; CR-49, CAP-10): at most twenty class-card holders whose name or PINTAR ID holds the words, from the
 * database's own list (card_holders: the schools the reader provisions people in, the card's last four digits only),
 * and, in a school's working context, only the learners enrolled at that school (as before). Nothing is read without
 * words; whether there is anyone at all is a count.
 */
export async function cariPemegangKartu(db: SupabaseClient, kata: string, sekolah: string | null): Promise<PemegangKartuBaris[]> {
  if (kata.length < 1) return [];
  const pola = `"*${kata}*"`;
  const { data } = await db.rpc("card_holders")
    .or(`display_name.ilike.${pola},institutional_id.ilike.${pola}`)
    .order("display_name").limit(sekolah ? 60 : 20);
  const baris = (Array.isArray(data) ? data : []) as Array<PemegangKartuBaris & { institution_id: string }>;
  if (!sekolah || baris.length === 0) return baris.slice(0, 20).map(tanpaSekolah);
  const { data: e } = await db.from("enrollments").select("person_id").eq("institution_id", sekolah)
    .in("person_id", baris.map((p) => p.person_id));
  const di = new Set(((e ?? []) as Array<{ person_id: string }>).map((x) => String(x.person_id)));
  return baris.filter((p) => di.has(p.person_id)).slice(0, 20).map(tanpaSekolah);
}

function tanpaSekolah(p: PemegangKartuBaris): PemegangKartuBaris {
  return { person_id: p.person_id, display_name: p.display_name, institutional_id: p.institutional_id, card_last4: p.card_last4 };
}

/** Whether the reader has any class-card holder in scope, counted, never listed. */
export async function adaPemegangKartu(db: SupabaseClient, sekolah: string | null): Promise<boolean> {
  const q = db.rpc("card_holders", {}, { count: "exact", head: true });
  const { count } = sekolah ? await q.eq("institution_id", sekolah) : await q;
  return (count ?? 0) > 0;
}

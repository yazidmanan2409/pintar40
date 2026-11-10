import { zonaSah, type ZonaSekolah } from "@/lib/hle";

/**
 * Sharon F1 (7a2c1751): the school's own time zone (WIB, WITA or WIT; institutions.zona_waktu, 20270112195000), for
 * the screens and actions that write a school's dates. WIB when the school is unknown or the read fails, as before.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function zonaSekolah(db: any, sekolah: string | null | undefined): Promise<ZonaSekolah> {
  if (!sekolah) return "Asia/Jakarta";
  const { data, error } = await db.from("institutions").select("zona_waktu").eq("id", sekolah).maybeSingle();
  return error || !data ? "Asia/Jakarta" : zonaSah(data.zona_waktu);
}

/**
 * The owner's ruling (10 Nov): a list that spans schools writes each row on its own school's clock. One read for every
 * school the rows name; the lookup answers WIB for a row with no school (written «WIB», so the convention is explicit)
 * or one the reader may not see.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function zonaSekolahBanyak(db: any, sekolah: Iterable<string | null | undefined>): Promise<(id: string | null | undefined) => ZonaSekolah> {
  const ids = [...new Set([...sekolah].filter((x): x is string => typeof x === "string" && x.length > 0))];
  const peta = new Map<string, ZonaSekolah>();
  if (ids.length > 0) {
    const { data, error } = await db.from("institutions").select("id, zona_waktu").in("id", ids);
    if (!error) for (const r of (data ?? []) as Array<{ id: string; zona_waktu: unknown }>) peta.set(r.id, zonaSah(r.zona_waktu));
  }
  return (id) => (id ? peta.get(id) ?? "Asia/Jakarta" : "Asia/Jakarta");
}

/**
 * The same, for rows that name a place (an org node: a class) rather than a school, such as a learner's open
 * assessments (my_open_assessments returns the class, not the school): the school of each place, then its zone.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function zonaSimpulBanyak(db: any, simpul: Iterable<string | null | undefined>): Promise<(id: string | null | undefined) => ZonaSekolah> {
  const ids = [...new Set([...simpul].filter((x): x is string => typeof x === "string" && x.length > 0))];
  const sekolahDari = new Map<string, string>();
  if (ids.length > 0) {
    const { data, error } = await db.from("org_nodes").select("id, institution_id").in("id", ids);
    if (!error) for (const r of (data ?? []) as Array<{ id: string; institution_id: string }>) sekolahDari.set(r.id, r.institution_id);
  }
  const zona = await zonaSekolahBanyak(db, sekolahDari.values());
  return (id) => zona(id ? sekolahDari.get(id) : null);
}

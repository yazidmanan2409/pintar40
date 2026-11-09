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

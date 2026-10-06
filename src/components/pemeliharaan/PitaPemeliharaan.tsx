import type { Locale } from "@/lib/hle";
import { statusSaya } from "@/lib/pemeliharaan";
import PengingatPemeliharaan from "./PengingatPemeliharaan";

/**
 * #148 (D-094(d)): the maintenance windows and notices that reach this reader, read once as the page begins and
 * handed to the browser, which times the warnings itself. Nothing for a reader nobody stops and nobody tells anything.
 */
export default async function PitaPemeliharaan({ locale }: { locale: Locale }) {
  const status = await statusSaya();
  if (!status.terhenti && status.pemeliharaan.length === 0 && status.pengumuman.length === 0) return null;
  return <PengingatPemeliharaan locale={locale} status={status} />;
}

/**
 * CONTOH LAPORAN (approved 7 Nov): A CLASS'S TARGET, AS ITS UJI PENGUASAAN SEALED IT, read one way for every report.
 * A report draws the target line only where there is one target to draw: every Uji Penguasaan given to the class
 * carries the same sealed mark (D-085 M3: the mark is the assignment's, copied unchanged into every attempt). Two
 * chapters with two marks, or none set, draw no line (null): a line that stood for only one of them would mislead.
 * Read with the reader's own client through target_kelas (O2), so a reader who may not read the class's figures gets no line either.
 */
export function satuTarget(tanda: ReadonlyArray<number | string | null | undefined>): number | null {
  const ada = tanda.filter((x) => x !== null && x !== undefined && x !== "").map(Number).filter((x) => Number.isFinite(x));
  if (ada.length === 0 || ada.length !== tanda.length) return null;
  return ada.every((x) => x === ada[0]) ? ada[0] : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the Supabase client, as pengajar.ts and pimpinan.ts type it
export async function targetKelasDari(c: any, nodeId: string): Promise<number | null> {
  // Owner ruling O2 (9 Nov): through target_kelas, which gives a reader of the class's figures (a Dekan and a Kepala
  // departemen within their scope included) each chapter's sealed Uji Penguasaan mark and nothing else, where reading
  // assessment_assignments directly gave them none
  const { data, error } = await c.rpc("target_kelas", { p_class: nodeId });
  if (error || !Array.isArray(data)) return null;
  return satuTarget((data as Array<{ pass_mark: number | string | null }>).map((r) => r.pass_mark));
}

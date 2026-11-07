/**
 * CONTOH LAPORAN (approved 7 Nov): A CLASS'S TARGET, AS ITS UJI PENGUASAAN SEALED IT, read one way for every report.
 * A report draws the target line only where there is one target to draw: every Uji Penguasaan given to the class
 * carries the same sealed mark (D-085 M3: the mark is the assignment's, copied unchanged into every attempt). Two
 * chapters with two marks, or none set, draw no line (null): a line that stood for only one of them would mislead.
 * Read with the reader's own client, so a reader who may not see the class's assignments gets no line either.
 */
export function satuTarget(tanda: ReadonlyArray<number | string | null | undefined>): number | null {
  const ada = tanda.filter((x) => x !== null && x !== undefined && x !== "").map(Number).filter((x) => Number.isFinite(x));
  if (ada.length === 0 || ada.length !== tanda.length) return null;
  return ada.every((x) => x === ada[0]) ? ada[0] : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the Supabase client, as pengajar.ts and pimpinan.ts type it
export async function targetKelasDari(c: any, nodeId: string): Promise<number | null> {
  const { data, error } = await c
    .from("assessment_assignments")
    .select("pass_mark, definition:assessment_definitions(mode)")
    .eq("node_id", nodeId)
    .in("status", ["OPEN", "CLOSED"]);
  if (error || !Array.isArray(data)) return null;
  const uji = (data as Array<{ pass_mark: number | string | null; definition: { mode: string } | null }>)
    .filter((r) => r.definition?.mode === "POST_TEST");
  return satuTarget(uji.map((r) => r.pass_mark));
}

/**
 * W1.5 (Batch 3; UX-01): the question check's waiting findings, one group per kind. Pure: TemuanKelompok draws these,
 * and STUDIO3B-TEMUAN-01 executes them.
 *
 * A finding's kind is its sentence: the database writes the same «masalah», «mengapa penting» and «cara memperbaiki»
 * for every finding of one pattern (run_mcq_quality, validate_course_content), and only «lokasi» differs. An
 * acknowledged finding is not waiting and is left out.
 */
export type Temuan = {
  id: string; severity: string; lokasi: string; masalah: string;
  mengapa_penting: string; cara_memperbaiki: string; acknowledged_at: string | null;
};
export type JenisTemuan = "MCQ_QUALITY" | "COACHING";

export type Kelompok = {
  jenis: JenisTemuan; severity: string; masalah: string; mengapa: string; cara: string; temuan: Temuan[];
};

/** The waiting findings as groups: one per kind and sentence, in the order each kind was first found. */
export function kelompokTemuan(daftar: ReadonlyArray<{ jenis: JenisTemuan; temuan: readonly Temuan[] }>): Kelompok[] {
  const peta = new Map<string, Kelompok>();
  for (const { jenis, temuan } of daftar) {
    for (const f of temuan) {
      if (f.acknowledged_at !== null) continue;
      const kunci = [jenis, f.severity, f.masalah, f.mengapa_penting, f.cara_memperbaiki].join("\u0000");
      const g = peta.get(kunci) ?? { jenis, severity: f.severity, masalah: f.masalah, mengapa: f.mengapa_penting, cara: f.cara_memperbaiki, temuan: [] };
      g.temuan.push(f);
      peta.set(kunci, g);
    }
  }
  return [...peta.values()];
}

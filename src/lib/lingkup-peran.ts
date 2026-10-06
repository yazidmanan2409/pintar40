/**
 * D-006 — WHERE A ROLE MAY BE GIVEN, AS THE SCREEN OFFERS IT.
 *
 * "Screens show only Bagian, Tingkat and Kelas. Role scopes: Admin sekolah and
 * Dekan at the school, Kepala departemen at a Bagian, Guru at a Kelas." Peran &
 * akses listed every place of the tree in alphabetical order, the hidden
 * «Jenjang» (FACULTY) and «Reguler» (PROGRAMME) included, each as "School ·
 * place", so the school itself came last and the first "SD …" entry was a
 * hidden level: a dean given «Dekan» there stood at «Jenjang» (audit S23d).
 *
 * Each school comes first by its own name, then its Bagian, Tingkat and Kelas,
 * each named after the school. No hidden level is offered. What a grant at any
 * place allows is unchanged: the database decides, as before.
 */
export type SimpulPeran = { id: string; institution_id: string; kind: string; name: string };
export type PilihanLingkup = { id: string; label: string };

const URUTAN: Record<string, number> = { INSTITUTION: 0, DEPARTMENT: 1, COHORT: 2, CLASS: 3 };

export function lingkupPeran(simpul: readonly SimpulPeran[], namaSekolah: ReadonlyMap<string, string>): PilihanLingkup[] {
  const sekolah = (n: SimpulPeran) => namaSekolah.get(n.institution_id) ?? "";
  return simpul
    .filter((n) => n.kind in URUTAN)
    .slice()
    .sort((a, b) =>
      sekolah(a).localeCompare(sekolah(b), "id", { numeric: true })
      || URUTAN[a.kind] - URUTAN[b.kind]
      || a.name.localeCompare(b.name, "id", { numeric: true }))
    .map((n) => ({ id: n.id, label: n.kind === "INSTITUTION" ? sekolah(n) || n.name : `${sekolah(n)} · ${n.name}` }));
}

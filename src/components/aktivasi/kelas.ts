/**
 * M7 (D-085) — WHOLE-CLASS CARD ISSUE: WHICH CLASS, AND HOW MANY IN IT.
 *
 * An administrator issues cards for a whole class in one operation. W2.10 (Batch 5; CR-49, D-153): the grouping is the
 * database's (kelas_menunggu_akun: per Kelas, its current members, an enrolment still PENDING or ACTIVE, who wait for
 * an account and may hold a card), so Aktivasi offers each Kelas with its count and never reads every waiting person
 * to build the offer. The class's own learners are read when its run starts (orang_kelas_menunggu_akun, by name).
 * Each card is still issued one person at a time through `/api/akun/aktivasi`, where the database decides and audits
 * per person: one press, one request per learner.
 */
export type KelasKartu = { id: string; label: string; jumlah: number };

/** One learner of a class's run, as orang_kelas_menunggu_akun answers. */
export type AnggotaKelas = { person_id: string; display_name: string; institutional_id: string };

/**
 * CR-91 (D-145(a)): a class card is a learner's alone. The waiting list says per person whether a card may be offered
 * (false for anyone holding a staff role, one that starts later included); anything but an explicit true is no card.
 * The database refuses the card regardless: this keeps the screen from offering what it would refuse.
 */
export function bolehKartu(o: { boleh_kartu?: boolean | null }): boolean {
  return o.boleh_kartu === true;
}

/**
 * The classes Aktivasi offers: each Kelas the database counted, labelled as the intake labels a place
 * (`pilihanTempat`), only a real Kelas with someone waiting, by label.
 */
export function kelasDitawarkan(
  hitungan: ReadonlyArray<{ node_id: string; jumlah: number }>,
  tempat: ReadonlyArray<{ id: string; label: string; level: string }>,
): KelasKartu[] {
  const kelas = new Map(tempat.filter((t) => t.level === "KELAS").map((t) => [t.id, t.label]));
  return hitungan
    .filter((h) => kelas.has(h.node_id) && h.jumlah > 0)
    .map((h) => ({ id: h.node_id, label: kelas.get(h.node_id)!, jumlah: h.jumlah }))
    .sort((a, b) => a.label.localeCompare(b.label, "id"));
}

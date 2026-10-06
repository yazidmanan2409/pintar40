/**
 * M7 (D-085) — WHOLE-CLASS CARD ISSUE: WHICH CLASS, AND WHO IN IT.
 *
 * An administrator issues cards for a whole class in one operation. The people
 * are exactly the ones Aktivasi already lists (`persons_awaiting_account`:
 * provisioned, no account yet); this only groups them by the Kelas they are a
 * member of, labelled as the intake labels a place (`pilihanTempat`). A person
 * in no class is not in any group and keeps their own row. Each card is still
 * issued one person at a time through `/api/akun/aktivasi`, where the database
 * decides and audits per person: one press, one request per learner.
 *
 * Pure and free of React, so a test drives exactly what the screen offers.
 */
export type KelasKartu = { id: string; label: string; orang: string[] };

/**
 * An enrolment still in the school: PENDING (provisioned, no account yet,
 * which is everyone this screen is for) or ACTIVE. An ENDED or CANCELLED one is
 * not a member to make a card for.
 */
export function masihTerdaftar(status: string | null | undefined): boolean {
  return status === "PENDING" || status === "ACTIVE";
}

export function kelasUntukKartu(
  menunggu: ReadonlyArray<{ person_id: string }>,
  keanggotaan: ReadonlyArray<{ person_id: string; node_id: string; status?: string | null }>,
  tempat: ReadonlyArray<{ id: string; label: string; level: string }>,
): KelasKartu[] {
  const kelas = new Map(tempat.filter((t) => t.level === "KELAS").map((t) => [t.id, t.label]));
  const tunggu = new Set(menunggu.map((m) => m.person_id));
  const per = new Map<string, Set<string>>();
  for (const k of keanggotaan) {
    if (!kelas.has(k.node_id) || !tunggu.has(k.person_id)) continue;
    if (k.status !== undefined && !masihTerdaftar(k.status)) continue;
    if (!per.has(k.node_id)) per.set(k.node_id, new Set());
    per.get(k.node_id)!.add(k.person_id);
  }
  // in the order Aktivasi lists the people, so the printed set reads like the screen
  const urut = menunggu.map((m) => m.person_id);
  return [...per.entries()]
    .map(([id, orang]) => ({ id, label: kelas.get(id)!, orang: urut.filter((p) => orang.has(p)) }))
    .filter((k) => k.orang.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "id"));
}

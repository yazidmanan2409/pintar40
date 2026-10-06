/**
 * WHICH OF THE READER'S SCOPES PIMPINAN OPENS ON (DAISY-07, HOD-09).
 *
 * A reader may stand over more than one node, and some of them can sit inside
 * others: a head of department who also teaches 5A holds the department and,
 * through the database's own confirmation, the class inside it. The page used
 * to open on the first by NAME, so "5A" came before "Matematika" and the head
 * of department's home was one class, with the department report -- the one
 * that lists every class -- a click away in the picker. CI found it on the
 * seed: a grant of 5A that F01-T04 revokes still names the node.
 *
 * So the default is the BROADEST scope: the first, in the given order, that
 * has no other of the reader's scopes above it on its path. A scope the reader
 * asked for by id still wins when it is one of theirs, and nothing outside
 * the list is ever chosen. A node without a path counts as broadest, which is
 * the old behaviour.
 *
 * Pure: the page passes lingkupPimpinan()'s list and ?lingkup=.
 */
export function lingkupAwal<T extends { id: string; jalur: readonly string[] }>(
  lingkup: readonly T[],
  diminta?: string,
): T | undefined {
  const pilihan = lingkup.find((n) => n.id === diminta);
  if (pilihan) return pilihan;
  const teratas = lingkup.filter((n) => !lingkup.some((m) => m.id !== n.id && n.jalur.includes(m.id)));
  return teratas[0] ?? lingkup[0];
}

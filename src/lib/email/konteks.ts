/**
 * D1 (DAISY-37 (2)): an email's context line, from the places its data carries. Every place once, alphabetically,
 * joined by «, » and the word for «and»; it names a place, never a role, so it states no authority (D-059). No place:
 * no line, and nothing in its stead. The roles' own order is the card's alone (urutKonteksKartu); this orders places.
 */
const urutanTempat = new Intl.Collator("id", { sensitivity: "base", numeric: true });

export function barisKonteks(tempat: ReadonlyArray<string | null>, kata: { awal: string; dan: string }): string | undefined {
  const daftar = [...new Set(tempat.filter((x): x is string => Boolean(x && x.trim())))].sort(urutanTempat.compare);
  if (daftar.length === 0) return undefined;
  const isi = daftar.length === 1 ? daftar[0] : `${daftar.slice(0, -1).join(", ")} ${kata.dan} ${daftar[daftar.length - 1]}`;
  return `${kata.awal} ${isi}.`;
}

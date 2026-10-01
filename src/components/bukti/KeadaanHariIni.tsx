import { t, format, type HleEvent, type Locale } from "@/lib/hle";

/** What a row needs of an assessment assignment: a subset of `Berjalan` (src/lib/pengajar.ts). */
export type AsesmenKelas = {
  id: string;
  judul: string;
  /** OPEN or CLOSED, as the assignment carries it. Never rendered as a word. */
  keadaan: string;
  mode: string;
  ditutup: string | null;
  mengumpulkan: number;
  /** W8: learners with a session of any state, so at least those who submitted. */
  mulai: number;
};

/**
 * W8: THREE STATES, NEVER TWO. «Belum mengerjakan» used to be everyone who had
 * not submitted, so a learner halfway through read as one who never started.
 * Submitted, started and not submitted, and not started are counted apart, and
 * the three add up to the class.
 */
export function hitungKeadaan(a: Pick<AsesmenKelas, "mengumpulkan" | "mulai">, murid: number) {
  const kumpul = Math.max(0, a.mengumpulkan);
  const mulai = Math.max(kumpul, a.mulai);
  return { kumpul, sedang: mulai - kumpul, belum: Math.max(0, murid - mulai) };
}

/** The cycle's order: the Pemetaan Awal before the Uji Penguasaan, then anything else. */
const URUT_MODE: Record<string, number> = { PRE_TEST: 0, POST_TEST: 1 };

/**
 * DAISY-26 (UX-06): WHICH TESTS "TODAY" IS ABOUT.
 *
 * Every test still open in the class, the one closing soonest first (the
 * Pemetaan Awal before the Uji Penguasaan when they close together, and one
 * that never closes last). When none is open, the one that closed most
 * recently. The page used to show one "focus" test, so with both tests of a
 * lesson open it counted the Pemetaan Awal and said nothing of the Uji
 * Penguasaan the same learners had also finished.
 */
export function keadaanHariIni<T extends AsesmenKelas>(asesmen: readonly T[]): T[] {
  const tutupnya = (a: T) => (a.ditutup ? Date.parse(a.ditutup) : Number.POSITIVE_INFINITY);
  const buka = asesmen
    .filter((a) => a.keadaan === "OPEN")
    .sort((a, b) =>
      tutupnya(a) - tutupnya(b)
      || (URUT_MODE[a.mode] ?? 9) - (URUT_MODE[b.mode] ?? 9)
      || a.judul.localeCompare(b.judul));
  if (buka.length > 0) return buka;
  const selesai = asesmen
    .filter((a) => a.keadaan !== "OPEN" && a.ditutup)
    .sort((a, b) => tutupnya(b) - tutupnya(a));
  return selesai.slice(0, 1);
}

/**
 * «Keadaan hari ini» on «Lihat bukti»: one block per test, each with its own
 * name and its own counts. Counts, never a judgment of anybody.
 */
export default function KeadaanHariIni({
  asesmen,
  murid,
  locale,
}: {
  asesmen: readonly AsesmenKelas[];
  /** Learners in the class. */
  murid: number;
  locale: Locale;
}) {
  const s = (k: HleEvent) => t(k, "educator", { locale });
  const n = (x: number) => format.number(x, locale);
  const tampil = keadaanHariIni(asesmen);
  if (tampil.length === 0) return <p className="pin-empty">{s("mengajar.bukti.kosong")}</p>;
  return (
    <div className="pin-keadaan">
      {tampil.map((a) => ({ a, k: hitungKeadaan(a, murid) })).map(({ a, k }) => (
        <div className="pin-keadaan-baris" key={a.id}>
          <p className="pin-keadaan-judul">{a.judul}</p>
          <dl className="pin-facts">
            <div>
              <dt>{s("mengajar.bukti.kumpul")}</dt>
              <dd className="pin-num">
                {n(k.kumpul)} / {n(murid)}
              </dd>
            </div>
            <div>
              <dt>{s("mengajar.bukti.jendela")}</dt>
              <dd>{a.ditutup ? format.date(a.ditutup, locale) : "—"}</dd>
            </div>
            <div>
              <dt>{s("mengajar.bukti.mulai")}</dt>
              <dd className="pin-num">
                {n(k.sedang)}
                <small>{s("mengajar.bukti.murid")}</small>
              </dd>
            </div>
            <div>
              <dt>{s("mengajar.bukti.belum")}</dt>
              <dd className="pin-num">
                {n(k.belum)}
                <small>{s("mengajar.bukti.murid")}</small>
              </dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}

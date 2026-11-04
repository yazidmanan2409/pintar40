import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import type { Envelope } from "./types";
import { kunciMuncul, SYARAT_METRIK } from "./muncul";
import type { JenisAnggota } from "@/lib/mengajar";

/**
 * KartuKetiadaan — the absence card, in four variants.
 *
 * S-2: "we looked and there is not enough yet" and "this is not for you" are
 * DIFFERENT SENTENCES, because they are different facts about the world. The
 * database already distinguishes them; a card that flattened them into "no
 * data" would be the surface undoing the work the evaluator did.
 *
 *   belum_cukup      the measurement ran and the sample is short — and it says
 *                    how short, because a reader who knows it needs five of
 *                    five and has three can act on that
 *   tidak_untuk_anda NO LABEL. Naming the metric would tell a reader exactly
 *                    what is being withheld from them, which is the leak the
 *                    refusal exists to prevent (it is why this variant renders
 *                    without a heading rather than with a greyed one)
 *   diganti          the figure was superseded by a newer measure
 *   menunggu         it is being calculated; come back
 *
 * The variant is DERIVED from the envelope's status, never passed in, so a
 * surface cannot choose a gentler sentence than the fact deserves.
 *
 * DAISY-07: A FIGURE SHORT OF EVIDENCE ALSO SAYS WHAT WILL MAKE IT APPEAR --
 * "setelah cukup murid menyelesaikan Cek penguasaan" -- from the evidence its
 * calculator counts (./muncul.ts). Only then: a refusal, a retired measure or
 * an uncomputable figure is not waiting on students.
 */
export type Variant = "belum_cukup" | "tidak_untuk_anda" | "diganti" | "menunggu";

export function variantOf(entry: Envelope): Variant {
  switch (entry.status) {
    case "below_minimum": return "belum_cukup";
    case "not_permitted": return "tidak_untuk_anda";
    case "deprecated": return "diganti";
    default: return "menunggu";
  }
}

const STATEMENT: Record<Variant, string> = {
  belum_cukup: "laporan.metrik.belum_cukup_data",
  tidak_untuk_anda: "laporan.metrik.bukan_untuk_anda",
  diganti: "laporan.metrik.diganti",
  menunggu: "laporan.metrik.tidak_dikenal",
};

/**
 * CR-46 (W3.2, Daisy's EmptyState «not enough yet»): never «(3/5)», a pair of figures that reads as a score. Where
 * the evidence counted is students, the sentence says so: «Sekarang 3 murid; perlu 5.» Elsewhere the unit is not
 * known here, so no count is shown (null); the line after it says what will make the figure appear. W3.9 (RV-9):
 * the two report pages say it the same way, from here.
 */
export function kalimatJumlah(entry: Envelope, locale: Locale = "id", persona: "educator" | "staff" = "educator", jenis: JenisAnggota = "LEARNER"): string | null {
  const syarat = entry.metric_id ? SYARAT_METRIK[entry.metric_id] : undefined;
  const hitungMurid = syarat === "penilaian" || syarat === "akhir" || syarat === "awal_akhir";
  if (variantOf(entry) !== "belum_cukup" || entry.needed == null || !hitungMurid) {
    return null;
  }
  return kalimatJumlahOrang(entry.have ?? 0, entry.needed, jenis, locale, persona);
}

/**
 * E-A3-1 (D-168): THE ONE «how far» SENTENCE, for every surface that counts people towards a threshold. It names the
 * place's people by the place's kind (DAISY-33): «murid» in an academic class, «peserta» in a professional-learning
 * one. A surface never writes the sentence itself.
 */
export function kalimatJumlahOrang(have: number, needed: number, jenis: JenisAnggota, locale: Locale = "id", persona: "educator" | "staff" = "educator"): string {
  return t(jenis === "PARTICIPANT" ? "ketiadaan.jumlah.peserta" : "ketiadaan.jumlah.murid", persona, { locale })
    .replace("{have}", format.number(have, locale))
    .replace("{needed}", format.number(needed, locale));
}

export default function KartuKetiadaan({
  entry,
  action,
  locale = "id",
  persona = "educator",
  jenis = "LEARNER",
}: {
  entry: Envelope;
  /** Optional: what to do while the figure is absent. */
  action?: string;
  locale?: Locale;
  persona?: "educator" | "staff";
  /** the place's kind: its people are «murid» or «peserta» (DAISY-33) */
  jenis?: JenisAnggota;
}) {
  const s = (k: string) => t(k as HleEvent, persona, { locale });
  const variant = variantOf(entry);
  // The envelope's own statement key wins when it carries one: the evaluator
  // knows more about why this particular figure is missing than a variant map.
  const base = s(entry.statement_key ?? STATEMENT[variant]);
  const muncul = kunciMuncul(entry);
  const jumlah = kalimatJumlah(entry, locale, persona, jenis);

  return (
    <div className="pin-metric">
      {/* No heading for `tidak_untuk_anda`: see the note above. */}
      {variant !== "tidak_untuk_anda" && entry.label_key ? (
        <span className="pin-ml">{s(entry.label_key)}</span>
      ) : null}
      <span className="pin-abs">{base}</span>
      {jumlah ? <span className="pin-ma">{jumlah}</span> : null}
      {muncul ? <span className="pin-ma">{s(muncul)}</span> : null}
      {action ? <span className="pin-ma">{action}</span> : null}
    </div>
  );
}

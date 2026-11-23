import { t, type Locale } from "@/lib/hle";
import type { ReadingMapCard } from "@/lib/assessment-engine/types";
import { TeksBaris } from "@/components/teks/Teks";

/**
 * THE READING MAP. One card per competency, in the order the database ranked
 * them, each carrying WHY THIS LEARNER is being sent there.
 *
 * `alasan` is the sentence that makes a reading map feel personal rather than
 * generated, and it comes from the engine — the frontend adds no reason of its
 * own and no recommendation the database did not make.
 *
 * THE TIER ENUM NEVER REACHES THE SCREEN. PERLU_SEGERA / WAJIB / DISARANKAN /
 * KUAT render through the existing `map.tier.*` copy keys, which is also what
 * F06-S03 asserts from the other side.
 *
 * Only the first card is drawn heavier, and only when it is one the learner
 * still has to read: "start here" is a single instruction, and marking three
 * cards urgent is the same as marking none.
 *
 * K-02 (ruling 78; Daisy, SAPU-KATA-RULING-78 §a): A KUAT CARD HAS NO WRONG
 * ANSWER TO EXPLAIN, so the engine's reading map fills its reason with the objective's own
 * statement and the card used to print it twice. Its reason slot says what the
 * mark means instead (`map.kuat.arti`), and the map says once, under its cards,
 * that the marks are an order of reading, not a score (`map.tingkat.arti`).
 */
const TIER_KEY = {
  PERLU_SEGERA: "map.tier.PERLU_SEGERA",
  WAJIB: "map.tier.WAJIB",
  DISARANKAN: "map.tier.DISARANKAN",
  KUAT: "map.tier.KUAT",
} as const;

export default function PetaBacaan({ kartu, locale }: { kartu: readonly ReadingMapCard[]; locale: Locale }) {
  if (kartu.length === 0) return null;
  const mulai = kartu.findIndex((k) => k.tingkat !== "KUAT");
  return (
    <div className="pin-peta">
      {kartu.map((k, i) => (
        <div key={`${k.kode}-${k.peringkat}`} className={`pin-kartu${i === mulai ? " pin-now" : ""}`}>
          <span className="pin-tier">{t(TIER_KEY[k.tingkat], "learner", { locale })}</span>
          <span className="pin-claim"><TeksBaris teks={k.pernyataan} /></span>
          <span className="pin-why">
            {k.tingkat === "KUAT" ? t("map.kuat.arti", "learner", { locale }) : <TeksBaris teks={k.alasan} />}
          </span>
        </div>
      ))}
      <p className="pin-meta pin-peta-arti" data-peta-arti="">{t("map.tingkat.arti", "learner", { locale })}</p>
    </div>
  );
}

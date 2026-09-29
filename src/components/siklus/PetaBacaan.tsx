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
          <span className="pin-why"><TeksBaris teks={k.alasan} /></span>
        </div>
      ))}
    </div>
  );
}

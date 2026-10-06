"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";
import { KUNCI_BUKA, sudahAdaPutaran, type SebabBuka } from "@/lib/umpanbalik-kontrak";
import type { SubjekKelas } from "@/lib/umpanbalik";

/**
 * THE EDUCATORS THIS CLASS MAY BE ASKED ABOUT, AND ONE BUTTON EACH.
 *
 * ═══ A LIST OF NAMES IS NOT A LIST OF PERMISSIONS ═══
 *
 * Every row here came from `feedback_subjects_for_class`, which reads the same
 * rule `open_feedback_cycle` enforces — and the list is still only a
 * description of a moment. An assignment can end between the read and the
 * press; authority can be withdrawn; a colleague can open the round first. This
 * component carries no token from one to the other and decides nothing: it
 * sends the class and the person, and renders whatever the endpoint answers.
 *
 * Which is why the outcomes are SPECIFIC. "That educator is no longer recorded
 * as teaching this class" is a different thing to be told than "this class is
 * not yours", and an operator who was just offered a name deserves to know
 * which of those happened rather than being shown a shrug.
 *
 * ═══ NOTHING HERE COUNTS ANYTHING ═══
 *
 * No participation, no responses, no threshold, no progress — not in the props,
 * not in the copy, not after a round starts. Opening a round must not become a
 * place to watch one fill up, and the surest way for this component not to show
 * a number is for one never to reach it.
 *
 * ═══ AND IT OFFERS NOTHING A ROUND IS NOT ═══
 *
 * One act per educator, and once a round exists the row says so and offers no
 * more. There is no reopen, no reset, no republish and no second start.
 */
export default function MulaiPutaran({
  kelas,
  subjek,
  buka,
  locale = "id",
}: {
  kelas: string;
  subjek: SubjekKelas[];
  buka: (kelas: string, subjek: string) => Promise<SebabBuka>;
  locale?: Locale;
}) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  const router = useRouter();
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [hasil, setHasil] = useState<Record<string, SebabBuka>>({});

  async function mulai(orang: string) {
    if (sibuk) return;
    setSibuk(orang);
    try {
      const sebab = await buka(kelas, orang);
      setHasil((lama) => ({ ...lama, [orang]: sebab }));
      // The rounds this class holds are the server's to list, and one of them
      // may have just come into existence. Nothing is drawn from the call's
      // own answer beyond the sentence it earned.
      if (sudahAdaPutaran(sebab)) router.refresh();
    } finally {
      setSibuk(null);
    }
  }

  if (subjek.length === 0) {
    return <p className="pin-empty">{s("umpanbalik.buka.kosong")}</p>;
  }

  return (
    <div className="pin-ub-subjek">
      <p className="pin-mm">{s("umpanbalik.buka.sub")}</p>
      <ul className="pin-list pin-ub-orang">
        {subjek.map((o) => {
          const sebab = hasil[o.id];
          const selesai = sebab !== undefined && sudahAdaPutaran(sebab);
          return (
            <li key={o.id}>
              <span className="pin-ml">{o.nama}</span>
              {sebab ? (
                <BarisHasil nada={selesai ? "netral" : "gagal"}>{s(KUNCI_BUKA[sebab])}</BarisHasil>
              ) : null}
              {/* Once this class has been asked about this educator, there is
                  nothing further to offer for them — and a second start is not
                  a thing this product has. */}
              {selesai ? null : (
                <span className="pin-ub-aksi">
                  <button
                    type="button"
                    className="pin-btn pin-ub-btn"
                    onClick={() => mulai(o.id)}
                    disabled={sibuk !== null}
                  >
                    {sibuk === o.id ? s("umpanbalik.buka.memulai") : s("umpanbalik.buka.aksi")}
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";
import { KUNCI_TUTUP, sudahDitutup, type SebabTutup } from "@/lib/umpanbalik-kontrak";

/**
 * THE ONE CONSEQUENTIAL ACT ON THIS SURFACE, ASKED TWICE.
 *
 * ═══ WHY IT CONFIRMS ═══
 *
 * Closing is terminal in both directions: collection stops, and the round does
 * not reopen. PINTAR has no modal dialog and this does not invent one — the
 * confirmation is a panel that replaces the button, which is the shape the
 * product already uses when something is about to become permanent. It says
 * plainly what ends and that it does not come back.
 *
 * ═══ AND WHAT THE CONFIRMATION MAY NOT SAY ═══
 *
 * Not how many have answered. Not how many are needed. Not how close the round
 * is to either. A confirmation is exactly where that information would feel
 * helpful — "5 have responded, close anyway?" — and it is exactly the
 * participation monitor opening a round must never become. There is no count in
 * this component because there is no count in the props: nothing was passed
 * that could be printed.
 *
 * ═══ THE OUTCOME IS A REASON, AND THE STATE COMES FROM THE SERVER ═══
 *
 * On success this does not render what the round became. It refreshes, and the
 * page asks the database again — so PUBLISHED and WITHHELD arrive through the
 * same governed reader that renders them at any other moment, and this
 * component never holds the inputs that would let it decide between them.
 *
 * No effect, no timer, no retry loop. A second press while one is in flight is
 * refused by the disabled control; a second press that lands is refused by
 * WP7B's own `state <> 'OPEN'` and comes back as "already closed", which is
 * what it is.
 */
export default function TutupPutaran({
  siklus,
  tutup,
  locale = "id",
}: {
  siklus: string;
  tutup: (siklus: string) => Promise<SebabTutup>;
  locale?: Locale;
}) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  const router = useRouter();
  const [tanya, setTanya] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [sebab, setSebab] = useState<SebabTutup | null>(null);

  async function kerjakan() {
    if (sibuk) return;
    setSibuk(true);
    setSebab(null);
    try {
      const hasil = await tutup(siklus);
      setSebab(hasil);
      setTanya(false);
      // COLLECTION HAS ENDED; WHAT THE ROUND BECAME IS THE SERVER'S TO SAY.
      // The page re-reads the cycle and its result, so the state and the
      // governed snapshot arrive the same way they do on any other visit.
      if (sudahDitutup(hasil)) router.refresh();
    } finally {
      setSibuk(false);
    }
  }

  // Closed, on this press or an earlier one. The control is gone: there is no
  // reopen, no reset and no republish to offer, so nothing is offered.
  if (sebab && sudahDitutup(sebab)) {
    return <BarisHasil nada="ok">{s(KUNCI_TUTUP[sebab])}</BarisHasil>;
  }

  return (
    <div className="pin-ub-tutup">
      {sebab ? <BarisHasil nada="netral">{s(KUNCI_TUTUP[sebab])}</BarisHasil> : null}

      {tanya ? (
        <div className="pin-ub-pasti" role="group" aria-labelledby="pin-ub-pasti-judul">
          <p id="pin-ub-pasti-judul" className="pin-ml">{s("umpanbalik.tutup.judul")}</p>
          <p className="pin-mm">{s("umpanbalik.tutup.arti")}</p>
          <p className="pin-mm">{s("umpanbalik.tutup.akhir")}</p>
          <div className="pin-actions">
            <button
              type="button"
              className="pin-btn pin-bahaya-pasti pin-ub-btn"
              onClick={kerjakan}
              disabled={sibuk}
            >
              {sibuk ? s("umpanbalik.tutup.menutup") : s("umpanbalik.tutup.ya")}
            </button>
            <button
              type="button"
              className="pin-btn pin-ub-btn"
              onClick={() => setTanya(false)}
              disabled={sibuk}
            >
              {s("umpanbalik.tutup.batal")}
            </button>
          </div>
        </div>
      ) : (
        <div className="pin-actions">
          <button type="button" className="pin-btn pin-ub-btn" onClick={() => setTanya(true)}>
            {s("umpanbalik.tutup.aksi")}
          </button>
        </div>
      )}
    </div>
  );
}

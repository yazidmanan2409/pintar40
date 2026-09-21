"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { bolehLanjut, type Kemajuan } from "@/lib/pendataan-kontrak";

/**
 * THE THING THAT ASKS FOR THE NEXT CHUNK, AND THE NUMBERS IT SHOWS.
 *
 * ═══ EVERY NUMBER IS THE DATABASE'S ═══
 *
 * `completed`, `remaining`, `failed` and `total` come from `import_progress`,
 * which counts rows that committed. This component has no counter of its own:
 * it does not add one per request sent, does not estimate between answers and
 * does not move a bar on a timer. The bar's width is `completed / total` — a
 * rendering of a durable number rather than an animation beside it — so when
 * the bar says a third, a third of the people really exist.
 *
 * ═══ IT DOES NOT START BY ITSELF ═══
 *
 * §10 says continuation must never be triggered merely because a page stayed
 * open, and the cleanest way to honour that is to have nothing at all happen
 * without a press. So there is no effect here and no auto-run: an
 * administrator who returns to an interrupted job sees where it stands and
 * presses Continue. That is also why a closed laptop is uneventful — the job
 * was never being driven by the page, only asked by it.
 *
 * ═══ AND IT CANNOT CROSS THE FIFTY ═══
 *
 * The loop's condition is `bolehLanjut`, a whitelist of the three provisioning
 * states. `AWAITING_PILOT_VERIFICATION` is not on it, so when WP5A moves the
 * job there the loop ends on its own and the page re-renders into the
 * checkpoint. This is the surface AGREEING with the gate, not enforcing it:
 * `import_advance` refuses that state too, so a modified client gets an error
 * rather than a fifty-first person.
 *
 * ═══ A LOST RESPONSE IS NOT A LOST JOB ═══
 *
 * When a call comes back with nothing — a dropped tunnel, a slept laptop, a
 * proxy timeout — the chunk may well have committed. So the driver RE-READS
 * durable progress and carries on from whatever it says. It reports an
 * interruption only when it cannot reach the database at all, and even then
 * says that what was recorded stays recorded, because it does.
 */
export default function Penggerak({
  awal,
  pekerjaan,
  majukan,
  bacaUlang,
  locale = "id",
}: {
  awal: Kemajuan;
  pekerjaan: string;
  majukan: (pekerjaan: string) => Promise<Kemajuan | null>;
  bacaUlang: (pekerjaan: string) => Promise<Kemajuan | null>;
  locale?: Locale;
}) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  const router = useRouter();
  const [kini, setKini] = useState<Kemajuan>(awal);
  const [jalan, setJalan] = useState(false);
  const [putus, setPutus] = useState(false);
  // A ref rather than state for the loop's own condition: pausing must take
  // effect on the next iteration, and a state read inside a running async
  // function would be the value it closed over.
  const hidup = useRef(false);

  async function jalankan() {
    if (hidup.current) return;
    hidup.current = true;
    setJalan(true);
    setPutus(false);
    let k = kini;
    try {
      while (hidup.current && bolehLanjut(k)) {
        const maju = await majukan(pekerjaan);
        if (maju) {
          k = maju;
        } else {
          // UNCERTAIN, NOT FAILED. Ask the database where the job actually is.
          const ulang = await bacaUlang(pekerjaan);
          if (!ulang) { setPutus(true); break; }
          k = ulang;
        }
        setKini(k);
      }
    } finally {
      hidup.current = false;
      setJalan(false);
      // The phase may have changed underneath — the pilot may now be waiting,
      // the job may be complete — and the server page owns those screens.
      router.refresh();
    }
  }

  function berhenti() {
    hidup.current = false;
    setJalan(false);
  }

  const bisa = bolehLanjut(kini);
  const lebar = kini.total > 0 ? Math.round((kini.completed / kini.total) * 100) : 0;

  return (
    <section className="pin-sec" aria-labelledby="pin-maju">
      <h2 id="pin-maju">{s("pendataan.maju.judul")}</h2>

      {/* THE COUNTS, WHICH ARE THE WHOLE STATUS. A polite live region, so a
          screen reader hears the count move without being interrupted on every
          chunk. */}
      <p className="pin-lede" role="status" aria-live="polite">
        <span className="pin-num">{format.number(kini.completed, locale)}</span>{" "}
        {s("pendataan.maju.selesai")}
        {" · "}
        <span className="pin-num">{format.number(kini.remaining, locale)}</span>{" "}
        {s("pendataan.maju.sisa")}
        {" · "}
        <span className="pin-num">{format.number(kini.total, locale)}</span>
      </p>

      {/* Width comes from committed rows. `aria-valuenow` carries the same
          number, so the bar and the announcement cannot disagree. */}
      <div
        className={`pin-data-bar${jalan ? " pin-data-jalan" : ""}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={kini.total}
        aria-valuenow={kini.completed}
      >
        <span style={{ width: `${lebar}%` }} />
      </div>

      {kini.failed > 0 ? (
        <p className="pin-msg pin-msg-err">
          <span className="pin-num">{format.number(kini.failed, locale)}</span>{" "}
          {s("pendataan.maju.gagal_baris")}
        </p>
      ) : null}

      {putus ? (
        <p className="pin-msg pin-msg-note" role="status">{s("pendataan.maju.terputus")}</p>
      ) : null}

      <div className="pin-data-kendali">
        {bisa && !jalan ? (
          <button type="button" className="pin-btn pin-go pin-data-btn" onClick={jalankan}>
            {kini.completed > 0 ? s("pendataan.maju.lanjut") : s("pendataan.maju.mulai")}
          </button>
        ) : null}
        {jalan ? (
          <button type="button" className="pin-btn pin-data-btn" onClick={berhenti}>
            {s("pendataan.maju.jeda")}
          </button>
        ) : null}
      </div>

      {/* Said plainly, because it is the thing an administrator watching a
          thousand-row import most wants to know and is least likely to assume. */}
      <p className="pin-mm">{s("pendataan.maju.aman")}</p>
    </section>
  );
}

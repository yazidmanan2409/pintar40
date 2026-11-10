"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { kunciMasalah } from "@/lib/pendataan-kontrak";
import BarisHasil from "@/components/BarisHasil";
import type { HasilPeriksa } from "@/app/pendataan/actions";

/**
 * THE CHECK, AND WHAT IT FOUND — row by row.
 *
 * WHY THE FINDINGS COME BACK TO THE CLIENT RATHER THAN THROUGH A REDIRECT.
 * §6 wants a problem tied to the row and the field it is about, and
 * `import_validate` returns one finding per ordinal. A redirect has nowhere to
 * carry fifty of those, and re-deriving them on the page would mean validating
 * during a render — which is a write, because a clean validation is what moves
 * a job to AWAITING_CONFIRMATION.
 *
 * NO ROW IS DISCARDED AND NO ROW IS FIXED HERE. PINTAR reports; the
 * administrator corrects their file and starts a fresh intake. A screen that
 * offered to drop the bad rows and continue would be provisioning a list the
 * administrator never approved — and the count they approved would not be the
 * count that happened.
 *
 * A CLEAN RESULT REFRESHES THE SERVER PAGE rather than drawing the next step
 * itself. The next step is the preview, and the preview is WP5A's own answer
 * about the job's new state — not something this component can know.
 */
export default function PeriksaDaftar({
  pekerjaan,
  aksi,
  locale = "id",
}: {
  pekerjaan: string;
  aksi: (pekerjaan: string) => Promise<HasilPeriksa>;
  locale?: Locale;
}) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  const router = useRouter();
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState<HasilPeriksa | null>(null);

  async function periksa() {
    setSibuk(true);
    try {
      const h = await aksi(pekerjaan);
      setHasil(h);
      if (h.ok) router.refresh();
    } finally {
      setSibuk(false);
    }
  }

  const buruk = hasil ? hasil.rows.filter((r) => !r.ok) : [];

  return (
    <section className="pin-sec" aria-labelledby="pin-periksa">
      <h2 id="pin-periksa">{s("pendataan.periksa.judul")}</h2>

      <button type="button" className="pin-btn pin-primary pin-go pin-data-btn" onClick={periksa} disabled={sibuk}>
        {sibuk ? s("pendataan.periksa.jalan") : s("pendataan.periksa.mulai")}
      </button>

      {/* The check could not run at all — which is not the same as rows being
          wrong, and does not tell the administrator to change their file. */}
      {hasil?.galat ? (
        <BarisHasil nada="gagal">{s("pendataan.periksa.gagal")}</BarisHasil>
      ) : null}

      {hasil && !hasil.galat && hasil.ok ? (
        <BarisHasil nada="ok">{s("pendataan.periksa.bersih")}</BarisHasil>
      ) : null}

      {buruk.length > 0 ? (
        <>
          <p className="pin-lede" role="status">
            <span className="pin-num">{format.number(buruk.length, locale)}</span>{" "}
            {s("pendataan.periksa.ada")}
          </p>
          <ul className="pin-list pin-data-masalah">
            {buruk.map((r) => (
              <li key={r.ordinal}>
                <span className="pin-ml">
                  {s("pendataan.periksa.baris")} {format.number(r.ordinal, locale)}
                </span>
                <ul>
                  {/* Each phrase the database returned, as a sentence about a
                      spreadsheet rather than about a column of a table. */}
                  {r.problems.map((p, i) => (
                    <li key={i}>{s(kunciMasalah(p))}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="pin-mm">{s("pendataan.periksa.perbaiki")}</p>
        </>
      ) : null}
    </section>
  );
}

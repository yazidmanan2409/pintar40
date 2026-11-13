import Link from "next/link";
import { t, format, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import { statusKey, type Posisi } from "@/lib/siklus";
import JejakSiklus from "./JejakSiklus";

/**
 * THE ONE THING, on the learning home: where the learner is in the cycle that
 * leads, and the action that continues it.
 *
 * DAISY-26 (UX-21). One button per destination, each named for where it goes
 * (`labelTujuan`). The second button opens the assignment's own page, with all
 * five steps, the reading map and the lessons, and it is shown only when the
 * first button goes somewhere else. The eyebrow names the panel, not a button.
 */
export default function PanelLanjut({
  subjek,
  judul,
  posisi,
  aksi,
  ringkasan,
  locale,
  persona,
  catatan = null,
}: {
  subjek: string;
  judul: string;
  posisi: Posisi;
  /** The step's own destination and what its button says. */
  aksi: { href: string; labelKey: HleEvent; label?: string } | null;
  /** A1: what the chapter's sitting adds (held, not counted, ended at its deadline, one more attempt); never a reason */
  catatan?: string | null;
  /** The assignment's own page. */
  ringkasan: string;
  locale: Locale;
  persona: Persona;
}) {
  const s = (k: HleEvent) => t(k, persona, { locale });
  return (
    <section className="pin-lanjut">
      <p className="pin-eyebrow">{s("siklus.panel.eyebrow")}</p>
      <p className="pin-where">
        {subjek} · {judul}
      </p>
      <h2>
        {s(statusKey(posisi) as HleEvent)}
        {posisi.langkah === "PELAJARAN" && posisi.pelajaranTotal > 0
          ? ` — ${format.number(posisi.pelajaranSelesai, locale)} ${s("siklus.dari")} ${format.number(posisi.pelajaranTotal, locale)} ${s("siklus.selesai_n")}`
          : ""}
      </h2>
      <JejakSiklus posisi={posisi} locale={locale} />
      {catatan ? <p data-catatan-bab="">{catatan}</p> : null}
      <div className="pin-actions">
        {aksi ? (
          <Link className="pin-btn pin-primary" href={aksi.href}>
            {aksi.label ?? s(aksi.labelKey)}
          </Link>
        ) : null}
        {aksi?.href !== ringkasan ? (
          <Link className="pin-btn" href={ringkasan}>
            {s("siklus.lihat_langkah")}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

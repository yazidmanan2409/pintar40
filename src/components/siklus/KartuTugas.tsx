import Link from "next/link";
import { t, format, type Locale } from "@/lib/hle";
import { statusKey, type Ketuntasan, type Posisi } from "@/lib/siklus";
import type { AssignmentEntry } from "@/lib/assessment-engine/types";
import JejakSiklus from "./JejakSiklus";

/**
 * An assignment as a POSITION IN A JOURNEY rather than a row in a table.
 *
 * Subject and grade above, the chapter as the title, the trail, and one line
 * saying which step and how far through it. The action is whatever that step
 * actually is — never a generic "open", because a learner who is three lessons
 * into five and a learner who has not started are not doing the same thing.
 */
export default function KartuTugas({
  tugas,
  posisi,
  locale,
  aksi,
  target = null,
  catatan = null,
}: {
  tugas: AssignmentEntry;
  posisi: Posisi;
  locale: Locale;
  /** Where this card leads, and what the button says. */
  aksi: { href: string; labelKey: Parameters<typeof t>[0]; label?: string } | null;
  /** A1: what the chapter's sitting adds (held, not counted, ended at its deadline, one more attempt); never a reason */
  catatan?: string | null;
  /** D-085 M3: on a finished chapter, whether the target was met (the session's own verdict); null when there is none */
  target?: Ketuntasan | null;
}) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "learner", { locale });
  // "Sedang di Pelajaran — 3 dari 5 selesai". The counts are only meaningful
  // while lessons are the step; on the mapping or the result they would be
  // reporting on something the learner is not looking at.
  const hitung =
    posisi.langkah === "PELAJARAN" && posisi.pelajaranTotal > 0
      ? ` — ${format.number(posisi.pelajaranSelesai, locale)} ${s("siklus.dari")} ` +
        `${format.number(posisi.pelajaranTotal, locale)} ${s("siklus.selesai_n")}`
      : "";

  return (
    <article className="pin-tugas">
      <span className="pin-eyebrow">
        {tugas.subject} · {tugas.grade_label}
      </span>
      <span className="pin-ttitle">{tugas.title}</span>
      <JejakSiklus posisi={posisi} locale={locale} />
      <div className="pin-tfoot">
        <span className="pin-tstatus">
          {s(statusKey(posisi) as Parameters<typeof t>[0])}
          {hitung}
          {/* M3: «Selesai» alone would say a finished chapter was mastered; it says which holds */}
          {posisi.langkah === "HASIL" && target
            ? ` · ${s(target === "TERCAPAI" ? "siklus.target.tercapai" : "siklus.target.belum")}`
            : ""}
        </span>
        {aksi ? (
          <Link className="pin-btn" href={aksi.href}>
            {aksi.label ?? s(aksi.labelKey)}
          </Link>
        ) : null}
      </div>
      {catatan ? <p className="pin-meta" data-catatan-bab="">{catatan}</p> : null}
    </article>
  );
}

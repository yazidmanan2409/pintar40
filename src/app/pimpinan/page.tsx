import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as pim from "@/lib/pimpinan";
import { menunggu, urutan } from "@/lib/pimpinan-kontrak";
import { putuskanAksi } from "./actions";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import KartuKeputusan from "@/components/pimpinan/KartuKeputusan";
import RingkasKesiapan from "@/components/pimpinan/RingkasKesiapan";
import { BarisLingkup, KartuKetiadaan } from "@/components/bukti";
import AngkaTerkelola from "@/components/pimpinan/AngkaTerkelola";

export const dynamic = "force-dynamic";

/**
 * THE MANAGEMENT HOME — "what do I need to know, and what needs my attention?"
 *
 * SIXTY SECONDS, AND THE ORDER IS THE ANSWER. Context, then what is waiting,
 * then what the evidence supports, then where the evidence is not ready yet,
 * then a way deeper. A reader who stops after the first two sections has the
 * answer to the question the page exists for; everything below is there for the
 * reader who does not stop.
 *
 * IT IS NOT A DASHBOARD, AND THE ABSENCES ARE THE DESIGN. No tiles, no chart, no
 * gauge, no counter standing alone: the only bare numbers on the page are the
 * count of waiting decisions, which is the headline sentence, and the readiness
 * tallies, which each carry their own words. Every figure comes through the
 * catalogue and arrives with its meaning and its standing attached.
 *
 * MANAGEMENT IS NOT EDUCATOR HIGHER UP. The educator's home asks what needs
 * attention in a class today; this one asks what DECISIONS are waiting. An item
 * reaches this page because a human is owed something — never because PINTAR
 * can aggregate one level further — and the suppression line says so on the
 * page rather than only in a document.
 *
 * WHO SEES IT: `management_scope_over_node` decides, which is the WP1 role set —
 * HEAD_OF_DEPARTMENT and DEAN — over an assigned node. An INSTITUTION_ADMIN
 * outranks both and holds no Management authority, so they meet the same one
 * refusal page an educator or a learner meets. Nothing on this page reads a role
 * name to reach that answer.
 */
export default async function Pimpinan({
  searchParams,
}: {
  searchParams: Promise<{ lingkup?: string; galat?: string }>;
}) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });

  const lingkup = await pim.lingkupPimpinan();
  if (lingkup.length === 0) {
    return (
      <HalamanPenolakan
        messageKey="pimpinan.ditolak"
        persona="staff"
        locale={locale}
        backHref="/"
        backKey="entry.title"
      />
    );
  }

  // The scope being read. A hand-edited query string is not trusted: an id that
  // is not one of the reader's own confirmed scopes falls back to the first
  // rather than being passed to a read.
  const dipilih = lingkup.find((n) => n.id === sp.lingkup) ?? lingkup[0];

  // DAISY-07 (B6c): a class figure is asked of a class. Standing above the
  // classes, each class of the branch answers for itself (BOB-06's
  // buktiPerKelas), never summed; standing at a class, buktiPimpinan asks it.
  const diKelas = dipilih.kind === "CLASS";
  const [keputusan, bukti, perKelas] = await Promise.all([
    pim.keputusanSaya(),
    pim.buktiPimpinan(dipilih.id, dipilih.institusi),
    diKelas ? Promise.resolve([] as pim.BuktiKelas[]) : pim.buktiPerKelas(dipilih.id).catch(() => [] as pim.BuktiKelas[]),
  ]);

  const tertib = urutan(keputusan);
  const antre = tertib.filter(menunggu);
  const angka = bukti.filter((e) => e.status === "ok");
  const absen = bukti.filter((e) => e.status !== "ok");

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pimpinan" current="pimpinan" />
      <main className="pin-col">
        {/* ── A. MANAGEMENT CONTEXT ─────────────────────────────────────── */}
        <BarisLingkup scope={{ path: [dipilih.nama] }} locale={locale} />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("pimpinan.eyebrow")}</p>
          <h1 className="pin-h1">{s("pimpinan.judul")}</h1>
          <p className="pin-intro">{s("pimpinan.batas")}</p>
        </div>

        {/* MORE THAN ONE PART OF THE SCHOOL, AND PLAIN LINKS RATHER THAN A
            SELECT. A picker whose choice is applied by a script is a control
            that looks operational before the script arrives; a link is a link
            in every browser, needs no hydration, and is already in the tab
            order. The list is only ever the scopes the database confirmed. */}
        {lingkup.length > 1 ? (
          <nav className="pin-lingkup" aria-label={s("pimpinan.lingkup.pilih")}>
            <span className="pin-meta">{s("pimpinan.lingkup.pilih")}</span>
            <ul>
              {lingkup.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/pimpinan?lingkup=${encodeURIComponent(n.id)}`}
                    aria-current={n.id === dipilih.id ? "true" : undefined}
                  >
                    {n.nama}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* ── B. NEEDS ATTENTION ────────────────────────────────────────── */}
        <section className="pin-sec" aria-labelledby="pin-antre">
          <h2 id="pin-antre">{s("pimpinan.menunggu.judul")}</h2>

          {/* A TRUTHFUL NOTHING. An empty queue reads as a finished sentence,
              not as an empty container apologising for itself. */}
          {antre.length === 0 ? (
            <p className="pin-empty">{s("pimpinan.menunggu.nihil")}</p>
          ) : antre.length === 1 ? (
            <p className="pin-lede">{s("pimpinan.menunggu.satu")}</p>
          ) : (
            <p className="pin-lede">
              <span className="pin-num">{format.number(antre.length, locale)}</span>{" "}
              {s("pimpinan.menunggu.banyak")}
            </p>
          )}

          {antre.length > 1 ? <p className="pin-meta">{s("pimpinan.urutan")}</p> : null}

          {tertib.map((k) => (
            <KartuKeputusan
              key={k.id}
              keputusan={k}
              aksi={putuskanAksi}
              locale={locale}
              galat={sp.galat === "1"}
            />
          ))}

          <p className="pin-mm">{s("pimpinan.memutuskan")}</p>
        </section>

        {/* ── C. WHAT THE EVIDENCE SUPPORTS ─────────────────────────────── */}
        <section className="pin-sec" aria-labelledby="pin-bukti">
          <h2 id="pin-bukti">{s("pimpinan.bukti.judul")}</h2>
          {bukti.length === 0 ? (
            <p className="pin-empty">{s("pimpinan.bukti.kosong")}</p>
          ) : (
            <>
              <div className="pin-grid2">
                {angka.map((e, i) => (
                  <AngkaTerkelola
                    key={e.metric_id ?? `angka-${i}`}
                    entry={e}
                    value={nilai(e.value, locale)}
                    locale={locale}
                  />
                ))}
              </div>
              {/* An absent figure keeps its own sentence — the evaluator's, not
                  a variant map's — so NOT_YET_EVALUABLE and INSUFFICIENT_EVIDENCE
                  read as the two different facts WP3 separated them into. */}
              {absen.map((e, i) => (
                <KartuKetiadaan
                  key={e.metric_id ?? `absen-${i}`}
                  entry={e}
                  locale={locale}
                  persona="staff"
                />
              ))}
            </>
          )}
        </section>

        {/* ── C2. CLASS BY CLASS (DAISY-07) ──────────────────────────────────
            Above the classes, each class answers for its own figures, and a
            class is a disclosure the reader opens: the summary line says
            whether it has any figure yet, and inside, every absent figure says
            what will make it appear. A class whose figures are not the
            reader's says so once, without counting what was withheld. */}
        {!diKelas ? (
          <section className="pin-sec" aria-labelledby="pin-perkelas">
            <h2 id="pin-perkelas">{s("pimpinan.kelas.judul")}</h2>
            <p className="pin-mm">{s("pimpinan.kelas.arti")}</p>
            {perKelas.length === 0 ? (
              <p className="pin-empty">{s("pimpinan.kelas.kosong")}</p>
            ) : (
              perKelas.map(({ kelas, bukti: bk }) => {
                const ada = bk.filter((e) => e.status === "ok");
                return (
                  <details key={kelas.id} className="pin-kelas-bukti">
                    <summary>
                      <span className="pin-kelas-nama">{kelas.nama}</span>
                      <span className="pin-kelas-tanda">
                        {s(bk.length === 0 ? "laporan.metrik.bukan_untuk_anda" : ada.length > 0 ? "pimpinan.kelas.ada" : "pimpinan.kelas.belum")}
                      </span>
                    </summary>
                    {bk.length > 0 ? (
                      <div className="pin-kelas-isi">
                        {ada.length > 0 ? (
                          <div className="pin-grid2">
                            {ada.map((e, i) => (
                              <AngkaTerkelola key={e.metric_id ?? `angka-${i}`} entry={e} value={nilai(e.value, locale)} locale={locale} />
                            ))}
                          </div>
                        ) : null}
                        {bk.filter((e) => e.status !== "ok").map((e, i) => (
                          <KartuKetiadaan key={e.metric_id ?? `absen-${i}`} entry={e} locale={locale} persona="staff" />
                        ))}
                      </div>
                    ) : null}
                  </details>
                );
              })
            )}
          </section>
        ) : null}

        {/* ── D. EVIDENCE READINESS ─────────────────────────────────────── */}
        <RingkasKesiapan entries={bukti} locale={locale} />

        {/* ── E. DELIBERATELY DEEPER ────────────────────────────────────── */}
        <section className="pin-sec" aria-labelledby="pin-lanjut">
          <h2 id="pin-lanjut">{s("pimpinan.perlu_diketahui")}</h2>
          <p className="pin-mm">{s("pimpinan.perlu_diketahui.sub")}</p>
          <Link className="pin-btn" href={`/pimpinan/${encodeURIComponent(dipilih.id)}`}>
            {s("pimpinan.buka.simpul")}
          </Link>
        </section>
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

/**
 * A figure as a human reads it.
 *
 * DELIBERATELY NOT A FORMATTER PER METRIC. The catalogue declares what each
 * figure means and `AngkaBerdiri` renders the meaning beside it; what this needs
 * to do is render the VALUE without inventing a unit for it. A ratio between 0
 * and 1 is shown as a percentage because every ratio in this catalogue is one, a
 * whole number as a count, and anything structured — a distribution, a list —
 * is left to its own count of entries rather than being flattened into a number
 * that would mean nothing.
 */
function nilai(value: unknown, locale: "id" | "en"): string {
  if (typeof value === "number") {
    return value > 0 && value <= 1 && !Number.isInteger(value)
      ? format.percent(value, locale)
      : format.number(value, locale);
  }
  if (Array.isArray(value)) return format.number(value.length, locale);
  if (value !== null && typeof value === "object") {
    return format.number(Object.keys(value as Record<string, unknown>).length, locale);
  }
  return "—";
}

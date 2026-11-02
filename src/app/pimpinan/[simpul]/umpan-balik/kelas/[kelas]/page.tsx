import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as pim from "@/lib/pimpinan";
import * as ub from "@/lib/umpanbalik";
import { keadaanKunci } from "@/lib/umpanbalik-kontrak";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import MulaiPutaran from "@/components/umpanbalik/MulaiPutaran";
import { bukaPutaranAksi } from "../../actions";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/pimpinan/[simpul]/umpan-balik/kelas/[kelas]");

export const dynamic = "force-dynamic";

/**
 * ONE CLASS: WHAT IT HAS ALREADY BEEN ASKED, AND WHO ELSE IT COULD BE.
 *
 * ═══ WHY A PAGE PER CLASS ═══
 *
 * Discovery is one call per class, and a dean stands over every class in a
 * school. Asking `feedback_subjects_for_class` for forty classes to draw one
 * list would be forty round trips for a page most of which nobody was going to
 * read. So the branch page links classes, and the question "who could this
 * class be asked about" is asked here, once, about the class in front of the
 * reader.
 *
 * ═══ TWO GATES, AND NEITHER OF THEM IS THIS PAGE ═══
 *
 * `simpulDalamLingkup` decides whether this reader is Management over the
 * branch they arrived through — WP4's own gate, unchanged. Then
 * `feedback_subjects_for_class` asks `management_scope_over_node` again about
 * THIS class, in the same sentence `open_feedback_cycle` uses, and returns null
 * when the answer is no. So a reader who reaches this address for a class
 * outside their scope is told it is not theirs by the endpoint rather than by a
 * filter written here, and the difference matters: a filter can be wrong in the
 * permissive direction and a refusal cannot.
 *
 * ═══ AND DISCOVERY IS NOT PERMISSION ═══
 *
 * Every name below is advisory. `open_feedback_cycle` re-authorizes and
 * re-validates on every press, and is entitled to refuse somebody it listed a
 * moment ago — an assignment ended, a colleague got there first, or the class
 * is reached by material that is not academic, which discovery deliberately
 * does not check because that is a fact about the class rather than about the
 * subject. Each of those gets its own sentence. None of them is worked around.
 */
export default async function KelasUmpanBalik({
  params,
}: {
  params: Promise<{ simpul: string; kelas: string }>;
}) {
  const { simpul, kelas } = await params;
  const locale = await currentLocale();
  const s = (k: string) => t(k as HleEvent, "staff", { locale });

  const node = await pim.simpulDalamLingkup(simpul);
  if (!node) {
    return (
      <HalamanPenolakan
        messageKey="umpanbalik.ditolak"
        persona="staff"
        locale={locale}
        backHref="/pimpinan"
        backKey="umpanbalik.kembali"
      />
    );
  }

  // The class's own name comes from the branch this reader already holds, so a
  // node outside it is nameless here and refused by the endpoint below.
  const bawah = await pim.cabang([node.id]);
  const ini = bawah.find((n) => n.id === kelas && n.kind === "CLASS");
  const [subjek, siklus] = await Promise.all([
    ub.subjekKelas(kelas),
    ub.siklusKelas([kelas]),
  ]);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pimpinan" current="pimpinan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/pimpinan/${encodeURIComponent(node.id)}/umpan-balik`}>
          ← {s("umpanbalik.kembali")}
        </Link>

        <div className="pin-head">
          <p className="pin-eyebrow">{s("umpanbalik.pimpinan.judul")}</p>
          <h1 className="pin-h1">{ini?.nama ?? ""}</h1>
        </div>

        {/* ── WHAT THIS CLASS HAS ALREADY BEEN ASKED ─────────────────────
            Shown first, because an operator about to start a round most often
            wants to know whether one already exists. It carries the state as a
            sentence and no figure of any kind. */}
        <section className="pin-sec" aria-labelledby="pin-ub-ada">
          <h2 id="pin-ub-ada">{s("umpanbalik.kelas.putaran")}</h2>
          {siklus.length === 0 ? (
            <p className="pin-empty">{s("umpanbalik.pimpinan.kosong")}</p>
          ) : (
            <ul className="pin-list pin-ub-riwayat">
              {siklus.map((c) => {
                const kunci = keadaanKunci(c.keadaan);
                return (
                  <li key={c.id}>
                    <Link href={`/pimpinan/${encodeURIComponent(node.id)}/umpan-balik/${encodeURIComponent(c.id)}`}>
                      <span className="pin-ml">{s("umpanbalik.tentang.guru")}: {c.guru ?? "—"}</span>
                      {kunci ? <span className="pin-meta">{s(kunci)}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── AND WHO ELSE IT COULD BE ASKED ABOUT ───────────────────────
            `null` is the endpoint refusing this reader for this class, which
            is a different sentence from an empty list: "not yours" and "nobody
            to ask about" are different facts and PINTAR says which. */}
        <section className="pin-sec" aria-labelledby="pin-ub-mulai">
          <h2 id="pin-ub-mulai">{s("umpanbalik.buka.judul")}</h2>
          {subjek === null ? (
            <p className="pin-empty">{s("umpanbalik.buka.tanpa_wewenang")}</p>
          ) : (
            <MulaiPutaran
              kelas={kelas}
              subjek={subjek}
              buka={bukaPutaranAksi}
              locale={locale}
            />
          )}
        </section>
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

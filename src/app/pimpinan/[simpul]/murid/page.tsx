import Link from "next/link";
import Kosong from "@/components/Kosong";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as pim from "@/lib/pimpinan";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/pimpinan/[simpul]/murid");

export const dynamic = "force-dynamic";

/**
 * LEVEL 2 — THE ROSTER. NAMES, IN ALPHABETICAL ORDER, AND NOTHING ELSE.
 *
 * Everything this page could have reached for is absent on purpose, and it is
 * the same list the educator's own roster refuses: a dot, a percentage, a rank,
 * a colour, a "needs attention" flag, the strugglers floated to the top. Any of
 * them would be PINTAR telling a dean something about a child it does not know,
 * and any ordering but the alphabet would be a ranking wearing a list's clothes.
 * WP4 §10 forbids all of it; so does the roster this one is modelled on.
 *
 * NO INDIVIDUAL RECORD IS READ TO DRAW THIS PAGE. `management_learner_detail`
 * is not called here and cannot be: the ruling is that opening one learner is a
 * separate, recorded act, and a list that quietly opened everyone to render
 * itself would make the audit trail say something false about what the reader
 * did.
 *
 * A LEARNER OUTSIDE THIS READER'S SCOPE NEVER ARRIVES. `membership_readable`,
 * `enrollment_readable` and `person_visible_to_me` all run through
 * CAN_VIEW_LEARNER_ROSTER over the node, so the database has already bounded the
 * list and this page does no filtering of its own.
 */
export default async function DaftarMuridPimpinan({
  params,
}: {
  params: Promise<{ simpul: string }>;
}) {
  const { simpul } = await params;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });

  const node = await pim.simpulDalamLingkup(simpul);
  if (!node) {
    return (
      <HalamanPenolakan
        messageKey="pimpinan.ditolak"
        persona="staff"
        locale={locale}
        backHref="/pimpinan"
      />
    );
  }

  const murid = await pim.daftarMurid(node.id);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pimpinan" current="pimpinan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/pimpinan/${encodeURIComponent(node.id)}`}>
          ← {node.nama}
        </Link>
        <BarisLingkup scope={{ path: [node.nama] }} locale={locale} />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("pimpinan.eyebrow")}</p>
          <h1 className="pin-h1">{s("pimpinan.murid.judul")}</h1>
          {/* The deliberateness, said before the list rather than discovered
              after it: opening one record is a separate act, and recorded. */}
          <p className="pin-intro">{s("pimpinan.murid.sub")}</p>
        </div>

        <section className="pin-sec">
          {murid.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("pimpinan.murid.kosong")} />
          ) : (
            <ul className="pin-list pin-nama-list">
              {murid.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/pimpinan/${encodeURIComponent(node.id)}/murid/${encodeURIComponent(m.id)}`}
                  >
                    {m.nama}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

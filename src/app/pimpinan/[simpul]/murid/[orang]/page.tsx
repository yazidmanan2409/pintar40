import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as pim from "@/lib/pimpinan";
import { KESIAPAN_KUNCI, kesiapan } from "@/lib/pimpinan-kontrak";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";

export const dynamic = "force-dynamic";

/**
 * LEVEL 3 — ONE NAMED LEARNER, OPENED ON PURPOSE, AND RECORDED.
 *
 * ARRIVING HERE IS THE DELIBERATE ACT. WP1 is explicit that a row predicate
 * cannot tell a roster read from opening a person, which is why this is an
 * endpoint rather than a policy: `management_learner_detail` authorizes on its
 * own, reads the record inside the boundary that authorized the reader, and
 * writes `learner_detail.opened` in the same transaction as it builds the
 * payload — so a returned record and a recorded open cannot come apart.
 *
 * AND THE PAGE ADDS NOTHING TO THAT. No approval dialog, no purpose code, no
 * justification field, no second confirmation: the ruling says the opening needs
 * none of those, and a form asking for one would be this surface inventing a
 * governance step the product deliberately does not have. What the page does
 * instead is say plainly that the opening was recorded, because a reader is owed
 * the knowledge that their own act left a trace.
 *
 * A REFUSAL AND A STRANGER LOOK THE SAME. A learner in the next department, a
 * learner in another school and a uuid that is nobody all raise the same
 * exception inside the endpoint, and all three arrive at the same refusal page
 * here — which has no slot for a reason.
 *
 * THE RECORD IS THE LEARNER'S OWN AND CARRIES NO COMPARISON. No cohort average
 * beside it, no position, no band relative to anyone else: this is the one place
 * in the product where a named individual is read, and it is precisely the place
 * where a comparison would turn a record into a verdict.
 */
export default async function RincianMuridPimpinan({
  params,
}: {
  params: Promise<{ simpul: string; orang: string }>;
}) {
  const { simpul, orang } = await params;
  const locale = await currentLocale();
  const s = (k: string) => t(k as HleEvent, "staff", { locale });

  const node = await pim.simpulDalamLingkup(simpul);
  if (!node) {
    return (
      <HalamanPenolakan
        messageKey="pimpinan.ditolak"
        persona="staff"
        locale={locale}
        backHref="/pimpinan"
        backKey="pimpinan.kembali"
      />
    );
  }

  const rincian = await pim.rincianMurid(orang, node.institusi);
  if (!rincian) {
    return (
      <HalamanPenolakan
        messageKey="pimpinan.ditolak"
        persona="staff"
        locale={locale}
        backHref={`/pimpinan/${encodeURIComponent(node.id)}/murid`}
        backKey="pimpinan.kembali"
      />
    );
  }

  const siap = kesiapan({ readiness: rincian.official_results_readiness });
  const catatan = Array.isArray(rincian.official_results) ? rincian.official_results : [];
  const cukup = siap === "SUFFICIENT_EVIDENCE";

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pimpinan" current="pimpinan" />
      <main className="pin-col">
        <Link className="pin-back" href={`/pimpinan/${encodeURIComponent(node.id)}/murid`}>
          ← {s("pimpinan.murid.judul")}
        </Link>
        <BarisLingkup scope={{ path: [node.nama] }} locale={locale} />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("pimpinan.rincian.judul")}</p>
          <h1 className="pin-h1">{rincian.display_name ?? ""}</h1>
          {/* Said out loud, because the reader's own act left a trace and they
              are owed the knowledge that it did. */}
          <p className="pin-meta">{s("pimpinan.rincian.tercatat")}</p>
        </div>

        <section className="pin-sec">
          <dl className="pin-facts">
            {rincian.programme ? (
              <div>
                <dt>{s("pimpinan.rincian.program")}</dt>
                <dd>{rincian.programme}</dd>
              </div>
            ) : null}
            {rincian.academic_period ? (
              <div>
                <dt>{s("pimpinan.rincian.periode")}</dt>
                <dd>{rincian.academic_period}</dd>
              </div>
            ) : null}
            {/* The placement names PLACES, and only places: the node `kind` is a
                schema enum and never renders. */}
            {rincian.placement.length > 0 ? (
              <div>
                <dt>{s("pimpinan.rincian.penempatan")}</dt>
                <dd>{rincian.placement.map((p) => p.name).join(" / ")}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="pin-sec" aria-labelledby="pin-catatan">
          <h2 id="pin-catatan">{s("pimpinan.rincian.catatan")}</h2>

          {/* R5 APPLIES TO ONE LEARNER TOO, and it is the same rule and the same
              governed minimum. "Nothing qualifying has arrived yet" is not a
              poor record, and it is not rendered as one: no zero stands in for
              an unknown, and the sentence says what is true. */}
          {!cukup ? (
            <>
              <p className="pin-empty">{s("pimpinan.rincian.belum")}</p>
              {siap ? <p className="pin-mm">{s(KESIAPAN_KUNCI[siap])}</p> : null}
            </>
          ) : (
            <ul className="pin-list pin-catatan-belajar">
              {catatan.map((r, i) => (
                <li key={i}>
                  {r.mode && MODE[r.mode] ? (
                    <span className="pin-ml">{s(MODE[r.mode])}</span>
                  ) : null}
                  {typeof r.mastery === "number" ? (
                    <span className="pin-num">
                      {s("pimpinan.rincian.penguasaan")} {format.percent(r.mastery, locale)}
                    </span>
                  ) : null}
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

/**
 * THE ASSESSMENT MODE, AS A TELLING AND THROUGH A DECLARED MAP.
 *
 * `mode` is a schema enum and must never render, so it is mapped. It is mapped
 * through a LIST rather than by building a key from the value: an enum member
 * added to the database later would otherwise compose a key that does not exist
 * in the copy table, and `t()` would be handed an undefined row at render time.
 * A mode with no entry here draws no label at all, which is the same discipline
 * the decision card applies to a source table.
 */
const MODE: Record<string, string> = {
  PRE_TEST: "jenis.mode.PRE_TEST",
  POST_TEST: "jenis.mode.POST_TEST",
  QUICK: "jenis.mode.QUICK",
};

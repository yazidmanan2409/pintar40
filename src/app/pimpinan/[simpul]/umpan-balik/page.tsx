import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as pim from "@/lib/pimpinan";
import * as ub from "@/lib/umpanbalik";
import { keadaanKunci } from "@/lib/umpanbalik-kontrak";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";

export const dynamic = "force-dynamic";

/**
 * THE FEEDBACK ROUNDS IN ONE PART OF THE SCHOOL — a list, and nothing summed.
 *
 * ═══ ONE CLASS AND ONE EDUCATOR IS THE GRAIN, AND IT STAYS THE GRAIN ═══
 *
 * §14: V1 Management consumes the same governed snapshot at CLASS × subject
 * EDUCATOR, and nothing is aggregated across classes in the frontend. So this
 * page LISTS rounds and opens one. It does not add them up, average them,
 * compare them, order them by anything but the class's own name, or put two
 * educators in a table beside each other — all of which are a ranking however
 * politely they are drawn, and none of which any backend contract would stand
 * behind.
 *
 * ═══ WHAT THE LIST MAY SAY ABOUT A ROUND THAT PUBLISHED NOTHING ═══
 *
 * That it published nothing. ADR-0022 §Decision 3 rules that disclosure
 * explicitly: Management is entitled to know a round produced no publishable
 * result, because that is a bound rather than a number. The sentence is the
 * canonical one, it appears on the round's own page, and nothing anywhere
 * narrows it towards the count that was missing.
 *
 * ═══ AND THE SCOPE IS THE DATABASE'S ═══
 *
 * `simpulDalamLingkup` and `cabang` are WP4's, so the branch is the one
 * Management already stands over, and `feedback_cycles` is then read under a
 * policy whose using-clause asks `management_scope_over_node` again. The node
 * list narrows what is SHOWN; the policy decides what is READABLE. An
 * institution's administrator passes neither.
 */
export default async function UmpanBalikLingkup({
  params,
}: {
  params: Promise<{ simpul: string }>;
}) {
  const { simpul } = await params;
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

  const bawah = await pim.cabang([node.id]);
  const siklus = await ub.siklusKelas(bawah.map((n) => n.id));

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pimpinan" current="pimpinan" />
      <main className="pin-col">
        <Link className="pin-back" href={`/pimpinan/${encodeURIComponent(node.id)}`}>
          ← {s("umpanbalik.kembali")}
        </Link>

        <div className="pin-head">
          <p className="pin-eyebrow">{s("umpanbalik.pimpinan.judul")}</p>
          <h1 className="pin-h1">{node.nama}</h1>
          <p className="pin-intro">{s("umpanbalik.pimpinan.sub")}</p>
        </div>

        <section className="pin-sec" aria-labelledby="pin-ub-daftar">
          <h2 id="pin-ub-daftar">{s("umpanbalik.pimpinan.judul")}</h2>
          {siklus.length === 0 ? (
            <p className="pin-empty">{s("umpanbalik.pimpinan.kosong")}</p>
          ) : (
            <ul className="pin-list pin-ub-riwayat">
              {siklus.map((c) => {
                const kunci = keadaanKunci(c.keadaan);
                return (
                  <li key={c.id}>
                    <Link href={`/pimpinan/${encodeURIComponent(node.id)}/umpan-balik/${encodeURIComponent(c.id)}`}>
                      <span className="pin-ml">{c.kelas}</span>
                      <span className="pin-mm">
                        {s("umpanbalik.tentang.guru")}: {c.guru ?? "—"}
                      </span>
                      {kunci ? <span className="pin-meta">{s(kunci)}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

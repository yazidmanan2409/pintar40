import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as pim from "@/lib/pimpinan";
import * as ub from "@/lib/umpanbalik";
import { keadaanKunci } from "@/lib/umpanbalik-kontrak";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import HasilKelas from "@/components/umpanbalik/HasilKelas";

export const dynamic = "force-dynamic";

/**
 * ONE ROUND, READ BY MANAGEMENT — and it is the SAME page the educator reads.
 *
 * `HasilKelas` is the component the subject's own page uses, with the same
 * result from the same endpoint. §14 asks for exactly that, and building a
 * second renderer for a reader with more authority would have been building the
 * place where the two quietly diverge. Management's authority decides WHICH
 * rounds they may open. It does not decide what a round says.
 *
 * WHAT IT DOES NOT BECOME IS A ROUTE TO A PERSON. There is no respondent here,
 * no list of who answered, no sheet, no "view responses", and no option that
 * can be followed into anybody: the snapshot is five questions of marginals and
 * a total, and the rows behind it carry no person to reach. Management
 * authority is authority over a part of a school. It was never authority to
 * identify a child who answered a question about their teacher.
 */
export default async function SatuUmpanBalik({
  params,
}: {
  params: Promise<{ simpul: string; siklus: string }>;
}) {
  const { simpul, siklus } = await params;
  const locale = await currentLocale();
  const s = (k: string) => t(k as HleEvent, "staff", { locale });

  const node = await pim.simpulDalamLingkup(simpul);
  // The cycle is fetched under its own policy: a reader standing in a branch
  // they do hold cannot reach a round outside it, because the row does not
  // come back rather than because this page filtered it.
  const c = node ? await ub.siklus(siklus) : null;
  if (!node || !c) {
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

  const hasil = await ub.hasil(c.id);
  const kunci = keadaanKunci(c.keadaan);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pimpinan" current="pimpinan" />
      <main className="pin-col">
        <Link className="pin-back" href={`/pimpinan/${encodeURIComponent(node.id)}/umpan-balik`}>
          ← {s("umpanbalik.kembali")}
        </Link>

        <div className="pin-head">
          <p className="pin-eyebrow">{s("umpanbalik.pimpinan.judul")}</p>
          <h1 className="pin-h1">{c.kelas}</h1>
          <p className="pin-intro">
            {s("umpanbalik.tentang.guru")}: {c.guru ?? "—"}
          </p>
        </div>

        <section className="pin-sec" aria-labelledby="pin-ub-hasil">
          <h2 id="pin-ub-hasil">{s("umpanbalik.hasil.judul")}</h2>
          {kunci ? <p className="pin-meta">{s(kunci)}</p> : null}
          <HasilKelas hasil={hasil} locale={locale} persona="staff" />
        </section>

        <p className="pin-mm">{s("umpanbalik.guru.guna")}</p>
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import * as ub from "@/lib/umpanbalik";
import { keadaanKunci } from "@/lib/umpanbalik-kontrak";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import HasilKelas from "@/components/umpanbalik/HasilKelas";

export const dynamic = "force-dynamic";

/**
 * WHAT THIS CLASS SAID — the subject educator's own reading.
 *
 * ═══ WHAT MAKES IT THEIRS IS THE POLICY, NOT THIS PAGE ═══
 *
 * `feedback_cycles` is selected under RLS whose using-clause is
 * `subject_person_id = current_person_id() or management_scope_over_node(...)`.
 * An educator therefore receives cycles about themselves and about nobody else,
 * and this page asks for no role and checks none: reaching for the class it is
 * named after is presentation, and the rows that come back are the database's
 * decision about whose they are. A colleague's cycle is not filtered out here —
 * it never arrives.
 *
 * ═══ IT IS NOT A DASHBOARD, AND THE ABSENCE OF ONE IS THE DESIGN ═══
 *
 * One class, the educator who taught it, and what that class chose on five
 * questions. No trend, no comparison with last term, no other class, no other
 * educator, no figure that stands for the person. The only number on the page
 * when there is one at all is how many responses chose each option, and the
 * total they came from.
 *
 * ═══ AND WHILE A ROUND IS OPEN THERE IS NOTHING NUMERIC TO SHOW ═══
 *
 * Not "a number we are choosing to hide": `feedback_result` returns a statement
 * key and no figures at all until the cycle closes. A subject watching their
 * own round fill up would be a subject differencing it, and would also be a
 * quietly horrible thing to build.
 */
export default async function UmpanBalikKelas({
  params,
}: {
  params: Promise<{ kelas: string }>;
}) {
  const { kelas } = await params;
  const locale = await currentLocale();
  const s = (k: string) => t(k as HleEvent, "educator", { locale });

  const konteks = await ajar.kelas(kelas);
  if (!konteks) {
    return (
      <HalamanPenolakan
        messageKey="umpanbalik.ditolak"
        persona="educator"
        locale={locale}
        backHref="/mengajar"
        backKey="umpanbalik.kembali"
      />
    );
  }

  const siklus = await ub.siklusKelas([kelas]);
  const hasil = await Promise.all(siklus.map((c) => ub.hasil(c.id)));

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main className="pin-col">
        <Link className="pin-back" href={`/mengajar/${encodeURIComponent(kelas)}`}>
          ← {s("umpanbalik.kembali")}
        </Link>

        <div className="pin-head">
          <p className="pin-eyebrow">{s("umpanbalik.guru.judul")}</p>
          <h1 className="pin-h1">{konteks.ini.nama}</h1>
          <p className="pin-intro">{s("umpanbalik.guru.intro")}</p>
        </div>

        {siklus.length === 0 ? (
          <p className="pin-empty">{s("umpanbalik.guru.kosong")}</p>
        ) : (
          siklus.map((c, i) => {
            const kunci = keadaanKunci(c.keadaan);
            return (
              <section key={c.id} className="pin-sec" aria-labelledby={`pin-ub-${c.id}`}>
                <h2 id={`pin-ub-${c.id}`}>{s("umpanbalik.hasil.judul")}</h2>
                {/* The state as a sentence. The enum never reaches the page,
                    and a value this release does not know renders nothing at
                    all rather than its own identifier. */}
                {kunci ? <p className="pin-meta">{s(kunci)}</p> : null}
                <HasilKelas hasil={hasil[i]} locale={locale} persona="educator" />
              </section>
            );
          })
        )}

        {/* Said once, at the bottom, where somebody who has just read what their
            class chose is deciding what to do about it. */}
        <p className="pin-mm">{s("umpanbalik.guru.guna")}</p>
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

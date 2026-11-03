import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import { kataMenunggu } from "@/components/mengajar/menunggu";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/mengajar/[kelas]/langkah");

export const dynamic = "force-dynamic";

/**
 * SCREEN F — what to do next, ordered by the state of this class.
 *
 * FROM STATE, NOT FROM A FEATURE LIST. An assessment with people still to
 * submit puts "see who has not submitted" first; published material this class
 * does not have puts "prepare it" first; a class with nothing open leads with
 * the quick assessment. The order is a reading of the class, which is the only
 * thing that makes a list like this worth more than a menu.
 *
 * EVERY CARD GOES SOMEWHERE. Two acts from the reviewed concept are absent:
 * changing an open assessment's window, and giving one learner extra time.
 * Both are real capabilities an educator holds — an RLS update on
 * `assessment_assignments`, and `extend_session_deadline`, which requires a
 * reason and audits it — and neither has a Slice-3 surface to land on. A card
 * that opens nothing is a promise the product cannot keep, so they wait for the
 * slice that builds them rather than sitting here inert. (The concept's line
 * about a window change being "recorded with its reason" was also the one G-9
 * found: a bare window update writes no reason and no audit row. Only
 * `extend_session_deadline` does, which is why its card keeps that sentence and
 * the other one would not have.)
 *
 * NOTHING HERE FOR ITEM REVIEW OR INTEGRITY, and the footnote says so plainly
 * rather than leaving an educator to wonder whether they have missed a menu.
 */
export default async function Langkah({ params }: { params: Promise<{ kelas: string }> }) {
  const { kelas: id } = await params;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  if (!ctx) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref="/mengajar" backKey="mengajar.kembali" />;
  }

  const [buka, tugas, terbit, fakta] = await Promise.all([
    ajar.berjalan([id]),
    ajar.penugasan(id),
    ajar.terbitan(ctx.ini.institusi, id),
    ajar.faktaKelas(id),
  ]);

  type Kartu = { key: string; judul: string; sebab: string; href: string; utama: boolean };
  // UX-37: what waits on the teacher here is decided once (menungguKelas), the same answer the home shows per class
  const kartu: Kartu[] = ajar
    .menungguKelas(id, buka, fakta.murid.length, new Set(tugas.map((x) => x.releaseId)), terbit)
    .map((m, i) => ({ key: m.key, ...kataMenunggu(m, s, locale), href: m.href, utama: i === 0 }));
  kartu.push({
    key: "f5",
    judul: s("mengajar.langkah.f5"),
    sebab: s("mengajar.langkah.f5w"),
    href: `/mengajar/${id}/uji-cepat`,
    utama: kartu.length === 0,
  });
  kartu.push({
    key: "fb",
    judul: s("mengajar.aksi.bukti"),
    sebab: s("mengajar.bukti.intro"),
    href: `/mengajar/${id}/bukti`,
    utama: false,
  });
  kartu.push({
    key: "f6",
    judul: s("mengajar.langkah.f6"),
    sebab: s("mengajar.langkah.f6w"),
    href: "/studio/unggah",
    utama: false,
  });

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}`}>← {ctx.ini.nama}</Link>
        <BarisLingkup
          scope={{
            institution: ctx.konteks.institusi?.nama ?? null,
            path: [ctx.ini.nama],
            period: ctx.konteks.periode,
          }}
          locale={locale}
        />
        <div className="pin-head">
          <p className="pin-eyebrow">{s("mengajar.langkah.eyebrow")} · {ctx.ini.nama}</p>
          <h1 className="pin-h1">{s("mengajar.langkah.judul")}</h1>
          <p className="pin-intro">{s("mengajar.langkah.intro")}</p>
        </div>

        <div className="pin-acts">
          {kartu.map((k) => (
            <Link key={k.key} className={k.utama ? "pin-act pin-first" : "pin-act"} href={k.href}>
              <span className="pin-title">{k.judul}</span>
              <span className="pin-why">{k.sebab}</span>
              <span className="pin-go">{s("mengajar.langkah.buka")} →</span>
            </Link>
          ))}
        </div>

        <p className="pin-foot">{s("mengajar.langkah.quiet")}</p>
        <KakiPintar />
      </main>
    </>
  );
}

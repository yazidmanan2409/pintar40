import Link from "next/link";
import { redirect } from "next/navigation";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { currentViewer } from "@/lib/auth";
import * as ub from "@/lib/umpanbalik";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { peranSaya } from "@/lib/tur-negara";
import { personaPembelajaran } from "@/lib/pembelajaran";
import LembarUmpanBalik from "@/components/umpanbalik/LembarUmpanBalik";
import { kirimUmpanBalikAksi } from "../actions";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/belajar/umpan-balik/[siklus]");

export const dynamic = "force-dynamic";

/**
 * ONE LEARNER, ONE SHEET.
 *
 * ELIGIBILITY IS NEVER DERIVED HERE. `feedback_questionnaire` answers, and it
 * answers in ONE sentence for a cycle that does not exist, a cycle that is not
 * this learner's, and a cycle that has closed. This page cannot tell those
 * apart and does not try: all three render the same calm page. That
 * indistinguishability is load-bearing — it is what stops the address bar being
 * used to discover that some class, somewhere, is being asked about its
 * teacher.
 *
 * NO ROSTER IS READ, no membership is consulted, and no eligibility is
 * computed. The one thing this page knows about other people is that it knows
 * nothing about them.
 *
 * THE ORDINARY SHELL, NOT THE FOCUS ONE. An assessment drops the navigation
 * because a learner is being timed and a way out costs them something. Nothing
 * is timed here and nothing is lost by leaving: a sheet that felt like a room
 * you could not walk out of would be the wrong feeling for this entirely.
 */
export default async function BeriUmpanBalik({
  params,
}: {
  params: Promise<{ siklus: string }>;
}) {
  const { siklus } = await params;
  const viewer = await currentViewer();
  if (!viewer) redirect(`/masuk?lanjut=/belajar/umpan-balik/${siklus}`);
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const kuesioner = await ub.kuesioner(siklus);
  if (!kuesioner) {
    return (
      <HalamanPenolakan
        messageKey="umpanbalik.kirim.bukan_milik"
        persona={personaPembelajaran(await peranSaya())}
        locale={locale}
        backHref="/belajar"
      />
    );
  }

  return (
    <>
      <CangkangPengalaman locale={locale} current="belajar" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href="/belajar">← {s("nav.belajar")}</Link>

        <div className="pin-head">
          <p className="pin-eyebrow">{s("umpanbalik.murid.judul")}</p>
          <h1 className="pin-h1">{kuesioner.class_name ?? ""}</h1>
          {kuesioner.subject_name ? (
            <p className="pin-intro">
              {s("umpanbalik.tentang.guru")}: {kuesioner.subject_name}
            </p>
          ) : null}
        </div>

        {/* ALREADY SENT, AND NOTHING TO SEND AGAIN. The endpoint carries this
            learner's own consumed state, so returning to a sheet they have
            already answered is uneventful rather than an opportunity to answer
            it twice. */}
        {kuesioner.already_answered ? (
          <section className="pin-sec" aria-labelledby="pin-ub-usai">
            <h2 id="pin-ub-usai">{s("umpanbalik.selesai.judul")}</h2>
            <p className="pin-msg pin-msg-note" role="status">{s("umpanbalik.kirim.sudah")}</p>
            <p className="pin-lede">{s("umpanbalik.selesai.arti")}</p>
          </section>
        ) : (
          <LembarUmpanBalik
            kuesioner={kuesioner}
            kirim={kirimUmpanBalikAksi}
            locale={locale}
          />
        )}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

import Link from "next/link";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import * as actions from "../actions";
import { mulaiAsesmen } from "../actions";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import TombolKirim from "@/components/TombolKirim";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import OrientasiAsesmen from "@/components/siklus/OrientasiAsesmen";
import { kunciNamaAsesmen } from "@/components/siklus/aksi";
import { peranSaya } from "@/lib/tur-negara";
import { personaPembelajaran } from "@/lib/pembelajaran";
import ItemPlayer from "./ItemPlayer";

/**
 * ONE ASSESSMENT EXPERIENCE, THREE WAYS IN.
 *
 * The cycle's mapping, the cycle's Mastery Check and a Quick assessment that
 * belongs to no cycle are the same experience — orientation, then the player.
 * They differ in their BOUNDS, not in their player, and building three players
 * would guarantee they drift.
 *
 * TWO STATES, DECIDED BY ONE FACT: is there a session?
 *
 *   no  → SCREEN D. Orientation. Reading it creates nothing. The learner sees
 *         what this is, how many questions, when it closes, what they will be
 *         able to do inside it, and how session activity is recorded — then
 *         presses a button, or leaves.
 *   yes → SCREEN E. The player, in the focus shell.
 *
 * THIS COMPONENT NEVER STARTS A SESSION. Rendering is looking; only the form
 * action in `mulaiAsesmen` commits. The previous routes called
 * `startSession()` during render, which meant navigating to the URL was the
 * commitment and Q-15 could not be shown before it — the ruling that Screen D
 * exists to satisfy.
 *
 * NO ORIENTATION MEANS NO ENTRY. `assessment_orientation()` is gated by the
 * same `may_start_assessment()` the start is gated by and returns nothing when
 * the learner may not begin. A null here is therefore the refusal page, never
 * a disabled orientation: an orientation for something that cannot be entered
 * is an invitation the product cannot honour.
 */
export default async function PermukaanAsesmen({
  penugasan,
  sesi,
  locale,
  eyebrow,
  kembali,
  diriHref,
  selesaiHref,
  mode,
}: {
  /** The assessment assignment: what would be started. */
  penugasan: string;
  /** The learner's existing session for it, if one is already open. */
  sesi: string | null;
  locale: Locale;
  /** Course and chapter, or the class a Quick assessment was opened to. */
  eyebrow: string;
  kembali: { href: string; key: HleEvent };
  /** This route's own URL: where the form returns once a session exists. */
  diriHref: string;
  /** Where the player goes when the learner submits. */
  selesaiHref: string;
  /** Which player treatment: the diagnostic one has no verdict language. */
  mode: "PEMETAAN" | "PENGUASAAN";
}) {
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const s = (k: HleEvent) => t(k, "learner", { locale });

  // ---------------------------------------------------------- D. orientation
  if (!sesi) {
    // W2.16 (DAISY-35 item 2): a refusal here speaks to the reader's own context (the roles are read once per request)
    const [orientasi, persona] = await Promise.all([
      engine.orientation(db, penugasan),
      peranSaya().then(personaPembelajaran),
    ]);
    if (!orientasi) {
      return <HalamanPenolakan locale={locale} persona={persona} backHref={kembali.href} backKey={kembali.key} />;
    }
    // DAISY-26 (UX-05): the assessment is called by its own kind, so an Uji
    // Cepat is never titled with the Uji Penguasaan whose player it borrows. A
    // kind with no product name shows its own title.
    const namaKunci = kunciNamaAsesmen(orientasi.mode);
    const nama = namaKunci ? s(namaKunci) : orientasi.title;
    return (
      <>
        <CangkangPengalaman locale={locale} current="belajar" />
        <main id="isi" tabIndex={-1} className="pin-col">
          <Link className="pin-back" href={kembali.href}>
            ← {s(kembali.key)}
          </Link>
          <OrientasiAsesmen
            orientasi={orientasi}
            locale={locale}
            mode={mode}
            eyebrow={eyebrow}
            judul={nama}
            mulai={
              <form action={mulaiAsesmen}>
                <input type="hidden" name="penugasan" value={penugasan} />
                <input type="hidden" name="kembali" value={diriHref} />
                <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.memulai")}>
                  {s("cycle.open")} {nama}
                </TombolKirim>
              </form>
            }
            kembali={{ href: kembali.href, label: s("siklus.nanti") }}
          />
          <KakiPintar />
        </main>
      </>
    );
  }

  // ------------------------------------------------------------- E. the player
  const [paper, prior, session] = await Promise.all([
    engine.paper(db, sesi),
    engine.answersSoFar(db, sesi),
    engine.sessionState(db, sesi),
  ]);

  const accepted: Record<string, { posisi: number } | { posisi: number[] }> = {};
  const seqs: Record<string, number> = {};
  for (const row of prior) {
    seqs[row.presented_item_id] = Math.max(seqs[row.presented_item_id] ?? 0, row.client_seq);
    if (row.posisi != null) accepted[row.presented_item_id] = { posisi: row.posisi } as never;
  }

  return (
    <>
      {/* The focus shell: the mark and the language, no tabs. A header offering
          three ways out of a timed task is inviting the learner to take one. */}
      <CangkangPengalaman locale={locale} kind="focus" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <ItemPlayer
          sessionId={sesi}
          paper={paper}
          accepted={accepted}
          seqs={seqs}
          mode={mode}
          memintaSertifikat={session?.mode === "POST_TEST"}
          stage={session?.stage ?? null}
          allowsPause={mode === "PENGUASAAN" && Boolean(session?.allows_pause)}
          startedAt={session?.started_at ?? null}
          assistanceWindow={session?.hesitation_window_seconds ?? null}
          finishHref={selesaiHref}
          locale={locale}
          actions={actions}
        />
      </main>
    </>
  );
}

import Link from "next/link";
import { menitTersisa } from "@/lib/pengerjaan-tampil";
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
import { zonaSimpulBanyak } from "@/lib/zona-sekolah";
import ItemPlayer from "./ItemPlayer";
import { pengerjaanSaya } from "@/lib/pengerjaan";
import { arahTolakMulai, jamJendela } from "@/lib/pemeliharaan-kontrak";

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
  sesi: sesiDiberikan,
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

  // A1 (O41-17, Daisy Q5): a held sitting is not played (its teacher resumes or closes it), and one the teacher ended as
  // not counted is behind the learner: the orientation is offered again, or the sentence that says it was not counted
  const keadaan = sesiDiberikan ? await pengerjaanSaya(sesiDiberikan).catch(() => null) : null;
  if (keadaan?.ditahan) {
    return (
      <>
        <CangkangPengalaman locale={locale} current="belajar" />
        <HalamanPenolakan locale={locale} persona={personaPembelajaran(await peranSaya())} messageKey="siklus.kartu.ditahan" backHref={kembali.href} backKey={kembali.key} />
      </>
    );
  }
  const tidakDihitung = keadaan?.penutupan === "TEACHER_NOT_COUNTED";
  const sesi = tidakDihitung ? null : sesiDiberikan;

  // ---------------------------------------------------------- D. orientation
  if (!sesi) {
    // W2.16 (DAISY-35 item 2): a refusal here speaks to the reader's own context (the roles are read once per request)
    const [orientasi, persona, zona] = await Promise.all([
      engine.orientation(db, penugasan),
      peranSaya().then(personaPembelajaran),
      // the owner's ruling (10 Nov): the assessment's school's clock; the orientation names no school, so the class the
      // learner's open assessment row names leads to it (WIB when the row is not among them)
      engine.openAssessments(db)
        .then(async (rows) => {
          const node = rows.find((r) => r.assessment_assignment_id === penugasan)?.node_id ?? null;
          return (await zonaSimpulBanyak(db, [node]))(node);
        })
        .catch(() => "Asia/Jakarta"),
    ]);
    if (!orientasi) {
      return <HalamanPenolakan locale={locale} persona={persona} backHref={kembali.href} backKey={kembali.key}
        messageKey={tidakDihitung ? "siklus.kartu.tidak_dihitung" : undefined} />;
    }
    // DAISY-26 (UX-05): the assessment is called by its own kind, so an Uji
    // Cepat is never titled with the Uji Penguasaan whose player it borrows. A
    // kind with no product name shows its own title.
    const namaKunci = kunciNamaAsesmen(orientasi.mode);
    const nama = namaKunci ? s(namaKunci) : orientasi.title;
    // A2b (R-A; Daisy, A2-KATA-DESAIN.md B2 and A2B-RA-KALIMAT.md): a maintenance refusal said on this screen disables
    // «Mulai» and ties its sentence to it; a platform-wide window's T−15 keeps 4.0's button (pressing it leads to the
    // maintenance page, as before)
    const tolak = orientasi.tolak_pemeliharaan ?? null;
    const dimatikan = tolak !== null && arahTolakMulai(tolak, orientasi.tolak_cakupan) === "LAYAR";
    const zonaTolak = { zona };
    const kalimatTolak = !dimatikan ? null
      : tolak === "MAINTENANCE_PLACE" ? s("pemeliharaan.pita.asesmen_baru")
      : tolak === "MAINTENANCE_NO_NEW_START" ? s("galat.maintenance_no_new_start")
      : (() => {
          const menit = orientasi.closes_at ? String(menitTersisa(orientasi.closes_at)) : "—";
          const kelas = orientasi.tolak_kelas && orientasi.tolak_kelas.length > 0 ? orientasi.tolak_kelas.join(", ") : null;
          const kunci: HleEvent = kelas ? (orientasi.tolak_selesai ? "siklus.d4.kelas_akhir" : "siklus.d4.kelas_tanpa_akhir")
            : orientasi.tolak_selesai ? "siklus.d4.akhir" : "siklus.d4.tanpa_akhir";
          return s(kunci).replace("{d}", menit).replace("{kelas}", kelas ?? "")
            .replace("{jam}", orientasi.tolak_mulai ? jamJendela(orientasi.tolak_mulai, zonaTolak) : "—")
            .replace("{jam_selesai}", orientasi.tolak_selesai ? jamJendela(orientasi.tolak_selesai, zonaTolak) : "—");
        })();
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
            zona={zona}
            mode={mode}
            eyebrow={eyebrow}
            judul={nama}
            mulai={dimatikan ? (
              <div className="pin-stack" data-mulai-ditolak={tolak}>
                <button type="button" className="pin-btn pin-primary" disabled aria-describedby="mulai-tolak">
                  {s("cycle.open")} {nama}
                </button>
                <p id="mulai-tolak" className="pin-mm" role="status">{kalimatTolak}</p>
              </div>
            ) : (
              <form action={mulaiAsesmen}>
                <input type="hidden" name="penugasan" value={penugasan} />
                <input type="hidden" name="kembali" value={diriHref} />
                <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.memulai")}>
                  {s("cycle.open")} {nama}
                </TombolKirim>
              </form>
            )}
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
        {/* A2a, THE PLAN item 3: on reopening a sitting a stop held, once, until it is answered again */}
        {keadaan?.dilepas_henti ? (
          <p className="pin-mm" role="status" data-dilepas-henti="">
            {keadaan.tenggat
              ? s("pengerjaan.dilepas_henti").replace("{n}", String(menitTersisa(keadaan.tenggat)))
              : s("pengerjaan.dilepas_henti_tanpa")}
          </p>
        ) : null}
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

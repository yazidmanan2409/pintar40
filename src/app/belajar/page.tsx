import Link from "next/link";
import { redirect } from "next/navigation";
import { t, format, type HleEvent, type Persona } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import { posisi, peringkat, statusKey, type Kandidat } from "@/lib/siklus";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import Tur from "@/components/tur/Tur";
import { PARAM_BANTUAN } from "@/components/tur/TombolBantuan";
import { bolehTampilOtomatis, varianBelajar, TUR_BELAJAR } from "@/lib/tur";
import { keadaanTur, peranSaya } from "@/lib/tur-negara";
import { konteksPembelajaran } from "@/lib/pembelajaran";
import JejakSiklus from "@/components/siklus/JejakSiklus";
import KartuTugas from "@/components/siklus/KartuTugas";

export const dynamic = "force-dynamic";

/**
 * SCREEN A — THE PERSONAL-LEARNING HOME, AND IT IS NOT A DASHBOARD.
 *
 * ═══ WP6B: ONE SURFACE, BECAUSE THERE IS ONLY ONE KIND OF OWN LEARNING ═══
 *
 * An educator opening their own professional development is doing what a
 * fifteen-year-old does at the same address, through the same engine, over a
 * course the school enrolled them in. So this page serves both rather than
 * being copied — a second landing would be a second answer to "what should I do
 * next", and the two would drift by the second sprint.
 *
 * NOTHING ABOUT ENTITLEMENT CHANGES, AND NOTHING HERE DECIDES IT.
 * `my_learning_assignments()` selects on an ACTIVE enrolment, an open
 * membership and node containment, and reads no role at all. This page asks it
 * the same question for everybody and renders the answer. An educator with no
 * enrolment gets nothing, exactly as a person with no enrolment always did; an
 * educator with one gets that one. Holding EDUCATOR neither adds nor removes a
 * row, and this file could not make it do so — the read happens before anything
 * below is known.
 *
 * WHAT DOES CHANGE IS WHO IS BEING SPOKEN TO. Somebody who also teaches is told
 * whose learning this is and that it stands apart from their classes, is kept
 * one press from Kelas by the shell, and is never handed the first-login tour
 * written for a child arriving at school. That is the whole difference, and it
 * is framing: the assignments, the ranking, the cards and every route out of
 * here are identical, because the learning is identical.
 *
 * AND IT IS NOT A ROLE SWITCH. Nobody becomes a Student to read this. There is
 * no mode, no second account, no `display_role` anywhere in this file, and no
 * control that changes who the person is — the only thing that changed between
 * Mengajar and here is which of their two contexts they are looking at.
 *
 * The primary Slice-2 problem: a learner arriving here should not have to
 * choose. One panel carries the single most appropriate next action, decided
 * in `src/lib/siklus.ts` from cycle state and lesson progress rather than from
 * list position, and everything below it is quiet.
 *
 * FOUR SECTIONS, AND TWO OF THEM VANISH. "Perlu perhatian" and "Bisa
 * dikerjakan sekarang" are absent entirely when there is nothing in them —
 * honest absence, never an empty container explaining that it is empty. The
 * home of a learner with nothing to do is short, and that is the correct
 * shape for it.
 */
export default async function Belajar({
  searchParams,
}: {
  searchParams: Promise<{ lanjut?: string; [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const viewer = await currentViewer();
  if (!viewer) redirect("/masuk?lanjut=/belajar");
  const locale = await currentLocale();
  const db = (await supabaseServer()) as unknown as engine.EngineClient;

  // WP6B. Which of their contexts this person is reading from — asked of the
  // roles they hold, answered before any copy is chosen, and used for nothing
  // else. The persona it selects changes no existing sentence on this page: the
  // copy table carries no `learner:` override anywhere, so every `siklus.*` key
  // tells an educator precisely what it tells a learner. UX1-AJAR-KATA-01
  // asserts that rather than trusting it.
  const konteks = konteksPembelajaran(await peranSaya());
  const persona: Persona = konteks.mengajar ? "educator" : "learner";
  const s = (k: HleEvent) => t(k, persona, { locale });

  const tugas = await engine.myAssignments(db);

  // One round of reads per assignment, then the ranking. The cycle state says
  // where the learner is; the lessons say how far through the reading they
  // are. Both are needed before anything can be called "next".
  const kandidat: Kandidat[] = await Promise.all(
    tugas.map(async (a): Promise<Kandidat> => {
      const [state, lessons] = await Promise.all([
        engine.cycleState(db, a.learning_assignment_id),
        engine.lessons(db, a.learning_assignment_id),
      ]);
      return {
        tugas: a,
        posisi: posisi(state, lessons),
        // A session already open or paused is the one obvious next action,
        // whatever step it belongs to.
        berjalan: Boolean(
          (state.post_session && state.post_status !== "FINALIZED") ||
            (state.pre_session && state.pre_status !== "FINALIZED"),
        ),
      };
    }),
  );
  const { utama, sisa } = peringkat(kandidat);

  // Q-12: what a learner may start that no learning assignment names. The RPC
  // returns exactly what `may_start_assessment()` accepts, so this list adds
  // no authority — everything in it is genuinely startable right now.
  const terbuka = await engine.openAssessments(db);

  // ───────────────────────────────────────────────── the first-login tour (UX-1)
  //
  // WHICH VARIANT. `varianBelajar` is handed nothing, and that is the whole of
  // the stage decision: this release has no person-scoped stage signal, and the
  // two it does have — `courses.stage` and the session's assessment stage —
  // are properties of a course and of a session, not of a learner. Guessing
  // from either would tell a fifteen-year-old that PINTAR thinks they are
  // eight, so the stage-neutral variant is what runs (§L-1, Sauron 2026-09-18).
  //
  // WHETHER IT OPENS BY ITSELF. Two exclusions on top of what the database
  // says, both of them about not interrupting work, and neither of them spends
  // a presentation:
  //   · a deep link — the person was going somewhere (§J-9);
  //   · a teacher's Quick Assessment window standing open on this very page —
  //     a class waiting for a quick check is never held up by onboarding
  //     (§J-10). `my_open_assessments` carries the mode, so this is the page's
  //     own information rather than a second question asked of the database.
  //
  // WHOSE TOUR IT IS (WP6B). The learner's first login belongs to somebody
  // holding no role assignment — `role_assignments` forbids STUDENT, so that is
  // exactly the set of people who are here as learners and nothing else. An
  // educator is not one of them, and presenting them a child's onboarding would
  // be PINTAR announcing that it had mistaken them for a student. So the state
  // is not even read for them: an unread tour cannot be presented, and no
  // presentation is spent.
  const keadaan = konteks.turBelajar ? await keadaanTur(TUR_BELAJAR) : null;
  const bolehTur = bolehTampilOtomatis(keadaan, {
    tautanLangsung: typeof sp.lanjut === "string" && sp.lanjut.length > 0,
    ujiCepatBerjalan: terbuka.some((a) => a.mode === "QUICK"),
  });

  /** Where a step actually leads, and what the button for it says. */
  function aksi(k: Kandidat): { href: string; labelKey: HleEvent } | null {
    const id = k.tugas.learning_assignment_id;
    switch (k.posisi.langkah) {
      case "PEMETAAN": return { href: `/belajar/${id}/pemetaan`, labelKey: "siklus.mulai" };
      case "PETA": return { href: `/belajar/${id}/peta`, labelKey: "siklus.lihat_peta" };
      case "PELAJARAN": return { href: `/belajar/${id}`, labelKey: "siklus.lanjutkan" };
      case "PENGUASAAN": return { href: `/belajar/${id}/penguasaan`, labelKey: "siklus.mulai" };
      case "HASIL": return { href: `/belajar/${id}/hasil`, labelKey: "siklus.buka" };
    }
  }

  // "Perlu perhatian": a cycle whose Mastery Check is the next thing and whose
  // reading is already done. It is not a deadline warning — PINTAR does not
  // have the learner's calendar — it is "this one is ready for you".
  const perhatian = sisa.filter(
    (k) => k.posisi.langkah === "PENGUASAAN" && !k.berjalan && k.posisi.pelajaranTotal > 0,
  );

  return (
    <>
      <CangkangPengalaman locale={locale} current="belajar" />
      <main className="pin-col">
        <div className="pin-head">
          <p className="pin-eyebrow">
            {konteks.mengajar ? s("pembelajaran.eyebrow") : s("siklus.beranda")}
          </p>
          <h1 className="pin-h1">
            {viewer.displayName ? `${s("siklus.halo")}, ${viewer.displayName}` : s("siklus.halo")}
          </h1>
          {/* The sentence that does the work for somebody who also teaches, and
              it is shown whether or not they have anything to do: the thing
              they most need to know is that this is theirs and that it is not
              about their teaching. A learner is told what is under way today,
              because for them there is no second context to be told apart. */}
          {konteks.mengajar ? (
            <p className="pin-intro">{s("pembelajaran.milik")}</p>
          ) : tugas.length > 0 ? (
            <p className="pin-intro">{s("siklus.hari_ini")}</p>
          ) : null}
        </div>

        {/* THE ONE THING. The only element on this page standing on the primary
            ground, because there is only ever one of it. */}
        {utama ? (
          <section className="pin-lanjut">
            <p className="pin-eyebrow">{s("siklus.lanjutkan")}</p>
            <p className="pin-where">
              {utama.tugas.subject} · {utama.tugas.title}
            </p>
            <h2>
              {s(statusKey(utama.posisi) as HleEvent)}
              {utama.posisi.langkah === "PELAJARAN" && utama.posisi.pelajaranTotal > 0
                ? ` — ${format.number(utama.posisi.pelajaranSelesai, locale)} ${s("siklus.dari")} ${format.number(utama.posisi.pelajaranTotal, locale)} ${s("siklus.selesai_n")}`
                : ""}
            </h2>
            <JejakSiklus posisi={utama.posisi} locale={locale} />
            <div className="pin-actions">
              {(() => {
                const a = aksi(utama);
                return a ? (
                  <Link className="pin-btn pin-primary" href={a.href}>
                    {s(a.labelKey)}
                  </Link>
                ) : null;
              })()}
              <Link className="pin-btn" href={`/belajar/${utama.tugas.learning_assignment_id}`}>
                {s("siklus.buka")}
              </Link>
            </div>
          </section>
        ) : null}

        {perhatian.length > 0 ? (
          <section className="pin-sec">
            <h2>{s("siklus.perhatian")}</h2>
            {perhatian.map((k) => (
              <div className="pin-perhatian" key={k.tugas.learning_assignment_id}>
                <span className="pin-what">{k.tugas.title}</span>
                <span className="pin-why">{s("siklus.di.penguasaan")}</span>
                <div className="pin-actions">
                  <Link className="pin-btn" href={`/belajar/${k.tugas.learning_assignment_id}/penguasaan`}>
                    {s("siklus.mulai")}
                  </Link>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {/* THE TOUR'S FIRST TARGET. The anchor is on the section rather than
            on a card, so the spotlight lands on the same area whether there is
            work here or the empty line — which is what lets step 1 keep its
            place in an empty page without anything being invented to point at
            (§J-1, §J-2). */}
        <section className="pin-sec" data-tur="daftar">
          <h2>{s("siklus.milik_anda")}</h2>
          {tugas.length === 0 ? (
            konteks.mengajar ? (
              // NOT AN ERROR, NOT A REFUSAL, NOT A SETUP STEP. Nobody has
              // enrolled this person in anything, which is an ordinary state of
              // affairs — so it is said in the quiet voice an empty section is
              // always said in here, with a second line saying what would make
              // it fill. Nothing on this path mentions permission, an account,
              // or anything the educator is supposed to go and do.
              <>
                <p className="pin-empty">{s("pembelajaran.kosong")}</p>
                <p className="pin-mm">{s("pembelajaran.kosong_arti")}</p>
              </>
            ) : (
              <p className="pin-empty">{s("cycle.none")}</p>
            )
          ) : (
            [...(utama ? [utama] : []), ...sisa].map((k) => (
              <KartuTugas
                key={k.tugas.learning_assignment_id}
                tugas={k.tugas}
                posisi={k.posisi}
                locale={locale}
                aksi={aksi(k)}
              />
            ))
          )}
        </section>

        {/* Q-12. Absent when there is nothing open, like every other section
            here that has nothing to say. */}
        {terbuka.length > 0 ? (
          <section className="pin-sec">
            <h2>{s("siklus.terbuka")}</h2>
            {terbuka.map((a) => (
              <div className="pin-tugas" key={a.assessment_assignment_id}>
                <span className="pin-ttitle">{a.title}</span>
                <div className="pin-tfoot">
                  <span className="pin-tstatus">
                    {format.number(a.item_count, locale)} {s("siklus.soal")} · {a.node_name}
                    {a.closes_at ? ` · ${s("siklus.ditutup")} ${format.date(a.closes_at, locale)}` : ""}
                  </span>
                  <Link className="pin-btn" href={`/belajar/asesmen/${a.assessment_assignment_id}`}>
                    {s("siklus.buka")}
                  </Link>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {/* THEIR CERTIFICATES, THROUGH THE ONE CERTIFICATE ARCHITECTURE.
            The learner's shell gives this a tab; somebody who also teaches
            reaches it from inside their learning, because for them it is one
            thing within one of two contexts rather than half the product. The
            destination is the same page, listing the same certificates by the
            same rules — there is no second certificate surface, and no second
            kind of certificate for it to show. */}
        {konteks.mengajar ? (
          <section className="pin-sec">
            <h2>{s("nav.sertifikat")}</h2>
            <p className="pin-mm">{s("pembelajaran.sertifikat_arti")}</p>
            <div className="pin-actions">
              <Link className="pin-btn" href="/belajar/sertifikat">{s("siklus.buka")}</Link>
            </div>
          </section>
        ) : null}

        <KakiPintar />
      </main>

      {/* A SIBLING OF THE PAGE, NOT A CHILD OF IT: while a step is open the
          tour makes every sibling inert, and a tour mounted inside `main`
          would be making itself inert along with the page. */}
      {konteks.turBelajar ? (
        <Tur
          kunci={TUR_BELAJAR}
          varian={varianBelajar(null)}
          locale={locale}
          persona="learner"
          keadaan={keadaan}
          otomatis={bolehTur.boleh}
          bantuanAwal={sp[PARAM_BANTUAN] === "1"}
          kosong={tugas.length === 0 ? ["daftar"] : []}
        />
      ) : null}
    </>
  );
}

import Link from "next/link";
import TandaTautan from "@/components/TandaTautan";
import { t, type Locale } from "@/lib/hle";
import { peranSaya } from "@/lib/tur-negara";
import { currentViewer } from "@/lib/auth";
import { konteksPembelajaran } from "@/lib/pembelajaran";
import PengalihBahasa from "./PengalihBahasa";
import MerekPintar from "./MerekPintar";
import TombolBantuan from "./tur/TombolBantuan";
import SesiSaya from "./SesiSaya";
import TabTempat, { tempatDariPeran, tawarkanStudio } from "./TabTempat";

/**
 * The Experience shell: the mark, where you are, and the language switch.
 *
 * TWO KINDS, AND THE DIFFERENCE MATTERS. A signed-in learner gets the tabs,
 * because they have somewhere to go. A stranger holding a verification link
 * gets the wordmark and the name of what this page is, and NO NAVIGATION — a
 * verification page that offered a way into PINTAR would be inviting somebody
 * who came to check a certificate to go looking at something else.
 *
 * A THIRD, ADDED IN SLICE 2: `focus`, for a learner inside an assessment. Same
 * reasoning as the public shell from the opposite direction — there the
 * navigation would invite a stranger further in, here it would invite a
 * learner out of a task they are being timed on.
 *
 * The language switch is on all three, because the reader of a public
 * verification page has no account to carry a preference in (S0.3), and a
 * learner does not lose their language by starting an assessment.
 *
 * BANTUAN, ADDED IN UX-1 §F. The shell had no help entry — two learner tabs,
 * one educator tab, and the language switch — so the tour's last step ("help
 * can always be found here") had nowhere true to point and Daisy's proposed
 * header control stands rather than being withdrawn (L-5). It is on the two
 * shells that have a landing to return to, and on neither of the other two:
 * §G-3 forbids a tour or a tip inside an assessment in progress and on the
 * public verification page, and a Help entry whose content is "start the tour"
 * would be offering exactly that.
 *
 * A FOURTH, ADDED IN SLICE 3: `pengajar`, the educator's shell. It is the
 * learner shell's shape with the educator's own destination, and it carries ONE
 * tab because Slice 3 builds one surface. The reviewed concept showed three —
 * Kelas, Materi, Akun — and the other two have no route yet; a tab that goes
 * nowhere is a promise the product cannot keep, so it is absent until the slice
 * that builds it arrives rather than present and inert.
 *
 * A FIFTH, ADDED IN WP4: `pimpinan`, the Management shell. Same shape again, one
 * tab, for the same reason — WP4 builds one Management landing and the branch
 * beneath it is reached from the page rather than from the header.
 *
 * A SIXTH, ADDED IN WP5B: `pendataan`, the institutional intake shell. One tab
 * again, to the intake's own entry — the job beneath it is reached from the
 * page, because a job is a thing you were sent to rather than a place you
 * navigate to.
 *
 * IT CARRIES NO HELP, AND THAT IS THE SHELL'S OWN RULE RATHER THAN AN OMISSION.
 * `TombolBantuan` opens a panel whose content is the tour for this experience,
 * and the tours that exist are `learner.first_login` and
 * `educator.first_login`. There is no Management tour, so a Help entry here
 * would open a panel offering nothing — which is the same objection §G-3 makes
 * to a Help entry inside an assessment, from the other direction.
 *
 * ═══ WP6B: THE EDUCATOR SHELL GAINS ITS SECOND TAB, AND THE LEARNING SHELL
 * LEARNS WHO IS READING IT ═══
 *
 * An educator may also be learning — the same person, the same account, a
 * different legitimate context — and the two are kept apart rather than merged.
 * So Mengajar gains ONE neighbour, Pembelajaran Saya, and that is the whole of
 * the navigation change: no role switcher, no second dashboard, no third place
 * to be.
 *
 * THE SAME TWO TABS THEN FOLLOW THEM INTO THEIR LEARNING. When somebody who
 * teaches opens the learning surface, the header still says Kelas — so they can
 * be back with their class in one press and never had to leave a context to get
 * here. Building this into the shell rather than into eleven pages is not
 * economy: it is the only way a lesson, a mapping and a certificate page cannot
 * disagree about who is reading them.
 *
 * WHICH IS ALSO WHY IT IS THE SHELL THAT ASKS. The question is "does this
 * person also teach", it is asked of the roles they hold, and it decides a
 * header. It decides nothing about what they may learn: `my_learning_assignments()`
 * reads no role, so a person with no enrolment sees an empty page under either
 * header, and no header ever added a course to it.
 *
 * AND THE LEARNING SHELL CARRIES NO HELP FOR THEM, by the rule two paragraphs
 * up. The two tours that exist are a learner's first login and an educator's;
 * neither is a map of an educator's own learning, and the learner's is the one
 * thing this work package must never show them. A Help entry offering the wrong
 * map is worse than none, so there is none — the same answer WP4 reached for
 * Management, for the same reason.
 */
export default async function CangkangPengalaman({
  locale,
  kind = "learner",
  current,
}: {
  locale: Locale;
  kind?: "learner" | "public" | "focus" | "pengajar" | "pimpinan" | "pendataan";
  current?: "belajar" | "sertifikat" | "kelas" | "pimpinan" | "pendataan" | "aktivasi";
}) {
  // ONE READ, IN PARALLEL (DAISY-02/03). The viewer and the reader's own active
  // roles are asked once, together, for every signed-in shell, and handed down:
  // the staff shells offer the other places those roles lead to (D-010), the
  // session strip decides from the same roles whether to name the reader (S15,
  // D-020), and the learner branch below decides its context from them too.
  // The public verification page reads nothing: nobody is signed in to it.
  const [viewer, peran] = kind === "public" ? [null, null] : await Promise.all([currentViewer(), peranSaya()]);
  const tempat = tempatDariPeran(peran);
  // DAISY-11 (D-021): the Studio tab, from the same roles, for every staff
  // shell. Studio itself still asks the database on arrival.
  const studio = tawarkanStudio(peran);

  // FOCUS. During an assessment the shell keeps the mark and the language and
  // drops the tabs. The engine survives navigating away — a session is server
  // state, not a page — but a header offering three ways out of a timed task
  // is inviting the learner to take one, and the cost of taking it is theirs.
  // The public verification shell already works this way for its own reason.
  if (kind === "focus") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <span className="pin-spacer" />
        <PengalihBahasa locale={locale} />
        <SesiSaya locale={locale} persona="learner" viewer={viewer} peran={peran} />
      </header>
    );
  }

  if (kind === "pengajar") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <nav className="pin-tabs" aria-label={t("app.name", "educator", { locale })}>
          <Link href="/mengajar" aria-current={current === "kelas" ? "page" : undefined}>
            {t("nav.kelas", "educator", { locale })}
            <TandaTautan />
          </Link>
          {/* Always here, never conditional on there being something behind it.
              A tab that appeared the day somebody was enrolled would be
              announcing the enrolment to anyone watching the header, and an
              educator who has no learning is entitled to the plain answer
              rather than to no door. */}
          <Link href="/belajar" aria-current={undefined}>
            {t("nav.pembelajaran", "educator", { locale })}
            <TandaTautan />
          </Link>
          <TabTempat tempat={tempat} kecuali={["/mengajar"]} locale={locale} persona="educator" studio={studio} />
        </nav>
        <span className="pin-spacer" />
        <TombolBantuan locale={locale} persona="educator" beranda="/mengajar" />
        <PengalihBahasa locale={locale} />
        <SesiSaya locale={locale} persona="educator" viewer={viewer} peran={peran} />
      </header>
    );
  }

  if (kind === "pimpinan") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <nav className="pin-tabs" aria-label={t("app.name", "staff", { locale })}>
          <Link href="/pimpinan" aria-current={current === "pimpinan" ? "page" : undefined}>
            {t("nav.pimpinan", "staff", { locale })}
            <TandaTautan />
          </Link>
          <TabTempat tempat={tempat} kecuali={["/pimpinan"]} locale={locale} persona="staff" studio={studio} />
        </nav>
        <span className="pin-spacer" />
        <PengalihBahasa locale={locale} />
        <SesiSaya locale={locale} persona="staff" viewer={viewer} peran={peran} />
      </header>
    );
  }

  if (kind === "pendataan") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <nav className="pin-tabs" aria-label={t("app.name", "staff", { locale })}>
          <Link href="/pendataan" aria-current={current === "pendataan" ? "page" : undefined}>
            {t("nav.pendataan", "staff", { locale })}
            <TandaTautan />
          </Link>
          {/* Aktivasi is the same audience's next step -- recorded people who
              cannot sign in yet -- and was reachable only by typing it (M3). */}
          <Link href="/aktivasi" aria-current={current === "aktivasi" ? "page" : undefined}>
            {t("nav.aktivasi", "staff", { locale })}
            <TandaTautan />
          </Link>
          <TabTempat tempat={tempat} locale={locale} persona="staff" studio={studio} />
        </nav>
        <span className="pin-spacer" />
        <PengalihBahasa locale={locale} />
        <SesiSaya locale={locale} persona="staff" viewer={viewer} peran={peran} />
      </header>
    );
  }

  if (kind === "public") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <span className="pin-sub">{t("verifikasi.situs", "public", { locale })}</span>
        <span className="pin-spacer" />
        <PengalihBahasa locale={locale} />
      </header>
    );
  }

  // WP6B. The only read this component makes, and only on the learning shell:
  // the other four return above without asking anything.
  const { mengajar } = konteksPembelajaran(peran);
  if (mengajar) {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <nav className="pin-tabs" aria-label={t("app.name", "educator", { locale })}>
          <Link href="/mengajar" aria-current={undefined}>
            {t("nav.kelas", "educator", { locale })}
            <TandaTautan />
          </Link>
          {/* Their certificates live under this tab rather than beside it: the
              learner's shell gives Sertifikat top billing because learning is
              the whole of their product, and for somebody who also teaches it
              is one thing inside one of two contexts. It is reached from the
              page, which is the same choice WP5B made about a job. */}
          <Link href="/belajar" aria-current={current ? "page" : undefined}>
            {t("nav.pembelajaran", "educator", { locale })}
            <TandaTautan />
          </Link>
          <TabTempat tempat={tempat} kecuali={["/mengajar"]} locale={locale} persona="educator" studio={studio} />
        </nav>
        <span className="pin-spacer" />
        <PengalihBahasa locale={locale} />
        <SesiSaya locale={locale} persona="educator" viewer={viewer} peran={peran} />
      </header>
    );
  }

  return (
    <header className="pin-top pin-shell pin-noprint">
      <MerekPintar />
      <nav className="pin-tabs" aria-label={t("app.name", "learner", { locale })}>
        <Link href="/belajar" aria-current={current === "belajar" ? "page" : undefined}>
          {t("nav.belajar", "learner", { locale })}
          <TandaTautan />
        </Link>
        {/* A stable anchor for the tour's certificate step. It names a place,
            and naming a place grants nothing: what is behind this tab is
            decided by the certificate's own authority, not by the tour. */}
        <Link
          href="/belajar/sertifikat"
          data-tur="sertifikat"
          aria-current={current === "sertifikat" ? "page" : undefined}
        >
          {t("nav.sertifikat", "learner", { locale })}
          <TandaTautan />
        </Link>
      </nav>
      <span className="pin-spacer" />
      <TombolBantuan locale={locale} persona="learner" beranda="/belajar" />
      <PengalihBahasa locale={locale} />
      <SesiSaya locale={locale} persona="learner" viewer={viewer} peran={peran} />
    </header>
  );
}

import Link from "next/link";
import TandaTautan from "@/components/TandaTautan";
import { t, type Locale } from "@/lib/hle";
import { peranSaya } from "@/lib/tur-negara";
import { currentViewer } from "@/lib/auth";
import { konteksPembelajaran } from "@/lib/pembelajaran";
import PengalihBahasa from "./PengalihBahasa";
import MerekPintar from "./MerekPintar";
import TombolBantuan from "./tur/TombolBantuan";
import TautanLapor from "@/components/lapor/TautanLapor";
import SesiSaya from "./SesiSaya";
import TabTempat, { tempatDariPeran, tawarkanStudio } from "./TabTempat";
import { navKonteks } from "./NavKonteks";
import { konteksSaya } from "@/lib/konteks-server";
import { melayani } from "@/lib/konteks";
import type { ReactNode } from "react";
import Ikon from "./Ikon";
import ItemNav from "./ItemNav";

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
  halamanKini,
}: {
  locale: Locale;
  kind?: "learner" | "public" | "focus" | "pengajar" | "pimpinan" | "pendataan";
  current?: "belajar" | "sertifikat" | "kelas" | "pimpinan" | "pendataan" | "aktivasi";
  /**
   * A page that is not one of the places but sits in a staff shell (D-140, review RV-3/RV-4): Konfigurasi's own pages,
   * Akun saya, «Laporkan masalah». The phone bar names it, and its parent place (Konfigurasi for its own pages) is
   * marked current in the navigation; Keamanan akun and Kirim email uji also show as their own item.
   */
  halamanKini?: "keamanan" | "emailuji" | "akun" | "lapor";
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
  // L3 (CR-83; D-132 §2.4): with a working context, every staff shell's tabs are that context's own surfaces and the
  // one way to change it is the chooser (NavKonteks); no tab leads into another context. Without one (an evaluation
  // persona, C10) the shells read the roles as before.
  const k = kind === "public" ? null : await konteksSaya();
  const adaKonteks = k?.keadaan === "ADA";
  // D-140 (RV-3/RV-4): the word for a page that is not a place, and the place it belongs to
  const KATA_HALAMAN = { keamanan: "keamanan.judul", emailuji: "emailuji.judul", akun: "akun.judul", lapor: "nav.lapor" } as const;
  const kataKini = halamanKini ? t(KATA_HALAMAN[halamanKini], "staff", { locale }) : null;
  const indukKini = halamanKini === "keamanan" || halamanKini === "emailuji" ? "/konfigurasi" : undefined;
  const subKini = halamanKini === "keamanan"
    ? <ItemNav href="/konfigurasi/keamanan" label={t("keamanan.judul", "staff", { locale })} kini />
    : halamanKini === "emailuji"
      ? <ItemNav href="/konfigurasi/email-uji" label={t("emailuji.judul", "staff", { locale })} kini />
      : null;

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
    return shellStaf({
      locale, persona: "educator",
      kini: kataKini ?? t("nav.kelas", "educator", { locale }),
      bantuan: <TombolBantuan locale={locale} persona="educator" beranda="/mengajar" />,
      sesi: <SesiSaya locale={locale} persona="educator" viewer={viewer} peran={peran} />,
      nav: (
        <>
          <ItemNav href="/mengajar" label={t("nav.kelas", "educator", { locale })} kini={current === "kelas"} />
          {/* Always here, never conditional on there being something behind it.
              A tab that appeared the day somebody was enrolled would be
              announcing the enrolment to anyone watching the header, and an
              educator who has no learning is entitled to the plain answer
              rather than to no door. */}
          {adaKonteks ? (
            await navKonteks({ locale, persona: "educator", kecuali: ["/mengajar"], bentuk: "nav", kini: indukKini })
          ) : (
            <>
              <ItemNav href="/belajar" label={t("nav.pembelajaran", "educator", { locale })} />
              <TabTempat tempat={tempat} kecuali={["/mengajar"]} locale={locale} persona="educator" studio={studio} bentuk="nav" kini={indukKini} />
            </>
          )}
        </>
      ),
    });
  }

  if (kind === "pimpinan") {
    return shellStaf({
      locale, persona: "staff",
      kini: kataKini ?? t("nav.pimpinan", "staff", { locale }),
      sesi: <SesiSaya locale={locale} persona="staff" viewer={viewer} peran={peran} />,
      nav: (
        <>
          <ItemNav href="/pimpinan" label={t("nav.pimpinan", "staff", { locale })} kini={current === "pimpinan"} />
          {await navKonteks({ locale, persona: "staff", kecuali: ["/pimpinan"], bentuk: "nav", kini: indukKini })}
        </>
      ),
    });
  }

  if (kind === "pendataan") {
    return shellStaf({
      locale, persona: "staff",
      kini: kataKini ?? t(current === "aktivasi" ? "nav.aktivasi" : "nav.pendataan", "staff", { locale }),
      sesi: <SesiSaya locale={locale} persona="staff" viewer={viewer} peran={peran} />,
      nav: (
        <>
          {!adaKonteks || (k?.keadaan === "ADA" && melayani(k, "/pendataan")) ? (
            <ItemNav href="/pendataan" label={t("nav.pendataan", "staff", { locale })} kini={current === "pendataan"} />
          ) : null}
          {/* Aktivasi is the same audience's next step -- recorded people who
              cannot sign in yet -- and was reachable only by typing it (M3). */}
          {!adaKonteks || (k?.keadaan === "ADA" && melayani(k, "/aktivasi")) ? (
            <ItemNav href="/aktivasi" label={t("nav.aktivasi", "staff", { locale })} kini={current === "aktivasi"} />
          ) : null}
          {adaKonteks ? (
            await navKonteks({ locale, persona: "staff", kecuali: ["/pendataan", "/aktivasi"], bentuk: "nav", kini: indukKini })
          ) : (
            <TabTempat tempat={tempat} locale={locale} persona="staff" studio={studio} bentuk="nav" kini={indukKini} />
          )}
          {subKini}
        </>
      ),
    });
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
    return shellStaf({
      locale, persona: "educator",
      kini: kataKini ?? t("nav.pembelajaran", "educator", { locale }),
      sesi: <SesiSaya locale={locale} persona="educator" viewer={viewer} peran={peran} />,
      lapor: "educator",
      nav: (
        <>
          {adaKonteks ? null : <ItemNav href="/mengajar" label={t("nav.kelas", "educator", { locale })} />}
          {/* Their certificates live under this tab rather than beside it: the
              learner's shell gives Sertifikat top billing because learning is
              the whole of their product, and for somebody who also teaches it
              is one thing inside one of two contexts. It is reached from the
              page, which is the same choice WP5B made about a job. */}
          <ItemNav href="/belajar" label={t("nav.pembelajaran", "educator", { locale })} kini={Boolean(current)} />
          {adaKonteks ? (
            await navKonteks({ locale, persona: "educator", kecuali: ["/belajar"], bentuk: "nav" })
          ) : (
            <TabTempat tempat={tempat} kecuali={["/mengajar"]} locale={locale} persona="educator" studio={studio} bentuk="nav" />
          )}
        </>
      ),
    });
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
        {/* L3: a person who also holds another context (an admin who learns, DG-20) has the chooser here, the one
            way to change it; a learner who holds only Belajar sees nothing new */}
        {adaKonteks ? await navKonteks({ locale, persona: "learner", kecuali: ["/belajar"] }) : null}
      </nav>
      <span className="pin-spacer" />
      <TombolBantuan locale={locale} persona="learner" beranda="/belajar" />
      <PengalihBahasa locale={locale} />
      <SesiSaya locale={locale} persona="learner" viewer={viewer} peran={peran} />
    </header>
  );
}

/**
 * THE STAFF SHELL (the design system's AppShell; question 1 and question 11, 5 Oct; D-138 step 3).
 *
 * One header, three layouts, decided by CSS alone so nothing is drawn twice (the tour and the help panel live in it):
 * - 1024 px and wider: a sticky left navigation, the person's places above and the person below (`.pin-staf`).
 * - Under 1024 px: a top bar (the mark, the current place, «Keluar», the menu button) and a menu that drops below it
 *   with the same places, Bantuan, «Laporkan masalah» and the language.
 * The menu opens with a checkbox and its label, so it works before any script has loaded on a slow classroom tablet,
 * the same reason «Keluar» is a real form. «Keluar» is visible at every width without opening anything (D-009).
 * The places are the ones the reader already had (TabTempat, navKonteks); a place shown decides nothing.
 */
function shellStaf({
  locale,
  persona,
  kini,
  nav,
  bantuan,
  sesi,
  lapor,
}: {
  locale: Locale;
  persona: "educator" | "staff";
  /** The current place's word, for the top bar under 1024 px. */
  kini: string;
  nav: ReactNode;
  bantuan?: ReactNode;
  sesi: ReactNode;
  /** The persona «Laporkan masalah» speaks to, when it is not the shell's own. */
  lapor?: "educator";
}) {
  return (
    <header className="pin-top pin-shell pin-noprint pin-staf">
      <div className="pin-staf-kepala">
        <MerekPintar />
      </div>
      <span className="pin-bar-tempat">{kini}</span>
      <input type="checkbox" id="pin-laci" className="pin-laci-saklar" aria-label={t("nav.menu", persona, { locale })} aria-controls="pin-laci-isi" />
      <label htmlFor="pin-laci" className="pin-laci-tombol" aria-hidden="true">
        <Ikon nama="menu" kelas="pin-ikon-buka" />
        <Ikon nama="x" kelas="pin-ikon-tutup" />
      </label>
      <div className="pin-laci" id="pin-laci-isi">
        <nav className="pin-tabs" aria-label={t("nav.tempat", persona, { locale })}>
          {nav}
        </nav>
        <div className="pin-staf-bawah">
          {bantuan}
          {/* DAISY-12 (D-037 step 2): beside Bantuan on every staff shell */}
          <TautanLapor locale={locale} persona={lapor ?? (persona === "educator" ? "educator" : undefined)} />
          <PengalihBahasa locale={locale} />
        </div>
      </div>
      {sesi}
    </header>
  );
}

/**
 * The staff shell for a surface that decides its own places (Konfigurasi, Studio): the page passes its items, drawn
 * with ItemNav, and the shell adds the reader, Bantuan's neighbours and the way out exactly as on every other staff
 * surface (D-138 step 3).
 */
export async function CangkangStaf({ locale, kini, nav }: { locale: Locale; kini: string; nav: ReactNode }) {
  const [viewer, peran] = await Promise.all([currentViewer(), peranSaya()]);
  return shellStaf({
    locale, persona: "staff", kini, nav,
    sesi: <SesiSaya locale={locale} persona="staff" viewer={viewer} peran={peran} />,
  });
}

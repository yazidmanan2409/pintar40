import { turPengajarBerlaku } from "@/lib/tur";

/**
 * PEMBELAJARAN SAYA — WHICH CONTEXT IS THIS PERSON READING THEIR OWN LEARNING IN?
 *
 * ═══ THE ONE THING THIS DOES NOT DECIDE ═══
 *
 * IT DECIDES NOTHING ABOUT ENTITLEMENT, and it could not. What a person may
 * learn comes from `my_learning_assignments()`, which selects on an ACTIVE
 * enrolment, an open membership and node containment and READS NO ROLE AT ALL —
 * WP6A re-read it and recorded exactly that. So an educator does not get
 * learning for being an educator, and a person with no enrolment gets nothing
 * however many roles they hold. Nothing below can add a row to that answer,
 * because nothing below is asked before it.
 *
 * What this decides is WHICH SHELL the person is looking at, and one thing that
 * follows from the shell.
 *
 * ═══ WHY IT ASKS ABOUT ROLES HELD, NOT ABOUT `display_role` ═══
 *
 * `display_role` is a coalesce — the highest role assignment, or STUDENT when
 * enrolled — so it answers "what is the most senior thing about this person",
 * which is a different question. An educator who gains an enrolment keeps
 * EDUCATOR; a head of department who teaches reads HEAD_OF_DEPARTMENT. Neither
 * tells you whether Mengajar is a place this person goes.
 *
 * The roles actually held do, and §H-3's rule for WHICH MAP somebody is shown
 * already exists for precisely this: `turPengajarBerlaku` is "the educator's
 * map is this person's map", and it is reused rather than restated. So the door
 * back to teaching appears exactly where the educator tour would — one rule,
 * one place, no second opinion about who an educator is.
 *
 * ═══ AND THE TOUR FOLLOWS THE SHELL, WHICH IS NOT THE SAME AS FOLLOWING RANK ═══
 *
 * §H-3 already ruled that the learner landing carries NO seniority gate, because
 * a senior person's learner experience is still the learner experience. That
 * stands, and WP6B does not touch it: a head of department, a dean, an
 * institution administrator and a platform administrator all still get the
 * learner shell here and all still get its first-login tour. `turBelajar` is
 * `!mengajar` and nothing else, so rank does not enter into it.
 *
 * What changes is the educator, and for a mechanical reason rather than a
 * judgement about who deserves onboarding: two of the learner tour's seven
 * steps are ANCHORS — step 6 on the Sertifikat tab, step 7 on the Bantuan
 * control — and the educator's learning shell carries neither, because their
 * certificates are reached from the page and their Help would open the wrong
 * map. A tour whose last two steps spotlight controls that are not on the
 * screen is not a map, and "help can always be found here" pointing at nothing
 * is the exact promise the shell's own rule refuses to make.
 *
 * So the tour is presented when the page it describes is the page in front of
 * the reader. That it also happens to spare an educator a first-login tour
 * written for somebody arriving at school is a welcome consequence, not the
 * rule: the rule is that a map must match its territory.
 *
 * ═══ AND A FAILED READ FALLS BACK TO WHAT THE PRODUCT ALREADY DID ═══
 *
 * `peranSaya` returns null when it could not read — no person in the session,
 * or the read failed. That yields `mengajar: false`, which is the learner shell
 * and the learner tour: exactly the behaviour of every release before this one.
 * A hiccup in a role read therefore degrades to the old product rather than to a
 * page with a door that may not be this person's on it, and the shell it falls
 * back to is the one whose anchors the tour actually names.
 */
export type KonteksPembelajaran = {
  /**
   * This person also teaches, so their own learning is one of two contexts:
   * the shell keeps a way back to the other, and names this one.
   */
  mengajar: boolean;
  /**
   * The learner shell is what this person is looking at — so the learner
   * first-login tour describes the page in front of them and every anchor it
   * names is on it.
   */
  turBelajar: boolean;
};

export function konteksPembelajaran(peran: readonly string[] | null): KonteksPembelajaran {
  const mengajar = peran === null ? false : turPengajarBerlaku(peran);
  return { mengajar, turBelajar: !mengajar };
}

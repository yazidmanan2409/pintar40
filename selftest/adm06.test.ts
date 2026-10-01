/**
 * ADM-J06 -- A SCHOOL ADMIN IS TOLD HOW TO ADD A TEACHER, AND THE WAY IT TELLS IS TRUE.
 *
 * A staff row in the intake is refused at «Periksa» with a sentence that sent
 * the school admin to the platform admin («Admin platform memberikan
 * perannya»). Since BOB-21 (D-049) the school admin grants a school-scoped
 * role to anyone the school has recorded, so the sentence named the wrong
 * person and hid the path that works. (The account is made on Aktivasi; the
 * intake never speaks of activation, UX1-DATA-JUJUR-01) (journey cross-check ADM-J06: no "add
 * teacher" for a school admin). This reads the sentence in both languages and
 * the database rule it describes; the CI audit's S12 walks the path.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { t } from "../src/lib/hle";
import { Checks, type SelfTest } from "./lib";

export const adm06Tests: SelfTest[] = [
  {
    id: "ADM06-K01",
    run: async (ctx) => {
      const c = new Checks();
      const id = t("pendataan.masalah.staf", "staff", { locale: "id" });
      const en = t("pendataan.masalah.staf", "staff", { locale: "en" });
      // the intake never speaks of activation (UX1-DATA-JUJUR-01): the account is Aktivasi's, a screen of its own
      c.expect(/Peran & akses/.test(id) && /Anda/.test(id) && !/Admin platform/i.test(id),
        `the staff-row sentence (id) does not tell the school admin they give the role on Peran & akses, or still sends them to the platform admin: «${id}»`);
      c.expect(/Roles & access/.test(en) && /\byou\b/.test(en) && !/platform admin/i.test(en),
        `the staff-row sentence (en) does not name the school's own path: «${en}»`);

      // the rule the sentence describes: a school admin may grant a school-scoped role to a person the school has
      // recorded (its institutional ID); the latest definition of the grant guard, read from the migrations
      const mig = join(ctx.repoRoot, "supabase", "migrations");
      const terakhir = readdirSync(mig).filter((f) => f.endsWith(".sql"))
        .filter((f) => /create or replace function public\.role_assignments_guard\(/i.test(readFileSync(join(mig, f), "utf8"))).sort().at(-1) ?? "";
      const guard = readFileSync(join(mig, terakhir), "utf8");
      c.expect(/has_scope\('INSTITUTION_ADMIN', new\.scope_node_id\)/.test(guard)
        && /institutional_identities ii[\s\S]{0,200}ii\.person_id = new\.person_id and ii\.institution_id = v_target_inst/.test(guard),
        `the grant guard (${terakhir}) no longer lets a school admin give a school-scoped role to a person the school has recorded`);
      return c.verdict(
        "the copy table's staff-row sentence, in id and en, tells the school admin that they give the role on Konfigurasi → " +
          "Peran & akses, and no longer sends them to the platform admin; the latest grant guard in the migrations (source) still admits a school " +
          "admin's school-scoped grant to a person holding the school's institutional ID",
      );
    },
  },
];

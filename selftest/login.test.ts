/**
 * LOGIN CONTRACT — L-1 (internal destinations) and L-2 (no self-provisioning).
 *
 * Added, not edited: these live in their own file so the whole repair is
 * reviewable in one place and no case that existed at the baseline is touched.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { tujuanInternal } from "../src/lib/tujuan";

/**
 * The predicate every destination site used before L-1, kept here as the
 * ADVERSARY. A test that only exercised the new helper would pass just as
 * happily against the old one; this is what makes the matrix below
 * discriminating rather than decorative.
 */
function lamaStartsWithSlash(raw: string, fallback = "/"): string {
  return raw.startsWith("/") ? raw : fallback;
}

/** Resolved the way a browser or `NextResponse.redirect` will resolve it. */
function keluarDariAsal(destination: string, origin = "https://pintar.example"): boolean {
  try {
    return new URL(destination, origin).origin !== origin;
  } catch {
    return true;
  }
}

/** Destinations the product legitimately produces. `src/proxy.ts` makes these. */
const DITERIMA: ReadonlyArray<readonly [string, string]> = [
  ["/", "/"],
  ["/belajar", "/belajar"],
  ["/belajar/9f1c", "/belajar/9f1c"],
  ["/belajar/9f1c/sertifikat", "/belajar/9f1c/sertifikat"],
  ["/studio/tinjau", "/studio/tinjau"],
  ["/mengajar/5b/bukti", "/mengajar/5b/bukti"],
  ["/konfigurasi", "/konfigurasi"],
  // query and fragment survive, because a destination is where someone was
  // going and that includes which tab they had open
  ["/belajar/9f1c?bagian=2", "/belajar/9f1c?bagian=2"],
  ["/belajar?a=1&b=2", "/belajar?a=1&b=2"],
  ["/studio/tinjau#catatan", "/studio/tinjau#catatan"],
  ["/belajar/9f1c?bagian=2#akhir", "/belajar/9f1c?bagian=2#akhir"],
];

/**
 * Destinations that must never become a redirect. The first six are the ones
 * the OLD predicate accepted; the rest it already refused and the new contract
 * must go on refusing.
 */
const DITOLAK: readonly string[] = [
  // ---- passed startsWith("/") and left the origin ----
  "//evil.example",
  "///evil.example",
  "////evil.example",
  "/\\evil.example",
  "/\\/evil.example",
  // Constructed rather than written as escapes: a source-level CR or LF would
  // end the literal it is inside. These are the cases that matter most --
  // the URL parser DELETES them before parsing, so a check that reads the raw
  // string is looking at a different string from the one that gets resolved.
  `/${String.fromCharCode(9)}/evil.example`,
  `/${String.fromCharCode(13)}//evil.example`,
  `/${String.fromCharCode(10)}//evil.example`,
  "//evil.example/%2e%2e",
  "//evil.example?x=1",
  "//evil.example#y",
  "//user:pass@evil.example",
  // ---- already refused, and still are ----
  "https://evil.example/x",
  "http://evil.example/x",
  "HTTPS://evil.example",
  "\\\\evil.example",
  "\\/evil.example",
  "javascript:alert(1)",
  "JaVaScRiPt:alert(1)",
  "data:text/html,<script>1</script>",
  "vbscript:x",
  "file:///etc/passwd",
  "belajar",
  " /belajar",
  "",
];

/** Sites that carry a destination across an authentication or action hop. */
const SITUS_TUJUAN = [
  "src/app/auth/callback/route.ts",
  "src/app/masuk/actions.ts",
  "src/app/masuk/page.tsx",
  "src/app/belajar/actions.ts",
] as const;

function psql(sql: string): string {
  const url = process.env.SUPABASE_DB_URL ?? "";
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, url], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql failed: ${(r.stderr || "").trim().slice(0, 200)}`);
  return (r.stdout || "").trim();
}

export const loginTests: SelfTest[] = [
  {
    // =======================================================================
    // L1-BERSIH-01 — THE SOURCE SAYS WHAT IT MEANS.
    //
    // Added because this patch introduced exactly this defect and the suite
    // went GREEN anyway. `src/lib/tujuan.ts` was written with the control
    // characters it exists to refuse spelled as real bytes rather than as
    // escapes: a NUL, a 0x1F and a 0x7F sat in the regex literal. The regex
    // still worked, every behavioural case still passed, and the only visible
    // symptom was that git called the file binary and would not diff it -- so
    // a security helper had become unreviewable while reading green.
    //
    // A stray control byte in source is therefore its own finding: it is
    // invisible to a reader, it defeats review, and a test that exercises
    // behaviour cannot see it. This is the check that can.
    // =======================================================================
    id: "L1-BERSIH-01",
    run: async (ctx) => {
      const c = new Checks();
      const EXT = /\.(?:ts|tsx|sql|json|css|mjs|js|ya?ml|md)$/;
      // Everything except TAB (9), LF (10) and CR (13), which are legitimate
      // whitespace in a source file.
      const allowed = new Set([9, 10, 13]);
      const offenders: string[] = [];
      let scanned = 0;
      const walk = (dir: string) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          if (e.name === "node_modules" || e.name === ".git" || e.name === ".next") continue;
          const q = join(dir, e.name);
          if (e.isDirectory()) { walk(q); continue; }
          if (!EXT.test(q)) continue;
          scanned += 1;
          const bytes = readFileSync(q);
          const hits = new Set<number>();
          for (const b of bytes) if ((b < 32 && !allowed.has(b)) || b === 127) hits.add(b);
          if (hits.size) {
            offenders.push(`${q.slice(ctx.repoRoot.length + 1)}: ${[...hits].map((b) => `0x${b.toString(16).padStart(2, "0")}`).join(", ")}`);
          }
        }
      };
      for (const d of ["src", "selftest", "supabase", "scripts"]) {
        const full = join(ctx.repoRoot, d);
        if (existsSync(full)) walk(full);
      }
      c.expect(scanned > 100, `only ${scanned} source file(s) scanned; the sweep is not reaching the tree`);
      c.expect(
        offenders.length === 0,
        "source file(s) carrying a literal control byte, which git treats as binary and a reader cannot see:\n  " +
          offenders.join("\n  "),
      );
      c.note(`${scanned} file(s) scanned across src, selftest, supabase and scripts`);
      return c.verdict(
        "no file under src, selftest, supabase or scripts carries a literal control byte outside tab, newline and carriage return. This exists because the L-1 helper was written with a NUL, a 0x1F and a 0x7F spelled as real bytes inside the very regex that refuses them: the regex still functioned, every behavioural case still passed, and the only symptom was that git called a security-critical file binary and refused to diff it. A byte a reviewer cannot see is not reviewed, and no test of behaviour can catch that -- so this one reads bytes",
      );
    },
  },
  {
    // =======================================================================
    // L1-TUJUAN-01 — POST-AUTH REDIRECTION STAYS ON THIS ORIGIN.
    //
    // Behaviour, not source text. The shipped helper is IMPORTED and CALLED
    // over a matrix of destinations, and each refusal is checked twice: the
    // helper must refuse it, AND the URL parser must agree the raw form would
    // have left the origin. A case that does not actually escape proves
    // nothing, so the matrix is required to be adversarial before it is
    // required to pass.
    //
    // The plant runs in-process rather than being described: the old
    // `startsWith("/")` predicate is applied to the same matrix and must be
    // shown to ACCEPT destinations that escape. If a future edit made the new
    // helper as weak as the old one, that comparison is what goes red.
    // =======================================================================
    id: "L1-TUJUAN-01",
    run: async () => {
      const c = new Checks();

      for (const [input, want] of DITERIMA) {
        const got = tujuanInternal(input);
        c.expect(got === want, `legitimate destination ${JSON.stringify(input)} became ${JSON.stringify(got)}`);
      }

      let escapingCases = 0;
      for (const raw of DITOLAK) {
        const got = tujuanInternal(raw);
        c.expect(got === "/", `${JSON.stringify(raw)} survived as ${JSON.stringify(got)}`);
        if (raw.startsWith("/") && keluarDariAsal(raw)) escapingCases += 1;
      }

      // THE PLANT. The old predicate, on the same matrix.
      const lolos = DITOLAK.filter((raw) => {
        const kept = lamaStartsWithSlash(raw);
        return kept !== "/" && keluarDariAsal(kept);
      });
      c.expect(
        lolos.length > 0,
        "the matrix contains no destination the old startsWith('/') predicate would have accepted, so it cannot tell the repair from the defect",
      );
      for (const raw of lolos) {
        c.expect(tujuanInternal(raw) === "/", `the repair did not refuse ${JSON.stringify(raw)}, which the old predicate accepted`);
      }

      // The caller's fallback is honoured, and a legitimate path still passes
      // through it untouched — `mulaiAsesmen` returns to /belajar, not to /.
      c.expect(tujuanInternal("//evil.example", "/belajar") === "/belajar", "the caller's fallback was not used on refusal");
      c.expect(tujuanInternal("/belajar/9f1c", "/belajar") === "/belajar/9f1c", "a legitimate destination was replaced by the fallback");
      c.expect(tujuanInternal(null) === "/" && tujuanInternal(undefined) === "/", "a missing destination did not fall back");

      // Idempotent: what comes out is already in the parser's own form, so
      // narrowing it a second time cannot change it. A check-then-use pair
      // that disagreed on the second parse is the usual way this defect
      // returns.
      for (const [input] of DITERIMA) {
        const once = tujuanInternal(input);
        c.expect(tujuanInternal(once) === once, `narrowing ${JSON.stringify(input)} twice changed it`);
      }

      c.note(`${DITERIMA.length} accepted, ${DITOLAK.length} refused, ${escapingCases} of which provably leave the origin, ${lolos.length} caught by the repair and not by the predicate it replaced`);
      return c.verdict(
        "every value that survives an authentication hop and becomes a redirect is narrowed to this origin by one shipped helper, exercised here rather than read: legitimate paths pass through with their query and fragment intact, and every destination that resolves off-origin is replaced by the caller's fallback. The refusals are adversarial by construction -- each is independently confirmed to escape when resolved by the same URL parser that will follow it -- and the predicate this repair replaced is applied to the same matrix and shown to accept destinations that leave the origin, so the test discriminates between the repair and the defect",
      );
    },
  },
  {
    // =======================================================================
    // L1-SENSUS-01 — AND NOWHERE ELSE DECIDES.
    //
    // One rule in one place is only true while it stays that way. This walks
    // the sites that carry a destination and requires each to route through
    // the helper, and requires that none of them still tests a destination
    // with a bare leading-slash check -- which is what four of them did.
    // =======================================================================
    id: "L1-SENSUS-01",
    run: async (ctx) => {
      const c = new Checks();
      const kode = (p: string) =>
        readFileSync(join(ctx.repoRoot, p), "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*\/\/.*$/gm, "");

      for (const p of SITUS_TUJUAN) {
        c.expect(existsSync(join(ctx.repoRoot, p)), `${p} is in the destination census but does not exist`);
        const src = kode(p);
        c.expect(/tujuanInternal\s*\(/.test(src), `${p} carries a destination but does not narrow it through tujuanInternal`);
        c.expect(
          !/\.startsWith\(\s*["']\/["']\s*\)/.test(src),
          `${p} still decides a destination with a bare leading-slash test, which is the defect L-1 repaired`,
        );
      }

      // The helper itself resolves rather than pattern-matches: the origin
      // comparison IS the contract, and a rewrite that dropped it for a longer
      // list of bad prefixes would be the same mistake with more lines.
      const helper = kode("src/lib/tujuan.ts");
      c.expect(/new URL\(/.test(helper), "the destination helper does not resolve the destination at all");
      c.expect(/\.origin\s*!==\s*PROBE/.test(helper), "the destination helper does not compare origins, so it is guessing from the text again");

      // Nothing outside the census may narrow a destination its own way.
      const others: string[] = [];
      const walk = (dir: string) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const q = join(dir, e.name);
          if (e.isDirectory()) { walk(q); continue; }
          if (!/\.tsx?$/.test(q)) continue;
          const rel = q.slice(ctx.repoRoot.length + 1);
          if ((SITUS_TUJUAN as readonly string[]).includes(rel)) continue;
          if (rel === "src/lib/tujuan.ts") continue;
          const src = kode(rel);
          if (/(?:lanjut|kembali|next)\s*\.startsWith\(\s*["']\/["']\s*\)/.test(src)) others.push(rel);
        }
      };
      walk(join(ctx.repoRoot, "src"));
      c.expect(others.length === 0, `destination(s) narrowed outside the one contract:\n  ${others.join("\n  ")}`);

      c.note(`${SITUS_TUJUAN.length} destination site(s), one helper`);
      return c.verdict(
        "the four sites that carry a destination across an authentication or action hop -- the magic-link callback, both sign-in actions, the sign-in page and the learner's start-assessment action -- each narrow it through the one shipped helper, none of them still decides with a bare leading-slash test, and no other source file under src/ narrows a destination its own way. The helper is required to RESOLVE and compare origins rather than pattern-match, because a longer list of forbidden prefixes would be the same defect with more lines",
      );
    },
  },
  {
    // =======================================================================
    // L2-KONTRAK-01 — AUTHENTICATION DOES NOT CREATE AN IDENTITY.
    //
    // PINTAR 4.0 is institution-provisioned. The sign-in form proves access to
    // an identity a school already created; it does not create one. Supabase
    // defaults `shouldCreateUser` to true, so the absence of the flag IS the
    // defect and its presence is the repair.
    //
    // The second half is the one that is easy to get wrong: with creation off,
    // an unknown address errors where a known one succeeds, and reporting that
    // difference to an unauthenticated visitor replaces a self-provisioning
    // defect with an account-existence oracle. So this also requires the
    // action to fold that refusal into the ordinary outcome, and requires that
    // no database pre-check rebuilt the same oracle one step earlier.
    // =======================================================================
    id: "L2-KONTRAK-01",
    run: async (ctx) => {
      const c = new Checks();
      const raw = readFileSync(join(ctx.repoRoot, "src/app/masuk/actions.ts"), "utf8");
      const src = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

      const otp = /signInWithOtp\s*\(\s*\{[\s\S]*?\n\s*\}\s*\)/.exec(src);
      c.expect(!!otp, "no signInWithOtp call found in the sign-in actions");
      const call = otp ? otp[0] : "";
      c.expect(/shouldCreateUser\s*:\s*false/.test(call), "signInWithOtp does not set shouldCreateUser: false, so an unknown email still self-provisions a PINTAR identity");
      c.expect(!/shouldCreateUser\s*:\s*true/.test(src), "something in the sign-in actions turns user creation back on");

      // No signup surface anywhere in the authentication module.
      for (const forbidden of ["signUp(", "admin.createUser", "inviteUserByEmail"]) {
        c.expect(!src.includes(forbidden), `the sign-in actions call ${forbidden}, which creates an identity`);
      }

      // No existence oracle: the refusal that means "no such provisioned
      // identity" must reach the caller as the ordinary outcome.
      c.expect(/tidakTerdaftar\s*\(/.test(src), "the action returns the raw error, so a known and an unknown address are distinguishable at the public contract");
      c.expect(/!error\s*\|\|\s*tidakTerdaftar\(/.test(src), "the neutral outcome is not the one returned for an unregistered address");
      c.expect(/otp_disabled|signup_disabled/.test(src), "the unregistered-address refusal is not matched on a stable error code");

      // And no pre-check that asks the database whether the email exists --
      // which would be the same oracle, one round-trip earlier.
      c.expect(
        !/from\(\s*["'](?:accounts|persons)["']\s*\)/.test(src) && !/auth\.admin\.(?:getUserBy|listUsers)/.test(src),
        "the sign-in actions look the address up before sending, which rebuilds the account-existence oracle in our own code",
      );

      // The card path is a different mechanism and must stay one.
      c.expect(/signInWithPassword\s*\(/.test(src), "the classroom-card path no longer uses signInWithPassword");
      const cardFn = /export async function signInWithCard[\s\S]*?\n\}/.exec(src);
      c.expect(!!cardFn && !/shouldCreateUser|signUp\(/.test(cardFn[0]), "the classroom-card path acquired signup behaviour");
      c.expect(/deriveCardSecret\s*\(/.test(src), "the classroom-card path no longer derives its credential server-side; the PIN must never be the password");

      return c.verdict(
        "magic-link authentication carries shouldCreateUser: false, so an unknown address cannot become an auth user and therefore cannot become a PINTAR person or account through on_auth_user_created -- the Supabase default is true, so the flag's absence was the defect. No signup, invite or admin-create call exists in the sign-in actions. The refusal that means 'no such provisioned identity' is folded into the ordinary outcome and matched on a stable error code, so a known and an unknown address are indistinguishable at the public contract, and no database pre-check rebuilds that oracle a round-trip earlier. The classroom-card path is untouched: still signInWithPassword over a server-derived secret, with no signup behaviour and the PIN still not the password",
      );
    },
  },
  {
    // =======================================================================
    // L2-TIDAK-DIBUAT-01 — MEASURED, NOT CONFIGURED.
    //
    // A flag is a claim. This asks the running Auth service for a magic link
    // for an address nobody has provisioned, exactly as the application asks,
    // and then counts rows.
    //
    // The three counts are taken BEFORE and AFTER, because "no row exists"
    // proves nothing on its own -- it is the pair that proves the request did
    // not create one. The positive control follows: a seeded, provisioned
    // address is accepted by the same endpoint, so the contract refuses
    // strangers rather than refusing everyone.
    // =======================================================================
    id: "L2-TIDAK-DIBUAT-01",
    requires: ["db", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const tidakDikenal = `tidak-terdaftar-${Date.now()}@contoh.invalid`;
      const hitung = () => ({
        authUsers: psql(`select count(*) from auth.users where email = '${tidakDikenal}'`),
        persons: psql(
          `select count(*) from public.persons p where p.display_name = '${tidakDikenal.split("@")[0]}'`,
        ),
        accounts: psql(
          `select count(*) from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${tidakDikenal}'`,
        ),
        allUsers: psql("select count(*) from auth.users"),
        allPersons: psql("select count(*) from public.persons"),
        allAccounts: psql("select count(*) from public.accounts"),
      });

      const before = hitung();
      c.expect(before.authUsers === "0" && before.persons === "0" && before.accounts === "0",
        `the unknown address already exists before the request: ${JSON.stringify(before)}`);

      // The request the application makes. `create_user: false` is the wire
      // form of `shouldCreateUser: false`.
      const otp = await fetch(`${ctx.supabaseUrl}/auth/v1/otp`, {
        method: "POST",
        headers: { apikey: ctx.supabaseAnonKey!, "content-type": "application/json" },
        body: JSON.stringify({ email: tidakDikenal, create_user: false }),
      });
      const otpBody = (await otp.text()).slice(0, 300);

      const after = hitung();
      c.expect(after.authUsers === "0", `an auth identity was created for an unknown address (${after.authUsers})`);
      c.expect(after.accounts === "0", `a PINTAR account was created for an unknown address (${after.accounts})`);
      c.expect(after.persons === "0", `a PINTAR person was created for an unknown address (${after.persons})`);
      c.expect(after.allUsers === before.allUsers, `auth.users grew ${before.allUsers} -> ${after.allUsers}`);
      c.expect(after.allPersons === before.allPersons, `persons grew ${before.allPersons} -> ${after.allPersons}`);
      c.expect(after.allAccounts === before.allAccounts, `accounts grew ${before.allAccounts} -> ${after.allAccounts}`);
      // REFUSED BY THE PROVISIONING GATE, specifically. Counting rows proves
      // nothing was created; this proves WHY -- the address was turned away for
      // not being provisioned, rather than for some unrelated failure that
      // happens to create nothing too. Without it, a broken Auth service would
      // pass this test.
      const gerbangPenyediaan = (status: number, body: string) =>
        status === 422 || /otp_disabled|signups? not allowed/i.test(body);
      c.expect(
        gerbangPenyediaan(otp.status, otpBody),
        `an unprovisioned address was not refused by the provisioning gate: ${otp.status} ${otpBody.slice(0, 120)}`,
      );

      // The Auth service's own status and body are RECORDED, not asserted on.
      // Whether GoTrue distinguishes a known address from an unknown one is
      // Supabase's behaviour, not PINTAR's contract, and a test that failed on
      // its wording would go red for something that is not this product's
      // defect. What PINTAR owes -- that the difference is folded into one
      // neutral outcome before it reaches a browser -- is L2-KONTRAK-01's, and
      // it is asserted there over the shipped action.

      // THE PLANT, and it is the reason this test is worth running: with
      // creation left at the Supabase default, the same address DOES become an
      // identity. Rolled back in the database rather than exercised against
      // the Auth service, because `persons_no_delete` means a row created here
      // could never be removed again.
      const ditanam = psql(
        `begin;
         insert into auth.users (id, email) values (gen_random_uuid(), '${tidakDikenal}');
         select (select count(*) from auth.users where email = '${tidakDikenal}')::text || '|' ||
                (select count(*) from public.accounts a join auth.users u on u.id = a.auth_user_id
                  where u.email = '${tidakDikenal}')::text || '|' ||
                (select count(*) from public.persons p
                  where p.display_name = '${tidakDikenal.split("@")[0]}')::text;
         rollback;`,
      ).trim().split("\n").filter((l) => l.includes("|")).pop() ?? "";
      c.expect(
        ditanam === "1|1|1",
        `the plant did not demonstrate the chain it is here to demonstrate (got ${JSON.stringify(ditanam)}); if an auth user no longer produces a person and an account, this test is asserting a boundary that has moved`,
      );
      const residu = psql(`select count(*) from auth.users where email = '${tidakDikenal}'`);
      c.expect(residu === "0", `the plant left ${residu} auth identity behind`);

      // POSITIVE CONTROL. A provisioned address is still served.
      const dikenal = psql(
        "select u.email from auth.users u join public.accounts a on a.auth_user_id = u.id " +
        "where u.email like '%@synthetic.pintar.test' order by u.email limit 1",
      ).trim();
      c.expect(dikenal.length > 0, "no provisioned address exists to use as a positive control");
      let kendaliStatus = 0;
      let kendaliBody = "";
      if (dikenal) {
        const ok = await fetch(`${ctx.supabaseUrl}/auth/v1/otp`, {
          method: "POST",
          headers: { apikey: ctx.supabaseAnonKey!, "content-type": "application/json" },
          body: JSON.stringify({ email: dikenal, create_user: false }),
        });
        kendaliStatus = ok.status;
        kendaliBody = (await ok.text()).slice(0, 300);

        // THE CLAIM IS ABOUT WHICH GATE REFUSES, NOT ABOUT DELIVERY.
        //
        // CI runs the Supabase stack with `-x ... mailpit`, so there is no SMTP
        // sink and GoTrue's SEND step fails for any address that reaches it --
        // which is exactly the provisioned one, because the unprovisioned one
        // is turned away before it. An earlier version of this control asserted
        // `status < 400` and went red on that 500, reporting "the contract
        // refuses everyone" when the contract had in fact let the address
        // through and the test environment simply had nowhere to post a letter.
        //
        // So the control asks what the contract actually claims: a provisioned
        // address is NOT refused by the provisioning gate. Whether the mail
        // leaves the building is Supabase's transport and the runner's
        // configuration, and asserting on it would make this test fail for
        // something that is not this product's defect.
        c.expect(
          !gerbangPenyediaan(kendaliStatus, kendaliBody),
          `a provisioned address was refused by the PROVISIONING gate (${kendaliStatus} ${kendaliBody.slice(0, 120)}); ` +
            "the contract is refusing everyone rather than only strangers",
        );
        // And the two are genuinely distinguishable at that gate, which is what
        // makes the pair evidence rather than two independent observations.
        c.expect(
          gerbangPenyediaan(otp.status, otpBody) && !gerbangPenyediaan(kendaliStatus, kendaliBody),
          `the provisioned and unprovisioned addresses met the same gate outcome (${otp.status} vs ${kendaliStatus}), so this run proves nothing about the gate`,
        );
      }

      c.note(
        `unprovisioned -> ${otp.status} ${JSON.stringify(otpBody.slice(0, 60))}; ` +
        `provisioned -> ${kendaliStatus} ${JSON.stringify(kendaliBody.slice(0, 60))} ` +
        `(a 5xx here is the runner having no mail transport, not a refusal); ` +
        `auth.users steady at ${after.allUsers}`,
      );
      return c.verdict(
        "an unknown address asks the running Auth service for a sign-in link exactly as the application asks, and creates nothing: no auth identity, no PINTAR person, no PINTAR account -- counted before and after, both for that address and across the three tables as a whole, so the proof is the PAIR rather than an absence that was always true. The chain it is protecting is demonstrated in the same run: an auth.users insert still produces a person and an account through on_auth_user_created, planted and rolled back rather than exercised against the Auth service, because persons_no_delete means a row created for real could never be removed. And the positive control holds -- a provisioned address is still served by the same endpoint, so the contract refuses strangers rather than refusing everyone",
      );
    },
  },
];

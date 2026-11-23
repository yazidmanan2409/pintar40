/**
 * Z3 (stream B) captures for Daisy: K-02, K-03, K-04, K-05, M1/M2 and R-8, at 1280, 390 and 320 px, keyboard only.
 *
 * Run against a local stack and `next start` of this branch (port 3999), with the selftest's environment:
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/tangkap-z3.ts
 *
 * The world is A1's screen fixture (a class of the run's own, taught by the cycle's teacher, with one learner who signs
 * in) and C1W-A02's sealed bootstrap certificate; both are removed after the run. K-04's report is drawn from the
 * component itself with the app's built stylesheet (a withheld domain needs more learners than a fixture has); its
 * file says so. Each shot's horizontal overflow, focused element and live-region text go to CATATAN-Z3.txt.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { lit, psql } from "../../../../../selftest/bob26.test";
import { bersihkan, dunia, masuk, mulai, muat, muridUji, sebagai, GURU } from "../../../../../selftest/a1-layar.test";
import { BOOT_GURU } from "../../../../../selftest/c1w-layar.test";

// Playwright is the container's own (never a project dependency), loaded as the repository's other capture scripts load it
const { chromium } = createRequire(__filename)("playwright");
type Browser = Awaited<ReturnType<typeof chromium.launch>>;
type BrowserContext = Awaited<ReturnType<Browser["newContext"]>>;
type Page = Awaited<ReturnType<BrowserContext["newPage"]>>;

const ASAL = "http://127.0.0.1:3999";
const AKAR = join(__dirname, "..", "..", "..", "..", "..");
const KE = __dirname;
const LEBAR = [1280, 390, 320] as const;
const catatan: string[] = [];

async function kontekDari(browser: Browser, k: unknown): Promise<BrowserContext> {
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const kue = (k as { kue: Map<string, string> }).kue;
  await ctx.addCookies([...kue].map(([name, value]) => ({ name, value, url: ASAL })));
  return ctx;
}

/** Tab `n` times from the top, then record and shoot at each width. */
async function tangkap(p: Page, nama: string, alamat: string | null, opsi: { tab?: number; tunggu?: string; tambahan?: (p: Page) => Promise<string> } = {}) {
  for (const w of LEBAR) {
    await p.setViewportSize({ width: w, height: 900 });
    if (alamat) await p.goto(ASAL + alamat, { waitUntil: "networkidle" });
    if (opsi.tunggu) await p.waitForSelector(opsi.tunggu, { timeout: 20000 }).catch(() => undefined);
    await p.keyboard.press("Tab"); // the skip link first
    for (let i = 1; i < (opsi.tab ?? 1); i++) await p.keyboard.press("Tab");
    const info = await p.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const live = [...document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')].map((x) => (x.textContent ?? "").trim()).filter(Boolean).join(" | ");
      return {
        lebih: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        fokus: el ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} «${(el.textContent ?? "").trim().slice(0, 60)}»` : "none",
        live: live.slice(0, 300),
      };
    });
    const lain = opsi.tambahan ? await opsi.tambahan(p) : "";
    catatan.push(`${nama}-${w}\toverflow ${info.lebih}px\tfocus ${info.fokus}\tlive «${info.live}»${lain ? "\t" + lain : ""}`);
    await p.screenshot({ path: join(KE, `${nama}-${w}.png`) });
  }
}

const teksDi = async (p: Page, sel: string) => (await p.locator(sel).allInnerTexts().catch(() => [])).join(" / ").replace(/\s+/g, " ").slice(0, 400);

(async () => {
  muat(AKAR);
  psql(`\\i ${join(AKAR, "selftest", "db", "fable04.sql")}`);
  // as C1W-A02 clears its own: a review left by a run that died half-way holds its certificate
  const bersihSertifikat = () => psql(`begin; set local session_replication_role = replica;
    delete from public.certificate_reviews where institution_id in (select id from public.institutions where official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP');
    delete from public.key_corrections where reason like 'Z3 layar%'; commit; select selftest.purge_certificates();`);
  bersihSertifikat();
  const tag = `z3${Date.now().toString(36)}`;
  const d0 = dunia(tag);
  if (typeof d0 === "string") throw new Error(d0);
  const d = d0;
  const { uid, pid } = d.murid.masuk;
  const browser = await chromium.launch();
  try {
    // ---------------------------------------------------------------- K-02: the learner's Peta Bacaan after a clean mapping
    const pre = mulai(uid, d.pre, 50);
    sebagai(uid, `select public.finish_my_session(${lit(pre)}, null)`);
    const murid = await masuk(ASAL, muridUji(tag), "BELAJAR");
    if (typeof murid === "string") throw new Error(murid);
    const mk = await kontekDari(browser, murid);
    const mp = await mk.newPage();
    await tangkap(mp, "01-peta-kuat", `/belajar/${d.la}/peta`, { tab: 3,
      tambahan: async (p) => `cards: ${await teksDi(p, ".pin-kartu")}\tnote: ${await teksDi(p, "[data-peta-arti]")}` });

    // ---------------------------------------------------------------- K-03: the teacher's one-learner page, before any Uji Penguasaan
    const guru = await masuk(ASAL, GURU, `MENGAJAR:${d.inst}`);
    if (typeof guru === "string") throw new Error(guru);
    const gk = await kontekDari(browser, guru);
    const gp = await gk.newPage();
    const muridSatu = `/mengajar/${d.kelas}/murid/${pid}`;
    await tangkap(gp, "02-guru-belum-uji", muridSatu, { tab: 3, tambahan: async (p) => `objectives: ${await teksDi(p, "section[aria-labelledby=pin-murid-tujuan]")}` });

    // ---------------------------------------------------------------- M1/M2: the Uji Penguasaan another session holds, waiting for the teacher
    const post = mulai(uid, d.post, 1);
    await tangkap(mp, "03-tunggu-izin", `/belajar/${d.la}/penguasaan`, { tunggu: '[data-pulih="RECOVERY_NOT_AUTHORISED"]', tab: 2,
      tambahan: async (p) => `body: ${await teksDi(p, "[data-pulih] .pin-hasil")}\tclass: ${await p.locator("[data-pulih] .pin-hasil").first().getAttribute("class").catch(() => "")}` });

    // ---------------------------------------------------------------- K-03: a failed read (provoked locally: the read's grant lifted for the shot)
    psql("revoke execute on function public.tujuan_belum_tercapai(uuid, uuid) from authenticated");
    try {
      await tangkap(gp, "04-guru-gagal-baca", muridSatu, { tab: 3, tambahan: async (p) => `objectives: ${await teksDi(p, "section[aria-labelledby=pin-murid-tujuan]")}` });
    } finally {
      psql("grant execute on function public.tujuan_belum_tercapai(uuid, uuid) to authenticated");
    }

    // ---------------------------------------------------------------- K-03: the list, on an OFFICIAL Uji Penguasaan (the fixture school's are
    // synthetic, which the read leaves out; there the page rightly says «Belum ada Uji Penguasaan»): the bootstrap school's learner, one
    // sitting with wrong answers, read by the bootstrap school's teacher
    sebagai(uid, `select public.finish_my_session(${lit(post)}, null)`);
    await tangkap(gp, "05-guru-sintetis-selesai", muridSatu, { tab: 3, tambahan: async (p) => `results: ${await teksDi(p, "section[aria-labelledby=pin-murid-hasil]")}\tobjectives: ${await teksDi(p, "section[aria-labelledby=pin-murid-tujuan]")}` });
    bersihSertifikat(); // the bootstrap tenant's sittings too, so its learner may sit again
    const sesiResmi = psql("select selftest.boot_attempt(false)").split("\n").pop()!.trim();
    const resmi = psql(`select concat_ws('|', aa.node_id, s.person_id, s.institution_id) from public.assessment_sessions s
      join public.assessment_assignments aa on aa.id = s.assessment_assignment_id where s.id = ${lit(sesiResmi)}`).split("|");
    const bg = await masuk(ASAL, BOOT_GURU, `MENGAJAR:${resmi[2]}`);
    if (typeof bg === "string") throw new Error(bg);
    const bgp = await (await kontekDari(browser, bg)).newPage();
    await tangkap(bgp, "05-guru-tujuan-resmi", `/mengajar/${resmi[0]}/murid/${resmi[1]}`, { tab: 3, tambahan: async (p) => `results: ${await teksDi(p, "section[aria-labelledby=pin-murid-hasil]")}\tobjectives: ${await teksDi(p, "section[aria-labelledby=pin-murid-tujuan]")}` });

    // ---------------------------------------------------------------- R-8: another class's assignment, under the learner's own address
    const asing = psql(`select x.la from selftest.cycle_fixture() x`);
    await tangkap(mp, "06-bukan-milik-hasil", `/belajar/${asing}/hasil`, { tab: 2, tambahan: async (p) => `page: ${await teksDi(p, "main")}` });
    // recovery: the way on is the page's own link (keyboard: Enter on it)
    await mp.setViewportSize({ width: 390, height: 900 });
    await mp.goto(`${ASAL}/belajar/${asing}/hasil`, { waitUntil: "networkidle" });
    await mp.locator("main a").first().focus();
    await mp.keyboard.press("Enter");
    await mp.waitForURL((u: URL) => !u.pathname.endsWith("/hasil"), { timeout: 15000 }).catch(() => undefined);
    await mp.waitForLoadState("networkidle");
    catatan.push(`06-bukan-milik-hasil-pulih\tEnter on «${await mp.locator("main a").first().innerText().catch(() => "")}» → ${mp.url().replace(ASAL, "")}`);
    await mp.screenshot({ path: join(KE, "06-bukan-milik-hasil-pulih-390.png") });

    // ---------------------------------------------------------------- K-05: the public check of a certificate under review, then revoked
    bersihSertifikat();
    const pra = JSON.parse(psql(`select row_to_json(t) from (select x.certificate_id, x.canonical_payload, s.sesi from (select selftest.boot_attempt(true) as sesi) s,
        lateral public.certificate_prepare(s.sesi, 1::smallint) x) t`)) as { certificate_id: string; canonical_payload: Record<string, unknown>; sesi: string };
    const { signWithKey } = await import("../../../../../src/lib/certificates/sign");
    const tanda = signWithKey(pra.canonical_payload as never, process.env.CERT_SECRET_KEY_V1 ?? "");
    const token = (psql(`do $$ declare v_s uuid := ${lit(pra.sesi)}; v_c uuid := ${lit(pra.certificate_id)}; v_r uuid; v_k uuid; v_i uuid; v_item uuid; begin
        perform public.certificate_seal(v_c, 1::smallint, ${lit(tanda)});
        select institution_id into v_i from public.certificates where id = v_c;
        select id into v_r from public.assessment_results where session_id = v_s and supersedes_result_id is null;
        select p.item_id into v_item from public.presented_items p where p.session_id = v_s order by p.position limit 1;
        set local session_replication_role = replica;
        insert into public.key_corrections (institution_id, line_root_course_id, asked_item_id, item_id, course_id, release_id, question_digest, key_before, key_after,
                                            reason, proposed_by_person_id, status, decided_at, decided_by_person_id)
        select v_i, r.course_id, v_item, v_item, r.course_id, r.id, 'x', '{A}', '{B}', 'Z3 layar kunci tertukar saat diketik',
               (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test'),
               'CONFIRMED', now(),
               (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-kaprodi@bootstrap.pintar.test')
          from public.assessment_sessions s join public.plp_releases r on r.id = s.plp_release_id where s.id = v_s returning id into v_k;
        insert into public.certificate_reviews (certificate_id, institution_id, session_id, opened_by_result_id, previous_result_id, key_correction_id)
        values (v_c, v_i, v_s, v_r, v_r, v_k);
        set local session_replication_role = origin;
        perform set_config('z3.token', (select verification_token from public.certificates where id = v_c), false);
      end $$; select current_setting('z3.token');`).split("\n").pop() ?? "").trim();
    const umum = await browser.newContext({ deviceScaleFactor: 2 });
    const up = await umum.newPage();
    const fakta = async (p: Page) => `facts: ${await teksDi(p, "main")}`;
    await tangkap(up, "07-verifikasi-ditinjau", `/verifikasi/${encodeURIComponent(token)}`, { tab: 1, tambahan: fakta });
    psql(`begin; set local session_replication_role = replica;
      delete from public.certificate_reviews where certificate_id = ${lit(pra.certificate_id)};
      update public.certificates set status = 'REVOKED', revoked_at = now(), revoked_reason = 'Z3 layar: dicabut untuk tangkapan' where id = ${lit(pra.certificate_id)}; commit;`);
    await tangkap(up, "08-verifikasi-dicabut", `/verifikasi/${encodeURIComponent(token)}`, { tab: 1, tambahan: fakta });
    bersihSertifikat();

    // ---------------------------------------------------------------- K-04: the school report's sentence, from the component and the app's stylesheet
    const css = readdirSync(join(AKAR, ".next", "static", "chunks")).filter((f) => f.endsWith(".css")).map((f) => readFileSync(join(AKAR, ".next", "static", "chunks", f), "utf8")).join("\n");
    const r = spawnSync(process.execPath, ["--import", "tsx", "-e", `(async () => {
      const { createElement: h } = await import("react"); const { renderToStaticMarkup: r } = await import("react-dom/server");
      const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiSekolah.tsx"); const K = (m.default.default ?? m.default);
      const d = (code, mean_score, withheld) => ({ objective_id: code, code, competency: "Kompetensi " + code, title: "Bidang " + code, mean_score, learners: 12, needed: 5, withheld: withheld ?? null });
      const e = (value) => [{ metric_id: "institution.competency_outcomes", label_key: "metrik.kompetensi.label", status: "ok", value }];
      process.stdout.write(JSON.stringify({ sebagian: r(h(K, { entries: e([d("A", 0.72), d("B", 0.81), d("C", null, "learners")]), locale: "id" })),
        penuh: r(h(K, { entries: e([d("A", 0.72), d("B", 0.81)]), locale: "id" })) }));
    })()`], { cwd: AKAR, encoding: "utf8" });
    const laporan = JSON.parse(r.stdout) as { sebagian: string; penuh: string };
    const kp = await (await browser.newContext({ deviceScaleFactor: 2 })).newPage();
    for (const [nama, isi] of [["09-laporan-sebagian", laporan.sebagian], ["10-laporan-penuh", laporan.penuh]] as const) {
      await kp.setContent(`<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width"><style>${css}</style></head>
        <body><main id="isi" class="pin-col">${isi}</main></body></html>`);
      await tangkap(kp, nama, null, { tab: 1, tambahan: async (p) => `sentence: ${await teksDi(p, "[data-lk-kalimat]")}` });
    }
  } finally {
    await browser.close();
    bersihkan();
    writeFileSync(join(KE, "CATATAN-Z3.txt"), catatan.join("\n") + "\n");
  }
})().catch((e) => { console.error(e); process.exit(1); });

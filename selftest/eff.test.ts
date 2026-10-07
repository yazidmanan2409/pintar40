/**
 * ASSISTANCE, ASKED FOR WHEN IT COULD BE DUE (owner ruling, 2 Oct; efficiency audits of 2 Oct).
 *
 * The question player used to ask the server every 5 s whether help was due: 23 server actions and Auth round trips
 * and 30% of the learner's RPC time per sitting, almost all "not yet", asked even where the assessment offers no
 * help, and its saves queued behind the checks. The server stays the authority (assistance_state). The player now
 * asks when the server's own figures say help could become due, not at all where no help is configured, again only
 * after a level is opened or an answer is taken while help is on screen; «Tutup» keeps the offer closed on that
 * question. The offline notice no longer rides on the check: option A, a light probe only while offline.
 *
 *   EFF-K01  executes jedaBantuan / jedaAwal and periksaSaatLuring (src/lib/bantuan-terjadwal.ts) and reads the
 *            question player, the assessment surface, the noteView action and the proxy's matcher for the wiring.
 *            Item 17 (owner ruling, 3 Oct): a recovery the probe finds enters the same path as the browser's `online`
 *            (the held answers are sent at once); executes dijawabDiHalaman: a question whose answer the page holds,
 *            acknowledged or held, sends no help check.
 *
 * WHOLE-SYSTEM AUDIT (2 Oct) -- A SCHOOL ADMINISTRATOR'S LISTS NAME THEIR SCHOOLS.
 *
 *   EFF-K02  Konfigurasi (src/app/konfigurasi/page.tsx) reads the enrolments and the audit trail of the schools the
 *            viewer administers, named, unless the viewer is the platform administrator; neither is read unnamed for a
 *            school administrator. (The policies return the same rows either way; unnamed, every row of every school
 *            is checked: 1,979 ms against 15 ms for the audit trail as gs-001's administrator on staging.)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as terjadwal from "../src/lib/bantuan-terjadwal";
import { ALAMAT_PERIKSA, SELISIH_MS, jedaAwal, jedaBantuan, periksaSaatLuring } from "../src/lib/bantuan-terjadwal";
import { Checks, type SelfTest } from "./lib";

const tidur = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
// strips comments, so a sentence about the old timer cannot satisfy or fail a wiring check
const kode = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
// the assistance checks' detector, run on the player and on a planted copy of the old poll
const pollBantuan = (src: string) => /(setInterval|tanyaBerkala)\([\s\S]{0,200}?actions\.assistance\(/.test(src);
// item 17: what the probe does on its first success, read from the player and from a planted copy of the old one
const pemulihanProbe = (src: string) => /periksaSaatLuring\(\s*\(\) => fetch\([\s\S]*?\),\s*([^,]+?),\s*5000,?\s*\)/.exec(src)?.[1]?.trim() ?? "";

export const effTests: SelfTest[] = [
  {
    id: "EFF-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. when to ask: from the server's figures, never where there is nothing to ask
      const w = { windowSeconds: 25, dwellSeconds: 10, due: false, answered: false };
      c.expect(jedaBantuan(w) === 15_000 + SELISIH_MS, `10 s into a 25 s window it asks in ${jedaBantuan(w)} ms`);
      c.expect(jedaBantuan({ ...w, windowSeconds: null }) === null, "it asks where the assessment offers no help");
      c.expect(jedaBantuan({ ...w, answered: true }) === null, "it asks about an answered question");
      c.expect(jedaBantuan({ ...w, due: true }) === null, "it asks again while help is already on offer");
      c.expect(jedaBantuan({ ...w, dwellSeconds: 40 }) === SELISIH_MS, "past the window it does not ask at once");
      c.expect(jedaAwal(25, null, false) === 25_000 + SELISIH_MS, "with no measured dwell it does not ask after the whole window");
      c.expect(jedaAwal(25, 3, true) === null && jedaAwal(null, 3, false) === null, "a first ask is planned where there is nothing to ask");

      // 2. the probe: only while offline, stops at the first yes, stops when told
      let tanya = 0, pulih = 0;
      const jawaban = [false, false, true];
      const stop = periksaSaatLuring(async () => jawaban[tanya++] ?? true, () => { pulih++; }, 20);
      await tidur(200);
      const setelah = tanya;
      await tidur(80);
      stop();
      c.expect(pulih === 1 && setelah === 3 && tanya === 3, `offline it probed ${setelah} time(s) and recovered ${pulih} time(s); after recovery it probed ${tanya - setelah} more`);
      let tanya2 = 0, pulih2 = 0;
      const stop2 = periksaSaatLuring(async () => { tanya2++; return false; }, () => { pulih2++; }, 20);
      await tidur(70);
      stop2();
      const saatBerhenti = tanya2;
      await tidur(80);
      c.expect(saatBerhenti >= 2 && tanya2 === saatBerhenti && pulih2 === 0, `stopped, it probed ${tanya2 - saatBerhenti} more time(s)`);
      let gagal = 0;
      const stop3 = periksaSaatLuring(async () => { gagal++; throw new Error("network"); }, () => { pulih2++; }, 20);
      await tidur(70);
      stop3();
      c.expect(gagal >= 2 && pulih2 === 0, "a probe that throws is taken as recovery or stops the probing");
      const proxy = readFileSync(join(repoRoot, "src", "proxy.ts"), "utf8");
      c.expect(ALAMAT_PERIKSA.startsWith("/brand/") && /\(\?!_next\/static\|_next\/image\|favicon\.ico\|brand\/\|fonts\/\)/.test(proxy),
        "the probe is not a static file outside the proxy's matcher (it would cost a session check)");

      // 2b. item 17: an answer the page holds sends no help check; holding it is not a receipt
      const lokal = (terjadwal as Record<string, unknown>).dijawabDiHalaman as
        ((d: Record<string, unknown>, t: { presentedItemId: string }[], id: string) => boolean) | undefined;
      c.expect(typeof lokal === "function", "dijawabDiHalaman is missing from src/lib/bantuan-terjadwal.ts");
      if (typeof lokal === "function") {
        c.expect(lokal({ a: { posisi: 1 } }, [], "a") === true, "an acknowledged answer does not suppress the help check");
        c.expect(lokal({}, [{ presentedItemId: "a" }], "a") === true, "an answer held for sending does not suppress the help check");
        c.expect(lokal({ b: { posisi: 1 } }, [{ presentedItemId: "c" }], "a") === false, "another question's answer suppresses this one's help check");
        c.expect(lokal({}, [], "a") === false, "a question with no answer taken sends no help check");
      }

      // 3. the wiring
      const pemain = kode(readFileSync(join(repoRoot, "src", "app", "belajar", "_components", "ItemPlayer.tsx"), "utf8"));
      c.expect(!pollBantuan(pemain), "the question player still asks about help on a timer of its own");
      c.expect(pollBantuan("tanyaBerkala(async () => { const r = await actions.assistance(itemId); }, 5000)")
        && pollBantuan("window.setInterval(() => { void actions.assistance(itemId); }, 5000)"),
        "the control: a planted 5 s poll of the assistance check is not caught");
      c.expect((pemain.match(/actions\.assistance\(/g) ?? []).length === 1, "the player asks about help from more than one place");
      c.expect(/jadwalkan\(jedaBantuan\(r\.state\)\)/.test(pemain) && /jedaAwal\(jendelaBantuan, v\.ok \? v\.dwellSeconds : null, terjawab\)/.test(pemain),
        "the player does not schedule its asks from the server's figures");
      const cek = /const tanya = async \(\) => \{([\s\S]*?)\n {4}\};/.exec(pemain)?.[1] ?? "";
      c.expect(cek.length > 0 && !/setOnline\(true\)/.test(cek) && /catch \{[\s\S]*?setOnline\(false\)/.test(cek)
        && /if \(!r\.ok\) \{ setAssist\(null\); return; \}/.test(cek),
        "the assistance check still drives the offline notice on a refusal or an answer (only a request that never arrives may)");
      c.expect(/ditutup\.current\.has\(itemId\)/.test(cek)
        && /onClick=\{\(\) => \{ ditutup\.current\.add\(itemId\); void actions\.dismissAssistance\(itemId\); setAssist\(null\); \}\}/.test(pemain),
        "«Tutup» does not keep the offer closed on that question");
      c.expect(/if \(online\) return;\s*return periksaSaatLuring\(/.test(pemain), "the probe is not limited to offline");
      // item 17: one recovery path. The browser's `online` and the probe's first success both send the held answers.
      c.expect(/const pulihkan = useCallback\(\(\) => \{ setOnline\(true\); void flush\(\); \}, \[flush\]\);/.test(pemain),
        "there is no single recovery that clears the notice and sends the held answers");
      c.expect(/window\.addEventListener\("online", pulihkan\);/.test(pemain), "the browser's `online` does not take the shared recovery");
      c.expect(pemulihanProbe(pemain) === "() => pulihkanRef.current()", `the probe's recovery is «${pemulihanProbe(pemain)}», not the shared recovery`);
      c.expect(pemulihanProbe("periksaSaatLuring(\n () => fetch(`${ALAMAT_PERIKSA}?periksa=${Date.now()}`, { method: \"HEAD\" }).then((r) => r.ok),\n () => setOnline(true),\n 5000,\n)") === "() => setOnline(true)",
        "the control: the old probe recovery (the notice only, nothing sent) is not read");
      // item 17: the scheduled help check is not sent for a question whose answer the page holds
      c.expect(/window\.setTimeout\(\(\) => \{\s*if \(dijawabDiHalaman\(diterima\.current, readEntries\(sessionId\), itemId\)\) return;\s*void tanya\(\);\s*\}, ms\)/.test(pemain),
        "the scheduled help check is sent for a question the learner has answered on this page");
      c.expect(/tanyaBantuan\.current\?\.\(\);\s*\}\s*\};/.test(pemain), "opening a level does not ask the server for the next one");
      const permukaan = readFileSync(join(repoRoot, "src", "app", "belajar", "_components", "PermukaanAsesmen.tsx"), "utf8");
      c.expect(/assistanceWindow=\{session\?\.hesitation_window_seconds \?\? null\}/.test(permukaan),
        "the assessment surface does not hand the player the assessment's window from the server");
      const aksi = readFileSync(join(repoRoot, "src", "app", "belajar", "actions.ts"), "utf8");
      c.expect(/dwellSeconds: Number\.isFinite\(sejak\) \? Math\.max\(0, \(Date\.now\(\) - sejak\) \/ 1000\) : null/.test(aksi),
        "the noteView action does not measure the time on screen from the server's first view");

      return c.verdict(
        "executes jedaBantuan and jedaAwal (src/lib/bantuan-terjadwal.ts): 10 s into a 25 s window the next ask is 15.5 s away; " +
          "no ask where no help is configured, the question is answered, or help is already on offer; executes periksaSaatLuring: " +
          "offline it probes until the first yes, then recovers once and stops; stopped, it probes no more; reads the question " +
          "player (src/app/belajar/_components/ItemPlayer.tsx): no timer of its own asks about help (a planted 5 s poll is caught), " +
          "the one ask is scheduled from the server's figures, a refusal does not turn on the offline notice, «Tutup» keeps the " +
          "offer closed, the probe runs only offline against a static file outside the proxy; the surface passes the server's window; " +
          "item 17: the probe's first success takes the same recovery as the browser's online (the held answers sent at once; the old " +
          "notice-only recovery is caught), and the scheduled check is not sent for a question answered on this page (dijawabDiHalaman executed)",
      );
    },
  },
  {
    id: "EFF-K02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const halaman = readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8");
      for (const [nama, tabel] of [["enrolmen", "enrollments"], ["jejak", "audit_log"]] as const) {
        c.expect(new RegExp(`const ${nama} = supabase\\.from\\("${tabel}"\\)`).test(halaman),
          `Konfigurasi does not read ${tabel} through «${nama}»`);
        c.expect((halaman.match(new RegExp(`from\\("${tabel}"\\)`, "g")) ?? []).length === 1,
          `Konfigurasi reads ${tabel} more than once`);
      }
      // RESTATED FOR L3 (D-132 C7) and FD-4: named by the working context's school (sekolahIni). The enrolments are
      // read for no school at all in «Seluruh platform», whose sections are not school-shaped, and unnamed only for an
      // evaluation persona as before (C10); the platform's audit stays the platform administrator's, its newest 50
      c.expect(/semuaSekolah \? enrolmen\.order\("created_at"\)\s*: sekolahIni\.length > 0 \? enrolmen\.in\("institution_id", sekolahIni\)\.order\("created_at"\) : tanpaBaris,/.test(halaman)
        && /const semuaSekolah = lama && isSys === true;/.test(halaman),
        "Konfigurasi reads enrollments without naming the administrator's schools");
      c.expect(/\(platformIni \? jejak : jejak\.in\("institution_id", sekolahIni\)\)\.order\("at", \{ ascending: false \}\)\.limit\(50\)/.test(halaman),
        "Konfigurasi reads audit_log without naming the administrator's schools");
      return c.verdict(
        "reads Konfigurasi (src/app/konfigurasi/page.tsx): a school administrator's enrolments and audit trail are read " +
          "for the working context's school, named (the platform's audit for the platform administrator in «Seluruh platform»; " +
          "no enrolments there), each read once",
      );
    },
  },
];

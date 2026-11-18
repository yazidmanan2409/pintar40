/**
 * A3 · THE RECOVERY ON THE SCREENS (THE PLAN §5.5 F; Daisy's A3-KODE-PEMULIHAN.md §1, §2, §4 (c), §5, §6, §7; O-4).
 *
 * A3-S10 reads the wiring the learner's screens keep (the old session's panel and its refusal classes; the new session's
 * one confirmation, its single attempt and «Coba lagi»). A3-J01 opens, in the running app, a sitting another session
 * controls: the low-stakes one asks «Lanjutkan di sini?» and plays nothing; the Uji Penguasaan plays nothing and starts
 * its one check.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";
import { Komputer } from "./bob29.test";
import { bersihkan, dunia, masuk, mulai, muat, muridUji, rapi, sebagai, teks } from "./a1-layar.test";

// a missing file reads as empty, so a red run names what is absent instead of throwing
const baca = (root: string, f: string) => (existsSync(join(root, f)) ? readFileSync(join(root, f), "utf8") : "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

export const a3LayarStaticTests: SelfTest[] = [
  {
    // A3-S10 (Daisy §1, §2, §4 (c), §5): the wiring the screens keep, read from the source
    id: "A3-S10",
    requires: [],
    run: async (ctx) => {
      const c = new Checks();
      const ip = baca(ctx.repoRoot, "src/app/belajar/_components/ItemPlayer.tsx");
      const ld = baca(ctx.repoRoot, "src/app/belajar/_components/LanjutkanDiSini.tsx");
      const pa = baca(ctx.repoRoot, "src/app/belajar/_components/PermukaanAsesmen.tsx");
      const ac = baca(ctx.repoRoot, "src/app/belajar/actions.ts");
      // the old session: a refused save is terminal ("lain"), never "pending" (which retried it for ever)
      c.expect(/if \(r\.code === "PR170" && r\.detail === "SITTING_NOT_CONTROLLER"\) return "lain";/.test(ip), "the player still keeps retrying a save another session's control refused");
      c.expect(/if \(lainRef\.current\) return "lain";/.test(ip) && /if \(diakhiri \|\| lain\) return;/.test(ip), "the player still replays or polls once the sitting continues elsewhere");
      c.expect(/if \(r\.keadaan\.di_sesi_ini === false\) \{ setLain\(true\); return; \}/.test(ip), "the player's check does not notice another session took the sitting");
      const panel = /if \(lain\) \{\s*return \(([\s\S]*?)\);\s*\}/.exec(ip)?.[1] ?? "";
      c.expect(/role="status"/.test(panel) && !/role="alert"/.test(panel) && !/pin-error|galat/.test(panel.replace(/pengerjaan\.galat\.sitting_not_controller/g, "")),
        "the old session's panel is not the quiet status Daisy set (§4 (c): not an error colour, not an alert)");
      c.expect(/pengerjaan\.pulih\.lain_judul/.test(panel) && /pengerjaan\.galat\.sitting_not_controller/.test(panel) && /pengerjaan\.pulih\.belum_tersimpan/.test(panel) && /href="\/belajar"/.test(panel),
        "the panel lacks its title, its body, the unsaved count or «Kembali ke Belajar»");
      c.expect(!/lanjutkan_di_sini|lanjutkanDiSini/.test(panel), "the old session's panel offers to take the sitting back (§2.5)");
      // the new session: one confirmation for low-stakes; one attempt on opening for an Uji Penguasaan; «Coba lagi» re-checks
      c.expect(/sekali\.current = true;/.test(ld) && (ld.match(/coba\(false\)/g) ?? []).length === 2 && (ld.match(/coba\(true\)/g) ?? []).length === 1,
        "the recovery screen calls the act other than once on opening, on «Lanjutkan di sini» and on «Coba lagi»");
      c.expect(!/setInterval|setTimeout\(\(\) => \{ void coba\(true\)/.test(ld) && !/router\.(push|replace)\(/.test(ld), "the recovery screen retries or redirects by itself (§2.1)");
      c.expect(/role="alert"/.test(ld) && /pengerjaan\.pulih\.diperiksa/.test(ld) && /pengerjaan\.pulih\.perlu_izin_isi/.test(ld), "the refusals are not alerts, or «Coba lagi» does not say when it checked, or the waiting body is missing");
      c.expect(/kode === "RECOVERY_NOT_AUTHORISED"\) \{[\s\S]*?rpc\("minta_izin_lanjut"/.test(ac), "a refusal for want of a permission does not send the request to the teacher's list");
      c.expect(/keadaan\.di_sesi_ini === false/.test(pa) && /<LanjutkanDiSini/.test(pa) && /<BarisLanjut/.test(pa), "the page does not choose the recovery screen, or the quiet line, from pengerjaan_saya");
      // O-4: the app cannot tell the device differs, so no learner sentence says «perangkat lain»
      const hle = readFileSync(join(ctx.repoRoot, "src/lib/hle.ts"), "utf8");
      const kata = [...hle.matchAll(/"pengerjaan\.pulih\.[a-z_]+": \{ default: "([^"]*)"/g)].map((m) => m[1]);
      c.expect(kata.length >= 11 && kata.every((k) => !/perangkat lain/.test(k)), `O-4: a recovery sentence names another device: ${kata.filter((k) => /perangkat lain/.test(k)).join(" | ")}`);
      return c.verdict("reads ItemPlayer.tsx, LanjutkanDiSini.tsx, PermukaanAsesmen.tsx, actions.ts and hle.ts: a save another session's control refuses is terminal for the old session (no replay, no probe, no poll), whose panel is a quiet status with its title, body, unsaved count and way back and no way to take the sitting back; the new session calls the act once on opening, on «Lanjutkan di sini» and on «Coba lagi», never by itself; its refusals are alerts and «Coba lagi» says when it checked; a refusal for want of a permission sends the request; the page chooses the screen from pengerjaan_saya; no recovery sentence says «perangkat lain» (O-4)");
    },
  },
];

export const a3LayarAppTests: SelfTest[] = [
  {
    // A3-J01 (Daisy §1; D7, D11): in the running app, the learner opens a sitting another session controls
    id: "A3-J01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      muat(ctx.repoRoot);
      const tag = `a3j${Date.now().toString(36)}`;
      const d0 = dunia(tag);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Exclude<typeof d0, string>;
      const { uid } = d.murid.masuk;
      try {
        // the harness's session starts the Pemetaan Awal (the "other" session: selftest.as_user_uid's own)
        const pre = mulai(uid, d.pre, 2);
        if (!c.expect(/^[0-9a-f-]{36}$/.test(pre), "the fixture's Pemetaan Awal did not start")) return c.verdict("");
        const murid0 = await masuk(asal, muridUji(tag), "BELAJAR");
        if (!c.expect(typeof murid0 !== "string", String(murid0))) return c.verdict("");
        const murid = murid0 as Komputer;
        const h1 = rapi(await (await murid.halaman(`/belajar/${d.la}/pemetaan`)).text());
        const tanya = /<section[^>]*data-pulih="tanya"[\s\S]*?<\/section>/.exec(h1)?.[0] ?? "";
        c.expect(teks(tanya).includes("Lanjutkan di sini?") && teks(tanya).includes("Anda masuk lagi, jadi asesmen ini dilanjutkan di sesi baru. Jawaban yang sudah tersimpan tetap ada."),
          `the low-stakes sitting another session controls does not ask «Lanjutkan di sini?»: ${teks(tanya).slice(0, 200) || teks(h1).slice(0, 200)}`);
        c.expect(/data-pulih-ya=""[^>]*>Lanjutkan di sini</.test(tanya) && /href="\/belajar"[^>]*data-pulih-batal=""[^>]*>Batal</.test(tanya), "the confirmation lacks «Lanjutkan di sini» or «Batal» back to Belajar");
        c.expect(!/pin-player/.test(h1) && !/role="alert"/.test(tanya), "the sitting is played here before the learner chose, or the question is an alert");
        c.expect(psql(`select generasi::text from public.assessment_sessions where id = ${lit(pre)}`) === "1", "opening the page moved the sitting (it must wait for the learner's choice)");
        // the Uji Penguasaan, started by the harness's session after the Pemetaan Awal is finished
        sebagai(uid, `select public.finish_my_session(${lit(pre)}, null)`);
        const post = mulai(uid, d.post, 1);
        if (!c.expect(/^[0-9a-f-]{36}$/.test(post), "the fixture's Uji Penguasaan did not start")) return c.verdict("");
        const h2 = rapi(await (await murid.halaman(`/belajar/${d.la}/penguasaan`)).text());
        c.expect(/data-pulih="memeriksa"/.test(h2) && !/pin-player/.test(h2), `the Uji Penguasaan another session controls is played, or its one check is not under way: ${teks(h2).slice(0, 200)}`);
        c.expect(psql(`select generasi || '|' || coalesce(lanjut_diminta_pada::text, 'none') from public.assessment_sessions where id = ${lit(post)}`) === "1|none",
          "rendering the page wrote to the sitting (only the learner's page, in the browser, acts)");
        return c.verdict("in the running app, a learner opening a sitting another session controls: the Pemetaan Awal asks «Lanjutkan di sini?» in O-4's neutral words with «Lanjutkan di sini» and «Batal», plays nothing and does not move the sitting; the Uji Penguasaan plays nothing and starts its one check; rendering writes nothing");
      } finally {
        bersihkan();
      }
    },
  },
];

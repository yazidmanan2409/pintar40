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
import { GURU, baris, bersihkan, dunia, formDengan, ke, masuk, mulai, muat, muridUji, rapi, sebagai, siapa, teks } from "./a1-layar.test";

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
      c.expect(/<BarisHasil nada="gagal">/.test(ld) && !/role="alert"/.test(ld) && /pengerjaan\.pulih\.diperiksa/.test(ld) && /pengerjaan\.pulih\.perlu_izin_isi/.test(ld), "the refusals are not alerts, or «Coba lagi» does not say when it checked, or the waiting body is missing");
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
        c.expect(/data-pulih-ya=""[^>]*>Lanjutkan di sini</.test(tanya) && /<a(?=[^>]*href="\/belajar")(?=[^>]*data-pulih-batal="")[^>]*>Batal</.test(tanya), `the confirmation lacks «Lanjutkan di sini» or «Batal» back to Belajar: ${tanya.replace(/\s+/g, " ").slice(0, 700)}`);
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
  {
    // A3-J02 (Daisy §1, §6.2, §8; D7): in the running app, the class's teacher sees the learner's request and allows it
    id: "A3-J02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      muat(ctx.repoRoot);
      const tag = `a3k${Date.now().toString(36)}`;
      const d0 = dunia(tag);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Exclude<typeof d0, string>;
      const { uid, pid, nama } = d.murid.masuk;
      try {
        // the harness's session starts both sittings; the learner then asks from another session (the request act)
        const pre = mulai(uid, d.pre, 1);
        const guru0 = await masuk(asal, GURU, `MENGAJAR:${d.inst}`);
        if (!c.expect(typeof guru0 !== "string", String(guru0))) return c.verdict("");
        const guru = guru0 as Komputer;
        // a low-stakes open sitting: «Atur» never offers «Izinkan» (it needs no teacher)
        const hp0 = rapi(await (await guru.halaman(`${siapa(d)}&sesi=${pre}`)).text());
        c.expect(/data-atur="[0-9a-f-]{36}"/.test(hp0) && !/data-atur-tindakan="izinkan"/.test(hp0), "the Pemetaan Awal's panel offers «Izinkan lanjut», or has no panel");
        sebagai(uid, `select public.finish_my_session(${lit(pre)}, null)`);
        const post = mulai(uid, d.post, 1);
        if (!c.expect(/^[0-9a-f-]{36}$/.test(post), "the fixture's Uji Penguasaan did not start")) return c.verdict("");
        psql(`begin; select set_config('request.jwt.claims', json_build_object('sub', ${lit(uid)}, 'role', 'authenticated', 'session_id', gen_random_uuid())::text, true);
          select set_config('request.jwt.claim.sub', ${lit(uid)}, true); set local role authenticated; select public.minta_izin_lanjut(${lit(post)}); commit;`);
        // the row says the request, in O-4's neutral form
        const h1 = await (await guru.halaman(siapa(d, d.post))).text();
        const b1 = baris(h1, nama);
        c.expect(teks(b1).includes("minta lanjut setelah masuk lagi") && !teks(b1).includes("perangkat lain") && /data-atur-buka=/.test(b1),
          `the teacher's row does not show the request (O-4), or offers no «Atur»: ${teks(b1).slice(0, 200)}`);
        // the panel: the act, its question and its reason inside it
        const h2 = rapi(await (await guru.halaman(`${siapa(d, d.post)}&sesi=${post}`)).text());
        const f = /<form[^>]*data-atur-tindakan="izinkan"[\s\S]*?<\/form>/.exec(h2)?.[0] ?? "";
        c.expect(teks(f).includes("Izinkan lanjut setelah masuk lagi") && teks(f).includes(`Izinkan ${nama} melanjutkan Uji Penguasaan setelah masuk lagi? Sesi sebelumnya tidak menyimpan jawabannya lagi.`)
          && teks(f).includes("10 sampai 300 karakter. Dicatat di jejak audit sekolah.") && !/pin-bahaya/.test(f),
          `the «Izinkan» form lacks Daisy's words, or is the red confirmation: ${teks(f).slice(0, 300)}`);
        // a short reason: refused beside the act, the typed reason kept (BL-1)
        const f0 = formDengan(h2, 'data-atur-tindakan="izinkan"', { alasan: "pendek" });
        if (!c.expect(typeof f0 !== "string", `the «Izinkan» form: ${f0}`)) return c.verdict("");
        const r0 = await guru.kirim(siapa(d, d.post), { form: f0 as Record<string, string> });
        c.expect(/kode=SITTING_REASON_REQUIRED/.test(ke(r0)) && /tindakan=izinkan/.test(ke(r0)), `a 6-character reason: ${r0.status} ${ke(r0)}`);
        const h3 = rapi(await (await guru.halaman(ke(r0))).text());
        const f3 = /<form[^>]*data-atur-tindakan="izinkan"[\s\S]*?<\/form>/.exec(h3)?.[0] ?? "";
        c.expect(teks(f3).includes("Tuliskan alasannya, 10 sampai 300 karakter.") && />pendek<\/textarea>/.test(f3), "the refusal is not beside «Izinkan», or the typed reason was lost");
        // a full reason: allowed, the result line says until when
        const r1 = await guru.kirim(siapa(d, d.post), { form: { ...(f0 as Record<string, string>), alasan: "perangkat murid mati saat Uji Penguasaan" } });
        c.expect(/hasil=diizinkan/.test(ke(r1)), `«Izinkan»: ${r1.status} ${ke(r1)}`);
        const h4 = await (await guru.halaman(ke(r1))).text();
        // the time and its zone are held together by a no-break space (Daisy §8): read in the raw html, where teks() would
        // fold it into an ordinary space
        const baru = rapi(h4).replace(/<[^>]+>/g, "");
        c.expect(new RegExp(`${nama} dapat melanjutkan sampai pukul \\d\\d\\.\\d\\d(?:\u00a0|&nbsp;|&#xa0;|&#160;)[A-Z]{3,4}\\.`).test(baru),
          `the result line does not say until when, with the zone held by a no-break space: ${(/[^<>]{0,60}dapat melanjutkan[^<>]{0,60}/.exec(baru) ?? [""])[0]}`);
        c.expect(psql(`select count(*) || '|' || bool_and(dipakai_pada is null and berlaku_sampai > now()) from public.pengerjaan_izin_lanjut where session_id = ${lit(post)} and person_id = ${lit(pid)}`) === "1|true",
          "the permission was not written once, unused and valid");
        // while it is valid the panel no longer offers it
        const h5 = rapi(await (await guru.halaman(`${siapa(d, d.post)}&sesi=${post}`)).text());
        c.expect(!/data-atur-tindakan="izinkan"/.test(h5), "the panel offers «Izinkan» again while a permission is valid");
        return c.verdict("in the running app, the class's teacher: a Pemetaan Awal's panel never offers «Izinkan lanjut»; after the learner's request the Uji Penguasaan's row reads «minta lanjut setelah masuk lagi» (never «perangkat lain»); its panel offers Daisy's act with its question and its reason inside it, not the red confirmation; a short reason is refused beside it with the typed reason kept; a full one allows it, the result line says until when on the school's clock, one valid permission is written, and the act is not offered again while it lasts");
      } finally {
        bersihkan();
      }
    },
  },
];

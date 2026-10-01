/**
 * M7 (D-085) -- A WHOLE CLASS'S CARDS IN ONE OPERATION, AS A PRINTABLE SET.
 *
 * "An authorised school administrator can issue PINTAR student cards for an
 * entire class in one operation and generate a practical printable class set
 * for distribution. Individual issuance remains available for exceptions.
 * Batch issuance must preserve individual student identity, credential
 * security, and auditability."
 *
 * This executes the grouping Aktivasi offers, renders the printable set, and
 * reads the source for the three preserved properties: every card goes through
 * the same per-person route the single button uses (identity, audit), and no
 * PIN is kept anywhere but the screen and the paper (security).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const m7Tests: SelfTest[] = [
  {
    id: "M7-K01",
    run: async (ctx) => {
      const c = new Checks();
      const { kelasUntukKartu } = await import("../src/components/aktivasi/kelas");

      // 1. which class, and who in it: only people awaiting an account, only real Kelas, each once, in Aktivasi's order
      const menunggu = [{ person_id: "budi" }, { person_id: "citra" }, { person_id: "dodi" }, { person_id: "eka" }, { person_id: "tanpa-kelas" }];
      const tempat = [
        { id: "b", label: "Kelas Rendah", level: "BAGIAN" }, { id: "t", label: "Kelas Rendah · Tingkat 1 · 2026/2027", level: "TINGKAT" },
        { id: "k1a", label: "Kelas Rendah · Tingkat 1 · Kelas 1A · 2026/2027", level: "KELAS" },
        { id: "k1b", label: "Kelas Rendah · Tingkat 1 · Kelas 1B · 2026/2027", level: "KELAS" },
      ];
      const keanggotaan = [
        { person_id: "eka", node_id: "k1a" }, { person_id: "budi", node_id: "k1a" }, { person_id: "citra", node_id: "k1a" },
        { person_id: "budi", node_id: "k1a" },          // listed twice by the read: once in the set
        { person_id: "ani", node_id: "k1a" },           // has an account already: not in the set
        { person_id: "dodi", node_id: "k1b" },
        { person_id: "citra", node_id: "t" },           // a Tingkat is not a class
      ];
      const g = kelasUntukKartu(menunggu, keanggotaan, tempat);
      c.expect(JSON.stringify(g.map((k) => [k.id, k.orang])) === JSON.stringify([["k1a", ["budi", "citra", "eka"]], ["k1b", ["dodi"]]]),
        `Aktivasi offers ${JSON.stringify(g.map((k) => [k.id, k.orang]))}; expected Kelas 1A: budi, citra, eka (Aktivasi's order, each once, nobody with an account) and Kelas 1B: dodi`);
      c.expect(kelasUntukKartu(menunggu, [], tempat).length === 0 && kelasUntukKartu([], keanggotaan, tempat).length === 0,
        "a class with nobody awaiting an account is offered");

      // 2. the printable set, as the administrator and the paper read it
      const kartu = [
        { nama: "Budi Murid", nomorInduk: "UJK-002", card: "4821930571", pin: "038214" },
        { nama: "Citra Murid", nomorInduk: "UJK-003", card: "5512093384", pin: "771020" },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/aktivasi/LembarKartu.tsx");' +
        "  const L = m.default?.default ?? m.default;" +
        "  const k = JSON.parse(process.env.M7_KASUS);" +
        "  process.stdout.write(JSON.stringify([renderToStaticMarkup(h(L, k)), renderToStaticMarkup(h(L, { ...k, kartu: [], gagal: [{ nama: 'Eka Murid', kunci: 'aktivasi.galat.sesi' }] }))]));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: ctx.repoRoot, encoding: "utf8",
        env: { ...process.env, NEXT_PUBLIC_APP_URL: "https://staging.pintarselalu.com", M7_KASUS: JSON.stringify({ locale: "id", kelas: "Kelas 1A", kartu, gagal: [] }) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === 2, `the class set could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const [set, gagal] = html;
        const kartuHtml = [...set.matchAll(/<li class="pin-akt-kartu">([\s\S]*?)<\/li>/g)].map((m) => m[1]);
        c.expect(kartuHtml.length === 2, `the set draws ${kartuHtml.length} card(s) for 2 learners`);
        for (const [i, k] of kartu.entries()) {
          const x = kartuHtml[i] ?? "";
          c.expect(x.includes(k.nama) && x.includes(k.nomorInduk) && x.includes(k.card) && x.includes(k.pin) && x.includes("staging.pintarselalu.com/masuk"),
            `card ${i + 1} does not carry the learner's name, school number, card number, PIN and where to sign in`);
        }
        c.expect(!/<img|photo|foto/i.test(set), "the class set carries a photo (T4)");
        c.expect(/class="pin-noprint"[\s\S]*Cetak kartu kelas/.test(set) && /PIN hanya ditampilkan sekali/.test(set),
          "the set does not offer printing, or does not say the PINs are shown once");
        c.expect(/Eka Murid/.test(gagal) && /Sesi Anda sudah berakhir/.test(gagal) && !/pin-akt-kartu"/.test(gagal),
          "a learner whose card was not made is not named with the reason, or is drawn as a card");
      }

      // 3. the three properties M7 must preserve
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const form = buang(readFileSync(join(ctx.repoRoot, "src", "components", "aktivasi", "FormAktivasi.tsx"), "utf8"));
      const fetches = [...form.matchAll(/fetch\(\s*"([^"]+)"/g)].map((m) => m[1]);
      c.expect(fetches.length === 1 && fetches[0] === "/api/akun/aktivasi",
        `the form asks ${JSON.stringify(fetches)}; the batch must use the same per-person route as the single button, and only it`);
      c.expect(/for \(let i = 0; i < giliran\.length; i\+\+\) \{[\s\S]*?await minta\("CLASSROOM_CARD", \{ person_id: p \}\)/.test(form),
        "the whole-class issue does not ask for each learner's card in turn through the same request");
      c.expect(!/localStorage|sessionStorage|indexedDB|document\.cookie/.test(form + buang(readFileSync(join(ctx.repoRoot, "src", "components", "aktivasi", "LembarKartu.tsx"), "utf8"))),
        "a PIN can be kept on the device");
      const api = readdirSync(join(ctx.repoRoot, "src", "app", "api", "akun"));
      c.expect(JSON.stringify(api) === JSON.stringify(["aktivasi"]), `a second issuance route exists beside aktivasi: ${JSON.stringify(api)}`);
      const page = buang(readFileSync(join(ctx.repoRoot, "src", "app", "aktivasi", "page.tsx"), "utf8"));
      c.expect(/\.in\("node_id", kelasIds\)\.is\("valid_to", null\)/.test(page) && /kelasUntukKartu\(orang, keanggotaan, tempat\)/.test(page),
        "the page does not read the classes' current members and group them through kelasUntukKartu");

      return c.verdict(
        "executed: Aktivasi offers each Kelas with the learners in it who await an account, each once and in Aktivasi's " +
          "order, never a Tingkat and never someone with an account; the printable set (rendered output) draws one card per " +
          "learner with name, school number, card number, PIN and the sign-in address, no photo, a print action and the " +
          "once-only warning off the paper, and names a learner whose card was not made with the reason; the source of the " +
          "form sends the batch through the one per-person route, in turn, and keeps no PIN on the device; there is no second " +
          "issuance route",
      );
    },
  },
];

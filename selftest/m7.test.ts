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
      // RESTATED FOR W2.10 (Batch 5; D-153, a changed requirement: the waiting list is paged, so the whole-class offer can
      // no longer be grouped from every waiting person in the page's render). Who is in a class's set (only people awaiting
      // an account, current members, PENDING as the intake leaves them, never a Tingkat, someone with an account, an ended
      // enrolment or a staff role, each once, in name order) is now the database's: kelas_menunggu_akun and
      // orang_kelas_menunggu_akun, executed by F26-W01. What stays here is executed too: the offer labels only real Kelas
      // with someone waiting, in label order.
      const { kelasDitawarkan } = await import("../src/components/aktivasi/kelas");

      // 1. which class: only real Kelas the database counted with someone waiting, labelled as the intake labels them
      const tempat = [
        { id: "b", label: "Kelas Rendah", level: "BAGIAN" }, { id: "t", label: "Kelas Rendah · Tingkat 1 · 2026/2027", level: "TINGKAT" },
        { id: "k1a", label: "Kelas Rendah · Tingkat 1 · Kelas 1A · 2026/2027", level: "KELAS" },
        { id: "k1b", label: "Kelas Rendah · Tingkat 1 · Kelas 1B · 2026/2027", level: "KELAS" },
        { id: "k1c", label: "Kelas Rendah · Tingkat 1 · Kelas 1C · 2026/2027", level: "KELAS" },
      ];
      const hitungan = [
        { node_id: "k1b", jumlah: 1 }, { node_id: "k1a", jumlah: 3 },
        { node_id: "t", jumlah: 4 },        // a Tingkat is not a class
        { node_id: "k1c", jumlah: 0 },      // nobody waiting
        { node_id: "lain", jumlah: 2 },     // a place this reader's structure does not have
      ];
      const g = kelasDitawarkan(hitungan, tempat);
      c.expect(JSON.stringify(g.map((k) => [k.id, k.jumlah])) === JSON.stringify([["k1a", 3], ["k1b", 1]]),
        `Aktivasi offers ${JSON.stringify(g.map((k) => [k.id, k.jumlah]))}; expected Kelas 1A (3) then Kelas 1B (1), never a Tingkat, an empty class or an unknown place`);
      c.expect(kelasDitawarkan([], tempat).length === 0 && kelasDitawarkan(hitungan, []).length === 0,
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
      // RESTATED AT THE GATE 3 LANDING (D-098): BOB-26 adds api/akun/kartu (the staff PINTAR card's data and
      // its email, read by my_identity_card; no credential). The guard keeps its point: aktivasi is the only
      // route under api/akun that issues a credential, so nothing beside it may authorise or create an account.
      const akun = join(ctx.repoRoot, "src", "app", "api", "akun");
      const api = readdirSync(akun);
      c.expect(api.includes("aktivasi"), `the issuance route aktivasi is gone: ${JSON.stringify(api)}`);
      const sumber = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? sumber(join(d, e.name)) : /\.tsx?$/.test(e.name) ? [buang(readFileSync(join(d, e.name), "utf8"))] : []);
      const penerbit = api.filter((r) => r !== "aktivasi" &&
        sumber(join(akun, r)).some((s) => /authorize_account_activation|authorize_new_person|auth\.admin\.createUser|CLASSROOM_CARD/.test(s)));
      c.expect(penerbit.length === 0, `a second issuance route exists beside aktivasi: ${JSON.stringify(penerbit)}`);
      // RESTATED FOR W2.10: the page asks the database for each Kelas's count and labels them through kelasDitawarkan; the
      // run reads that one class's learners (the database's set, F26-W01) and asks each card in turn as before
      const page = buang(readFileSync(join(ctx.repoRoot, "src", "app", "aktivasi", "page.tsx"), "utf8"));
      c.expect(/db\.rpc\("kelas_menunggu_akun", \{ p_sekolah: sekolah \}\)/.test(page) && /kelasDitawarkan\(hitungan, pilihanTempat\(/.test(page),
        "the page does not offer the classes the database counted, labelled through kelasDitawarkan");
      const aksiKelas = buang(readFileSync(join(ctx.repoRoot, "src", "app", "aktivasi", "actions.ts"), "utf8"));
      c.expect(/rpc\("orang_kelas_menunggu_akun", \{ p_kelas: kelas \}\)/.test(aksiKelas)
        && /const anggota = await anggotaKelasMenungguAksi\(k\.id\);/.test(form) && /const giliran = anggota\.map\(\(o\) => o\.person_id\)/.test(form),
        "the whole-class run does not read that class's learners from the database before asking each card");

      return c.verdict(
        "executed: Aktivasi offers each Kelas the database counted with someone waiting, never a Tingkat, an empty class or an " +
          "unknown place (who is in the set: F26-W01); the run reads that class's learners from the database; the printable set (rendered output) draws one card per " +
          "learner with name, school number, card number, PIN and the sign-in address, no photo, a print action and the " +
          "once-only warning off the paper, and names a learner whose card was not made with the reason; the source of the " +
          "form sends the batch through the one per-person route, in turn, and keeps no PIN on the device; there is no second " +
          "issuance route",
      );
    },
  },
  {
    id: "M7-K02",
    run: async (ctx) => {
      const c = new Checks();
      // H30 (Daisy, the owner's report review R7-02, 7 Nov): several classes in one run, extending M7's run, never a
      // second card system. Executed: the printable set names each card's class when the run spans classes. Read: one
      // function runs both the single class and the chosen classes, class after class, through the same per-learner
      // request; the offer is only what the database counted; and the per-class control stays as it was.
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const form = buang(readFileSync(join(ctx.repoRoot, "src", "components", "aktivasi", "FormAktivasi.tsx"), "utf8"));
      c.expect(/async function kartuKelas\(daftar: KelasKartu\[\], kunciSibuk: string\)/.test(form)
        && /for \(const k of daftar\) \{[\s\S]*?const anggota = await anggotaKelasMenungguAksi\(k\.id\);[\s\S]*?await minta\("CLASSROOM_CARD", \{ person_id: p \}\)/.test(form),
        "the chosen classes are not run class after class through each learner's own request");
      c.expect(/const kartuSatuKelas = \(\) => \{[\s\S]*?return kartuKelas\(k \? \[k\] : \[\]/.test(form)
        && /onClick=\{\(\) => void kartuKelas\(kelasBanyak, "banyak"\)\}/.test(form),
        "the single class and the chosen classes do not share one run");
      c.expect(/const kelasBanyak = kelas\.filter\(\(k\) => banyak\.has\(k\.id\)\);/.test(form)
        && /const muridBanyak = kelasBanyak\.reduce\(\(n, k\) => n \+ k\.jumlah, 0\);/.test(form),
        "the multi-class offer is not the database's counted classes, or its count is not theirs");
      c.expect(/aktivasi\.kelas\.banyak\.semua/.test(form) && /aktivasi\.kelas\.banyak\.terpilih/.test(form) && /aktivasi\.kelas\.banyak\.dikecualikan/.test(form)
        && /disabled=\{sibuk !== null \|\| muridBanyak === 0\}/.test(form),
        "«Pilih semua», the selected count, the exclusions or the empty-selection guard is missing");
      c.expect(/section\.pin-akt-kelas|className="pin-akt-orang pin-akt-kelas pin-noprint"/.test(form) && /<select className="pin-input" value=\{pilihKelas\}/.test(form)
        && /s\("aktivasi\.kelas\.tombol"\)/.test(form),
        "the per-class control (select and «Buat kartu untuk kelas ini») is no longer there");
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/aktivasi/LembarKartu.tsx");' +
        "  const L = m.default?.default ?? m.default;" +
        "  process.stdout.write(renderToStaticMarkup(h(L, JSON.parse(process.env.M7_KASUS))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: ctx.repoRoot, encoding: "utf8",
        env: { ...process.env, NEXT_PUBLIC_APP_URL: "https://staging.pintarselalu.com", M7_KASUS: JSON.stringify({ locale: "id", kelas: "Kelas 7E, Kelas 8B", gagal: [],
          kartu: [{ nama: "Budi Murid", nomorInduk: "UJK-002", card: "4821930571", pin: "038214", kelas: "Kelas 7E" },
                  { nama: "Citra Murid", nomorInduk: "UJK-003", card: "5512093384", pin: "771020", kelas: "Kelas 8B" }] }) },
      });
      if (c.expect(anak.status === 0, `the multi-class set could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const kartu = [...anak.stdout.matchAll(/<li class="pin-akt-kartu">([\s\S]*?)<\/li>/g)].map((m) => m[1]);
        c.expect(kartu.length === 2 && kartu[0].includes("Kelas 7E") && kartu[1].includes("Kelas 8B") && /Kelas 7E, Kelas 8B/.test(anak.stdout),
          "a card of a multi-class set does not name its class, or the set does not name its classes");
      }
      return c.verdict("H30: several classes in one press, «Pilih semua» and the selected count, run class after class through the same per-learner request as one class (the database decides and audits each card); the offer and count are the database's; the per-class control is kept; each card of a multi-class set names its class");
    },
  },
];

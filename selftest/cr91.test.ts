/**
 * CR-91 (Batch 1; F-3 ruled by the owner, D-145(a)): A CLASS CARD IS A LEARNER'S ALONE — the application's half.
 *
 * The database half is selftest/db/fable23.sql (F23-C01 … F23-C07): no person holds a class card and a staff role,
 * enforced from both sides. The owner asked for the restriction «in the database and application, not merely hidden»,
 * so the application adds two checks of its own:
 *
 *  CR91-K01  THE CARD SIGN-IN ASKS AT AUTHENTICATION. src/lib/kartu-masuk.ts, driven with every outside call recorded:
 *            after Auth accepts the card, the decision asks `kartu_bukan_staf()` AS THE NEW SESSION. A card whose
 *            person holds a staff role is refused (403 CARD_REQUEST_REFUSED, with a reference), its session is ended,
 *            and the attempt is not settled as a sign-in; a question that cannot be asked fails closed the same way
 *            (CARD_UNAVAILABLE). A learner's card signs in as before. The route asks with the session's own client
 *            (never the service role) and ends it through keluarPerangkatIni (this session only, BOB-05).
 *  CR91-K02  AKTIVASI OFFERS A CARD ONLY TO A LEARNER. bolehKartu is true only for an explicit boleh_kartu = true; the
 *            real form, rendered, offers «kartu» to the learner and not to the Guru (email only); the page builds the
 *            whole-class card groups from the people a card may be offered to.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

type Hasil = { status: number; body: Record<string, unknown> };

export const cr91Tests: SelfTest[] = [
  {
    id: "CR91-K01",
    run: async (ctx) => {
      const c = new Checks();
      const sebelum = { CARD_PEPPER: process.env.CARD_PEPPER, CARD_EMAIL_DOMAIN: process.env.CARD_EMAIL_DOMAIN };
      process.env.CARD_PEPPER = process.env.CARD_PEPPER ?? "selftest-card-pepper-cr91-32-characters-long";
      process.env.CARD_EMAIL_DOMAIN = process.env.CARD_EMAIL_DOMAIN ?? "cards.synthetic.pintar.test";
      try {
        const { masukDenganKartu } = await import("../src/lib/kartu-masuk");
        const coba = async (staf: boolean | "tak-terjawab") => {
          const cat = { selesai: [] as string[], keluar: 0, tanya: 0, log: [] as string[] };
          const h = (await masukDenganKartu({ origin: true, kartu: "7001", pin: "2468", lanjut: "/belajar" }, {
            catat: async () => 0,
            selesaikan: async (_k: string, hasil: string) => { cat.selesai.push(hasil); },
            masuk: async () => ({ error: null, jeda: null }),
            tujuan: async () => "/belajar",
            bukanStaf: async () => {
              cat.tanya++;
              if (staf === "tak-terjawab") throw new Error("database unreachable");
              return !staf;
            },
            keluar: async () => { cat.keluar++; },
            catatGalat: (ref: string, apa: string) => { cat.log.push(`${ref} ${apa}`); },
          })) as Hasil;
          return { h, cat };
        };

        const murid = await coba(false);
        c.expect(murid.h.status === 200 && murid.h.body.ok === true && murid.cat.tanya === 1 && murid.cat.keluar === 0
          && murid.cat.selesai.join() === "MASUK",
          `a learner's card: ${murid.h.status} ${JSON.stringify(murid.h.body)}, asked ${murid.cat.tanya}, ended ${murid.cat.keluar}, settled ${murid.cat.selesai.join()}`);

        const staf = await coba(true);
        c.expect(staf.h.status === 403 && staf.h.body.code === "CARD_REQUEST_REFUSED" && typeof staf.h.body.ref === "string",
          `a card whose person holds a staff role answered ${staf.h.status} ${JSON.stringify(staf.h.body)}, not 403 CARD_REQUEST_REFUSED with a reference`);
        c.expect(staf.cat.keluar === 1, `the refused card's session was ended ${staf.cat.keluar} time(s), not once`);
        c.expect(!staf.cat.selesai.includes("MASUK"), "the refused card's attempt was settled as a sign-in");
        c.expect(staf.cat.log.some((l) => /CR-91/.test(l)) && !JSON.stringify(staf.h.body).match(/staf|staff|CR-91/i),
          "the refusal is not logged by name, or the answer says why");

        const tak = await coba("tak-terjawab");
        c.expect(tak.h.status !== 200 && tak.h.body.code === "CARD_UNAVAILABLE" && tak.cat.keluar === 1 && !tak.cat.selesai.includes("MASUK"),
          `a staff check that cannot be asked answered ${tak.h.status} ${JSON.stringify(tak.h.body)}, ended ${tak.cat.keluar}: it must fail closed`);

        // the route: the session's own client asks and ends; never the service role
        const rute = readFileSync(join(ctx.repoRoot, "src/app/api/masuk/kartu/route.ts"), "utf8");
        c.expect(/bukanStaf:\s*async\s*\(\)\s*=>\s*\{[\s\S]{0,200}?\(await sesi\(\)\)\.rpc\(\s*["']kartu_bukan_staf["']/.test(rute),
          "the route does not ask kartu_bukan_staf with the new session's own client");
        c.expect(!/layanan\.rpc\(\s*["']kartu_bukan_staf["']/.test(rute), "the route asks the staff check with the service role");
        c.expect(/keluar:\s*async\s*\(\)\s*=>\s*keluarPerangkatIni\(\s*await sesi\(\)\s*\)/.test(rute),
          "the route does not end a refused card session through keluarPerangkatIni (this session only, BOB-05)");
      } finally {
        for (const [k, v] of Object.entries(sebelum)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
      }
      return c.verdict("a learner's card signs in; a card whose person holds a staff role, or whose check cannot be asked, is refused, its session ended and not settled; the route asks as the session itself");
    },
  },
  {
    id: "CR91-K02",
    run: async (ctx) => {
      const c = new Checks();
      const { bolehKartu } = await import("../src/components/aktivasi/kelas");
      c.expect(bolehKartu({ boleh_kartu: true }) && !bolehKartu({ boleh_kartu: false }) && !bolehKartu({}) && !bolehKartu({ boleh_kartu: null }),
        "bolehKartu offers a card for something other than an explicit boleh_kartu = true");

      const orang = [
        { person_id: "m1", display_name: "Ani Murid", institutional_id: "UJK-001", institution_id: "i1", boleh_kartu: true },
        { person_id: "g1", display_name: "Budi Guru", institutional_id: "UJK-002", institution_id: "i1", boleh_kartu: false },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/aktivasi/FormAktivasi.tsx");' +
        "  const F = m.default?.default ?? m.default;" +
        "  process.stdout.write(renderToStaticMarkup(h(F, { locale: 'id', adminSistem: false, orang: JSON.parse(process.env.CR91_ORANG), kelas: [] })));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: ctx.repoRoot, encoding: "utf8", env: { ...process.env, CR91_ORANG: JSON.stringify(orang) },
      });
      if (c.expect(anak.status === 0 && anak.stdout.length > 0, `Aktivasi's form could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const { t } = await import("../src/lib/hle");
        const kartu = t("aktivasi.dengan_kartu", "staff", { locale: "id" });
        const surel = t("aktivasi.dengan_surel", "staff", { locale: "id" });
        const baris = [...anak.stdout.matchAll(/<li class="pin-akt-orang">([\s\S]*?)<\/li>/g)].map((m) => m[1]);
        const ani = baris.find((b) => b.includes("Ani Murid")) ?? "";
        const budi = baris.find((b) => b.includes("Budi Guru")) ?? "";
        c.expect(ani.includes(kartu) && ani.includes(surel), "the learner is not offered both a card and email");
        c.expect(budi.includes(surel) && !budi.includes(kartu), "the Guru is offered a class card");
      }
      const halaman = readFileSync(join(ctx.repoRoot, "src/app/aktivasi/page.tsx"), "utf8");
      // RESTATED FOR W2.10 (Batch 5; D-153): the whole-class groups are the database's (kelas_menunggu_akun,
      // orang_kelas_menunggu_akun), which leave out anyone holding a staff role (memegang_peran_staf; executed by F26-W01)
      const mig = readFileSync(join(ctx.repoRoot, "supabase/migrations/20261224100000_people_awaiting_an_account_are_listed_a_page_at_a_time.sql"), "utf8");
      c.expect(/kelasMenunggu\(supabase, lingkupTunggu\)/.test(halaman)
        && /and not public\.memegang_peran_staf\(p\.id\)/.test(mig.slice(mig.indexOf("function public.kelas_menunggu_akun_anggota"))),
        "the whole-class card groups are not built from the people a card may be offered to");
      return c.verdict("a card is offered only for an explicit boleh_kartu = true; the form offers the learner a card and email and the Guru email only; whole-class cards are for learners");
    },
  },
];

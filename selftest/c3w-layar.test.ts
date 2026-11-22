/**
 * C3w-1 · AI-ASSISTED DRAFTING ON THE SCREENS (C3-11; Daisy, C3W-1-WORDS.md dde78004 and C3W-1-WORDS-TAMBAHAN.md
 * fdb90e16). The running app, as the package's author, with the local stub (the harness's PINTAR_AI_STUB_HARNESS=1,
 * set by selftest/run.ts for the app it starts; no provider, key or spend).
 *
 *   C3W-L01  the button «Buat draf soal dengan AI» is drawn only where the school has the entitlement; the drafting
 *            route answers the rights box first (AI_HAK_SUMBER, nothing reserved), then two drafts on the stub, and the
 *            same idempotency key again makes no second call; the cards say «Draf dari AI», the provenance line with
 *            the option's display name and «Menunggu keputusan Anda»; the package says «2 dari n soal disusun dengan
 *            AI»; once checked, «Ajukan untuk ditinjau» is held with Daisy's sentence tied to it and the button is
 *            gone; «Terima» and «Hapus» decide, the chip names who accepted, «Draf dihapus.» is said, and the step is
 *            held no more. Commits a world of its own and removes it.
 */
import { randomBytes } from "node:crypto";
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";
import { tersusun } from "./konteks-uji";
import { GURU, bersihkan, dunia, masuk, muat, sebagai, type Dunia } from "./c1w-layar.test";

const teks = (html: string) => tersusun(html).replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
const paketDi = (course: string, q = "") => `/studio/paket/${course}${q}`;
const ke = (r: Response) => (r.headers.get("location") ?? "").replace(/&amp;/g, "&");
/** The one form holding every mark, as a browser sends it: its hidden fields. */
function formDengan(html: string, ...penanda: string[]): Record<string, string> | string {
  const bentuk = tersusun(html).split(/<form\b/).slice(1).map((b) => b.split(/<\/form>/)[0]).filter((b) => penanda.every((p) => b.includes(p)));
  if (bentuk.length !== 1) return `${bentuk.length} form(s) hold ${penanda.join(" + ")}`;
  const out: Record<string, string> = {};
  for (const m of bentuk[0].matchAll(/<input\b[^>]*\btype="hidden"[^>]*>/g)) {
    const nama = /\bname="([^"]*)"/.exec(m[0])?.[1];
    const nilai = (/\bvalue="([^"]*)"/.exec(m[0])?.[1] ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    if (nama) out[nama] = nilai;
  }
  return out;
}

/** The school's entitlement on a stub option, committed; removed with everything the drafting wrote. */
function hak(d: Dunia, tag: string): string {
  return psql(`begin;
    insert into public.ai_opsi (kunci, nama_tampilan, model_ident, harga_dasar, status, plafon_biaya, henti_keras_terverifikasi)
      values ('c3l-${tag}', 'Stub PINTAR', 'stub-1', '{"masuk": 1, "keluar": 1}', 'QUALIFIED', 100000000, true);
    insert into public.ai_plafon_platform (plafon) values (100000000) on conflict (id) do nothing;
    insert into public.ai_hak_sekolah (sekolah, opsi, aktif, jatah, mulai)
      select ${lit(d.inst)}, o.id, true, 100000000, now() - interval '1 day' from public.ai_opsi o where o.kunci = 'c3l-${tag}'
      on conflict (sekolah) do update set opsi = excluded.opsi, aktif = true, jatah = excluded.jatah, mulai = excluded.mulai, berakhir = null;
    commit; select 'ok';`);
}
function lepas(d: Dunia, tag: string, plafonAda: boolean): void {
  psql(`begin; set local session_replication_role = replica;
    delete from public.ai_penerimaan where item_id in (select a.item_id from public.ai_asal_soal a join public.ai_permintaan m on m.id = a.permintaan where m.course_id = ${lit(d.course)});
    delete from public.ai_asal_soal where permintaan in (select id from public.ai_permintaan where course_id = ${lit(d.course)});
    delete from public.ai_percobaan where permintaan in (select id from public.ai_permintaan where course_id = ${lit(d.course)});
    delete from public.ai_permintaan where course_id = ${lit(d.course)};
    delete from public.ai_hak_sekolah where sekolah = ${lit(d.inst)};
    delete from public.ai_opsi where kunci = 'c3l-${tag}';
    ${plafonAda ? "" : "delete from public.ai_plafon_platform;"}
    commit;`);
}

export const c3wLayarTests: SelfTest[] = [
  {
    id: "C3W-L01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      muat(ctx.repoRoot);
      const d0 = dunia(tag, `C1W layar ${tag}`);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      const plafonAda = psql("select count(*) from public.ai_plafon_platform") !== "0";
      try {
        const guru0 = await masuk(asal, GURU, `MENGELOLA:${d.inst}`, `MENGAJAR:${d.inst}`);
        if (!c.expect(typeof guru0 !== "string", String(guru0))) return c.verdict("");
        const guru = guru0 as Exclude<typeof guru0, string>;
        // no entitlement: no button
        const h0 = await (await guru.halaman(paketDi(d.course))).text();
        c.expect(!/data-draf-ai=""/.test(h0), "the button is drawn for a school without the entitlement (Daisy §1.1: absent, never disabled)");
        c.expect(hak(d, tag).endsWith("ok"), "the entitlement could not be set");
        const h1 = await (await guru.halaman(paketDi(d.course))).text();
        c.expect(/data-draf-ai=""/.test(h1) && teks(h1).includes("Buat draf soal dengan AI"), "the button «Buat draf soal dengan AI» is not drawn for the package's author");
        const lesson = psql(`select l.id from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = ${lit(d.course)} order by m.ordinal, l.ordinal limit 1`);
        const minta = (o: Record<string, unknown>) => guru.jsonDari("/api/draf-ai", { json: {
          course: d.course, lesson, sumber: "TEMPEL", teks: "Ani membeli tiga jeruk dan dua apel di pasar pagi.", objectives: ["Membandingkan pecahan"],
          jumlah: 2, kunci: `c3l${tag}`, hakSumber: true, ...o } });
        // the rights box first: refused, nothing reserved
        const r0 = await minta({ hakSumber: false, kunci: `c3l${tag}tanpa` });
        c.expect(r0.status === 422 && r0.body?.kode === "AI_HAK_SUMBER", `without the rights box: ${r0.status} ${JSON.stringify(r0.body)} (422 AI_HAK_SUMBER)`);
        // two drafts on the stub
        const r1 = await minta({});
        c.expect(r1.status === 200 && r1.body?.ok === true && Array.isArray(r1.body?.items) && (r1.body!.items as unknown[]).length === 2,
          `drafting two questions on the stub: ${r1.status} ${JSON.stringify(r1.body)}`);
        const percobaan = () => psql(`select count(*) from public.ai_percobaan p join public.ai_permintaan m on m.id = p.permintaan where m.course_id = ${lit(d.course)}`);
        const sebelum = percobaan();
        const r2 = await minta({});
        c.expect(r2.status === 200 && r2.body?.ulang === true && percobaan() === sebelum && sebelum === "1",
          `the same key again: ${r2.status} ${JSON.stringify(r2.body)}; attempts ${sebelum} then ${percobaan()} (one, and no second call)`);
        // the cards
        const h2 = await (await guru.halaman(paketDi(d.course))).text();
        const t2 = teks(h2);
        const kartu = [...h2.matchAll(/data-draf-ai-asal="([0-9a-f-]{36})"/g)].map((m) => m[1]);
        c.expect(kartu.length === 2 && (h2.match(/data-draf-ai-chip="BELUM"/g) ?? []).length === 2 && t2.includes("Draf dari AI")
          && t2.includes("Disusun dengan AI (Stub PINTAR) dari teks yang ditempel") && t2.includes("Menunggu keputusan Anda: terima atau hapus."),
          `the generated cards: ${kartu.length} card(s); «${t2.slice(Math.max(0, t2.indexOf("Draf dari AI")), t2.indexOf("Draf dari AI") + 260)}»`);
        c.expect(/2 dari \d+ soal disusun dengan AI/.test(t2), "the package does not say «2 dari n soal disusun dengan AI»");
        // checked: the button gone, «Ajukan» held with Daisy's sentence tied to it
        const maju = sebagai(GURU.identitas, `select selftest.f12_advance(${lit(d.course)}, 'STRUCTURED')`, `select selftest.f12_advance(${lit(d.course)}, 'VALIDATED')`);
        const h3 = await (await guru.halaman(paketDi(d.course))).text();
        c.expect(!/data-draf-ai=""/.test(h3), "a checked package still offers «Buat draf soal dengan AI» (TAMBAHAN §4)");
        c.expect(/disabled="" aria-describedby="lt-ai-belum"|aria-describedby="lt-ai-belum" disabled=""/.test(h3) && /id="lt-ai-belum"/.test(h3)
          && teks(h3).includes("2 soal masih draf dari AI. Setiap soal perlu diterima atau dihapus oleh pendidik sebelum paket diajukan."),
          `«Ajukan» is not held with its reason (advance: ${maju.slice(-120)})`);
        // the decisions
        const [x, y] = kartu;
        const terima = formDengan(h3, `name="item" value="${x}"`, `name="keputusan" value="TERIMA"`);
        if (!c.expect(typeof terima !== "string", `«Terima»'s form: ${terima}`)) return c.verdict("");
        const rt = await guru.kirim(paketDi(d.course), { form: terima as Record<string, string> });
        c.expect(/c1h=ok/.test(ke(rt)) && /c1=AI_DITERIMA/.test(ke(rt)), `«Terima»: ${rt.status} ${ke(rt)}`);
        const h4 = await (await guru.halaman(paketDi(d.course))).text();
        const hapus = formDengan(h4, `name="item" value="${y}"`, `name="keputusan" value="HAPUS"`);
        if (!c.expect(typeof hapus !== "string", `«Hapus»'s form: ${hapus}`)) return c.verdict("");
        const rh = await guru.kirim(paketDi(d.course), { form: hapus as Record<string, string> });
        c.expect(/c1=AI_DIHAPUS/.test(ke(rh)) && psql(`select count(*) from public.items where id = ${lit(y)}`) === "0", `«Hapus»: ${rh.status} ${ke(rh)}`);
        const h5 = await (await guru.halaman(ke(rh).replace(asal, ""))).text();
        const t5 = teks(h5);
        c.expect(t5.includes("Draf dihapus.") && /data-draf-ai-chip="ACCEPTED"/.test(h5) && /Diterima oleh \S/.test(t5) && !/id="lt-ai-belum"/.test(h5),
          `after the decisions: «Draf dihapus.» ${t5.includes("Draf dihapus.")}, accepted chip ${/data-draf-ai-chip="ACCEPTED"/.test(h5)}, held ${/id="lt-ai-belum"/.test(h5)}`);
        // learners see no mark: the provenance read refuses them (C3W-C32), and no learner page names it (C3W-C38)
      } finally {
        lepas(d, tag, plafonAda);
        bersihkan();
      }
      return c.verdict("the running app, as the package's author, on the harness's stub: no entitlement, no button; with it, «Buat draf soal dengan AI»; the drafting route refuses the missing rights box AI_HAK_SUMBER, drafts two questions, and answers the same key again with no second attempt; the cards say «Draf dari AI», «Disusun dengan AI (Stub PINTAR) dari teks yang ditempel» and the waiting line; the package says «2 dari n soal disusun dengan AI»; once checked the button is gone and «Ajukan» is held, its reason tied by aria-describedby in Daisy's words; «Terima» and «Hapus» decide, the chip names who accepted, «Draf dihapus.» is said and the step is held no more");
    },
  },
];

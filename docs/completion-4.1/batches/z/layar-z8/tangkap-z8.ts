/**
 * Z8 item 8 captures (Daisy, via Bob 13:22Z): the last school administrator's recovery walk at 390 by keyboard, the
 * refusal at 1280, and the refused revocation at 390 with the role still listed. Run by tangkap-z8.sh against a fresh
 * local stack (308 migrations and the seed) and a production build on :3999; the stack is reset afterwards.
 *
 * The world is the synthetic Alpha school: Admin Alpha is its only administrator; Guru Alpha teaches there.
 * Keyboard only: fields are reached by focus and Tab, chosen with the arrow keys, typed, ticked with Space and sent
 * with Enter. No clicks.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { ipUji, psql } from "../../../../../selftest/bob26.test";
import { Komputer } from "../../../../../selftest/bob29.test";
import { pilihKonteksPeramban } from "../../../../../selftest/konteks-uji";

const { chromium } = createRequire(__filename)("playwright");
type Browser = Awaited<ReturnType<typeof chromium.launch>>;
type Page = Awaited<ReturnType<Awaited<ReturnType<Browser["newContext"]>>["newPage"]>>;

const ASAL = "http://127.0.0.1:3999";
const KE = __dirname;
const catatan: string[] = [];
const ADMIN = { identitas: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" };
const GURU = "alpha-guru@synthetic.pintar.test";
const ALASAN = "Saya pindah tugas ke sekolah lain";

const orangDari = (e: string) => `(select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${e}')`;
const satu = (q: string) => psql(q).split("\n").pop()!.trim();

async function rekam(p: Page, nama: string, bagian?: string, atas?: string) {
  if (bagian) await p.locator(bagian).first().scrollIntoViewIfNeeded().catch(() => undefined);
  // `atas`: the element is brought to the top of the viewport, so what follows it (a kept form) is in the shot
  if (atas) {
    await p.locator(atas).first().evaluate((e: Element) => e.scrollIntoView({ block: "start" })).catch(() => undefined);
    // the sticky header would cover the element's first lines
    await p.evaluate(() => window.scrollBy(0, -((document.querySelector("header")?.getBoundingClientRect().height ?? 0) + 24)));
  }
  const info = await p.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    const live = [...document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')].map((x) => (x.textContent ?? "").trim()).filter(Boolean).join(" | ");
    return {
      lebih: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fokus: el ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} «${(el.textContent ?? (el as HTMLInputElement).value ?? "").trim().slice(0, 60)}»` : "none",
      live: live.slice(0, 500),
    };
  });
  const teks = bagian ? (await p.locator(bagian).allInnerTexts().catch(() => [])).join(" / ").replace(/\s+/g, " ").slice(0, 700) : "";
  const w = p.viewportSize()!.width;
  catatan.push(`${nama}-${w}\t${p.url().replace(ASAL, "")}\toverflow ${info.lebih}px\tfocus ${info.fokus}\tlive «${info.live}»${teks ? `\tsection «${teks}»` : ""}`);
  await p.screenshot({ path: join(KE, `z8-${nama}-${w}.png`) });
}

/** A closed <select> takes the arrow keys: press until it holds `nilai`. */
async function pilih(p: Page, nilai: string) {
  for (let i = 0; i < 80; i++) {
    if (await p.evaluate(() => (document.activeElement as HTMLSelectElement | null)?.value ?? "") === nilai) return;
    await p.keyboard.press("ArrowDown");
  }
  throw new Error(`the select never reached ${nilai}`);
}

/** Akun saya › Meninggalkan PINTAR › «Tutup akun saya»: tick the one confirmation with Space, Tab to the button, Enter. */
async function tutupAkun(p: Page) {
  await p.goto(`${ASAL}/akun#meninggalkan`, { waitUntil: "networkidle" });
  await p.locator('[data-minta-akun="CLOSE"] input[name="konfirmasi"]').focus();
  await p.keyboard.press("Space");
  await p.keyboard.press("Tab");
  await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.keyboard.press("Enter")]);
}

(async () => {
  const inst = satu(`select ra.institution_id from public.role_assignments ra where ra.person_id = ${orangDari(ADMIN.identitas)} and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null and ra.scope_node_id = ra.institution_id limit 1`);
  const raAdmin = satu(`select ra.id from public.role_assignments ra where ra.person_id = ${orangDari(ADMIN.identitas)} and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null and ra.scope_node_id = ra.institution_id limit 1`);
  const guru = satu(`select ${orangDari(GURU)}`);
  const raGuru = satu(`select ra.id from public.role_assignments ra where ra.person_id = '${guru}' and ra.institution_id = '${inst}' and ra.role = 'EDUCATOR' and ra.revoked_at is null order by ra.created_at limit 1`);
  const sampai = satu(`select to_char(now() + interval '180 days', 'MMDDYYYY')`);
  catatan.push(`world: Alpha ${inst}; Admin Alpha's role ${raAdmin}; Guru Alpha ${guru} (EDUCATOR ${raGuru}); usable administrators before: ${satu(`select count(*) from public.admin_dapat_dipakai('INSTITUTION_ADMIN', '${inst}')`)}`);

  const k = new Komputer(ASAL, ipUji());
  if ((await k.jsonDari("/masuk/password", { form: ADMIN })).status !== 200) throw new Error("Admin Alpha could not sign in");
  await k.halaman("/konfigurasi");
  await k.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
  await pilihKonteksPeramban(k, `MENGELOLA:${inst}`);
  const browser = await chromium.launch();
  const masuk = async (lebar: number) => {
    const ctx = await browser.newContext({ deviceScaleFactor: 2, locale: "en-US" });
    await ctx.addCookies([...(k as unknown as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
    const p = await ctx.newPage();
    await p.setViewportSize({ width: lebar, height: 900 });
    return p;
  };
  try {
    // ─── the refused revocation (390): the screen offers no «Cabut» on one's own role, so the form of another row is
    //     sent with the hidden assignment pointed at Admin Alpha's own, as a browser could (b0-layar's precedent)
    const c = await masuk(390);
    await c.goto(`${ASAL}/konfigurasi/roles?ubah=${raGuru}#peran-${raGuru}`, { waitUntil: "networkidle" });
    await c.evaluate(([dari, ke]: string[]) => {
      const i = document.querySelector(`form input[name="assignment"][value="${dari}"]`) as HTMLInputElement | null;
      if (!i) throw new Error("no open revocation form");
      i.value = ke;
    }, [raGuru, raAdmin]);
    await c.locator('form input[name="alasan"]').focus();
    await c.keyboard.type(ALASAN);
    await Promise.all([c.waitForNavigation({ waitUntil: "networkidle" }), c.keyboard.press("Enter")]);
    await rekam(c, "05-cabut-tolak", undefined, '[role="alert"]');
    // the same page further down: Admin Alpha's role, still listed
    await rekam(c, "05-cabut-peran-tetap", `#peran-${raAdmin}`, `#peran-${raAdmin}`);
    catatan.push(`  after the refused revocation: Admin Alpha's role ${satu(`select case when revoked_at is null then 'live' else 'REVOKED' end from public.role_assignments where id = '${raAdmin}'`)}; listed: ${await c.locator(`#peran-${raAdmin}`).count()}; ROLE_LAST_SCHOOL_ADMIN said: ${(await c.content()).includes("hasil=gagal") || /kode=ROLE_LAST_SCHOOL_ADMIN/.test(c.url())}`);

    // ─── step 1: the closure refused, the form kept (390, then 1280)
    for (const w of [390, 1280]) {
      const p = await masuk(w);
      await tutupAkun(p);
      await rekam(p, "01-tutup-tolak", "#meninggalkan", '#meninggalkan [role="alert"]');
      catatan.push(`  the CLOSE form still offered: ${await p.locator('[data-minta-akun="CLOSE"]').count()}; account closed: ${satu(`select count(*) from public.person_suspensions where person_id = ${orangDari(ADMIN.identitas)} and ended_at is null`)}`);
    }

    // ─── step 2: appoint Guru Alpha Admin sekolah in Peran & akses (390), then confirm
    const p = await masuk(390);
    await p.goto(`${ASAL}/konfigurasi/roles`, { waitUntil: "networkidle" });
    await p.locator('select[name="person"]').focus();
    await pilih(p, guru);
    await p.keyboard.press("Tab");
    await pilih(p, "INSTITUTION_ADMIN");
    await p.keyboard.press("Tab");
    await pilih(p, inst);
    await p.keyboard.press("Tab");
    await p.keyboard.type(sampai);
    await rekam(p, "02-tunjuk-isi", 'form:has(select[name="person"])');
    await p.locator('form:has(select[name="person"]) button[type="submit"]').first().focus();
    await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.keyboard.press("Enter")]);
    await rekam(p, "03-tunjuk-yakin", 'form:has(input[name="yakin"])');
    await p.locator('form:has(input[name="yakin"]) button[type="submit"]').first().focus();
    await Promise.all([p.waitForNavigation({ waitUntil: "networkidle" }), p.keyboard.press("Enter")]);
    await rekam(p, "04-tunjuk-ok", `[id^="peran-"]:has-text("Guru Alpha")`);
    catatan.push(`  usable administrators after the appointment: ${satu(`select count(*) from public.admin_dapat_dipakai('INSTITUTION_ADMIN', '${inst}')`)}`);

    // ─── step 3: the closure goes through
    const t = await masuk(390);
    await tutupAkun(t);
    await rekam(t, "06-tutup-ok");
    catatan.push(`  account closed: ${satu(`select count(*) from public.person_suspensions where person_id = ${orangDari(ADMIN.identitas)} and ended_at is null and category = 'CLOSED_AT_REQUEST'`)}`);
  } finally {
    await browser.close();
    writeFileSync(join(KE, "CATATAN-Z8.txt"), catatan.join("\n") + "\n");
  }
})().catch((e) => { console.error(e); writeFileSync(join(KE, "CATATAN-Z8.txt"), catatan.join("\n") + `\nFAILED: ${(e as Error).message}\n`); process.exit(1); });

// Batch 2 exit gate: a keyboard walk of the shell and the account menu, axe on the shells, screenshots at 320/1024/1280.
const { chromium } = require('playwright');
const fs = require('fs');
const APP = 'http://127.0.0.1:3999', OUT = process.env.OUT;
const AXE = fs.readFileSync(process.env.AXE, 'utf8');
const hasil = []; const catat = (id, ok, d) => { hasil.push({ id, ok, d }); console.log(`${ok ? 'PASS' : 'FAIL'} ${id} :: ${d}`); };
async function aktif(p) { return p.evaluate(() => { const e = document.activeElement; return { tag: e.tagName.toLowerCase(), id: e.id, cls: e.className && e.className.baseVal === undefined ? e.className : '', role: e.getAttribute('role'), teks: (e.innerText || '').trim().slice(0, 40), atas: e.getBoundingClientRect().top, terlihat: getComputedStyle(e).outlineStyle !== 'none' || getComputedStyle(e).boxShadow !== 'none' }; }); }
async function masuk(p, email, pw) {
  await p.goto(`${APP}/masuk`, { waitUntil: 'networkidle' });
  await p.locator('button[type=submit]:not([disabled])').waitFor({ timeout: 30000 }); await p.fill('#identitas', email); await p.fill('#password', pw); await p.click('button[type=submit]');
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
  for (let i = 0; i < 20 && new URL(p.url()).pathname === '/masuk'; i++) await p.waitForTimeout(300);
  if (new URL(p.url()).pathname === '/perangkat') {
    await p.locator('button[type=submit]:not([disabled])').waitFor({ timeout: 30000 });
    await p.locator('input[type=radio][value=PERSONAL]').check();
    await p.locator('button[type=submit]').click();
    await p.waitForURL((u) => u.pathname !== '/perangkat', { timeout: 30000 });
    await p.waitForLoadState('networkidle');
  }
  return new URL(p.url()).pathname;
}
async function axe(p, nama) {
  await p.addScriptTag({ content: AXE });
  const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map((x) => `${x.id}(${x.impact})×${x.nodes.length} [${x.nodes.map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 160)).join(' | ')}]`));
  catat(`AXE ${nama}`, v.length === 0, v.join(', ') || 'clean');
}
(async () => {
  const b = await chromium.launch();
  for (const lebar of [1280, 1024, 320]) {
    const ctx = await b.newContext({ viewport: { width: lebar, height: 900 } }); const p = await ctx.newPage();
    const tiba = await masuk(p, 'alpha-admin@synthetic.pintar.test', 'Sintetis-AlphaAdmin-27!');
    if (lebar === 1280) {
      // the chooser, if any: the first door
      if (tiba === '/' && await p.locator('[data-pemilih="konteks"] button[data-konteks]').count()) { await p.locator('[data-pemilih="konteks"] button[data-konteks]').first().click(); await p.waitForLoadState('networkidle'); }
      const di = new URL(p.url()).pathname;
      const judul = await p.title();
      catat('JUDUL', /· PINTAR$|PINTAR/.test(judul) && judul !== 'PINTAR', `${di}: «${judul}»`);
      await p.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
      await p.keyboard.press('Tab'); await p.waitForTimeout(400); let a = await aktif(p);
      catat('LEWATI-1', a.tag === 'a' && /pin-lewati/.test(a.cls) && a.atas >= 0 && a.terlihat, `first Tab → ${a.tag}.${a.cls} «${a.teks}» top ${Math.round(a.atas)} ring ${a.terlihat}`);
      await p.screenshot({ path: `${OUT}/01-lewati-1280.png` });
      await p.keyboard.press('Enter'); await p.waitForTimeout(200); a = await aktif(p);
      catat('LEWATI-2', a.id === 'isi', `Enter → focus on ${a.tag}#${a.id}`);
      // the account menu, reached by Tab from the page's top
      await p.goto(`${APP}${di}`, { waitUntil: 'networkidle' });
      let n = 0, ketemu = false;
      for (; n < 120; n++) { await p.keyboard.press('Tab'); a = await aktif(p); if (a.tag === 'button' && /pin-menu-tombol/.test(a.cls)) { ketemu = true; break; } }
      catat('MENU-0', ketemu, `the name button reached in ${n + 1} Tab press(es) from the top of the page, ring ${a.terlihat}`);
      if (!ketemu) await p.locator('button.pin-menu-tombol').first().focus();
      await p.keyboard.press('Enter'); await p.waitForTimeout(150);
      const ex = await p.getAttribute('button.pin-menu-tombol', 'aria-expanded'); a = await aktif(p);
      catat('MENU-1', ex === 'true' && a.role === 'menuitem', `Enter: expanded=${ex}, focus on «${a.teks}» (${a.role})`);
      await p.screenshot({ path: `${OUT}/02-menu-1280.png` });
      await p.keyboard.press('ArrowDown'); const b2 = (await aktif(p)).teks;
      await p.keyboard.press('End'); const e2 = (await aktif(p)).teks;
      await p.keyboard.press('Home'); const h2 = (await aktif(p)).teks;
      await p.keyboard.press('ArrowUp'); const u2 = (await aktif(p)).teks;
      catat('MENU-2', b2 !== h2 && /semua|every/i.test(e2) && u2 === e2, `↓ «${b2}», End «${e2}», Home «${h2}», ↑ wraps to «${u2}»`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(100); a = await aktif(p);
      const ex2 = await p.getAttribute('button.pin-menu-tombol', 'aria-expanded');
      catat('MENU-3', ex2 === 'false' && /pin-menu-tombol/.test(a.cls), `Esc: expanded=${ex2}, focus back on ${a.tag}.${a.cls}`);
      await p.keyboard.press('Enter'); await p.waitForTimeout(100); await p.keyboard.press('End'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
      const buka = await p.evaluate(() => document.querySelector('dialog.pin-dialog')?.open === true); a = await aktif(p);
      catat('DIALOG-1', buka && /Batal|Cancel/.test(a.teks), `dialog open=${buka}, focus on «${a.teks}»`);
      await p.screenshot({ path: `${OUT}/03-dialog-1280.png` });
      await p.keyboard.press('Tab'); const t1 = (await aktif(p)).teks; await p.keyboard.press('Tab'); const t2 = (await aktif(p)).teks;
      const luar = await p.evaluate(() => { const e = document.activeElement; const d = document.querySelector('dialog.pin-dialog'); return e && e !== document.body && !d.contains(e) ? e.tagName : null; });
      catat('DIALOG-2', /Keluar dari semua|Sign out everywhere/.test(t1) && luar === null, `Tab «${t1}», Tab again: focus behind the dialog = ${luar ?? 'none (the page behind is inert; the browser takes it)'}`);
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      const tutup = await p.evaluate(() => document.querySelector('dialog.pin-dialog')?.open === false); a = await aktif(p);
      catat('DIALOG-3', tutup && /pin-menu-tombol/.test(a.cls), `Esc: closed=${tutup}, focus back on ${a.tag}.${a.cls}; still signed in: ${new URL(p.url()).pathname}`);
      for (const r of [di, '/akun', '/lapor', '/lapor/saya', '/konfigurasi']) { await p.goto(`${APP}${r}`, { waitUntil: 'networkidle' }); await axe(p, r); }
    }
    await p.goto(`${APP}/akun`, { waitUntil: 'load' }).catch(() => {}); await p.waitForLoadState('networkidle').catch(() => {});
    const melebar = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    catat(`LEBAR-${lebar}`, !melebar, `/akun at ${lebar}px: wider than the window ${melebar}`);
    await p.screenshot({ path: `${OUT}/04-akun-${lebar}.png`, fullPage: false });
    if (lebar === 320) {
      const laci = p.locator('label[for="pin-laci"]');
      if (await laci.isVisible().catch(() => false)) { await laci.click(); await p.waitForTimeout(200); }
      const akun = p.locator('button.pin-menu-tombol:visible');
      catat('MENU-320-0', await akun.count() > 0, `the name button is reachable at 320 px (drawer opened): ${await akun.count()}`);
      if (await akun.count()) { await akun.first().click(); await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}/05-menu-320.png` }); }
      const m = await p.evaluate(() => { const r = document.querySelector('#pin-menu-akun')?.getBoundingClientRect(); return r ? { l: Math.round(r.left), r: Math.round(r.right), w: innerWidth } : null; });
      catat('MENU-320', !m || (m.l >= 0 && m.r <= m.w), `the open menu at 320 px: ${JSON.stringify(m)}`);
    }
    await ctx.close();
  }
  // a learner: the skip link, no menu, no name
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  await masuk(p, 'alpha-siswa-1@synthetic.pintar.test', 'Sintetis-AlphaSiswa1-76!');
  await p.goto(`${APP}/belajar`, { waitUntil: 'networkidle' });
  await p.keyboard.press('Tab'); await p.waitForTimeout(400); const a = await aktif(p);
  catat('MURID-1', /pin-lewati/.test(a.cls) && !(await p.locator('button.pin-menu-tombol').count()), `learner: first Tab «${a.teks}», menu buttons ${await p.locator('button.pin-menu-tombol').count()}; title «${await p.title()}»`);
  await axe(p, '/belajar (learner)');
  await p.screenshot({ path: `${OUT}/06-belajar-1280.png` });
  await b.close();
  fs.writeFileSync(`${OUT}/jalan.json`, JSON.stringify(hasil, null, 1));
  console.log(`${hasil.filter((h) => h.ok).length}/${hasil.length} PASS`);
})().catch((e) => { console.error(e); process.exit(1); });

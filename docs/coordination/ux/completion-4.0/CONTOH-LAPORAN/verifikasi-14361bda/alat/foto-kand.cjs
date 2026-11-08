const { chromium } = require('playwright'); const fs = require('fs'); const { execSync } = require('child_process');
const dir = process.argv[2]; const axe = fs.readFileSync('/home/user/pintar40/node_modules/axe-core/axe.min.js', 'utf8');
(async () => { const b = await chromium.launch();
  for (const f of ['guru','kadep','kadep-10','dekan']) {
    for (const w of [1280, 390, 320]) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      await p.goto(`file://${dir}/${f}.html`); await p.evaluate(() => document.fonts.ready);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      await p.screenshot({ path: `${dir}/${f}-${w}.png`, fullPage: true });
      let ax = [];
      if (w === 1280) { await p.addScriptTag({ content: axe }); ax = await p.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] } }).then(r => r.violations.map(v => v.id + ':' + v.nodes.length)));
        await p.emulateMedia({ media: 'print' }); await p.pdf({ path: `${dir}/${f}-a4.pdf`, preferCSSPageSize: true, printBackground: true });
        execSync(`rm -f ${dir}/${f}-a4-*.png; pdftoppm -r 80 -png ${dir}/${f}-a4.pdf ${dir}/${f}-a4`); }
      console.log(f, w, 'scrollWidth', sw, ax.join(' '));
      await p.close(); } }
  await b.close(); })();

const { chromium } = require('playwright');
(async () => {
  const [inp, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + inp, { waitUntil: 'networkidle' });
  await p.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: true,
    margin: { top: '18mm', bottom: '18mm', left: '17mm', right: '17mm' },
    headerTemplate: '<div style="font-family:Inter,sans-serif;font-size:7.5pt;color:#5b6666;width:100%;padding:0 17mm;">Buku Soal Penilaian · Evaluasi soal PINTAR</div>',
    footerTemplate: '<div style="font-family:Inter,sans-serif;font-size:7.5pt;color:#5b6666;width:100%;padding:0 17mm;text-align:right;">Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></div>' });
  await b.close();
})();

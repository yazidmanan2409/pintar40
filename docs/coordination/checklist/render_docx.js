// Renders checklist_data.py as the Word copy for Yazid.
// Run: python3 checklist_data.py > /tmp/c.json && NODE_PATH=<dir with the docx package> node render_docx.js /tmp/c.json out.docx
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, PageOrientation, LevelFormat, BorderStyle, Footer, PageNumber,
  VerticalAlign,
} = require("docx");

const [, , input, output] = process.argv;
const d = JSON.parse(fs.readFileSync(input, "utf8"));

const PAGE_W = 16838, PAGE_H = 11906, MARGIN = 850, USABLE = PAGE_W - 2 * MARGIN; // A4 landscape
const FONT = "Arial";
const INK = "1D2939", MUTED = "475467", ACCENT = "0B5394", HEAD_FILL = "E8EEF6", RULE = "C9D1DC";
const STATUS_COLOR = {
  PASS: "1E7B34", FAIL: "B42318", PARTIAL: "B54708", BLOCKED: "6941C6",
  "N-I": "475467", "N-T": "475467", "N/A": "475467", "NOT VERIFIED": "B54708",
};
const STATUS_RE = /^(PASS|FAIL|PARTIAL|BLOCKED|N-T|N-I|N\/A|NOT VERIFIED)\b/;
const ORDER = ["PASS", "PARTIAL", "FAIL", "BLOCKED", "N-I", "N-T"];

const status = (b) => (b.match(STATUS_RE) || [null, "N-T"])[1];
// What follows the status word: "FAIL: reason", "BLOCKED by B4", or nothing when only punctuation is left.
function tail(b, s) {
  const rest = b.slice(s.length).replace(/^[:\s]+/, "");
  if (/^[.\s]*$/.test(rest)) return "";
  return /^(\(|for |by )/.test(rest) ? " " + rest : ": " + rest;
}
const border = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const borders = { top: border, bottom: border, left: border, right: border };

function run(text, o = {}) {
  return new TextRun({ text, font: FONT, size: o.size || 17, bold: o.bold, italics: o.italics, color: o.color || INK });
}
function para(children, o = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [run(children, o)],
    spacing: { before: o.before ?? 0, after: o.after ?? 60, line: o.line ?? 252 },
    alignment: o.align, keepNext: o.keepNext,
    numbering: o.numbering, border: o.border, shading: o.shading, indent: o.indent,
  });
}
function cell(content, width, o = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map((c) =>
    c instanceof Paragraph ? c : para(String(c), { size: o.size || 16, bold: o.bold, color: o.color, after: 20, align: o.align }));
  return new TableCell({
    children: paras, width: { size: width, type: WidthType.DXA }, borders,
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 }, verticalAlign: o.valign,
  });
}
function table(widths, header, rows) {
  const total = widths.reduce((a, b) => a + b, 0);
  if (total !== USABLE) throw new Error(`table widths ${total} != ${USABLE}`);
  const head = new TableRow({
    tableHeader: true, cantSplit: true,
    children: header.map((h, i) => cell(h, widths[i], { bold: true, fill: HEAD_FILL, size: 16 })),
  });
  const body = rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => (c instanceof TableCell ? c : cell(c, widths[i]))) }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [head, ...body] });
}
function statusPara(b) {
  const s = status(b);
  const kids = [run(s, { bold: true, color: STATUS_COLOR[s], size: 16 })];
  const rest = tail(b, s);
  if (rest) kids.push(run(rest, { size: 16 }));
  return para(kids, { after: 20 });
}
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: FONT })], keepNext: true, pageBreakBefore: false });
}
const resultBoxes = () => [para("☐ PASS  ☐ FAIL", { size: 15, after: 20 }), para("☐ PARTIAL", { size: 15, after: 20 })];

const children = [];
const add = (...xs) => children.push(...xs);

// Title block
add(
  para([run(d.META.title.toUpperCase(), { bold: true, color: ACCENT, size: 20 })], { after: 40 }),
  para([run(d.META.subtitle, { bold: true, size: 40 })], { after: 60 }),
  para([run(d.META.version, { color: MUTED, size: 18 })], { after: 200 }),
);
add(new Table({
  width: { size: USABLE, type: WidthType.DXA }, columnWidths: [2200, USABLE - 2200],
  rows: d.META.rows.map(([k, v]) => new TableRow({
    cantSplit: true,
    children: [cell(k, 2200, { bold: true, fill: HEAD_FILL, size: 17 }), cell(v, USABLE - 2200, { size: 17, bold: k === "Gate rule" })],
  })),
}));
add(para([run(d.META.principle, { italics: true, color: ACCENT, size: 19 })], {
  before: 200, after: 200, indent: { left: 200 },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 8 } },
}));

// Baseline at a glance
add(h1(`Baseline at a glance — main ${d.BASELINE.sha}, ${d.BASELINE.date}`));
add(para("P0 checks only. Every one must be PASS on the release candidate before any push to live. Counts come from the Baseline column below.", { color: MUTED }));
add(para([run("Evidence: ", { bold: true }), run(d.BASELINE.evidence)], { after: 120 }));
const secs = d.ROLE_SECTIONS.map((s) => [s.title.split(" — ")[0], s.rows]);
secs.push(["Universal checks", d.UNIVERSAL.map(([i, c, g, b]) => [i, c, "", "", g, b])]);
const tot = Object.fromEntries(ORDER.map((s) => [s, 0]));
let n = 0;
const sumRows = secs.map(([title, rows]) => {
  const p0 = rows.filter((r) => r[4].startsWith("P0"));
  n += p0.length;
  const c = Object.fromEntries(ORDER.map((s) => [s, 0]));
  p0.forEach((r) => { c[status(r[5])] += 1; tot[status(r[5])] += 1; });
  return [title, String(p0.length), ...ORDER.map((s) => String(c[s]))];
});
const sw = [5140, 1400, 1433, 1433, 1433, 1433, 1433, 1433];
add(new Table({
  width: { size: USABLE, type: WidthType.DXA }, columnWidths: sw,
  rows: [
    new TableRow({ tableHeader: true, children: ["Section", "P0 checks", ...ORDER].map((h, i) =>
      cell(h, sw[i], { bold: true, fill: HEAD_FILL, color: STATUS_COLOR[h], align: i ? AlignmentType.CENTER : undefined })) }),
    ...sumRows.map((r) => new TableRow({ children: r.map((v, i) => cell(v, sw[i], { align: i ? AlignmentType.CENTER : undefined })) })),
    new TableRow({ children: ["Total", String(n), ...ORDER.map((s) => String(tot[s]))].map((v, i) =>
      cell(v, sw[i], { bold: true, fill: "F4F6F9", align: i ? AlignmentType.CENTER : undefined })) }),
  ],
}));
add(para([
  run("Verdict on this baseline: ", { bold: true, size: 18 }),
  run(`${tot.PASS} of ${n} P0 checks pass. NO-GO for any new release until the sprint 1 tickets land and the full run below is repeated on the release candidate. The live release (5b5b68d) stays as it is.`, { size: 18 }),
], { before: 120, after: 120 }));

// 1. How to use
add(h1("1. How to use this checklist"));
d.HOW_TO_USE.forEach((t) => add(para(t, { numbering: { reference: "steps", level: 0 }, size: 18 })));
add(para([run("Gate  ", { bold: true, size: 18 }), run("P0 blocks go-live · P1 is fixed before go-live or accepted in writing by Yazid · P2 is tracked after go-live.", { size: 18 })], { before: 120 }));
add(para([run("How  ", { bold: true, size: 18 }), run("AUTO automated test or harness step · RUN walked by hand, with screenshots · PROD read-only check on production · CODE code or database inspection.", { size: 18 })]));
add(para([run("Status  ", { bold: true, size: 18 }), ...["PASS", "FAIL", "PARTIAL", "BLOCKED"].flatMap((s) => [run(s, { bold: true, color: STATUS_COLOR[s], size: 18 }), run(" · ", { size: 18 })]),
  run("N-I not implemented · N-T not yet tested · N/A.", { size: 18 })]));

// 2. Roles
add(h1("2. Roles and where they land"));
add(table([2600, 2600, 5000, 4938], ["Role", "Lands on (D-010)", "Purpose", "Authority boundary"], d.ROLES));
add(para(d.ROLES_NOTE, { color: MUTED, before: 80 }));

// 3..10 role journeys
const rw = [780, 2200, 3300, 900, 760, 5398, 1800];
d.ROLE_SECTIONS.forEach((s, idx) => {
  add(h1(`${idx + 3}. ${s.title}`));
  add(para(s.intro, { color: MUTED }));
  add(table(rw, ["ID", "Checkpoint", "Expected", "How", "Gate", `Baseline (main ${d.BASELINE.sha})`, "Release candidate"],
    s.rows.map(([i, c, e, how, g, b]) => [
      cell(i, rw[0], { bold: true }), c, e, how,
      cell(g, rw[4], { bold: g.startsWith("P0"), color: g.startsWith("P0") ? "B42318" : INK }),
      cell([statusPara(b)], rw[5]), cell(resultBoxes(), rw[6]),
    ])));
});

let sec = 3 + d.ROLE_SECTIONS.length;
const uw = [1100, 5500, 900, 5838, 1800];
add(h1(`${sec}. Universal checks (every flow)`));
add(table(uw, ["ID", "Check", "Gate", "Baseline", "Release candidate"],
  d.UNIVERSAL.map(([i, c, g, b]) => [cell(i, uw[0], { bold: true }), c, g, cell([statusPara(b)], uw[3]), cell(resultBoxes(), uw[4])])));

add(h1(`${sec + 1}. Release-day checks (production, read-only)`));
add(para("Run after the migrations and the deploy of the release candidate. None of them writes to production.", { color: MUTED }));
add(table(uw, ["ID", "Check", "Gate", "Status today", "Release day"],
  d.RELEASE.map(([i, c, g, b]) => [cell(i, uw[0], { bold: true }), c, g, cell([statusPara(b)], uw[3]), cell(resultBoxes(), uw[4])])));

add(h1(`${sec + 2}. Known findings and where they are fixed`));
add(table([1600, 5000, 5538, 3000], ["Ref", "Finding", "Fix", "State"], d.FINDINGS));

add(h1(`${sec + 3}. Run record (kept for every run, in RELEASES.md)`));
add(table([3000, 7138, 5000], ["Field", "What to record", "Entry"], d.RUN_RECORD.map(([k, v]) => [cell(k, 3000, { bold: true }), v, ""])));

add(h1(`${sec + 4}. Completion rule`));
d.COMPLETION.forEach((t, i) => add(para(t, { size: 18, after: 100, bold: i === 1 })));

add(h1("Appendix A — sources"));
d.SOURCES.forEach((t) => add(para(t, { numbering: { reference: "bullets", level: 0 }, size: 18 })));
add(h1("Appendix B — what changed from the 24 September draft"));
d.CHANGES_FROM_DRAFT.forEach((t) => add(para(t, { numbering: { reference: "bullets", level: 0 }, size: 18 })));

const doc = new Document({
  creator: "PINTAR coordinator",
  title: `${d.META.title} — ${d.META.subtitle}`,
  styles: {
    default: { document: { run: { font: FONT, size: 18, color: INK } } },
    paragraphStyles: [{
      id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { font: FONT, size: 26, bold: true, color: ACCENT },
      paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0, keepNext: true },
    }],
  },
  numbering: {
    config: [
      { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } } } }] },
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "PINTAR 4.0 · End-to-end user flow & release checklist v2 · page ", font: FONT, size: 15, color: MUTED }),
          new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 15, color: MUTED }),
          new TextRun({ text: " of ", font: FONT, size: 15, color: MUTED }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 15, color: MUTED }),
        ],
      })] }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(output, buf); console.log(output); });

// Reads the chosen Lucide icons (lucide-static, ISC) and prints the map that
// project/components/bundle.js embeds: name -> the SVG's inner markup, copied
// verbatim. Usage: node alat/ikon.mjs <path to lucide-static/icons>
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const IKON = [
  "book-open", "award", "users", "graduation-cap", "chart-no-axes-column", "settings", "file-spreadsheet",
  "user-check", "square-pen", "shield", "mail", "circle-help", "id-card", "log-out", "languages", "user",
  "chevron-down", "chevron-left", "chevron-right", "check", "x", "menu", "search", "ellipsis",
  "arrow-up-down", "arrow-up", "arrow-down", "info", "circle-alert", "triangle-alert", "circle-check",
  "calendar", "clock", "eye", "eye-off", "list-filter", "panel-left-close", "panel-left-open", "plus", "trash-2",
];

const dir = process.argv[2];
const peta = {};
for (const n of IKON) {
  const svg = readFileSync(join(dir, `${n}.svg`), "utf8");
  const isi = svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>"));
  peta[n] = isi.replace(/\s*\n\s*/g, "").trim();
}
process.stdout.write(JSON.stringify(peta));

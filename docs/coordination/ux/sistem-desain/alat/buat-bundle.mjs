// Builds project/components/bundle.js from alat/bundle-sumber.js and the
// Lucide icon map (alat/ikon.mjs). Usage: node alat/buat-bundle.mjs <lucide-static/icons>
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const sini = dirname(fileURLToPath(import.meta.url));
const peta = execFileSync("node", [join(sini, "ikon.mjs"), process.argv[2]], { encoding: "utf8" });
const sumber = readFileSync(join(sini, "bundle-sumber.js"), "utf8");
const keluar = sumber.replace("/*IKON*/{}", peta);
if (/<\/script|<!--/i.test(keluar)) throw new Error("bundle.js would close or escape its <script>");
writeFileSync(join(sini, "..", "project", "components", "bundle.js"), keluar);
console.log("bundle.js", keluar.length, "bytes");

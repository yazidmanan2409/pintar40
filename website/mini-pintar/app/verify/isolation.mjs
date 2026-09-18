// Mini-PINTAR — zero-write and no-storage isolation, asserted on the source.
//
// ADR-0021's five properties are structural facts, and the ADR's audit
// evidence says an auditor confirms the decision "by finding no Mini-PINTAR
// write path ... and no request from the demonstration carrying an answer".
// This is that check, mechanised. It reads the shipped files and fails on
// any API that could persist, transmit or identify.
//
// The ruling of 2026-09-18 (§6.3) is the strict form: no localStorage, no
// sessionStorage, no IndexedDB, no cookie for answers, progress, adaptation
// or outcome. This file bans them outright rather than by purpose, because
// "for answers" is not a distinction a scanner can make and a bundle that
// never touches storage needs no such distinction.
//
// Run: node verify/isolation.mjs

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");

const SHIPPED = ["index.html", "style.css", "content.js", "adapt.js", "app.js"];
const PURE = ["content.js", "adapt.js"];

const fails = [];
const fail = (what, where) => fails.push(`${what} — ${where}`);
let checks = 0;

const src = Object.fromEntries(
  SHIPPED.map((f) => [f, readFileSync(join(APP, f), "utf8")]));

/**
 * Comments say why a rule exists; they must not be able to satisfy or
 * violate one. Both are stripped before scanning, so this file's own
 * mention of `localStorage` in a comment does not trip it.
 */
function code(text, file) {
  if (file.endsWith(".css")) return text.replace(/\/\*[\s\S]*?\*\//g, " ");
  if (file.endsWith(".html")) return text.replace(/<!--[\s\S]*?-->/g, " ");
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
}

const CODE = Object.fromEntries(SHIPPED.map((f) => [f, code(src[f], f)]));

// ------------------------------------------------------------- persistence

const PERSISTENCE = [
  "localStorage", "sessionStorage", "indexedDB", "openDatabase",
  "document.cookie", "cookieStore", "caches.open", "CacheStorage",
  "navigator.storage", "FileSystemHandle", "showSaveFilePicker",
];

// ------------------------------------------------------------ transmission

const TRANSMISSION = [
  "fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource",
  "RTCPeerConnection", "navigator.connection", "import(",
  "new Image", "importScripts", "postMessage", "BroadcastChannel",
  "<form", "formaction", "method=", "action=",
];

// ---------------------------------------------------------- identification

const IDENTIFICATION = [
  "randomUUID", "getUserMedia", "geolocation", "navigator.userAgent",
  "navigator.platform", "navigator.hardwareConcurrency", "deviceMemory",
  "gtag", "dataLayer", "_paq", "analytics", "mixpanel", "segment",
  "clarity", "hotjar", "fbq", "plausible", "posthog",
];

for (const file of SHIPPED) {
  for (const [label, list] of [
    ["persistence", PERSISTENCE],
    ["transmission", TRANSMISSION],
    ["identification", IDENTIFICATION],
  ]) {
    for (const needle of list) {
      if (CODE[file].includes(needle)) fail(`${label} API "${needle}"`, file);
      else checks += 1;
    }
  }
}

// No external origin anywhere: no webfont, no CDN, no tracking pixel, no
// preconnect. The only network activity is the browser fetching the five
// files above. A page arguing that it keeps nothing about you has to be
// true of its own requests first.
for (const file of SHIPPED) {
  const urls = CODE[file].match(/\b(?:https?:)?\/\/[a-z0-9.-]+/gi) || [];
  if (urls.length) fail(`external origin ${urls.join(", ")}`, file);
  else checks += 1;
}

// Every relative reference resolves inside the bundle.
const refs = [
  ...(CODE["index.html"].match(/(?:src|href)="([^"]+)"/g) || []),
].map((m) => m.replace(/.*="([^"]+)"/, "$1"));
for (const r of refs) {
  if (!SHIPPED.includes(r)) fail(`reference outside the bundle: ${r}`, "index.html");
  else checks += 1;
}

// ----------------------------------------------------------------- purity
//
// The adaptation must be replayable. Anything time-dependent or random in
// content.js or adapt.js would make "same answers -> same result" false,
// and paths.mjs's replay would then be proving a property the code does not
// have. app.js is exempt: its decorative clock and its hesitation window
// read the time and change nothing the adaptation sees.

const IMPURE = ["Date", "Math.random", "performance.now", "setTimeout",
                "setInterval", "requestAnimationFrame", "crypto"];
for (const file of PURE) {
  for (const needle of IMPURE) {
    if (CODE[file].includes(needle)) fail(`impure "${needle}" in a replayable module`, file);
    else checks += 1;
  }
}

// adapt.js must not touch the DOM: a pure function that reads a checkbox is
// not a pure function.
for (const needle of ["document.", "window.", "location", "navigator"]) {
  if (CODE["adapt.js"].includes(needle)) fail(`DOM access "${needle}"`, "adapt.js");
  else checks += 1;
}

// ------------------------------------------------ state lives in memory only
//
// The positive half of the claim: there IS a single in-memory object, it is
// rebuilt from nothing on restart, and the threshold discloses the
// consequence in advance.

if (!/const FRESH = \(\) => \(\{/.test(CODE["app.js"]))
  fail("no single in-memory state factory found", "app.js");
else checks += 1;

if (!CODE["app.js"].includes("s = FRESH()"))
  fail("restart does not rebuild state from nothing", "app.js");
else checks += 1;

if (!CODE["app.js"].includes("thresholdReload"))
  fail("the threshold does not disclose that a reload restarts", "app.js");
else checks += 1;

// The language preference is read, never written: a functional preference
// may live on the corporate site by its own mechanism, but nothing
// educational may enter it and nothing here may write one.
if (!/URLSearchParams\(location\.search\)/.test(CODE["app.js"]))
  fail("initial language is not read from the document or the query", "app.js");
else checks += 1;

// pushState carries a step name and nothing else. An answer in the URL
// would be an answer in the visitor's history, their referrer header and
// anyone's server log.
const pushes = CODE["app.js"].match(/(?:push|replace)State\([^)]*\)/g) || [];
for (const p of pushes) {
  if (/mapChoices|checkChoices|choice|answer|outcome/.test(p))
    fail(`history entry carries an answer: ${p}`, "app.js");
  else checks += 1;
}
if (pushes.length === 0) fail("no history handling found", "app.js");

// --------------------------------------------------------------- report

if (fails.length) {
  console.error(`\nisolation FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(`isolation OK — ${checks} checks across ${SHIPPED.length} shipped files: ` +
            `no persistence, no transmission, no identification, no external origin, ` +
            `adaptation replayable`);

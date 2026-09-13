#!/usr/bin/env node
/**
 * baseline-parity — the frozen architecture baseline is what it says it is.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT A MARKER COUNT. The repository's
 * `docs/rebuild/` copies drifted from the authoritative ones and nobody could
 * see it: a stale document reads as complete and gets quoted in good faith, so
 * the divergence only surfaced when two parties quoted the same document and
 * disagreed. That cost two review rounds.
 *
 * The first instrument here counted `Baseline amendment (...)` markers. The
 * reconciliation measurement retired that idea on evidence rather than
 * argument: doc 03 carried the correct marker AND was still stale, while the
 * readiness report, doc 16 and the freeze record carry no marker at all. Three
 * of eighteen documents are structurally invisible to marker-counting, and one
 * of them is the sync manifest itself. Content integrity is not the better
 * option; it is the only one that works.
 *
 * SIX ASSERTIONS.
 *   1. every listed path exists and its sha256 matches      — stale content, silent edits
 *   2. every file in a governed directory is listed         — additions and renames without governance
 *   3. each document's own marker equals its manifest baseline — two records that must agree
 *   4. a changed digest requires a changed baseline         — editing a frozen document silently
 *   5. a changed baseline requires an ADR in the same diff  — amendments are recorded where amendments live
 *   6. no ungoverned second copy of a governed document     — the defect itself, one level up
 *
 * Assertion 2 is the one usually omitted and the one that makes a DELETION
 * visible. Its governed directories are derived from the manifest rather than
 * hard-coded, so a manifest that starts governing a new directory gets the
 * protection without anyone remembering to widen a constant.
 *
 * Assertion 6 exists because syncing the baseline in created exactly the defect
 * the rest of this script is about: seven FABLE prompts landed under
 * `fable-prompts/` while `docs/phases/` already held copies of the same
 * documents, two of them pre-amendment. Two copies, no way to see which is
 * current — the original failure, reproduced by the repair. It matches an
 * ungoverned file to a governed one by BASENAME or by first `# ` heading,
 * because the two stale copies had kept the name while changing the title and
 * one exact copy had kept the title while changing the name. A copy that
 * changes BOTH is still invisible to this, and that limit is real: assertion 6
 * catches a duplicate that still looks like what it is, not one disguised.
 *
 * 4 and 5 need git history. Run with --no-git to skip them (the selftest does,
 * so the same logic is checked locally without a second implementation).
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const MANIFEST = "docs/rebuild/BASELINE-MANIFEST.json";
// Directories that assertion 6 will not walk. .git and node_modules for the
// obvious reason; docs/implementation-notes/ because it exists precisely to
// hold commentary ABOUT governed documents and would otherwise be read as a
// duplicate of them.
const SKIP_WALK = new Set([".git", "node_modules", ".next", "dist", "coverage"]);
// The manifest cannot list its own digest. Named here rather than pattern-matched
// so the exception is one line a reader can see.
const NOT_A_BASELINE_DOCUMENT = new Set([MANIFEST]);
const MARKER = /Baseline amendment \((\d{4}-\d{2}-\d{2})\)/;

const useGit = !process.argv.includes("--no-git");
const problems = [];
const notes = [];
const fail = (m) => problems.push(m);
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

const manifest = JSON.parse(readFileSync(join(ROOT, MANIFEST), "utf8"));
const docs = manifest.documents ?? [];
if (docs.length === 0) fail("the manifest lists no documents");

// --- 1. every listed path exists and matches -------------------------------
for (const d of docs) {
  const p = join(ROOT, d.path);
  if (!existsSync(p)) { fail(`1: missing from the repository: ${d.path}`); continue; }
  const got = sha(p);
  if (got !== d.sha256) {
    fail(`1: content differs from the frozen baseline: ${d.path}\n     manifest ${d.sha256}\n     repo     ${got}`);
  }
}

// --- 2. every file in a governed directory is listed ------------------------
const listed = new Set(docs.map((d) => d.path));
// Derived, not hard-coded: whatever directories the manifest governs are the
// directories that get swept. `docs/rebuild` and `fable-prompts` today.
const governedDirs = [...new Set(docs.map((d) => dirname(d.path)))].sort();
for (const dir of governedDirs) {
  if (!existsSync(join(ROOT, dir))) { fail(`2: governed directory is missing: ${dir}/`); continue; }
  for (const f of readdirSync(join(ROOT, dir))) {
    const p = `${dir}/${f}`;
    if (NOT_A_BASELINE_DOCUMENT.has(p)) continue;
    if (!listed.has(p)) fail(`2: present under ${dir}/ but absent from the manifest: ${p}`);
  }
}

// --- 3. the document's own marker equals its manifest baseline --------------
for (const d of docs) {
  const p = join(ROOT, d.path);
  if (!existsSync(p)) continue;
  const m = MARKER.exec(readFileSync(p, "utf8"));
  const inDoc = m ? m[1] : null;
  if (inDoc !== (d.baseline ?? null)) {
    fail(`3: the document's marker and its manifest baseline disagree: ${d.path}\n     document ${inDoc ?? "(none)"}\n     manifest ${d.baseline ?? "(none)"}`);
  }
}

// --- 6. no ungoverned second copy of a governed document --------------------
const firstHeading = (file) => {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (line.startsWith("# ")) return line.trim();
    if (line.trim() !== "") return null;
  }
  return null;
};
const byName = new Map();
const byTitle = new Map();
for (const d of docs) {
  const p = join(ROOT, d.path);
  if (!existsSync(p)) continue;
  byName.set(basename(d.path), d.path);
  const t = firstHeading(p);
  if (t) byTitle.set(t, d.path);
}
const walk = (dir) => {
  for (const f of readdirSync(join(ROOT, dir === "" ? "." : dir))) {
    if (SKIP_WALK.has(f)) continue;
    const rel = dir === "" ? f : `${dir}/${f}`;
    const abs = join(ROOT, rel);
    if (statSync(abs).isDirectory()) { walk(rel); continue; }
    if (!f.endsWith(".md")) continue;
    if (listed.has(rel) || NOT_A_BASELINE_DOCUMENT.has(rel)) continue;
    const hit = byName.get(f) ?? byTitle.get(firstHeading(abs) ?? "\u0000");
    if (hit) {
      fail(`6: ${rel} is an ungoverned second copy of the governed document ${hit}. ` +
        `One copy of a baseline document, in the directory the manifest governs — ` +
        `two copies is the defect this whole script exists to end.`);
    }
  }
};
walk("");

// --- 4 and 5: history ------------------------------------------------------
if (useGit) {
  let previous = null;
  try {
    previous = JSON.parse(execFileSync("git", ["show", `HEAD~1:${MANIFEST}`], { encoding: "utf8" }));
  } catch {
    notes.push("no previous manifest in history (first commit, or a shallow clone): 4 and 5 not evaluated");
  }
  if (previous) {
    const before = new Map((previous.documents ?? []).map((d) => [d.path, d]));
    const movedDigest = [];
    const movedBaseline = [];
    for (const d of docs) {
      const b = before.get(d.path);
      if (!b) continue;
      if (b.sha256 !== d.sha256) movedDigest.push(d.path);
      if ((b.baseline ?? null) !== (d.baseline ?? null)) movedBaseline.push(d.path);
    }
    for (const p of movedDigest) {
      if (!movedBaseline.includes(p)) {
        fail(`4: ${p} changed content without changing its baseline identity. A frozen document changes only as a recognisable amendment.`);
      }
    }
    if (movedBaseline.length > 0) {
      let touched = [];
      try {
        touched = execFileSync("git", ["diff", "--name-only", "HEAD~1", "HEAD"], { encoding: "utf8" })
          .split("\n").filter(Boolean);
      } catch { /* handled below */ }
      if (!touched.some((f) => f.startsWith("docs/adr/"))) {
        fail(`5: ${movedBaseline.join(", ")} changed baseline identity without an ADR in the same change (doc 13: amendments are recorded where amendments are recorded).`);
      }
    }
    notes.push(`history: ${movedDigest.length} digest change(s), ${movedBaseline.length} baseline change(s)`);
  }
} else {
  notes.push("--no-git: assertions 4 and 5 skipped");
}

for (const n of notes) console.log(`note: ${n}`);
if (problems.length > 0) {
  console.error(`\nbaseline-parity FAILED — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("\nThe architecture baseline in docs/rebuild/ is frozen. If an amendment was");
  console.error("supplied, sync the files, update BASELINE-MANIFEST.json (sha256, bytes and");
  console.error("baseline), and record the amendment in docs/adr/ in the same commit.");
  process.exit(1);
}
console.log(`baseline-parity OK — ${docs.length} document(s) byte-identical to the frozen baseline`);

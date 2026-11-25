/**
 * ENG-GUARD (Sharon, ENG-SKILLS-REVIEW-ecf2b5cc E3) -- THE ENGINEERING GUIDANCE
 * CANNOT QUIETLY GROW AN EXECUTION PATH. Agent skills (.claude/skills) and
 * CLAUDE.md are text a session reads; they run nothing. What would run
 * something is a settings hook, an MCP server or a plugin, and each of those
 * is a supply-chain decision that needs Sharon's review. So the repository
 * carries none: no .mcp.json, and no `hooks`, `mcpServers`, `enabledPlugins`
 * or `extraKnownMarketplaces` in .claude/settings*.json. The allowlist is
 * empty. A skill folder holds only Markdown (Sharon N1): a bundled script is code. The test also proves itself on a planted tree that has each of them.
 * And CLAUDE.md stays an index: every skill it names exists, every skill that
 * exists is named, and each SKILL.md's name matches its directory.
 */
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

/** Settings keys that make the harness run code or reach a service. None is allowed (Sharon E3). */
const ALLOWED: string[] = [];
const FORBIDDEN_KEYS = ["hooks", "mcpServers", "enabledPlugins", "extraKnownMarketplaces", "enabledMcpjsonServers"];
/** Files a skill folder may hold besides Markdown. None (Sharon N1): a bundled script is code a session could be told to run. */
const SKILL_FILES_ALLOWED: string[] = [];

/** Every file under a directory, relative to it. */
function filesUnder(dir: string, rel = ""): string[] {
  return readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? filesUnder(dir, join(rel, d.name)) : [join(rel, d.name)]);
}

/** Every problem in a tree: an execution path, or an index that has drifted from the skills. */
export function guidanceProblems(root: string): string[] {
  const out: string[] = [];
  if (existsSync(join(root, ".mcp.json"))) out.push(".mcp.json is present");
  for (const f of ["settings.json", "settings.local.json"]) {
    const p = join(root, ".claude", f);
    if (!existsSync(p)) continue;
    let json: Record<string, unknown> = {};
    try { json = JSON.parse(readFileSync(p, "utf8")); } catch { out.push(`.claude/${f} is not valid JSON`); continue; }
    for (const k of FORBIDDEN_KEYS) if (k in json && !ALLOWED.includes(k)) out.push(`.claude/${f} declares ${k}`);
  }
  const dir = join(root, ".claude", "skills");
  const skills = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  const index = existsSync(join(root, "CLAUDE.md")) ? readFileSync(join(root, "CLAUDE.md"), "utf8") : "";
  if (skills.length && !index) out.push("skills exist but CLAUDE.md, their index, is missing");
  const named = [...index.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]);
  for (const s of skills) {
    const md = join(dir, s, "SKILL.md");
    if (!existsSync(md)) { out.push(`.claude/skills/${s} has no SKILL.md`); continue; }
    const head = readFileSync(md, "utf8").split("\n---")[0];
    if (!new RegExp(`^name: ${s}$`, "m").test(head)) out.push(`.claude/skills/${s}/SKILL.md does not name itself ${s}`);
    if (!/^description: \S/m.test(head)) out.push(`.claude/skills/${s}/SKILL.md has no description`);
    if (!named.includes(s)) out.push(`CLAUDE.md does not index the skill ${s}`);
    for (const f of filesUnder(join(dir, s))) {
      if (!f.endsWith(".md") && !SKILL_FILES_ALLOWED.includes(join(s, f))) out.push(`.claude/skills/${s}/${f} is not Markdown`);
      else if (statSync(join(dir, s, f)).mode & 0o111) out.push(`.claude/skills/${s}/${f} is executable`);
    }
  }
  for (const n of named) if (!skills.includes(n)) out.push(`CLAUDE.md indexes ${n}, which does not exist`);
  return out;
}

export const engGuardTests: SelfTest[] = [
  {
    id: "ENG-GUARD-01",
    run: async (ctx) => {
      const c = new Checks();
      // the repository itself: no execution path, and an index that matches the skills
      const found = guidanceProblems(ctx.repoRoot);
      c.expect(found.length === 0, `the engineering guidance has problems: ${found.join("; ")}`);
      c.expect(ALLOWED.length === 0 && SKILL_FILES_ALLOWED.length === 0, "an allowlist is not empty; every entry needs Sharon's review");
      const index = readFileSync(join(ctx.repoRoot, "CLAUDE.md"), "utf8");
      c.expect(/## Never/.test(index) && /Sharon's review/.test(index) && /third part/.test(index),
        "CLAUDE.md's «Never» list lost the supply-chain rule");

      // the scan is a CI control that fails closed (owner, 25 Nov; Sharon E1): its job runs the tree scan with no
      // condition and no continue-on-error, and the verdict needs it, so a failed, skipped or cancelled scan is red
      const ci = readFileSync(join(ctx.repoRoot, ".github/workflows/ci.yml"), "utf8");
      const scan = /\n {2}guard-scan:\n([\s\S]*?)(?=\n {2}[a-z-]+:\n)/.exec(ci)?.[1] ?? "";
      c.expect(/run: node scripts\/guard\/sensitive-scan\.mjs --tree\s*$/m.test(scan), "ci.yml has no guard-scan job running the tree scan");
      c.expect(!/^\s+if:|continue-on-error/m.test(scan), "guard-scan can be skipped or its failure ignored");
      const needs = /\n {2}verdict:\n[\s\S]*?needs: \[([^\]]+)\]/.exec(ci)?.[1] ?? "";
      c.expect(needs.split(",").map((x) => x.trim()).includes("guard-scan"), "the verdict does not need guard-scan");

      // the plant: a tree with every execution path and a drifted index must be caught on each count
      const plant = mkdtempSync(join(tmpdir(), "eng-guard-"));
      try {
        writeFileSync(join(plant, ".mcp.json"), "{}");
        mkdirSync(join(plant, ".claude", "skills", "orphan"), { recursive: true });
        writeFileSync(join(plant, ".claude", "settings.json"), JSON.stringify({ hooks: {}, mcpServers: {}, enabledPlugins: {} }));
        writeFileSync(join(plant, ".claude", "skills", "orphan", "SKILL.md"), "---\nname: wrong\n---\n");
        writeFileSync(join(plant, "CLAUDE.md"), "| `ghost` | x |\n");
        writeFileSync(join(plant, ".claude", "skills", "orphan", "run.sh"), "#!/bin/sh\n", { mode: 0o755 });
        const caught = guidanceProblems(plant);
        for (const want of [".mcp.json is present", "declares hooks", "declares mcpServers", "declares enabledPlugins",
          "does not name itself orphan", "has no description", "does not index the skill orphan", "indexes ghost",
          "orphan/run.sh is not Markdown"]) {
          c.expect(caught.some((x) => x.includes(want)), `the plant was not caught: ${want}`);
        }
      } finally {
        rmSync(plant, { recursive: true, force: true });
      }
      return c.verdict("no .mcp.json and no hooks, MCP servers or plugins in .claude settings (allowlist empty); CLAUDE.md indexes exactly the skills that exist, each named after its directory with a description and holding only Markdown; the «Never» list keeps the supply-chain rule; CI's guard-scan runs the tree scan unconditionally and the verdict needs it; a planted tree with each of these is caught");
    },
  },
];

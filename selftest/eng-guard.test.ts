/**
 * ENG-GUARD (Sharon, ENG-SKILLS-REVIEW-ecf2b5cc E3) -- THE ENGINEERING GUIDANCE
 * CANNOT QUIETLY GROW AN EXECUTION PATH. Agent skills (.claude/skills) and
 * CLAUDE.md are text a session reads; they run nothing. What would run
 * something is a settings hook, an MCP server or a plugin, and each of those
 * is a supply-chain decision that needs Sharon's review. So the repository
 * carries none: no .mcp.json, and no `hooks`, `mcpServers`, `enabledPlugins`
 * or `extraKnownMarketplaces` in .claude/settings*.json. The allowlist is
 * empty. The test also proves itself on a planted tree that has each of them.
 * And CLAUDE.md stays an index: every skill it names exists, every skill that
 * exists is named, and each SKILL.md's name matches its directory.
 */
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

/** Settings keys that make the harness run code or reach a service. None is allowed (Sharon E3). */
const ALLOWED: string[] = [];
const FORBIDDEN_KEYS = ["hooks", "mcpServers", "enabledPlugins", "extraKnownMarketplaces", "enabledMcpjsonServers"];

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
      c.expect(ALLOWED.length === 0, "the settings allowlist is not empty; every entry needs Sharon's review");
      const index = readFileSync(join(ctx.repoRoot, "CLAUDE.md"), "utf8");
      c.expect(/## Never/.test(index) && /Sharon's review/.test(index) && /third part/.test(index),
        "CLAUDE.md's «Never» list lost the supply-chain rule");

      // the plant: a tree with every execution path and a drifted index must be caught on each count
      const plant = mkdtempSync(join(tmpdir(), "eng-guard-"));
      try {
        writeFileSync(join(plant, ".mcp.json"), "{}");
        mkdirSync(join(plant, ".claude", "skills", "orphan"), { recursive: true });
        writeFileSync(join(plant, ".claude", "settings.json"), JSON.stringify({ hooks: {}, mcpServers: {}, enabledPlugins: {} }));
        writeFileSync(join(plant, ".claude", "skills", "orphan", "SKILL.md"), "---\nname: wrong\n---\n");
        writeFileSync(join(plant, "CLAUDE.md"), "| `ghost` | x |\n");
        const caught = guidanceProblems(plant);
        for (const want of [".mcp.json is present", "declares hooks", "declares mcpServers", "declares enabledPlugins",
          "does not name itself orphan", "has no description", "does not index the skill orphan", "indexes ghost"]) {
          c.expect(caught.some((x) => x.includes(want)), `the plant was not caught: ${want}`);
        }
      } finally {
        rmSync(plant, { recursive: true, force: true });
      }
      return c.verdict("no .mcp.json and no hooks, MCP servers or plugins in .claude settings (allowlist empty); CLAUDE.md indexes exactly the skills that exist, each named after its directory with a description; the «Never» list keeps the supply-chain rule; a planted tree with each of these is caught");
    },
  },
];

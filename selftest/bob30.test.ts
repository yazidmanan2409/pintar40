/**
 * BOB-30 (D-031, CAP-02) -- AN ANSWER IS SAVED WITHOUT REDRAWING THE PAGE.
 *
 * Like the lesson save before BOB-23, every learner action in
 * src/app/belajar/actions.ts wrote the session cookie back unchanged, and Next
 * redraws the whole page for any server action that writes a cookie. On the
 * assessment page that meant, for EVERY answer, the paper, the answers so far
 * and the session state read again, and the whole player sent new props it
 * never reads: its state is taken once, at mount, and after that from each
 * action's own result.
 *
 * The fix is the one BOB-23 made for the lesson save, for all of them: `db()`
 * opens the caller's client with `tulisJikaBerubah`, so the session cookie is
 * written only when it changed (a refresh, a sign-out). What the rule itself
 * does is BOB23-K01's (cookieYangBerubah); this holds every learner action to
 * it, and the player to never needing a redraw.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

function tanpaKomentar(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** Each exported function's body in a source file, by name. */
function fungsi(src: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /export async function ([A-Za-z0-9_]+)\s*\(/g;
  const awal = [...src.matchAll(re)].map((m) => ({ nama: m[1], i: m.index ?? 0 }));
  awal.forEach((f, k) => out.set(f.nama, src.slice(f.i, k + 1 < awal.length ? awal[k + 1].i : src.length)));
  return out;
}

export const bob30Tests: SelfTest[] = [
  {
    id: "BOB30-K01",
    run: async (ctx) => {
      const c = new Checks();
      const baca = (f: string) => tanpaKomentar(readFileSync(join(ctx.repoRoot, f), "utf8"));
      const aksi = baca("src/app/belajar/actions.ts");
      const pemain = baca("src/app/belajar/_components/ItemPlayer.tsx");

      // 1. the one client every learner action opens writes only a changed session
      const db = /async function db\(\)\s*\{[\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      c.expect(/supabaseServer\(\{ tulisJikaBerubah: true \}\)/.test(db),
        "db() writes the session cookie back unchanged, so every learner action redraws its page");
      const telanjang = aksi.match(/supabaseServer\(\s*\)/g) ?? [];
      c.expect(telanjang.length === 0, `${telanjang.length} learner action client(s) still write the session back unchanged (supabaseServer())`);

      // 2. every action the item player is handed, and the lesson save, reaches that client
      const tipe = /actions:\s*\{([\s\S]*?)\n\s{2}\};/.exec(pemain)?.[1] ?? "";
      const diberikan = [...tipe.matchAll(/^\s{4}([a-zA-Z]+):/gm)].map((m) => m[1]);
      c.expect(diberikan.length >= 9, `the player's action list could not be read (${diberikan.length} found)`);
      const badan = fungsi(aksi);
      for (const nama of [...diberikan, "saveLessonProgress", "mulaiAsesmen", "startSession"]) {
        const b = badan.get(nama);
        c.expect(b !== undefined, `the player is handed ${nama}, which src/app/belajar/actions.ts does not export`);
        if (b) {
          c.expect(/await db\(\)|supabaseServer\(\{ tulisJikaBerubah: true \}\)/.test(b),
            `${nama} does not open the client that writes only a changed session`);
        }
      }
      // and nothing is exported there that bypasses it
      for (const [nama, b] of badan) {
        c.expect(!/supabaseServer\(/.test(b) || /supabaseServer\(\{ tulisJikaBerubah: true \}\)/.test(b),
          `${nama} opens its own client without tulisJikaBerubah`);
      }

      // 3. the player never needs the redraw: it takes nothing from a re-render
      c.expect(!/router\.refresh\(|revalidatePath|revalidateTag/.test(pemain + aksi),
        "the item player or its actions ask for a redraw, so the page still re-renders per answer");
      c.expect(/useState<Record<string, Answer>>\(props\.accepted\)/.test(pemain) && /useRef<Record<string, number>>\(\{ \.\.\.props\.seqs \}\)/.test(pemain),
        "the player no longer takes the server's answers and sequence once, at mount");
      c.expect(/setAccepted\(\(a\) => \(\{ \.\.\.a, \[item\]: v \}\)\)/.test(pemain),
        "an answer is no longer shown from its own acknowledgement");

      return c.verdict(
        "src/app/belajar/actions.ts opens one client, db(), with tulisJikaBerubah, so a learner action writes the session cookie " +
          `only when it changed and no longer redraws its page; each of the ${diberikan.length} actions ItemPlayer is handed ` +
          "(submitAnswer, noteView, assistance, openAssistance, dismissAssistance, pauseSession, resumeSession, noteIntegrity, " +
          "finishSession), the lesson save and the start reach it, and no exported action opens a client without it; the player asks " +
          "for no redraw, takes the server's answers and sequence once at mount, and shows an answer from its own acknowledgement",
      );
    },
  },
];

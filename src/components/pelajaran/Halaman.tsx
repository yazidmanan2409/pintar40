/**
 * L4 (CR-88, D-127 Q9's engineering; investigation RC-6 (3), FD-6): ONE RENDERER, TWO PLACES. What a lesson's
 * pages are, how a page is drawn and what a worked example says live here, and both the learner's player
 * (src/app/belajar/_components/LessonPlayer.tsx) and Studio's preview (src/app/studio/pratinjau/[pelajaran])
 * draw through them. The preview used to flatten the lesson into one card and print `[[visual:…]]` as text.
 *
 * No hooks and no browser API: the player, a client component, and the preview, a server component, import
 * the same functions. Paging, saving and step-by-step reveal stay the player's own.
 */
import TeksBlok, { TeksBaris } from "@/components/teks/Teks";
import { t } from "@/lib/hle";

/** PAGINATION IS AT HEADING BOUNDARIES (`## `), so authoring controls it. Never empty: a lesson has a page. */
export function halamanPelajaran(bodyMarkdown: string | null | undefined): string[][] {
  const out: string[][] = [];
  let currentPage: string[] = [];
  for (const line of (bodyMarkdown ?? "").split("\n")) {
    if (line.startsWith("## ") && currentPage.some((l) => l.trim() !== "")) {
      out.push(currentPage);
      currentPage = [];
    }
    currentPage.push(line);
  }
  if (currentPage.some((l) => l.trim() !== "")) out.push(currentPage);
  return out.length ? out : [[""]];
}

/** `[[visual:pecahan|3/8]]` → a drawn diagram. Unknown directives render as text. */
export function Visual({ spec }: { spec: string }) {
  const [kind, arg] = spec.split("|");
  if (kind === "pecahan" && arg && arg.includes("/")) {
    const [numStr, denStr] = arg.split("/");
    const num = Number(numStr), den = Number(denStr);
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0 && num >= 0 && num <= den) {
      const w = 320, h = 64, cell = w / den;
      return (
        // Readiness (Daisy, 8 Nov): the diagram's name is copy (hle.ts), in the lesson's own language, which is the
        // content's (a lesson's text is not translated around it)
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={t("pelajaran.visual.pecahan", "learner").replace("{n}", String(num)).replace("{m}", String(den))}
             className="pin-lmedia">
          {Array.from({ length: den }, (_, i) => (
            <rect key={i} x={i * cell} y={0} width={cell} height={h}
              fill={i < num ? "var(--pintar-primary)" : "var(--surface-2)"}
              stroke="var(--line-1)" strokeWidth={1} />
          ))}
        </svg>
      );
    }
  }
  return <p className="pin-meta">{spec}</p>;
}

/**
 * DAISY-30: a page's lines are drawn by the shared renderer (TeksBlok), which reads the lesson's own marks; the one
 * directive only a lesson knows, a drawn diagram, is handed back here.
 */
export function sisipVisual(line: string) {
  const visual = /^\[\[visual:(.+)\]\]$/.exec(line.trim());
  return visual ? <Visual spec={visual[1]} /> : null;
}

/** One page of a lesson, as the learner reads it. */
export function HalamanPelajaran({ baris }: { baris: string[] }) {
  return <article className="pin-prose"><TeksBlok teks={baris.join("\n")} sisip={sisipVisual} /></article>;
}

export type ContohLangkah = { judul?: string; langkah?: string[] };

/** The worked example a lesson shows: its first, when it has steps. One rule for the player and the preview. */
export function contohPelajaran(contoh: readonly ContohLangkah[] | null | undefined): ContohLangkah | null {
  const pertama = (contoh ?? [])[0];
  return pertama && (pertama.langkah ?? []).length > 0 ? pertama : null;
}

/** A worked example's steps, the first `tampil` of them (the player reveals one at a time; the preview shows all). */
export function LangkahContoh({ contoh, tampil }: { contoh: ContohLangkah; tampil: number }) {
  const langkah = contoh.langkah ?? [];
  return (
    <>
      <h3 className="pin-lh3"><TeksBaris teks={contoh.judul} /></h3>
      <ol className="pin-steps">
        {langkah.slice(0, tampil).map((s, i) => (
          <li key={i} className="pin-langkah"><span className="pin-n">{i + 1}</span><span><TeksBaris teks={s} /></span></li>
        ))}
      </ol>
    </>
  );
}

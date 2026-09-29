import { Fragment, type ReactNode } from "react";

/**
 * DAISY-30: LEARNER TEXT RENDERS ITS OWN MARKUP.
 *
 * Lessons are written with a little markup: **bold**, "- " lines for a list,
 * pipe tables, and (SMA X Matematika) ^{…} / _{…} for what Unicode cannot
 * write, such as a^{m/n}. The lesson player drew every line as a plain <p> and
 * the item screens drew stems and options as plain text, so a learner read the
 * asterisks and the pipes. This is the one renderer for all of it: the lesson
 * player, question stems, options and rationales, the result and review
 * screens, and Studio's preview.
 *
 * REACT ELEMENTS ONLY. Nothing is parsed as HTML and there is no
 * dangerouslySetInnerHTML: a «<b>» in a lesson is shown as the three
 * characters it is. Anything that is not one of the marks above, or a mark
 * left open, renders literally, exactly as it did before.
 *
 * LINES STAY LINES. Authors break lines on purpose (a bar chart drawn in █, a
 * pictogram, «**Coba:** …» over «_Periksa: …_»), so a single newline is a new
 * line, as the player always drew it, and never merged into one paragraph.
 *
 * A TABLE IS A "|" LINE FOLLOWED BY A |---| LINE. Tally marks («||||/ ||») and
 * a pipe inside a sentence («979 | 875») are text, not tables.
 */

/** Inline marks: **bold**, ^{sup}, _{sub}. For a stem, an option, a line. */
export function TeksBaris({ teks }: { teks: string | null | undefined }) {
  if (!teks) return null;
  return <>{sebaris(teks)}</>;
}

/**
 * A body of lines: paragraphs, «## » headings, "- " lists and pipe tables,
 * each line's inline marks included. `sisip` lets the lesson player draw its
 * own line directives (a [[visual:…]] diagram) in place.
 */
export default function TeksBlok({
  teks,
  sisip,
}: {
  teks: string | null | undefined;
  sisip?: (baris: string) => ReactNode | null;
}) {
  if (!teks) return null;
  return <>{blok(teks, sisip)}</>;
}

export type Blok =
  | { jenis: "p"; teks: string }
  | { jenis: "h"; teks: string }
  | { jenis: "ul"; butir: string[] }
  | { jenis: "tabel"; kepala: string[]; baris: string[][] }
  | { jenis: "sisip"; teks: string };

const PEMISAH = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

/** A line of a table: it starts with a pipe. */
const barisTabel = (b: string) => b.trimStart().startsWith("|");

/** The line after a table's head: dashes between pipes, and at least one pipe. */
const pemisah = (b: string | undefined) => b !== undefined && b.includes("|") && PEMISAH.test(b);

function sel(b: string): string[] {
  let x = b.trim();
  if (x.startsWith("|")) x = x.slice(1);
  if (x.endsWith("|")) x = x.slice(0, -1);
  return x.split("|").map((c) => c.trim());
}

/** The body as blocks. Pure, so the test reads the structure as well as the render. */
export function uraiBlok(teks: string, sisip?: (baris: string) => boolean): Blok[] {
  const baris = teks.replace(/\r\n?/g, "\n").split("\n");
  const out: Blok[] = [];
  for (let i = 0; i < baris.length; i++) {
    const b = baris[i];
    if (b.trim() === "") continue;
    if (sisip?.(b)) { out.push({ jenis: "sisip", teks: b }); continue; }
    if (b.startsWith("## ")) { out.push({ jenis: "h", teks: b.slice(3) }); continue; }
    if (b.startsWith("- ")) {
      const butir: string[] = [];
      while (i < baris.length && baris[i].startsWith("- ")) butir.push(baris[i++].slice(2));
      i--;
      out.push({ jenis: "ul", butir });
      continue;
    }
    if (barisTabel(b) && pemisah(baris[i + 1])) {
      const kepala = sel(b);
      const isi: string[][] = [];
      i += 2;
      while (i < baris.length && barisTabel(baris[i])) isi.push(sel(baris[i++]));
      i--;
      out.push({ jenis: "tabel", kepala, baris: isi });
      continue;
    }
    out.push({ jenis: "p", teks: b });
  }
  return out;
}

function blok(teks: string, sisip?: (baris: string) => ReactNode | null): ReactNode[] {
  const disisip = new Map<string, ReactNode>();
  const cek = sisip
    ? (b: string) => {
        const r = sisip(b);
        if (r === null || r === undefined) return false;
        disisip.set(b, r);
        return true;
      }
    : undefined;
  return uraiBlok(teks, cek).map((x, k) => {
    switch (x.jenis) {
      case "sisip":
        return <Fragment key={k}>{disisip.get(x.teks)}</Fragment>;
      case "h":
        return <h3 key={k} className="pin-lh3">{sebaris(x.teks)}</h3>;
      case "ul":
        return (
          <ul key={k} className="pin-tdaftar">
            {x.butir.map((t, j) => <li key={j}>{sebaris(t)}</li>)}
          </ul>
        );
      case "tabel":
        return (
          <div key={k} className="pin-ttabel">
            <table>
              <thead>
                <tr>{x.kepala.map((c, j) => <th key={j} scope="col">{sebaris(c)}</th>)}</tr>
              </thead>
              <tbody>
                {x.baris.map((r, j) => (
                  <tr key={j}>{r.map((c, m) => <td key={m}>{sebaris(c)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return <p key={k} className="pin-lp">{sebaris(x.teks)}</p>;
    }
  });
}

/** Where the brace opened at `buka` closes, counting nested braces; -1 if it never does. */
function tutup(s: string, buka: number): number {
  let d = 0;
  for (let i = buka; i < s.length; i++) {
    if (s[i] === "{") d++;
    else if (s[i] === "}" && --d === 0) return i;
  }
  return -1;
}

/** One line's inline marks, as React nodes. A mark left open is text. */
export function sebaris(s: string, tebal = true): ReactNode[] {
  const out: ReactNode[] = [];
  let teks = "";
  const lepas = () => { if (teks) { out.push(teks); teks = ""; } };
  for (let i = 0; i < s.length; ) {
    if (tebal && s.startsWith("**", i)) {
      const akhir = s.indexOf("**", i + 2);
      if (akhir > i + 2) {
        lepas();
        out.push(<strong key={out.length}>{sebaris(s.slice(i + 2, akhir), false)}</strong>);
        i = akhir + 2;
        continue;
      }
    }
    if ((s[i] === "^" || s[i] === "_") && s[i + 1] === "{") {
      const akhir = tutup(s, i + 1);
      if (akhir > i + 2) {
        lepas();
        const isi = sebaris(s.slice(i + 2, akhir), tebal);
        out.push(s[i] === "^" ? <sup key={out.length}>{isi}</sup> : <sub key={out.length}>{isi}</sub>);
        i = akhir + 1;
        continue;
      }
    }
    teks += s[i++];
  }
  lepas();
  return out;
}

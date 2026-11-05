/**
 * The learner-surface rule (doc 12 «complexity leaking»; src/lib/hle.ts INTERNAL_WORDS) is about PINTAR's OWN words:
 * a learner is never told «Salah» or «Incorrect» as a verdict, and never shown a lifecycle enum or an engine version.
 * A question's stem, its options and a lesson's body are the AUTHOR's content: «Salah satu lebih besar» («one of them
 * is larger») is ordinary Indonesian and must not be refused or rewritten to suit a word list (owner, 4 Nov).
 *
 * The shared renderer marks authored content (`data-isi-materi`, src/components/teks/Teks.tsx). This removes exactly
 * those elements, nesting counted, and keeps everything around them: a verdict badge PINTAR draws beside an option, a
 * feedback sentence from the copy table, a heading, a button. The scan then reads what PINTAR itself says.
 */
export function tanpaIsiMateri(html: string): string {
  let h = html;
  for (;;) {
    const m = /<(span|div)\b[^>]*\bdata-isi-materi=""[^>]*>/.exec(h);
    if (!m) return h;
    const tag = m[1];
    const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, "g");
    re.lastIndex = m.index + m[0].length;
    let d = 1, akhir = -1, t: RegExpExecArray | null;
    while ((t = re.exec(h))) { d += t[0].startsWith("</") ? -1 : 1; if (d === 0) { akhir = t.index + t[0].length; break; } }
    if (akhir < 0) return h; // malformed: leave it for the scan rather than hide the rest of the page
    h = h.slice(0, m.index) + h.slice(akhir);
  }
}

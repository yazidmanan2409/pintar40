/**
 * A chapter's name as a reader sees it (Reporting Quality Gate, R7 / Daisy F2, 9 Nov): a title that already begins with
 * its subject («Matematika Kelas 5 · Bab 1») is not prefixed with it again («Matematika · Matematika Kelas 5 · Bab 1»).
 * `lain` are the parts said between the subject and the title (a grade), dropped with the subject when the title
 * already carries it.
 */
export function namaBab(subject: string | null | undefined, title: string | null | undefined, ...lain: Array<string | null | undefined>): string {
  const t = (title ?? "").trim();
  const s = (subject ?? "").trim();
  if (t && s && t.toLowerCase().startsWith(s.toLowerCase())) return t;
  return [s, ...lain.map((x) => (x ?? "").trim()), t].filter(Boolean).join(" · ");
}

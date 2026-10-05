/**
 * A little Markdown, enough for project/*.md: headings, tables, lists (two levels, with quotes and
 * paragraphs inside an item), quotes, paragraphs, and inline code, bold and italic. Shared by the
 * boards (papan.mts) and the one-file site (buat-situs.mts).
 */
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const sebaris = (s: string) => esc(s)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
  .replace(/&amp;nbsp;/g, "&nbsp;");
export function md(teks: string): string {
  const baris = teks.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < baris.length) {
    const b = baris[i];
    if (!b.trim()) { i++; continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(b);
    if (h) { const n = Math.min(h[1].length + 1, 4); out.push(`<h${n}>${sebaris(h[2])}</h${n}>`); i++; continue; }
    if (b.startsWith("|")) {
      const rows: string[][] = [];
      while (i < baris.length && baris[i].startsWith("|")) { rows.push(baris[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())); i++; }
      const [kepala, , ...isi] = rows;
      out.push(`<table><thead><tr>${kepala.map((c) => `<th>${sebaris(c)}</th>`).join("")}</tr></thead><tbody>${isi.map((r) => `<tr>${r.map((c) => `<td>${sebaris(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s/.test(b)) {
      const urut = /^\s*\d+\./.test(b);
      const mula = urut ? Number(/^\s*(\d+)\./.exec(b)![1]) : 1;
      const item: string[] = [];
      // An item continues over a blank line when the next text is indented under it: a new paragraph,
      // a nested list (two levels) or a quote inside the item.
      const lanjut = (j: number) => { while (j < baris.length && !baris[j].trim()) j++; return j < baris.length && /^\s{2,}\S/.test(baris[j]); };
      let kosong = false;
      while (i < baris.length && (/^\s*([-*]|\d+\.)\s/.test(baris[i]) || (/^\s{2,}\S/.test(baris[i]) && item.length) || (!baris[i].trim() && item.length && lanjut(i)))) {
        const l = baris[i];
        const akhir = item.length - 1;
        if (!l.trim()) { kosong = true; i++; continue; }
        if (/^\s{6,}([-*]|\d+\.)\s/.test(l) && item[akhir].endsWith("</li></ul>")) item[akhir] = item[akhir].replace(/<\/li><\/ul>$/, `<ul><li>${sebaris(l.replace(/^\s+([-*]|\d+\.)\s/, ""))}</li></ul></li></ul>`);
        else if (/^\s{2,}([-*]|\d+\.)\s/.test(l)) item[akhir] += `<ul><li>${sebaris(l.replace(/^\s+([-*]|\d+\.)\s/, ""))}</li></ul>`;
        else if (/^\s{2,}>/.test(l)) {
          const q: string[] = [];
          while (i < baris.length && /^\s{2,}>/.test(baris[i])) { q.push(baris[i].replace(/^\s+>\s?/, "")); i++; }
          item[akhir] += `<blockquote>${md(q.join("\n"))}</blockquote>`; kosong = false; continue;
        } else if (/^\s{2,}\S/.test(l)) item[akhir] += kosong ? `<p>${sebaris(l.trim())}</p>` : ` ${sebaris(l.trim())}`;
        else item.push(sebaris(l.replace(/^\s*([-*]|\d+\.)\s/, "")));
        kosong = false;
        i++;
      }
      out.push(`<${urut ? `ol${mula !== 1 ? ` start="${mula}"` : ""}` : "ul"}>${item.map((x) => `<li>${x.replace(/<\/ul><ul>/g, "")}</li>`).join("")}</${urut ? "ol" : "ul"}>`);
      continue;
    }
    if (b.startsWith(">")) { const q: string[] = []; while (i < baris.length && baris[i].startsWith(">")) { q.push(baris[i].replace(/^>\s?/, "")); i++; } out.push(`<blockquote>${md(q.join("\n"))}</blockquote>`); continue; }
    const p: string[] = [];
    while (i < baris.length && baris[i].trim() && !/^(#|\||\s*[-*]\s|\s*\d+\.\s|>)/.test(baris[i])) { p.push(baris[i]); i++; }
    out.push(`<p>${sebaris(p.join(" "))}</p>`);
  }
  return out.join("\n");
}

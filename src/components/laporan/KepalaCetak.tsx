/**
 * KESETIAAN #3 (G-01): THE A4 HEADER OF A REPORT — after the PINTAR wordmark (@page laporan, experience.css), the
 * report, the place and the period, as one line in the page's top-right margin box. A margin box can only take text
 * from CSS, so each report page writes its own line here; the text is escaped for a CSS string. Screen: nothing.
 */
export default function KepalaCetak({ bagian }: { bagian: ReadonlyArray<string | null | undefined> }) {
  const teks = bagian.filter((x): x is string => typeof x === "string" && x.trim() !== "").join(" · ");
  if (!teks) return null;
  const css = JSON.stringify(teks).replace(/</g, "\\3C ");
  // the line's type and colour are the stylesheet's (@page laporan, experience.css); only its words are the page's
  const kotak = `@top-right { content: ${css}; }`;
  return <style>{`@page laporan { ${kotak} } @page laporan-lebar { ${kotak} }`}</style>;
}

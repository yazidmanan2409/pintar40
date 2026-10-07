/**
 * L3 (D-132 C3): A TEST CHOOSES ITS WORKING CONTEXT THE WAY A PERSON DOES, on the chooser (`/`), by posting the door
 * it shows exactly as a browser without script would: the door's form and its hidden fields, the server action's
 * own id among them. Nothing here writes a context any other way, and nothing here grants anything: the door is
 * drawn only for a pair the person holds, and the database writes only that (konteks_tetapkan, PILIHAN).
 *
 *   pilih   "BELAJAR", "MENGAJAR:<place id>", "MENGELOLA:<place id>", "MENGELOLA:PLATFORM"; or a purpose and the
 *           place's name as the door shows it ({ tujuan, nama })
 *
 * Returns where the choice sent the person (the context's home, or the page asked to continue to).
 */
export type PilihKonteks = string | { tujuan: "BELAJAR" | "MENGAJAR" | "MENGELOLA"; nama?: string };

const nilai = (tag: string, nama: string) =>
  (new RegExp(`\\b${nama}="([^"]*)"`).exec(tag)?.[1] ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

/** The chooser's doors on a rendered `/`: each door's pair key, its words and its form's hidden fields. */
export function pintuDi(html: string): Array<{ kunci: string; label: string; isian: Array<[string, string]> }> {
  const out: Array<{ kunci: string; label: string; isian: Array<[string, string]> }> = [];
  for (const bagian of html.split(/<form\b/).slice(1)) {
    const isi = bagian.split(/<\/form>/)[0];
    const tombol = /<button\b[^>]*\bdata-konteks="([^"]*)"[^>]*>([\s\S]*?)<\/button>/.exec(isi);
    if (!tombol) continue;
    const isian = [...isi.matchAll(/<input\b[^>]*\btype="hidden"[^>]*>/g)].map((m) => [nilai(m[0], "name"), nilai(m[0], "value")] as [string, string]);
    out.push({ kunci: tombol[1], label: tombol[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(), isian });
  }
  return out;
}

/** The one door that answers `pilih`, or a sentence naming what the chooser offered instead. */
export function pintuUntuk(html: string, pilih: PilihKonteks): ReturnType<typeof pintuDi>[number] | string {
  const pintu = pintuDi(html);
  const cocok = pintu.filter((p) => typeof pilih === "string"
    ? p.kunci === pilih
    : p.kunci.split(":")[0] === pilih.tujuan && (!pilih.nama || p.label.includes(pilih.nama)));
  return cocok.length === 1 ? cocok[0]
    : `the chooser offers ${cocok.length} door(s) for ${JSON.stringify(pilih)}: ${JSON.stringify(pintu.map((p) => `${p.kunci} «${p.label}»`))}`;
}

/**
 * Chooses a context for a session held as a cookie header (selftest/app.test.ts's signIn). `jalur` is the chooser's
 * own address, which may carry a page to continue to (`/?lanjut=...`).
 */
export async function pilihKonteksCookie(base: string, cookie: string, pilih: PilihKonteks, jalur = "/"): Promise<string> {
  const halaman = await fetch(`${base}${jalur}`, { headers: { cookie }, redirect: "manual" });
  const html = await halaman.text();
  const pintu = pintuUntuk(html, pilih);
  if (typeof pintu === "string") throw new Error(`${pintu} (GET ${jalur} answered ${halaman.status})`);
  const fd = new FormData();
  for (const [n, v] of pintu.isian) fd.set(n, v);
  const r = await fetch(`${base}${jalur}`, { method: "POST", body: fd, headers: { cookie, origin: base }, redirect: "manual" });
  const ke = r.headers.get("location");
  if (![302, 303, 307, 308].includes(r.status) || !ke) throw new Error(`choosing ${pintu.kunci} answered ${r.status} without a destination`);
  return new URL(ke, base).pathname + new URL(ke, base).search;
}

/** The same for a browser that keeps its own cookie jar (selftest/bob26.test.ts's Peramban). */
export async function pilihKonteksPeramban(
  b: { asal: string; kirim: (path: string, opsi?: { form?: Record<string, string>; method?: string }) => Promise<Response> },
  pilih: PilihKonteks,
  jalur = "/",
): Promise<string> {
  const html = await (await b.kirim(jalur, { method: "GET" })).text();
  const pintu = pintuUntuk(html, pilih);
  if (typeof pintu === "string") throw new Error(pintu);
  const r = await b.kirim(jalur, { form: Object.fromEntries(pintu.isian) });
  const ke = r.headers.get("location");
  if (![302, 303, 307, 308].includes(r.status) || !ke) throw new Error(`choosing ${pintu.kunci} answered ${r.status} without a destination`);
  return new URL(ke, b.asal).pathname + new URL(ke, b.asal).search;
}

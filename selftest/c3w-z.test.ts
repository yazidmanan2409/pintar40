/**
 * C3w-1's first commits: Daisy's four Studio items before the build (C3W-1-WORDS.md §«Studio consistency»).
 *
 *   Z-2 (X-1)  a Studio refusal rendered a second <main id="isi"> inside the Studio layout's own <main>
 *   Z-3 (X-3)  the key-correction page: ONE answer for an unknown and a forbidden id (revised, Daisy's V-3: no existence
 *              oracle), in neutral words: «Koreksi ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.»
 *   N-6        Kanonik's withdraw confirmation stated the result («… sudah berakhir») before the admin confirmed
 *   N-7        Kanonik's withdraw select was labelled «Paket Pembelajaran»; each option is a package · school grant
 *
 * Z-S01 reads the wiring and the words; Z-J01 renders the two Studio refusals in the running app and counts landmarks.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { randomUUID } from "node:crypto";
import { Checks, type SelfTest } from "./lib";
import { psql } from "./bob26.test";
import { Komputer } from "./bob29.test";
import { BOOT_ADMIN, masuk } from "./c1w-layar.test";
import { t, type HleEvent } from "../src/lib/hle";

const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
const semua = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const f = join(dir, n);
  return statSync(f).isDirectory() ? semua(f) : f.endsWith(".tsx") ? [f] : [];
});

/** Daisy's words, word for word (ID and EN). */
const KATA: Array<[HleEvent, string, string]> = [
  ["studio.kunci.tidak_dapat_dibuka", "Koreksi ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.",
    "This correction cannot be opened. It may no longer exist, or it is not for you."],
  ["studio.kanonik.tarik.akibat", "Sekolah itu tidak dapat membuka pengerjaan baru dengan paket ini lagi. Murid yang sedang mengerjakan tetap bisa menyelesaikannya.",
    "That school can no longer open new sittings with this package. Students already working on it can still finish."],
  ["studio.kanonik.izin_berlaku", "Izin yang berlaku", "Current permissions"],
];

export const c3wZStaticTests: SelfTest[] = [
  {
    id: "Z-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => buang(readFileSync(join(repoRoot, ...p), "utf8"));
      // Z-2: Studio's layout owns <main id="isi">; the refusal page draws a <div> inside a frame that already has one
      c.expect(/<main id="isi"/.test(baca("src", "app", "studio", "layout.tsx")), "Studio's layout no longer renders <main id=\"isi\"> (the frame each refusal relies on)");
      const tolak = baca("src", "components", "HalamanPenolakan.tsx");
      c.expect(/dalamBingkai\?: boolean/.test(tolak) && /const Bungkus = dalamBingkai \? "div" : "main";/.test(tolak)
        && /<Bungkus id=\{dalamBingkai \? undefined : "isi"\}/.test(tolak),
        "HalamanPenolakan cannot draw itself inside a frame that already has <main id=\"isi\"> (dalamBingkai)");
      // the layout's own refusal replaces the whole frame (no Studio <main> around it), so it keeps its own <main>
      const studio = semua(join(repoRoot, "src", "app", "studio")).filter((f) => !/[\\/]studio[\\/]layout\.tsx$/.test(f));
      const panggil = studio.flatMap((f) => [...buang(readFileSync(f, "utf8")).matchAll(/<HalamanPenolakan\b[^>]*\/>/g)]
        .map((m) => [relative(repoRoot, f), m[0]] as const));
      c.expect(panggil.length >= 2, `only ${panggil.length} refusal(s) found under src/app/studio`);
      const tanpa = panggil.filter(([, m]) => !/\bdalamBingkai\b/.test(m));
      c.expect(tanpa.length === 0, `a Studio refusal draws a second <main id="isi">: ${tanpa.map(([f]) => f).join(", ")}`);
      // Z-3: one answer for an unknown and a forbidden correction, in Daisy's neutral words
      const koreksi = baca("src", "app", "studio", "tinjau", "kunci", "[koreksi]", "page.tsx");
      c.expect(/if \(error \|\| !data\) \{\s*return <HalamanPenolakan[^>]*messageKey="studio\.kunci\.tidak_dapat_dibuka"[^>]*\/>;/.test(koreksi),
        "the key-correction page does not give one neutral answer (studio.kunci.tidak_dapat_dibuka) for an unknown and a forbidden id");
      c.expect(!/notFound\(/.test(koreksi), "the key-correction page tells an unknown id apart from a forbidden one (an existence oracle, V-3)");
      // N-6 and N-7 on Kanonik's withdraw form
      const kanonik = baca("src", "app", "studio", "kanonik", "page.tsx");
      const tarik = /<form action=\{withdrawDistributionAction\}[\s\S]*?<\/form>/.exec(kanonik)?.[0] ?? "";
      c.expect(tarik !== "", "Kanonik's withdraw form was not found");
      c.expect(/akibat=\{<p>\{s\("studio\.kanonik\.tarik\.akibat"\)\}<\/p>\}/.test(tarik) && !/studio\.kanonik\.ditarik/.test(tarik),
        "N-6: the withdraw confirmation still says the result («… sudah berakhir») before the admin confirms");
      c.expect(/<span>\{s\("studio\.kanonik\.izin_berlaku"\)\}<\/span>\s*<select[^>]*name="distribusi"/.test(tarik) && !/studio\.paket\.judul/.test(tarik),
        "N-7: the withdraw select is not labelled «Izin yang berlaku»");
      for (const [k, id, en] of KATA) {
        c.expect(t(k, "staff", { locale: "id" }) === id, `${k} (id): ${t(k, "staff", { locale: "id" })}`);
        c.expect(t(k, "staff", { locale: "en" }) === en, `${k} (en): ${t(k, "staff", { locale: "en" })}`);
      }
      return c.verdict("reads the source files of Studio's layout, HalamanPenolakan, every page under src/app/studio, the key-correction page and Kanonik's page, and the copy table: Studio's layout owns <main id=\"isi\"> and every Studio refusal draws itself inside it (dalamBingkai, a <div>); the key-correction page gives one neutral answer for an unknown and a forbidden id, never notFound (V-3); Kanonik's withdraw confirmation says what will happen, not what has, and its select is «Izin yang berlaku»; Daisy's three sentences word for word, ID and EN");
    },
  },
];

export const c3wZAppTests: SelfTest[] = [
  {
    id: "Z-J01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const sekolah = psql(`select ra.institution_id from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
        join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test' and ra.institution_id is not null
         and ra.revoked_at is null order by ra.id limit 1`);
      if (!c.expect(/^[0-9a-f-]{36}$/.test(sekolah), `the bootstrap admin's school: ${sekolah}`)) return c.verdict("");
      const admin0 = await masuk(asal, BOOT_ADMIN, `MENGELOLA:${sekolah}`);
      if (!c.expect(typeof admin0 !== "string", String(admin0))) return c.verdict("");
      const admin = admin0 as Komputer;
      const hitung = (h: string) => ({ main: (h.match(/<main\b/g) ?? []).length, isi: (h.match(/\bid="isi"/g) ?? []).length });
      for (const alamat of [`/studio/tinjau/kunci/${randomUUID()}`, `/studio/paket/${randomUUID()}`, "/studio/tinjau/kunci/bukan-uuid"]) {
        const h = await (await admin.halaman(alamat)).text();
        const n = hitung(h);
        c.expect(n.main === 1 && n.isi === 1, `${alamat}: ${n.main} <main> and ${n.isi} id="isi" (one of each, the Studio frame's)`);
      }
      const k = (await (await admin.halaman(`/studio/tinjau/kunci/${randomUUID()}`)).text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      c.expect(k.includes("Koreksi ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.") && k.includes("Antrean Tinjauan"),
        `an unknown correction does not get Daisy's one neutral answer with its way back to the review queue (Antrean Tinjauan): ${k.slice(0, 200)}`);
      return c.verdict("renders, in the running app, as the bootstrap school's admin: an unknown key correction, an unknown package and a malformed correction id each draw exactly one <main> and one id=\"isi\" (Studio's own), and the unknown correction says «Koreksi ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.» with its way back to «Antrean Tinjauan»");
    },
  },
];

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
import { BOOT_ADMIN, BOOT_SISWA, masuk } from "./c1w-layar.test";
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
      // Daisy's three conditions (her Z-2 acceptance, via Bob 19 Nov): (a) inside Studio a refusal draws no <main> of its
      // own, its heading is the first heading in Studio's <main>, and the skip link lands on that <main id="isi"> (the
      // only id="isi"); (b) outside Studio a refusal keeps its own <main id="isi">; (c) every Studio route and refusal
      // path is read, and two main landmarks anywhere fail
      const landmark = (alamat: string, h: string) => {
        const main = (h.match(/<main\b/g) ?? []).length, isi = (h.match(/\bid="isi"/g) ?? []).length;
        const mainIsi = /<main\b[^>]*\bid="isi"/.test(h);
        const lewati = /<a[^>]*href="#isi"[^>]*>Langsung ke isi</.test(h);
        // Daisy (via Bob, 19 Nov 11:10): exactly one <h1> on the page, whether the refusal's heading sits under Studio's
        // header h1 as an h2 or the header steps aside (the key-correction page)
        const h1 = (h.match(/<h1\b/g) ?? []).length;
        c.expect(h1 === 1, `${alamat}: ${h1} <h1> on the page (exactly one)`);
        c.expect(main === 1 && isi === 1 && mainIsi && lewati,
          `${alamat}: ${main} <main>, ${isi} id="isi", id="isi" ${mainIsi ? "is" : "is not"} the <main>, skip link ${lewati ? "present" : "absent"} (one of each; the skip link lands on the <main>)`);
        return /<main\b[^>]*\bid="isi"[^>]*>([\s\S]*)<\/main>/.exec(h)?.[1] ?? "";
      };
      const kepala = (isiMain: string) => (/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/.exec(isiMain)?.[1] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      // every Studio page as the school's admin (c)
      for (const alamat of ["/studio", "/studio/bank", "/studio/definisi", "/studio/integritas", "/studio/kanonik", "/studio/tinjau", "/studio/unggah"]) {
        landmark(alamat, await (await admin.halaman(alamat)).text());
      }
      // every Studio refusal path (a, c): the addressed pages with an id that is not there, or not an id
      const tolakan: Array<[string, string | null]> = [
        [`/studio/tinjau/kunci/${randomUUID()}`, "Koreksi ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda."],
        ["/studio/tinjau/kunci/bukan-uuid", "Koreksi ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda."],
        [`/studio/paket/${randomUUID()}`, null],
        [`/studio/kanonik/${randomUUID()}`, null],
        [`/studio/pratinjau/${randomUUID()}`, null],
      ];
      for (const [alamat, kalimat] of tolakan) {
        const h = await (await admin.halaman(alamat)).text();
        const isiMain = landmark(alamat, h);
        const k = kepala(isiMain);
        c.expect(k !== "" && (kalimat === null || k === kalimat), `${alamat}: the first heading in Studio's <main> is «${k}»${kalimat ? `, not «${kalimat}»` : ""}`);
      }
      const k = (await (await admin.halaman(`/studio/tinjau/kunci/${randomUUID()}`)).text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      c.expect(k.includes("Antrean Tinjauan"), `an unknown correction offers no way back to «Antrean Tinjauan»: ${k.slice(0, 200)}`);
      // (b) and the layout's own refusal: a learner opening Studio meets the refusal OUTSIDE the frame, with its own main
      const siswa0 = await masuk(asal, BOOT_SISWA, "BELAJAR");
      if (!c.expect(typeof siswa0 !== "string", String(siswa0))) return c.verdict("");
      const hs = await (await (siswa0 as Komputer).halaman("/studio")).text();
      landmark("/studio as a learner (the layout's refusal, outside the frame)", hs);
      c.expect(/<main\b[^>]*\bid="isi"[^>]*class="pin-col"/.test(hs) || /<main\b[^>]*class="pin-col"[^>]*\bid="isi"/.test(hs),
        "outside Studio's frame the refusal no longer draws its own <main id=\"isi\" class=\"pin-col\">");
      return c.verdict("renders, in the running app (Daisy's three Z-2 conditions): as the bootstrap school's admin, all seven Studio pages and five refusal paths (an unknown and a malformed correction, an unknown package, Kanonik release and lesson preview) each draw exactly one <main>, and it is the only id=\"isi\", the skip link's target, and exactly one <h1>; on each refusal the first heading in that <main> is the refusal's, the unknown correction's in Daisy's words with its way back to «Antrean Tinjauan»; a learner opening Studio meets the layout's refusal outside the frame, with its own <main id=\"isi\">");
    },
  },
];

/**
 * D-189 (owner, 5 Nov: «PINTAR BACKUP DESTINATION»): THE STAGING BACKUP AND ITS DRILL, WITH GOOGLE DRIVE AS THE PLACE.
 *
 * DR-G01 runs scripts/recovery/backup.mjs exactly as backup-offsite.yml does, against the local stack's database and
 * Storage, with BACKUP_DESTINATION=gdrive and a stand-in for Google's OAuth token endpoint and Drive v3 (the calls
 * scripts/recovery/gdrive.mjs makes, answering as Drive does: its own sha256Checksum of what it stored). Then
 * scripts/recovery/drill.mjs fetches the newest complete bundle from the same stand-in. It proves:
 *   - clean: the daily and (on the 1st) monthly copies and their success records, in that order, each with its key and
 *     retention date; Drive's SHA-256 equals the record's; the record says the bundle is NOT immutable (D-189(9));
 *     the bundle opens with the drill key R3 and holds every planted Storage object with its hash;
 *   - the drill takes it back, its SHA-256 as its record and Drive say;
 *   - retention: an expired older copy is deleted, the one just made and an unexpired one are kept;
 *   - planted failures, each red with no success record: Drive storing other bytes than were sent; a token wider than
 *     drive.file (D-189(5)); a refused refresh token; a key that already exists (never overwritten).
 */
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";
import { backupModul, decrypt, localStorage, makeKeys, pgAs, pgBin, postgres, psql, storageRest } from "./dr150b.test";

const BACKUP = "scripts/recovery/backup.mjs";
const DRILL = "scripts/recovery/drill.mjs";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

type Berkas = { id: string; name: string; parents: string[]; mimeType: string; appProperties: Record<string, string>; body: Buffer; sha: string };

/** A stand-in for Google's token endpoint and the Drive v3 calls gdrive.mjs makes. */
export async function standInDrive(opts: { refresh: string; scope?: string; corrupt?: RegExp; preload?: Berkas[] }) {
  const files = new Map<string, Berkas>((opts.preload ?? []).map((f) => [f.id, f]));
  const order: string[] = [];
  const deleted: string[] = [];
  const sessions = new Map<string, { meta: Partial<Berkas> }>();
  let n = 0;
  const TOKEN = "ya29.standin-" + randomBytes(6).toString("hex");
  const srv = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (b) => chunks.push(b));
    req.on("end", () => {
      const u = new URL(req.url ?? "/", "http://x");
      const body = Buffer.concat(chunks);
      const json = (code: number, o: unknown, h: Record<string, string> = {}) => { res.writeHead(code, { "content-type": "application/json", ...h }); res.end(JSON.stringify(o)); };
      if (u.pathname === "/token") {
        const p = new URLSearchParams(body.toString());
        if (p.get("grant_type") !== "refresh_token" || p.get("refresh_token") !== opts.refresh) return json(400, { error: "invalid_grant" });
        return json(200, { access_token: TOKEN, expires_in: 3599, scope: opts.scope ?? SCOPE, token_type: "Bearer" });
      }
      if (u.pathname.startsWith("/upload/session/")) {
        const s = sessions.get(u.pathname);
        if (!s || req.method !== "PUT") return json(404, {});
        const id = `f${++n}`;
        const stored = opts.corrupt?.test(String(s.meta.appProperties?.pintar_key)) ? Buffer.concat([body, Buffer.from("x")]) : body;
        const f: Berkas = { id, name: String(s.meta.name), parents: s.meta.parents ?? [], mimeType: "application/octet-stream",
          appProperties: s.meta.appProperties ?? {}, body: stored, sha: createHash("sha256").update(stored).digest("hex") };
        files.set(id, f); order.push(f.appProperties.pintar_key ?? f.name);
        return json(200, { id, size: String(stored.length), sha256Checksum: f.sha });
      }
      if (req.headers.authorization !== `Bearer ${TOKEN}`) return json(401, { error: "unauthenticated" });
      if (u.pathname === "/upload/drive/v3/files" && u.searchParams.get("uploadType") === "resumable") {
        const at = `/upload/session/${++n}`;
        sessions.set(at, { meta: JSON.parse(body.toString()) });
        res.writeHead(200, { location: `http://${req.headers.host}${at}` }); return res.end();
      }
      if (u.pathname === "/drive/v3/files" && req.method === "POST") {
        const m = JSON.parse(body.toString());
        const id = `d${++n}`;
        files.set(id, { id, name: m.name, parents: m.parents ?? [], mimeType: m.mimeType, appProperties: m.appProperties ?? {}, body: Buffer.alloc(0), sha: "" });
        return json(200, { id });
      }
      if (u.pathname === "/drive/v3/files" && req.method === "GET") {
        // the query forms gdrive.mjs uses: a folder by its store, a parent's children, a child by its key
        const qy = u.searchParams.get("q") ?? "";
        const parent = /'([^']+)' in parents/.exec(qy)?.[1];
        const prop = /appProperties has \{ key='([^']+)' and value='((?:[^'\\]|\\.)*)' \}/.exec(qy);
        const isFolder = /mimeType='application\/vnd\.google-apps\.folder'/.test(qy);
        const hit = [...files.values()].filter((f) => (!parent || f.parents.includes(parent))
          && (!prop || f.appProperties[prop[1]] === prop[2].replace(/\\(.)/g, "$1"))
          && (!isFolder || f.mimeType === "application/vnd.google-apps.folder"));
        return json(200, { files: hit.map((f) => ({ id: f.id, name: f.name, size: String(f.body.length), sha256Checksum: f.sha || undefined, appProperties: f.appProperties })) });
      }
      const m = /^\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname);
      if (m && req.method === "GET" && u.searchParams.get("alt") === "media") {
        const f = files.get(decodeURIComponent(m[1]));
        if (!f) return json(404, {});
        res.writeHead(200, { "content-type": "application/octet-stream", "content-length": String(f.body.length) }); return res.end(f.body);
      }
      if (m && req.method === "DELETE") {
        const f = files.get(decodeURIComponent(m[1]));
        if (!f) return json(404, {});
        files.delete(f.id); deleted.push(f.appProperties.pintar_key ?? f.name);
        res.writeHead(204); return res.end();
      }
      return json(404, { error: "not a call gdrive.mjs makes" });
    });
  });
  await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", () => ok()));
  const url = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  const byKey = (k: string) => [...files.values()].find((f) => f.appProperties.pintar_key === k);
  return { url, files, order, deleted, byKey, close: () => new Promise<void>((ok) => srv.close(() => ok())) };
}

export const drgdTests: SelfTest[] = [
  {
    id: "DR-G01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      if (!c.expect(existsSync(join(repoRoot, "scripts/recovery/gdrive.mjs")), "scripts/recovery/gdrive.mjs is missing: there is no Google Drive destination")) return c.verdict("");
      const pg = postgres();
      const dir = mkdtempSync(join(tmpdir(), "dr-g01-"));
      const k = makeKeys(dir, ["R1", "R3"]);
      const st = localStorage(repoRoot);
      const BUCKET = "drg01-backup-test";
      const kata = randomBytes(24).toString("base64url");
      const REFRESH = "1//standin-refresh-" + randomBytes(8).toString("hex");
      const ext = psql(pg, "select json_object_agg(extname, extversion) from pg_extension").out.trim();
      const baseline = join(dir, "baseline.json");
      writeFileSync(baseline, JSON.stringify({ staging: JSON.parse(ext), production: null }));
      const files: Record<string, Buffer> = { "lesson/a.txt": Buffer.from("PINTAR Drive backup test\n"), "media/b.bin": randomBytes(90000) };
      try {
        const setPw = psql(pg, `alter role pintar_backup password '${kata}'`);
        if (!c.expect(setPw.ok, `a test password could not be set: ${setPw.err}`)) return c.verdict("");
        await storageRest(st, "POST", "bucket", JSON.stringify({ id: BUCKET, name: BUCKET, public: false }));
        for (const [nm, b] of Object.entries(files)) {
          const r = await storageRest(st, "POST", `object/${BUCKET}/${nm.split("/").map(encodeURIComponent).join("/")}`, b, "application/octet-stream");
          c.expect(r.status === 200, `a test object could not be stored in Storage: ${r.status} ${r.text.slice(0, 120)}`);
        }
        const bin = pgBin(pg);
        const env = (drive: string, extra: Record<string, string> = {}): NodeJS.ProcessEnv => ({ PATH: process.env.PATH ?? "", NODE_ENV: "production" as const,
          ...pgAs("pintar_backup", kata), PINTAR_PG_BIN: bin.dir, ...st.s3, BACKUP_TARGET: "staging", BACKUP_RECIPIENTS: "R1 R3",
          RECIPIENTS_DIR: k.pub, EXTENSION_BASELINE: baseline, BACKUP_DESTINATION: "gdrive",
          GDRIVE_CLIENT_ID: "standin.apps.googleusercontent.com", GDRIVE_CLIENT_SECRET: "standin-secret", GDRIVE_REFRESH_TOKEN: REFRESH,
          GDRIVE_API: drive, GDRIVE_TOKEN_URL: `${drive}/token`, GDRIVE_STORE: "pintar-staging",
          BACKUP_NOW: "2026-11-01T20:00:00Z", RELEASE_SHA: "dr-g01", RUNNER_TEMP: dir, ...extra });
        const node = (script: string, args: string[], e: NodeJS.ProcessEnv) => new Promise<{ code: number | null; text: string }>((ok) => {
          const p = spawn("node", [join(repoRoot, script), ...args], { env: e });
          let text = ""; p.stdout.on("data", (b) => (text += b)); p.stderr.on("data", (b) => (text += b));
          p.on("close", (code) => ok({ code, text }));
        });
        const sukses = (o: string[]) => o.filter((x) => x.endsWith(".success.json"));
        const daily = "staging/daily/2026-11-01/pintar-staging-20261101T200000Z.tar.gz.gpg";
        const monthly = "staging/monthly/2026-11/pintar-staging-20261101T200000Z.tar.gz.gpg";

        // 1. clean, with an expired older copy and an unexpired one already in the store (retention)
        const folder = { id: "d0", name: "PINTAR backup (pintar-staging)", parents: [], mimeType: "application/vnd.google-apps.folder",
          appProperties: { pintar_store: "pintar-staging" }, body: Buffer.alloc(0), sha: "" };
        const lama = (key: string, until: string, id: string) => ({ id, name: key.split("/").pop()!, parents: ["d0"], mimeType: "application/octet-stream",
          appProperties: { pintar_store: "pintar-staging", pintar_key: key, pintar_retain_until: until }, body: Buffer.from(id), sha: createHash("sha256").update(id).digest("hex") });
        const tua = "staging/daily/2026-09-20/pintar-staging-20260920T200000Z.tar.gz.gpg";
        const muda = "staging/daily/2026-10-30/pintar-staging-20261030T200000Z.tar.gz.gpg";
        const d = await standInDrive({ refresh: REFRESH, preload: [folder, lama(tua, "2026-10-25T20:00:00Z", "o1"), lama(`${tua}.success.json`, "2026-10-25T20:00:00Z", "o2"),
          lama(muda, "2026-12-04T20:00:00Z", "o3"), lama(`${muda}.success.json`, "2026-12-04T20:00:00Z", "o4")] });
        try {
          const a = await node(BACKUP, ["run"], env(d.url));
          c.expect(a.code === 0 && d.order.join(" ") === [daily, `${daily}.success.json`, monthly, `${monthly}.success.json`].join(" "),
            `the clean run: exit ${a.code}; uploaded ${d.order.join(", ")}; ${a.text.trim().split("\n").slice(-2).join(" | ").slice(0, 400)}`);
          const fd = d.byKey(daily), fm = d.byKey(monthly), fr = d.byKey(`${daily}.success.json`);
          c.expect(fd?.appProperties.pintar_retain_until === "2026-12-06T20:00:00Z" && fm?.appProperties.pintar_retain_until === "2027-11-02T20:00:00Z"
            && fd?.parents.includes("d0"), `the retention dates and folder set by the uploads: ${JSON.stringify([fd?.appProperties, fm?.appProperties])}`);
          const rec = fr ? JSON.parse(fr.body.toString()) : null;
          c.expect(rec?.target === "staging" && rec?.bundle?.recipients?.join(" ") === "R1 R3" && rec?.bundle?.sha256 === fd?.sha && rec?.storage?.objects >= 2
            && rec?.immutable === false && /no object lock/.test(rec?.immutability ?? "") && rec?.destination === "google-drive:pintar-staging",
            `the success record: ${JSON.stringify(rec).slice(0, 400)}`);
          c.expect(d.deleted.join(" ") === `${tua} ${tua}.success.json` && !!d.byKey(muda) && !!d.byKey(`${muda}.success.json`),
            `retention deleted ${JSON.stringify(d.deleted)}; expected only the expired older copy and its record`);
          if (fd) {
            writeFileSync(join(dir, "daily.gpg"), fd.body);
            const de = decrypt(k.homes.R3, join(dir, "daily.gpg"), join(dir, "daily.tar.gz"));
            const x = join(dir, "x"); mkdirSync(x);
            const t = spawnSync("tar", ["-xzf", join(dir, "daily.tar.gz"), "-C", x]);
            const b = (await backupModul(repoRoot))!;
            const mf = de.ok && t.status === 0 ? await b.checkManifest(x) : { problems: [`cannot open: ${de.err}`], files: 0 };
            c.expect(mf.problems.length === 0 && mf.files > 10, `the decrypted bundle against its manifest: ${mf.problems.slice(0, 3).join("; ")}`);
            const man = existsSync(join(x, "storage/manifest.jsonl")) ? readFileSync(join(x, "storage/manifest.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l)) : [];
            for (const [nm, body] of Object.entries(files)) {
              const e = man.find((o: { bucket: string; name: string }) => o.bucket === BUCKET && o.name === nm);
              c.expect(e && e.sha256 === createHash("sha256").update(body).digest("hex") && readFileSync(join(x, e.file)).equals(body), `Storage object ${nm} is not in the bundle as stored`);
            }
          }
          // 2. the drill takes it back from Drive
          const out = join(dir, "drill");
          const f = await node(DRILL, ["fetch", "staging", out], { PATH: process.env.PATH ?? "", NODE_ENV: "production" as const, RECIPIENTS_DIR: k.pub, DRILL_DESTINATION: "gdrive",
            GDRIVE_CLIENT_ID: "standin.apps.googleusercontent.com", GDRIVE_CLIENT_SECRET: "standin-secret", GDRIVE_REFRESH_TOKEN: REFRESH,
            GDRIVE_API: d.url, GDRIVE_TOKEN_URL: `${d.url}/token`, GDRIVE_STORE: "pintar-staging" });
          const got = existsSync(join(out, "bundle.tar.gz.gpg")) ? createHash("sha256").update(readFileSync(join(out, "bundle.tar.gz.gpg"))).digest("hex") : "";
          c.expect(f.code === 0 && got === fd?.sha && /fetched staging\/(daily|monthly)\//.test(f.text), `the drill's fetch from Drive: exit ${f.code}; ${f.text.trim().slice(0, 300)}`);
          // 3. a key that already exists is never overwritten: the same run again is red, nothing new stored
          const before = d.order.length;
          const again = await node(BACKUP, ["run"], env(d.url));
          c.expect(again.code !== 0 && d.order.length === before && /already exists/.test(again.text), `a second run onto existing keys: exit ${again.code}; ${again.text.trim().split("\n").pop()?.slice(0, 200)}`);
        } finally { await d.close(); }

        // 4. planted failures, each red with no success record stored
        const merah = async (nama: string, pola: RegExp, opts: { scope?: string; corrupt?: RegExp; refresh?: string }) => {
          const s = await standInDrive({ refresh: REFRESH, scope: opts.scope, corrupt: opts.corrupt });
          try {
            const r = await node(BACKUP, ["run"], env(s.url, opts.refresh ? { GDRIVE_REFRESH_TOKEN: opts.refresh } : {}));
            c.expect(r.code !== 0 && sukses(s.order).length === 0 && pola.test(r.text), `${nama}: exit ${r.code}, success records ${sukses(s.order).length}; ${r.text.trim().split("\n").pop()?.slice(0, 240)}`);
          } finally { await s.close(); }
        };
        await merah("Drive stored other bytes than were sent", /BadDigest/, { corrupt: /\.gpg$/ });
        await merah("a token wider than drive.file", /more than the drive\.file scope/, { scope: `${SCOPE} https://www.googleapis.com/auth/drive` });
        await merah("a refused refresh token", /refused the refresh token/, { refresh: "1//wrong" });
      } finally {
        psql(pg, "alter role pintar_backup password null");
        await storageRest(st, "POST", `bucket/${BUCKET}/empty`).catch(() => null);
        await storageRest(st, "DELETE", `bucket/${BUCKET}`).catch(() => null);
      }
      return c.verdict("backup.mjs to a stand-in Google Drive (drive.file token): daily and monthly copies with their records last, Drive's SHA-256 equal to the "
        + "record's, retention dates set, the record marked not immutable; the bundle opens with R3 and holds every planted Storage object; an expired older "
        + "copy pruned, the new and an unexpired one kept; drill.mjs fetched it back by its checksum; an existing key never overwritten; Drive storing other "
        + "bytes, a wider token and a refused token each red with no success record");
    },
  },
];

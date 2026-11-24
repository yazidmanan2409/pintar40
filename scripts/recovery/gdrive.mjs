// D-189 (owner, 5 Nov: «PINTAR BACKUP DESTINATION»): GOOGLE DRIVE AS THE TEMPORARY OFFSITE DESTINATION, IN PLACE OF S3.
//
// The same four calls the S3 client gives backup.mjs and drill.mjs (putFile, getBytes, head, list), plus prune, so the
// tested backup and drill logic is unchanged: collection, encryption to the recovery keys, checksums, the success record
// written last, and the drill's choice of the newest complete bundle. Only the place the bundles are kept differs.
//
//   - Authentication: one OAuth refresh token for the owner's account, scope drive.file ONLY: this app sees, creates and
//     deletes the files it created itself and nothing else in the Drive. No password, no full-Drive access. The token
//     lives in a GitHub environment secret and is exchanged here for a short-lived access token, never printed.
//   - Layout: one folder, «PINTAR backup (<store>)», made by this app. Each object is one file in it whose appProperties
//     carry its key (`pintar_key`, the S3 key it would have had) and its retention date (`pintar_retain_until`).
//   - Integrity: every upload is read back from Drive's own sha256Checksum (Drive computes it), and must equal the local
//     file's SHA-256, or the upload is refused. A key that already exists is never overwritten.
//   - Retention: prune() permanently deletes files whose retention date has passed, never the newest complete bundle.
//     THIS IS NOT IMMUTABILITY. Drive has no object lock: the owner's account, or this token, can delete a file at any
//     time, and Drive's trash is ordinary deletion recovery, not protection (D-189(9)). The record says so.
//
// Environment: GDRIVE_CLIENT_ID GDRIVE_CLIENT_SECRET GDRIVE_REFRESH_TOKEN [GDRIVE_STORE] (default pintar-backup)
//              [GDRIVE_API] [GDRIVE_UPLOAD_API] [GDRIVE_TOKEN_URL] (test stand-ins only)
import { createReadStream } from "node:fs";
import { fileDigests } from "./s3.mjs";

const FOLDER = "application/vnd.google-apps.folder";
const q = (s) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

export function gdriveClient({ clientId, clientSecret, refreshToken, store = "pintar-backup",
  api = "https://www.googleapis.com", uploadApi = api, tokenUrl = "https://oauth2.googleapis.com/token" } = {}) {
  if (!clientId || !clientSecret || !refreshToken) throw new Error("a Google Drive client needs its OAuth client id, client secret and refresh token");
  if (!/^[a-z0-9-]{1,40}$/.test(store)) throw new Error("the Drive store name is not a short slug");
  let token = null;
  let folderId = null;

  async function accessToken() {
    if (token && token.until > Date.now() + 60_000) return token.value;
    const r = await fetch(tokenUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }) });
    const j = await r.json().catch(() => ({}));
    if (r.status !== 200 || !j.access_token) throw new Error(`Google refused the refresh token (HTTP ${r.status}${j.error ? ", " + j.error : ""})`);
    if (j.scope && !String(j.scope).split(" ").every((s) => s === "https://www.googleapis.com/auth/drive.file")) {
      throw new Error("the refresh token carries more than the drive.file scope: refused (D-189(5))");
    }
    token = { value: j.access_token, until: Date.now() + Number(j.expires_in ?? 3000) * 1000 };
    return token.value;
  }
  async function call(method, url, { json, headers = {}, body, duplex } = {}) {
    const init = { method, headers: { authorization: `Bearer ${await accessToken()}`, ...headers } };
    if (json !== undefined) { init.headers["content-type"] = "application/json; charset=UTF-8"; init.body = JSON.stringify(json); }
    if (body !== undefined) { init.body = body; if (duplex) init.duplex = duplex; }
    return fetch(url, init);
  }
  async function find(query, fields = "id,name,size,sha256Checksum,appProperties,createdTime") {
    const out = [];
    let page;
    do {
      const u = new URL(`${api}/drive/v3/files`);
      u.searchParams.set("q", query);
      u.searchParams.set("fields", `nextPageToken,files(${fields})`);
      u.searchParams.set("pageSize", "1000");
      u.searchParams.set("spaces", "drive");
      if (page) u.searchParams.set("pageToken", page);
      const r = await call("GET", u.toString());
      const j = await r.json().catch(() => ({}));
      if (r.status !== 200) throw new Error(`listing the Drive store answered HTTP ${r.status}`);
      out.push(...(j.files ?? []));
      page = j.nextPageToken;
    } while (page);
    return out;
  }
  async function folder() {
    if (folderId) return folderId;
    const got = await find(`mimeType='${FOLDER}' and appProperties has { key='pintar_store' and value='${q(store)}' } and trashed=false`, "id");
    if (got.length > 1) throw new Error(`the Drive store «${store}» has ${got.length} folders; expected one`);
    if (got.length === 1) return (folderId = got[0].id);
    const r = await call("POST", `${api}/drive/v3/files?fields=id`, { json: { name: `PINTAR backup (${store})`, mimeType: FOLDER, appProperties: { pintar_store: store } } });
    const j = await r.json().catch(() => ({}));
    if (r.status !== 200 || !j.id) throw new Error(`the Drive store's folder could not be made (HTTP ${r.status})`);
    return (folderId = j.id);
  }
  async function byKey(key) {
    const f = await folder();
    const got = await find(`'${f}' in parents and appProperties has { key='pintar_key' and value='${q(key)}' } and trashed=false`);
    if (got.length > 1) throw new Error(`${key} exists ${got.length} times in the Drive store`);
    return got[0] ?? null;
  }
  const b64 = (hex) => (hex ? Buffer.from(hex, "hex").toString("base64") : null);

  return {
    store,
    /** Upload a file under its key; Drive's own SHA-256 of what it stored must equal the file's, or it is refused. */
    async putFile(key, file, { retainUntil } = {}) {
      if (Buffer.byteLength(key) > 110) throw new Error(`the key ${key} is too long for a Drive property`);
      const d = await fileDigests(file);
      if (await byKey(key)) return { status: 409, ok: false, sha256: d.sha256, size: d.size, error: "the key already exists: never overwritten" };
      const f = await folder();
      const meta = { name: key.split("/").pop(), parents: [f],
        appProperties: { pintar_store: store, pintar_key: key, ...(retainUntil ? { pintar_retain_until: retainUntil } : {}) } };
      const start = await call("POST", `${uploadApi}/upload/drive/v3/files?uploadType=resumable&fields=id,size,sha256Checksum`,
        { json: meta, headers: { "x-upload-content-type": "application/octet-stream", "x-upload-content-length": String(d.size) } });
      const at = start.headers.get("location");
      if (start.status !== 200 || !at) return { status: start.status, ok: false, sha256: d.sha256, size: d.size, error: `the upload could not start (HTTP ${start.status})` };
      const r = await fetch(at, { method: "PUT", headers: { "content-length": String(d.size), "content-type": "application/octet-stream" },
        body: createReadStream(file), duplex: "half" });
      const j = await r.json().catch(() => ({}));
      if (r.status !== 200 && r.status !== 201) return { status: r.status, ok: false, sha256: d.sha256, size: d.size, error: `HTTP ${r.status}` };
      if (j.sha256Checksum !== d.sha256 || Number(j.size) !== d.size) {
        return { status: r.status, ok: false, sha256: d.sha256, size: d.size, error: "BadDigest: Drive's SHA-256 of the stored file differs" };
      }
      return { status: 200, ok: true, sha256: d.sha256, size: d.size, error: "", id: j.id };
    },
    /** A file's bytes by key, with Drive's stored SHA-256 (base64, as the S3 client gives it). */
    async getBytes(key) {
      const m = await byKey(key);
      if (!m) return { status: 404, bytes: Buffer.alloc(0), etag: null, checksum: null };
      const r = await call("GET", `${api}/drive/v3/files/${encodeURIComponent(m.id)}?alt=media`);
      const bytes = Buffer.from(await r.arrayBuffer());
      return { status: r.status, bytes: r.status === 200 ? bytes : Buffer.alloc(0), etag: null, checksum: b64(m.sha256Checksum) };
    },
    /** What S3's HEAD gave: the stored checksum and size; Drive has no lock, so lockMode is always null. */
    async head(key) {
      const m = await byKey(key);
      if (!m) return { status: 404, checksum: null, size: -1, lockMode: null, retainUntil: null, legalHold: null };
      return { status: 200, checksum: b64(m.sha256Checksum), size: Number(m.size ?? -1), lockMode: null,
        retainUntil: m.appProperties?.pintar_retain_until ?? null, legalHold: null };
    },
    /** Every key under a prefix. */
    async list(prefix) {
      const f = await folder();
      return (await find(`'${f}' in parents and trashed=false`))
        .map((m) => ({ key: m.appProperties?.pintar_key ?? "", size: Number(m.size ?? 0), retainUntil: m.appProperties?.pintar_retain_until ?? null, id: m.id }))
        .filter((m) => m.key && m.key.startsWith(prefix));
    },
    /**
     * Retention: permanently delete every file under `prefix` whose retention date has passed, but never the newest
     * complete bundle (and its record), whatever its date. Returns the keys deleted. Not immutability (header).
     */
    async prune(prefix, now, keep = []) {
      const all = await this.list(prefix);
      const keepSet = new Set(keep.flatMap((k) => [k, `${k}.success.json`]));
      const gone = [];
      for (const m of all) {
        if (keepSet.has(m.key) || !m.retainUntil || new Date(m.retainUntil) > now) continue;
        const r = await call("DELETE", `${api}/drive/v3/files/${encodeURIComponent(m.id)}`);
        if (r.status !== 204 && r.status !== 200) throw new Error(`the expired ${m.key} could not be deleted (HTTP ${r.status})`);
        gone.push(m.key);
      }
      return gone;
    },
  };
}

/** The client from the environment (backup.mjs: writer; drill.mjs: reader, the same narrow scope). */
export function gdriveFromEnv() {
  return gdriveClient({ clientId: process.env.GDRIVE_CLIENT_ID, clientSecret: process.env.GDRIVE_CLIENT_SECRET,
    refreshToken: process.env.GDRIVE_REFRESH_TOKEN, store: process.env.GDRIVE_STORE || "pintar-backup",
    api: process.env.GDRIVE_API || undefined, uploadApi: process.env.GDRIVE_UPLOAD_API || process.env.GDRIVE_API || undefined,
    tokenUrl: process.env.GDRIVE_TOKEN_URL || undefined });
}

// #150 WP-B: the one S3 client the backup, escrow and recovery scripts use, with no dependency (AWS Signature V4).
//
// Three different S3 services, three different credentials, never confused (closure plan A3):
//   C3  Supabase Storage's S3-compatible API (Supabase's, NOT AWS): list and get the project's Storage objects;
//   C4  AWS S3, the writer: PutObject with its SHA-256 checksum and its Object Lock retention or legal hold, nothing else;
//   C5  AWS S3, the reader: get and list, for drills and restores.
// A client is built from one credential and one endpoint. It never prints a key, a signature or an object's content.
import { createHash, createHmac } from "node:crypto";
import { createReadStream, statSync } from "node:fs";

const EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

/** RFC 3986 encoding of one path segment or query part, as Signature V4 wants it. */
export function uriEncode(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase());
}

const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
const hex = (b) => createHash("sha256").update(b).digest("hex");

/**
 * Signature V4 for one request. Returns the headers to send (Authorization included).
 *   host, path (already encoded), query ({k: v}), headers ({lowercase: value}), payloadHash, region, keyId, secret, now
 */
export function sign({ method, host, path, query = {}, headers = {}, payloadHash, region, keyId, secret, now = new Date() }) {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const day = amzDate.slice(0, 8);
  const h = { ...headers, host, "x-amz-date": amzDate, "x-amz-content-sha256": payloadHash };
  const names = Object.keys(h).map((k) => k.toLowerCase()).sort();
  const canonHeaders = names.map((k) => `${k}:${String(h[k]).trim().replace(/\s+/g, " ")}\n`).join("");
  const signed = names.join(";");
  const canonQuery = Object.keys(query).sort().map((k) => `${uriEncode(k)}=${uriEncode(String(query[k]))}`).join("&");
  const canon = [method, path, canonQuery, canonHeaders, signed, payloadHash].join("\n");
  const scope = `${day}/${region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, hex(canon)].join("\n");
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${secret}`, day), region), "s3"), "aws4_request");
  const signature = createHmac("sha256", kSigning).update(toSign).digest("hex");
  return { ...h, authorization: `AWS4-HMAC-SHA256 Credential=${keyId}/${scope}, SignedHeaders=${signed}, Signature=${signature}` };
}

/** SHA-256 (hex and base64) and MD5 (base64) of a file, streamed. */
export async function fileDigests(file) {
  const s = createHash("sha256"), m = createHash("md5");
  await new Promise((ok, no) => createReadStream(file).on("data", (b) => { s.update(b); m.update(b); }).on("end", ok).on("error", no));
  const sha = s.digest();
  return { sha256: sha.toString("hex"), sha256b64: sha.toString("base64"), md5b64: m.digest("base64"), size: statSync(file).size };
}

/**
 * A client for one bucket on one endpoint with one credential.
 *   endpoint   e.g. https://s3.ap-southeast-1.amazonaws.com, or https://<ref>.storage.supabase.co/storage/v1/s3
 *   pathStyle  true for Supabase Storage and local stand-ins; AWS is addressed virtual-host style
 */
export function s3Client({ endpoint, region, keyId, secret, bucket, pathStyle = false }) {
  if (!endpoint || !region || !keyId || !secret || !bucket) throw new Error("an S3 client needs its endpoint, region, key id, secret and bucket");
  const base = new URL(endpoint);
  const prefix = base.pathname.replace(/\/$/, "");
  const where = (key) => {
    const k = key ? "/" + key.split("/").map(uriEncode).join("/") : "";
    return pathStyle
      ? { host: base.host, path: `${prefix}/${uriEncode(bucket)}${k}`, origin: `${base.protocol}//${base.host}` }
      : { host: `${bucket}.${base.host}`, path: `${prefix}${k || "/"}`, origin: `${base.protocol}//${bucket}.${base.host}` };
  };
  async function request(method, key, { query = {}, headers = {}, body, payloadHash = EMPTY_SHA256, length } = {}) {
    const w = where(key);
    const signed = sign({ method, host: w.host, path: w.path, query, headers, payloadHash, region, keyId, secret });
    const qs = Object.keys(query).sort().map((k) => `${uriEncode(k)}=${uriEncode(String(query[k]))}`).join("&");
    const init = { method, headers: { ...signed, ...(length !== undefined ? { "content-length": String(length) } : {}) } };
    delete init.headers.host;
    if (body) { init.body = body; init.duplex = "half"; }
    return fetch(`${w.origin}${w.path}${qs ? "?" + qs : ""}`, init);
  }
  return {
    /** PUT a file with its SHA-256 checksum (S3 itself rejects a mismatch) and the given extra headers (retention, hold). */
    async putFile(key, file, extra = {}) {
      const d = await fileDigests(file);
      const headers = { "content-type": "application/octet-stream", "content-md5": d.md5b64, "x-amz-checksum-sha256": d.sha256b64, ...extra };
      const r = await request("PUT", key, { headers, body: createReadStream(file), payloadHash: d.sha256, length: d.size });
      const text = await r.text();
      return { status: r.status, ok: r.status === 200, sha256: d.sha256, size: d.size, error: r.status === 200 ? "" : (/<Code>([^<]+)<\/Code>/.exec(text)?.[1] ?? `HTTP ${r.status}`) };
    },
    /** GET an object's bytes (a Buffer), with its HTTP status. */
    async getBytes(key, headers = {}) {
      const r = await request("GET", key, { headers });
      const bytes = Buffer.from(await r.arrayBuffer());
      return { status: r.status, bytes: r.status === 200 ? bytes : Buffer.alloc(0), etag: r.headers.get("etag"), checksum: r.headers.get("x-amz-checksum-sha256") };
    },
    /** HEAD with the stored checksum asked for. */
    async head(key) {
      const r = await request("HEAD", key, { headers: { "x-amz-checksum-mode": "ENABLED" } });
      return { status: r.status, checksum: r.headers.get("x-amz-checksum-sha256"), size: Number(r.headers.get("content-length") ?? -1),
        lockMode: r.headers.get("x-amz-object-lock-mode"), retainUntil: r.headers.get("x-amz-object-lock-retain-until-date"), legalHold: r.headers.get("x-amz-object-lock-legal-hold") };
    },
    /** Every key under a prefix (ListObjectsV2, paged). */
    async list(prefix) {
      const keys = [];
      let token;
      do {
        const query = { "list-type": "2", prefix, ...(token ? { "continuation-token": token } : {}) };
        const r = await request("GET", "", { query });
        const text = await r.text();
        if (r.status !== 200) throw new Error(`listing ${prefix} answered HTTP ${r.status}`);
        for (const m of text.matchAll(/<Contents>[\s\S]*?<Key>([^<]*)<\/Key>[\s\S]*?<Size>(\d+)<\/Size>[\s\S]*?<\/Contents>/g)) {
          keys.push({ key: m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'"), size: Number(m[2]) });
        }
        token = /<IsTruncated>true<\/IsTruncated>/.test(text) ? /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(text)?.[1] : undefined;
      } while (token);
      return keys;
    },
  };
}

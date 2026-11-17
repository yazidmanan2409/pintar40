// Rehearsal-only mock of the two model-record endpoints. Records the auth header it receives, so the rehearsal can
// prove each key reached the right host and nowhere else. Writes the record to argv[3].
import http from 'node:http'; import { writeFileSync } from 'node:fs';
const [, , port, out, behaviour = 'ok'] = process.argv; const seen = [];
http.createServer((req, res) => {
  seen.push({ url: req.url, auth: req.headers.authorization || null, ver: req.headers['anthropic-version'] || null });
  writeFileSync(out, JSON.stringify(seen));
  const m = req.url.match(/^\/v1\/models\/(.+)$/);
  if (behaviour === 'deny') { res.writeHead(401); return res.end('{}'); }
  if (m) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ id: m[1] })); }
  res.writeHead(404); res.end('{}');
}).listen(Number(port), '127.0.0.1');

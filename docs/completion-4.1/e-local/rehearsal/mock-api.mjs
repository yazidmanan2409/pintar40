// Rehearsal-only mock of the two model-record endpoints. Records the auth header it receives (to prove each key
// reached the right host only) and, at the moment of each request, the full process list (Sharon R1: no key in argv).
import http from 'node:http'; import { writeFileSync } from 'node:fs'; import { execSync } from 'node:child_process';
const [, , port, out, behaviour = 'ok'] = process.argv; const seen = [];
http.createServer((req, res) => {
  const ps = execSync('ps -eo args', { encoding: 'utf8' });
  seen.push({ url: req.url, auth: req.headers.authorization || null, ver: req.headers['anthropic-version'] || null,
    key_text_in_process_list: /REHEARSALKEY/.test(ps) });
  writeFileSync(out, JSON.stringify(seen));
  const m = req.url.match(/^\/v1\/models\/(.+)$/);
  if (behaviour === 'deny') { res.writeHead(401); return res.end('{}'); }
  if (m) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ id: m[1] })); }
  res.writeHead(404); res.end('{}');
}).listen(Number(port), '127.0.0.1');

// PINTAR E · practice run only (zsh jalankan-e.sh --latihan). A stand-in for Anthropic's model record, on this Mac
// only (127.0.0.1, a free port). It answers one question, "does the model exist", and never sees a real key: the
// practice run accepts only the dummy text sk-ant-latihan. It writes its port to the file given, then serves until stopped.
import http from 'node:http'; import { writeFileSync } from 'node:fs';
const [, , portFile] = process.argv;
const srv = http.createServer((req, res) => {
  const ok = req.headers.authorization === 'Bearer sk-ant-latihan' && req.url === '/v1/models/claude-sonnet-5-5';
  res.writeHead(ok ? 200 : 401, { 'content-type': 'application/json' });
  res.end(ok ? JSON.stringify({ id: 'claude-sonnet-5-5' }) : '{}');
});
srv.listen(0, '127.0.0.1', () => writeFileSync(portFile, String(srv.address().port)));

import { createRequire } from "node:module";
const req = createRequire("/home/user/pintar40/package.json");
const { createServerClient } = req("@supabase/ssr");
const jar = new Map();
const c = createServerClient("http://127.0.0.1:54321", "fake", { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) } });
await c.auth.signInWithPassword({ email: process.argv[2], password: "x" });
process.stdout.write([...jar].map(([n, v]) => `${n}=${v}`).join("; "));

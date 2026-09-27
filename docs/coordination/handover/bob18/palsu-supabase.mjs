// Scaffolding only: a fake Auth + REST on :54321 to rehearse BOB06-R01's HTTP mechanics.
import http from "node:http";
const PERAN = {
  "siklus-email@synthetic.pintar.test": "STUDENT", "alpha-guru@synthetic.pintar.test": "EDUCATOR",
  "alpha-hod@synthetic.pintar.test": "HEAD_OF_DEPARTMENT", "alpha-dean@synthetic.pintar.test": "DEAN",
  "alpha-admin@synthetic.pintar.test": "INSTITUTION_ADMIN", "sysadmin@synthetic.pintar.test": "SYSTEM_ADMIN", "siklus-admin@synthetic.pintar.test": "INSTITUTION_ADMIN",
};
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (email) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: email, email, exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated", role: "authenticated", session_id: "s" })}.sig`;
const user = (email) => ({ id: "00000000-0000-4000-8000-" + String(Object.keys(PERAN).indexOf(email) + 1).padStart(12, "0"), email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() });
const dari = (req) => { const a = req.headers.authorization ?? ""; try { return JSON.parse(Buffer.from(a.replace(/^Bearer /, "").split(".")[1], "base64url")).email; } catch { return null; } };
const LATENSI = Number(process.env.LATENSI ?? 0);
const TIGA = [["22222222-2222-4222-8222-222222222222", "Sekolah Palsu"], ["22222222-2222-4222-8222-222222222223", "Sekolah Dua"], ["22222222-2222-4222-8222-222222222224", "Sekolah Tiga"]];
http.createServer((req, res) => {
  let body = ""; req.on("data", (d) => (body += d)); req.on("end", () => setTimeout(() => {
    const u = new URL(req.url, "http://x"); const j = (s, o) => { res.writeHead(s, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
    if (u.pathname === "/auth/v1/health") return j(200, { ok: true });
    if (u.pathname === "/auth/v1/token") { const { email } = JSON.parse(body || "{}"); if (!PERAN[email]) return j(400, { error: "invalid_grant" });
      return j(200, { access_token: jwt(email), token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "r-" + email, user: user(email) }); }
    if (u.pathname === "/auth/v1/user") { const e = dari(req); return e && PERAN[e] ? j(200, user(e)) : j(401, { message: "no" }); }
    if (u.pathname === "/rest/v1/my_profile") { const e = dari(req); const row = e ? { person_id: user(e).id, display_name: "X", display_role: PERAN[e] } : null;
      return /vnd\.pgrst\.object/.test(req.headers.accept ?? "") ? (row ? j(200, row) : j(406, {})) : j(200, row ? [row] : []); }
    if (u.pathname === "/rest/v1/courses") { const row = { id: "11111111-1111-4111-8111-111111111111", title: "Pecahan", status: "PUBLISHED", institution_id: "22222222-2222-4222-8222-222222222222", author_person_id: null };
      return /vnd\.pgrst\.object/.test(req.headers.accept ?? "") ? j(200, row) : j(200, [row]); }
    if (u.pathname === "/rest/v1/rpc/studio_capabilities") return j(200, TIGA.map(([institution_id, name]) => ({ institution_id, name, capabilities: JSON.parse(body || "{}").p_capabilities ?? [] })));
    if (u.pathname === "/rest/v1/rpc/platform_schema_lint") return j(200, { tables_without_rls: 0 });
    if (/^\/rest\/v1\/rpc\/(can_|is_system_admin|has_scope|management_scope)/.test(u.pathname)) return j(200, true);
    if (u.pathname === "/rest/v1/role_assignments") return j(200, [{ id: "44444444-4444-4444-8444-444444444444", person_id: user(dari(req) ?? "sysadmin@synthetic.pintar.test").id, institution_id: "22222222-2222-4222-8222-222222222222", scope_node_id: "33333333-3333-4333-8333-333333333333", role: "INSTITUTION_ADMIN", valid_from: "2026-01-01T00:00:00Z", valid_until: "2027-01-01T00:00:00Z", revoked_at: null, created_at: "2026-01-01T00:00:00Z" }]);
    if (u.pathname === "/rest/v1/institutions") return j(200, TIGA.map(([id, name]) => ({ id, name, slug: id.slice(-4), is_synthetic: true, is_active: true, tenant_kind: "SCHOOL" })));
    if (u.pathname === "/rest/v1/org_nodes") return j(200, [{ id: "33333333-3333-4333-8333-333333333333", institution_id: "22222222-2222-4222-8222-222222222222", kind: "INSTITUTION", name: "Sekolah Palsu", academic_period_id: null, is_active: true, jalur: ["33333333-3333-4333-8333-333333333333"] }]);
    if (u.pathname === "/rest/v1/platform_environment") return /vnd\.pgrst\.object/.test(req.headers.accept ?? "") ? j(200, { environment: "development" }) : j(200, [{ environment: "development" }]);
    return j(200, u.pathname.startsWith("/rest/v1/rpc/") ? null : []);
  }, LATENSI + (new URL(req.url, "http://x").pathname === "/rest/v1/rpc/platform_schema_lint" && LATENSI ? 8300 : 0)));
}).listen(54321, "127.0.0.1", () => console.log("palsu up"));

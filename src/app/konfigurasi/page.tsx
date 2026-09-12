import Link from "next/link";
import { t } from "@/lib/hle";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Super Admin & Configuration Studio — shell (FABLE-01 §10).
 * Gated server-side by the database's own authority (role assignments via
 * RLS/RPC), never by the display role alone. A lower role receives a clean,
 * calm refusal — never a broken partial render. Panels for later phases are
 * empty placeholders; nothing is faked into them.
 */
export default async function Konfigurasi() {
  const viewer = await currentViewer();
  const supabase = await supabaseServer();

  // Authority: SYSTEM_ADMIN, or INSTITUTION_ADMIN over at least one institution.
  const [{ data: isSys }, { data: adminInstitutions }] = await Promise.all([
    supabase.rpc("is_system_admin"),
    supabase.from("role_assignments").select("institution_id, role").eq("role", "INSTITUTION_ADMIN").is("revoked_at", null),
  ]);
  const institutionIds = Array.from(new Set((adminInstitutions ?? []).map((r) => r.institution_id).filter(Boolean))) as string[];
  const authorized = isSys === true || institutionIds.length > 0;

  if (!viewer || !authorized) {
    return (
      <main className="mx-auto max-w-md py-16">
        <p className="text-sm text-ink-3">{t("app.name", "staff")}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("config.refused", "staff")}</h1>
        <p className="mt-4"><Link href="/">← {t("entry.title", "staff")}</Link></p>
      </main>
    );
  }

  const [{ data: institutions }, { data: activeClasses }, { data: lint }, { data: env }] = await Promise.all([
    supabase.from("institutions").select("id, name, slug, is_synthetic, is_active").order("name"),
    supabase.from("classes").select("node_id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    isSys ? supabase.rpc("platform_schema_lint") : Promise.resolve({ data: null }),
    isSys ? supabase.from("platform_environment").select("environment").maybeSingle() : Promise.resolve({ data: null }),
  ]);
  void activeClasses;

  const lintOk = lint
    ? Object.entries(lint as Record<string, unknown>).every(([k, v]) => k === "environment" || k === "migrations_applied" || v === 0)
    : null;

  const sections: Array<{ key: string; title: string; live: boolean; body?: React.ReactNode }> = [
    {
      key: "system",
      title: t("config.section.system", "staff"),
      live: true,
      body: (
        <ul className="mt-2 grid gap-1 text-sm text-ink-2">
          {(institutions ?? []).map((i) => (
            <li key={i.id} className="flex items-center justify-between rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
              <span>{i.name}{i.is_synthetic ? <span className="ml-2 rounded bg-info-soft px-1.5 text-xs text-info">sintetis</span> : null}</span>
              <span className="text-ink-3">{i.is_active ? "aktif" : "nonaktif"}</span>
            </li>
          ))}
          {(institutions ?? []).length === 0 && <li className="text-ink-3">Belum ada institusi.</li>}
        </ul>
      ),
    },
    { key: "content", title: t("config.section.content", "staff"), live: false },
    { key: "assessment", title: t("config.section.assessment", "staff"), live: false },
    { key: "certificates", title: t("config.section.certificates", "staff"), live: false },
    { key: "intelligence", title: t("config.section.intelligence", "staff"), live: false },
  ];

  return (
    <main className="py-6">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-ink-3">{t("app.name", "staff")}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("config.title", "staff")}</h1>
        </div>
        <form action="/keluar" method="post"><button className="text-sm text-ink-2 underline">Keluar</button></form>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4">
          <p className="text-sm text-ink-3">{t("config.card.health", "staff")}</p>
          {lintOk === null ? (
            <p className="mt-1 text-ink-2">—</p>
          ) : (
            <p className={`mt-1 inline-block rounded px-2 py-0.5 ${lintOk ? "bg-ok-soft text-ok" : "bg-blocked-soft text-blocked"}`}>
              {lintOk ? "Semua pemeriksaan lolos" : "Perlu perhatian"}
            </p>
          )}
        </div>
        <div className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4">
          <p className="text-sm text-ink-3">{t("config.card.cohorts", "staff")}</p>
          <p className="mt-1 text-ink-2">{activeClasses === null ? "—" : ""}</p>
        </div>
        <div className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4">
          <p className="text-sm text-ink-3">{t("config.environment", "staff")}</p>
          <p className="mt-1 text-ink-2">{env?.environment ?? "—"}</p>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
        <nav className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-2">
          {sections.map((s) => (
            <a key={s.key} href={`#${s.key}`} className="block rounded-[var(--radius-1)] px-3 py-2 text-sm hover:bg-surface-2">{s.title}</a>
          ))}
        </nav>
        <div className="grid gap-4">
          {sections.map((s) => (
            <section key={s.key} id={s.key} className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4">
              <h2 className="font-medium">{s.title}</h2>
              {s.live ? s.body : <p className="mt-2 text-sm text-ink-3">{t("config.placeholder", "staff")}</p>}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

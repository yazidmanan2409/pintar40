import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import {
  grantRoleAction, revokeRoleAction, rolloverAction, saveReportTemplateAction, setFlagAction,
  setPlatformConfigAction, transferAuthorizeAction, transferExecuteAction, transferRejectAction,
  transferRequestAction,
} from "./actions";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { currentLocale } from "@/lib/locale";
import SesiSaya from "@/components/SesiSaya";
import TabTempat, { tempatDariPeran } from "@/components/TabTempat";
import { peranSaya } from "@/lib/tur-negara";

/**
 * Super Admin & Configuration Studio — shell (FABLE-01 §10).
 * Gated server-side by the database's own authority (role assignments via
 * RLS/RPC), never by the display role alone. A lower role receives a clean,
 * calm refusal — never a broken partial render. Panels for later phases are
 * empty placeholders; nothing is faked into them.
 *
 * Phase-1 surfaces wired here call only RPCs and tables that already exist:
 * period rollover, transfer request/authorize/execute/reject (policy hooks
 * only — OD-9), role grant/revoke, audit reader, feature flags and the two
 * platform switches. Every read is the signed-in user's own RLS view.
 */

const s = (event: HleEvent) => t(event, "staff");
const short = (id: string | null | undefined) => (id ? id.slice(0, 8) : "—");
const tautanTempat = "text-ink-2 underline underline-offset-4 hover:text-ink-1";
const when = (iso: string) => new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" });
const roleLabel = (r: string) => (["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"].includes(r) ? s(`role.${r}` as HleEvent) : r);
const transferLabel = (st: string) => (["REQUESTED", "AUTHORIZED", "EXECUTED", "REJECTED", "CANCELLED"].includes(st) ? s(`transfer.${st}` as HleEvent) : st);

const card = "rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4";
const field = "rounded-[var(--radius-1)] border border-line-1 bg-surface-0 px-2 py-1 text-sm";
const button = "rounded-[var(--radius-1)] bg-surface-2 px-3 py-1 text-sm hover:bg-line-1";
const label = "grid gap-1 text-sm text-ink-2";

/** The three reports PINTAR defines. The table's own CHECK is the authority. */
const STANDARD_REPORTS = ["class_learning_intelligence", "institution_learning_intelligence", "learner_result"] as const;

type MetricDefinition = {
  metric_id: string;
  label_key: string;
  scope: string;
  allowed_visualizations: string[];
  deprecated: boolean;
};

type SearchParams = Promise<{ bagian?: string; hasil?: string; detail?: string }>;

export default async function Konfigurasi({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await currentViewer();
  const supabase = await supabaseServer();
  const sp = await searchParams;

  // Authority: SYSTEM_ADMIN, or INSTITUTION_ADMIN over at least one institution.
  const [{ data: isSys }, { data: adminAssignments }] = await Promise.all([
    supabase.rpc("is_system_admin"),
    supabase.from("role_assignments").select("institution_id, role, valid_until").eq("role", "INSTITUTION_ADMIN").is("revoked_at", null)
      .gt("valid_until", new Date().toISOString()),
  ]);
  const adminInstitutionIds = Array.from(new Set((adminAssignments ?? []).map((r) => r.institution_id).filter(Boolean))) as string[];
  const authorized = isSys === true || adminInstitutionIds.length > 0;

  if (!viewer || !authorized) {
    // S0.5: the ONE refusal page. `authorized` above is unchanged.
    return (
      <HalamanPenolakan
        messageKey="config.refused"
        persona="staff"
        locale={await currentLocale()}
        backHref="/"
        backKey="entry.title"
      />
    );
  }

  const [
    { data: institutions }, { data: periods }, { data: nodes }, { data: enrollments }, { data: transfers },
    { data: assignments }, { data: audit }, { data: flags }, { data: platformConfig }, { data: lint }, { data: env },
  ] = await Promise.all([
    supabase.from("institutions").select("id, name, slug, is_synthetic, is_active").order("name"),
    supabase.from("academic_periods").select("id, institution_id, name, starts_on, ends_on").order("starts_on"),
    supabase.from("org_nodes").select("id, institution_id, kind, name, academic_period_id, is_active").order("name"),
    supabase.from("enrollments").select("id, person_id, institution_id, academic_period_id, status").eq("status", "ACTIVE").order("created_at"),
    supabase.from("transfers").select("id, person_id, from_institution_id, to_institution_id, status, reason, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("role_assignments").select("id, person_id, role, scope_node_id, institution_id, valid_until, revoked_at").is("revoked_at", null).order("created_at", { ascending: false }),
    supabase.from("audit_log").select("id, at, action, target_table, target_id, institution_id, build_sha").order("at", { ascending: false }).limit(50),
    supabase.from("feature_flags").select("key, institution_id, enabled, note").order("key"),
    supabase.from("platform_config").select("key, value"),
    isSys ? supabase.rpc("platform_schema_lint") : Promise.resolve({ data: null }),
    isSys ? supabase.from("platform_environment").select("environment").maybeSingle() : Promise.resolve({ data: null }),
  ]);

  // FINAL DELTA 2. The people the three sources above cannot reach: no active
  // role, no enrolment, no transfer. The database decides who may ask and who
  // may be seen -- a non-SYSTEM_ADMIN is refused by the endpoint and gets an
  // error rather than rows, which is why nothing here checks a role first.
  const { data: awaiting } = await supabase.rpc("persons_awaiting_first_role");
  const awaitingPersons = (awaiting ?? []) as Array<{ person_id: string; display_name: string }>;

  // W8-02. The institution's own templates, and the catalogue they may select
  // from. Both are ordinary reads under this viewer's own RLS: the template
  // rows are their school's, and the catalogue is PINTAR's, readable by anyone
  // signed in and writable by nobody through this surface.
  const liveCatalogue = (await supabase.rpc("current_metric_catalogue")).data as string | null;
  const [{ data: reportTemplates }, { data: templateMetrics }, { data: metricDefs }] = await Promise.all([
    supabase.from("report_templates").select("id, institution_id, template_version, standard_report, title_key").order("title_key"),
    supabase.from("report_template_metrics").select("template_id, metric_id, ordinal, visualization").order("ordinal"),
    liveCatalogue
      ? supabase.from("metric_definitions")
          .select("metric_id, label_key, scope, allowed_visualizations, deprecated")
          .eq("catalogue_version", liveCatalogue).eq("deprecated", false).order("metric_id")
      : Promise.resolve({ data: [] as MetricDefinition[] }),
  ]);

  // Names for the people this viewer may see (RLS decides who that is).
  const personIds = Array.from(new Set([
    ...(enrollments ?? []).map((e) => e.person_id), ...(transfers ?? []).map((x) => x.person_id), ...(assignments ?? []).map((a) => a.person_id),
  ]));
  const { data: persons } = personIds.length
    ? await supabase.from("persons").select("id, display_name").in("id", personIds)
    : { data: [] as Array<{ id: string; display_name: string }> };
  const personName = new Map((persons ?? []).map((p) => [p.id, p.display_name]));
  const institutionName = new Map((institutions ?? []).map((i) => [i.id, i.name]));
  const periodName = new Map((periods ?? []).map((p) => [p.id, p.name]));
  const nodeName = new Map((nodes ?? []).map((n) => [n.id, `${n.name}`]));

  const activeClassCount = (nodes ?? []).filter((n) => n.kind === "CLASS" && n.is_active).length;
  const lintOk = lint
    ? Object.entries(lint as Record<string, unknown>).every(([k, v]) => k === "environment" || k === "migrations_applied" || v === 0)
    : null;
  const configValue = (key: string) => (platformConfig ?? []).find((r) => r.key === key)?.value === true;
  const myInstitutions = (institutions ?? []).filter((i) => isSys || adminInstitutionIds.includes(i.id));
  const myInstitutionIds = myInstitutions.map((i) => i.id);
  const myTemplates = (reportTemplates ?? []).filter((t) => myInstitutionIds.includes(t.institution_id));
  const metricsByTemplate = new Map<string, Array<{ metric_id: string; visualization: string }>>();
  for (const m of templateMetrics ?? []) {
    const list = metricsByTemplate.get(m.template_id) ?? [];
    list.push({ metric_id: m.metric_id, visualization: m.visualization });
    metricsByTemplate.set(m.template_id, list);
  }
  const rollNodes = (nodes ?? []).filter((n) => (n.kind === "COHORT" || n.kind === "CLASS") && n.academic_period_id);

  const result = (section: string) =>
    sp.bagian === section && sp.hasil ? (
      <p className={`mt-3 inline-block rounded px-2 py-0.5 text-sm ${sp.hasil === "ok" ? "bg-ok-soft text-ok" : "bg-blocked-soft text-blocked"}`}>
        {sp.hasil === "ok" ? s("config.result.ok") : s("config.result.failed")}{sp.detail ? ` ${sp.detail}` : ""}
      </p>
    ) : null;

  const nav: Array<[string, string]> = [
    ["system", s("config.section.system")], ["rollover", s("config.section.rollover")], ["transfers", s("config.section.transfers")],
    ["roles", s("config.section.roles")], ["audit", s("config.section.audit")], ["flags", s("config.section.flags")],
    ["content", s("config.section.content")], ["assessment", s("config.section.assessment")],
    ["certificates", s("config.section.certificates")], ["intelligence", s("config.section.intelligence")],
  ];

  return (
    <main className="py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-3">{s("app.name")}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{s("config.title")}</h1>
        </div>
        {/* DAISY-02: the shared session strip replaces a hard-coded "Keluar"
            that sat outside the copy table and never changed language. */}
        <SesiSaya locale={await currentLocale()} persona="staff" sebut />
      </header>

      {/* WP5B. THE WAY IN TO BULK INTAKE, from the surface an institution
          administrator already lands on. It is one link and not a panel: the
          intake is its own experience on the design system, and reproducing a
          piece of it here would be two places to keep true. The link decides
          nothing — `/pendataan` asks `can_on_node('CAN_PROVISION_PEOPLE', …)`
          on arrival and refuses a reader who does not hold it. */}
      {/* DAISY-03 (M3). Aktivasi and Studio were reachable only by typing
          their addresses. They sit beside the intake now, with the
          administrator's other places (D-010) after them. Every one of these
          asks its own gate on arrival; a link here decides nothing. */}
      <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label={t("nav.tempat", "staff", { locale: await currentLocale() })}>
        <Link href="/pendataan" className={tautanTempat}>{s("pendataan.judul")}</Link>
        <Link href="/aktivasi" className={tautanTempat}>{s("nav.aktivasi")}</Link>
        <Link href="/studio" className={tautanTempat}>{s("nav.studio")}</Link>
        <TabTempat
          tempat={tempatDariPeran(await peranSaya())}
          kecuali={["/konfigurasi"]}
          locale={await currentLocale()}
          persona="staff"
          kelas={tautanTempat}
        />
      </nav>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className={card}>
          <p className="text-sm text-ink-3">{s("config.card.health")}</p>
          {lintOk === null ? <p className="mt-1 text-ink-2">—</p> : (
            <p className={`mt-1 inline-block rounded px-2 py-0.5 ${lintOk ? "bg-ok-soft text-ok" : "bg-blocked-soft text-blocked"}`}>
              {lintOk ? "Semua pemeriksaan lolos" : "Perlu perhatian"}
            </p>
          )}
        </div>
        <div className={card}>
          <p className="text-sm text-ink-3">{s("config.card.cohorts")}</p>
          <p className="mt-1 text-ink-2">{activeClassCount}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-ink-3">{s("config.environment")}</p>
          <p className="mt-1 text-ink-2">{env?.environment ?? "—"}</p>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
        <nav className={`${card} self-start p-2`}>
          {nav.map(([key, title]) => (
            <a key={key} href={`#${key}`} className="block rounded-[var(--radius-1)] px-3 py-2 text-sm hover:bg-surface-2">{title}</a>
          ))}
        </nav>

        <div className="grid gap-4">
          {/* System & Configuration: institutions and periods */}
          <section id="system" className={card}>
            <h2 className="font-medium">{s("config.section.system")}</h2>
            <ul className="mt-2 grid gap-1 text-sm text-ink-2">
              {(institutions ?? []).map((i) => (
                <li key={i.id} className="rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span>{i.name}{i.is_synthetic ? <span className="ml-2 rounded bg-info-soft px-1.5 text-xs text-info">sintetis</span> : null}</span>
                    <span className="text-ink-3">{i.is_active ? "aktif" : "nonaktif"}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-3">
                    {(periods ?? []).filter((p) => p.institution_id === i.id).map((p) => `${p.name} (${p.starts_on} – ${p.ends_on})`).join(" · ") || s("config.empty")}
                  </p>
                </li>
              ))}
              {(institutions ?? []).length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
          </section>

          {/* Period rollover (INV-23) */}
          <section id="rollover" className={card}>
            <h2 className="font-medium">{s("config.section.rollover")}</h2>
            <p className="mt-1 text-sm text-ink-3">{s("config.label.mapping_help")}</p>
            {myInstitutions.map((inst) => {
              const instPeriods = (periods ?? []).filter((p) => p.institution_id === inst.id);
              const instNodes = rollNodes.filter((n) => n.institution_id === inst.id);
              if (instPeriods.length < 2 || instNodes.length === 0) return null;
              return (
                <form key={inst.id} action={rolloverAction} className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3">
                  <input type="hidden" name="institution" value={inst.id} />
                  <p className="text-sm font-medium">{inst.name}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className={label}>{s("config.label.period_from")}
                      <select name="from_period" className={field} required defaultValue="">
                        <option value="" disabled>—</option>
                        {instPeriods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </label>
                    <label className={label}>{s("config.label.period_to")}
                      <select name="to_period" className={field} required defaultValue="">
                        <option value="" disabled>—</option>
                        {instPeriods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-1">
                    {instNodes.map((n) => (
                      <label key={n.id} className="flex items-center justify-between gap-2 text-sm text-ink-2">
                        <span>{n.name} <span className="text-ink-3">· {periodName.get(n.academic_period_id!) ?? ""}</span></span>
                        <select name={`map[${n.id}]`} className={field} defaultValue="">
                          <option value="">{s("config.label.not_rolled")}</option>
                          {instNodes.filter((m) => m.id !== n.id && m.kind === n.kind).map((m) => (
                            <option key={m.id} value={m.id}>{m.name} · {periodName.get(m.academic_period_id!) ?? ""}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                  <div><button className={button}>{s("config.action.rollover")}</button></div>
                </form>
              );
            })}
            {result("rollover")}
          </section>

          {/* Transfers (INV-25; policy hooks only — OD-9) */}
          <section id="transfers" className={card}>
            <h2 className="font-medium">{s("config.section.transfers")}</h2>
            <ul className="mt-2 grid gap-1 text-sm text-ink-2">
              {(transfers ?? []).map((x) => (
                <li key={x.id} className="grid gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <span>{personName.get(x.person_id) ?? short(x.person_id)}</span>
                    <span className="text-ink-3"> · {institutionName.get(x.from_institution_id) ?? short(x.from_institution_id)} → {institutionName.get(x.to_institution_id) ?? short(x.to_institution_id)}</span>
                    <span className="ml-2 rounded bg-info-soft px-1.5 text-xs text-info">{transferLabel(x.status)}</span>
                    {x.reason ? <p className="text-xs text-ink-3">{x.reason}</p> : null}
                  </div>
                  {(x.status === "REQUESTED" || x.status === "AUTHORIZED") && (
                    <div className="flex flex-wrap gap-2">
                      {x.status === "REQUESTED" && (
                        <form action={transferAuthorizeAction}><input type="hidden" name="transfer" value={x.id} /><button className={button}>{s("config.action.authorize")}</button></form>
                      )}
                      {x.status === "AUTHORIZED" && (
                        <form action={transferExecuteAction}><input type="hidden" name="transfer" value={x.id} /><button className={button}>{s("config.action.execute")}</button></form>
                      )}
                      <form action={transferRejectAction} className="flex gap-1">
                        <input type="hidden" name="transfer" value={x.id} />
                        <input name="reason" className={field} placeholder={s("config.label.reason")} />
                        <button className={button}>{s("config.action.reject")}</button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
              {(transfers ?? []).length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
            <form action={transferRequestAction} className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3 sm:grid-cols-2">
              <label className={`${label} sm:col-span-2`}>{s("config.label.enrollment")}
                <select name="from_enrollment" className={field} required defaultValue="">
                  <option value="" disabled>—</option>
                  {(enrollments ?? []).filter((e) => isSys || adminInstitutionIds.includes(e.institution_id)).map((e) => (
                    <option key={e.id} value={e.id}>
                      {personName.get(e.person_id) ?? short(e.person_id)} · {institutionName.get(e.institution_id) ?? short(e.institution_id)} · {periodName.get(e.academic_period_id) ?? ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className={label}>{s("config.label.destination_institution")}<input name="to_institution" className={field} required /></label>
              <label className={label}>{s("config.label.destination_period")}<input name="to_period" className={field} required /></label>
              <label className={label}>{s("config.label.destination_programme")}<input name="to_programme" className={field} /></label>
              <label className={label}>{s("config.label.reason")}<input name="reason" className={field} /></label>
              <p className="text-xs text-ink-3 sm:col-span-2">{s("config.label.destination_help")}</p>
              <div><button className={button}>{s("config.action.request_transfer")}</button></div>
            </form>
            {result("transfers")}
          </section>

          {/* Roles (INV-16) */}
          <section id="roles" className={card}>
            <h2 className="font-medium">{s("config.section.roles")}</h2>
            <ul className="mt-2 grid gap-1 text-sm text-ink-2">
              {(assignments ?? []).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
                  <span>
                    {personName.get(a.person_id) ?? short(a.person_id)} · {roleLabel(a.role)}
                    <span className="text-ink-3"> · {a.scope_node_id ? nodeName.get(a.scope_node_id) ?? short(a.scope_node_id) : s("role.SYSTEM_ADMIN")} · {s("config.label.valid_until").toLowerCase()} {a.valid_until.slice(0, 10)}</span>
                  </span>
                  {a.person_id !== viewer.personId && (
                    <form action={revokeRoleAction}><input type="hidden" name="assignment" value={a.id} /><button className={button}>{s("config.action.revoke")}</button></form>
                  )}
                </li>
              ))}
              {(assignments ?? []).length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
            <form action={grantRoleAction} className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3 sm:grid-cols-2">
              <label className={label}>{s("config.label.person")}
                <select name="person" className={field} required defaultValue="">
                  <option value="" disabled>—</option>
                  {/* Two groups, and the union is total: everyone the reader
                      may see either holds something already or holds nothing
                      yet. A school's first administrator is always in the
                      second group, which is why it had to exist. */}
                  {awaitingPersons.length > 0 && (
                    <optgroup label={s("config.label.person_new")}>
                      {awaitingPersons.map((p) => (
                        <option key={p.person_id} value={p.person_id}>{p.display_name}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={s("config.label.person_known")}>
                    {(persons ?? []).filter((p) => p.id !== viewer.personId).map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
                  </optgroup>
                </select>
              </label>
              <label className={label}>{s("config.label.role")}
                <select name="role" className={field} required defaultValue="EDUCATOR">
                  {(["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", ...(isSys ? ["INSTITUTION_ADMIN", "SYSTEM_ADMIN"] : [])]).map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </label>
              <label className={label}>{s("config.label.scope")}
                <select name="scope" className={field} defaultValue="">
                  <option value="">—</option>
                  {(nodes ?? []).map((n) => <option key={n.id} value={n.id}>{institutionName.get(n.institution_id) ?? ""} · {n.name}</option>)}
                </select>
              </label>
              <label className={label}>{s("config.label.valid_until")}<input type="date" name="valid_until" className={field} required /></label>
              <div><button className={button}>{s("config.action.grant")}</button></div>
            </form>
            {result("roles")}
          </section>

          {/* Audit reader (INV-18) — read only */}
          <section id="audit" className={card}>
            <h2 className="font-medium">{s("config.section.audit")}</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm text-ink-2">
                <thead className="text-xs text-ink-3">
                  <tr><th className="py-1 pr-3">{s("config.label.when")}</th><th className="py-1 pr-3">{s("config.label.action")}</th><th className="py-1 pr-3">{s("config.label.target")}</th><th className="py-1 pr-3">{s("config.label.build")}</th></tr>
                </thead>
                <tbody>
                  {(audit ?? []).map((r) => (
                    <tr key={r.id} className="border-t border-line-1">
                      <td className="py-1 pr-3 whitespace-nowrap">{when(r.at)}</td>
                      <td className="py-1 pr-3">{r.action}</td>
                      <td className="py-1 pr-3 text-ink-3">{r.target_table} · {short(r.target_id)}{r.institution_id ? ` · ${institutionName.get(r.institution_id) ?? short(r.institution_id)}` : ""}</td>
                      <td className="py-1 pr-3 text-ink-3">{short(r.build_sha)}</td>
                    </tr>
                  ))}
                  {(audit ?? []).length === 0 && <tr><td className="py-1 text-ink-3" colSpan={4}>{s("config.empty")}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          {/* Feature flags and platform switches (doc 16 §8) */}
          <section id="flags" className={card}>
            <h2 className="font-medium">{s("config.section.flags")}</h2>
            {isSys && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(["maintenance_mode", "registration_lock"] as const).map((key) => (
                  <form key={key} action={setPlatformConfigAction} className="flex items-center justify-between gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2 text-sm">
                    <input type="hidden" name="key" value={key} />
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="value" defaultChecked={configValue(key)} />
                      {key === "maintenance_mode" ? s("config.label.maintenance") : s("config.label.registration_lock")}
                    </label>
                    <button className={button}>{s("config.action.save")}</button>
                  </form>
                ))}
              </div>
            )}
            <ul className="mt-2 grid gap-1 text-sm text-ink-2">
              {(flags ?? []).map((f) => (
                <li key={`${f.key}:${f.institution_id}`} className="flex items-center justify-between rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
                  <span>{f.key} <span className="text-ink-3">· {institutionName.get(f.institution_id) ?? short(f.institution_id)}</span></span>
                  <span className="text-ink-3">{f.enabled ? "aktif" : "nonaktif"}</span>
                </li>
              ))}
              {(flags ?? []).length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
            {myInstitutions.length > 0 && (
              <form action={setFlagAction} className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                <label className={label}>{s("config.section.system")}
                  <select name="institution" className={field} required defaultValue={myInstitutions[0].id}>
                    {myInstitutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </label>
                <label className={label}>{s("config.label.flag_key")}<input name="key" className={field} required pattern="[a-z][a-z0-9_.]{1,80}" /></label>
                <label className="flex items-center gap-2 text-sm text-ink-2"><input type="checkbox" name="enabled" />{s("config.label.enabled")}</label>
                <button className={button}>{s("config.action.save")}</button>
              </form>
            )}
            {result("flags")}
          </section>

          {/* W8-02 — REPORT CONFIGURATION.
              PINTAR owns the metrics; the school owns the selection. The form
              below can send a metric id, an order and a visualization, and
              nothing else: there is no field for a formula, a meaning, an
              audience or a minimum sample, because those are not an
              institution's to set. `save_report_template` asks for
              CAN_MANAGE_REPORT_TEMPLATES before it resolves anything, and the
              row guards ask again on every write — this panel is a form, not
              an authority. */}
          <section id="intelligence" className={card}>
            <h2 className="font-medium">{s("laporan.templat.judul")}</h2>
            <p className="mt-2 text-sm text-ink-3">{s("laporan.templat.penjelasan")}</p>

            {myTemplates.length === 0 ? (
              <p className="mt-3 text-sm text-ink-3">{s("laporan.templat.kosong")}</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm">
                {myTemplates.map((tpl) => (
                  <li key={tpl.id} className="rounded-[var(--radius-1)] border border-line-1 p-2">
                    <span className="font-medium">{tpl.title_key}</span>
                    <span className="text-ink-3"> · {tpl.standard_report} · {s("laporan.templat.versi")} {tpl.template_version}</span>
                    <p className="mt-1 text-ink-2">
                      {(metricsByTemplate.get(tpl.id) ?? []).map((m) => `${m.metric_id} (${m.visualization})`).join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {myInstitutions.length === 0 || (metricDefs ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-ink-3">{s("laporan.templat.tak_berwenang")}</p>
            ) : (
              <form action={saveReportTemplateAction} className="mt-4 grid gap-3">
                <label className={label}>{s("laporan.templat.institusi")}
                  <select name="institution" className={field} required defaultValue={myInstitutions[0]?.id}>
                    {myInstitutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </label>
                <label className={label}>{s("laporan.templat.jenis")}
                  <select name="standard_report" className={field} required>
                    {STANDARD_REPORTS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label className={label}>{s("laporan.templat.judul_kunci")}
                  <input name="title_key" className={field} required pattern="[a-z][a-z0-9_.]+"
                         defaultValue="laporan.institusi.judul" />
                </label>
                <fieldset className="grid gap-1">
                  <legend className="text-sm text-ink-2">{s("laporan.templat.pilih")}</legend>
                  <p className="text-xs text-ink-3">{s("laporan.templat.batas")}</p>
                  {(metricDefs ?? []).map((d) => (
                    <label key={d.metric_id} className="flex flex-wrap items-center gap-2 text-sm">
                      {/* The metric id, which is PINTAR's own name for it and
                          already carries its scope ("class.", "institution.").
                          The scope column itself is an enum and §7 does not
                          let one be rendered raw to a human. */}
                      <span className="min-w-[14rem] text-ink-2">{d.metric_id}</span>
                      {/* No selection is the default: an empty visualization
                          is how a metric is left out, so the form cannot
                          silently include one nobody ticked. */}
                      <select name={`metric[${d.metric_id}]`} className={field} defaultValue="">
                        <option value="">—</option>
                        {(d.allowed_visualizations ?? []).map((v: string) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </label>
                  ))}
                </fieldset>
                <button className={button}>{s("laporan.templat.simpan")}</button>
              </form>
            )}
            {result("intelligence")}
          </section>

          {/* Placeholders for later phases — nothing faked */}
          {(["content", "assessment", "certificates"] as const).map((key) => (
            <section key={key} id={key} className={card}>
              <h2 className="font-medium">{s(`config.section.${key}` as HleEvent)}</h2>
              <p className="mt-2 text-sm text-ink-3">{s("config.placeholder")}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

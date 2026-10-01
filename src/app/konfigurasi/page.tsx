import Link from "next/link";
import TandaTautan from "@/components/TandaTautan";
import { t, format, type HleEvent } from "@/lib/hle";
import { kalimatHasil, rujukan } from "@/lib/galat-kontrak";
import { nilaiSkema } from "@/lib/kesehatan-skema";
import KartuKesehatan, { type KeadaanKesehatan } from "@/components/konfigurasi/KartuKesehatan";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import {
  grantRoleAction, pindahKelasAction, revokeRoleAction, rolloverAction, saveReportTemplateAction, setFlagAction,
  setPlatformConfigAction, tetapkanBatasAction, transferAuthorizeAction, transferExecuteAction, transferRejectAction,
  transferRequestAction,
} from "./actions";
import { pelajaranDanBatas } from "@/lib/batas-ketuntasan";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { currentLocale } from "@/lib/locale";
import SesiSaya from "@/components/SesiSaya";
import TabTempat, { tempatDariPeran } from "@/components/TabTempat";
import { peranSaya } from "@/lib/tur-negara";
import { bacaStruktur } from "@/lib/struktur";
import { tahunAjaranPada } from "@/lib/struktur-kontrak";
import PanelStruktur from "@/components/struktur/PanelStruktur";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import { sekolahPendataan } from "@/lib/pendataan";
import { sekolahDipilih, sekolahDitawarkan } from "@/components/sekolah";
import { asalPindah, muridDiKelas, namaKelas, tujuanPindah } from "@/lib/pindah-kelas";
import { persiapanSekolah, type PeranTerbaca } from "@/lib/persiapan-sekolah";

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

type SearchParams = Promise<{ bagian?: string; hasil?: string; kode?: string; ref?: string; n?: string; sekolah?: string; periksa?: string; dari?: string }>;

export default async function Konfigurasi({ searchParams }: { searchParams: SearchParams }) {
  // One parallel read of the viewer and their roles (DAISY-02/03).
  const [viewer, peran] = await Promise.all([currentViewer(), peranSaya()]);
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
    { data: assignments }, { data: audit }, { data: flags }, { data: platformConfig }, { data: lint, error: lintError }, { data: env },
    { data: awaiting }, [{ data: reportTemplates }, { data: templateMetrics }, { data: metricDefs }],
  ] = await Promise.all([
    supabase.from("institutions").select("id, name, slug, is_synthetic, is_active, tenant_kind").order("name"),
    supabase.from("academic_periods").select("id, institution_id, name, starts_on, ends_on").order("starts_on"),
    supabase.from("org_nodes").select("id, institution_id, kind, name, academic_period_id, is_active, jalur").order("name"),
    supabase.from("enrollments").select("id, person_id, institution_id, academic_period_id, status").eq("status", "ACTIVE").order("created_at"),
    supabase.from("transfers").select("id, person_id, from_institution_id, to_institution_id, status, reason, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("role_assignments").select("id, person_id, role, scope_node_id, institution_id, valid_until, revoked_at").is("revoked_at", null).order("created_at", { ascending: false }),
    supabase.from("audit_log").select("id, at, action, target_table, target_id, institution_id, build_sha").order("at", { ascending: false }).limit(50),
    supabase.from("feature_flags").select("key, institution_id, enabled, note").order("key"),
    supabase.from("platform_config").select("key, value"),
    // BOB-18 (D-046): the schema lint runs when an operator asks for it, never
    // on an ordinary load -- it reads the whole catalogue, and every sign-in of
    // the platform admin lands here.
    isSys && sp.periksa === "skema" ? supabase.rpc("platform_schema_lint") : Promise.resolve({ data: null, error: null }),
    isSys ? supabase.from("platform_environment").select("environment").maybeSingle() : Promise.resolve({ data: null }),
    // FINAL DELTA 2. The people the three sources above cannot reach: no active
    // role, no enrolment, no transfer. The platform administrator asks the
    // platform's list, which refuses everyone else (the school administrator's
    // asking was 338 refusals in U-PERF's 30-session run on staging).
    // BOB-20 (D-048): a school administrator asks each school they administer
    // for its own list -- the people it has recorded who hold nothing there
    // yet, such as a newly recorded teacher. The database decides again who
    // may ask; a school it refuses simply adds nobody.
    isSys === true
      ? supabase.rpc("persons_awaiting_first_role")
      : Promise.all(adminInstitutionIds.map((sekolah) => supabase.rpc("persons_awaiting_first_role_at", { p_institution: sekolah })))
          .then((jawaban) => ({ data: jawaban.flatMap((j) => (j.data ?? []) as Array<{ person_id: string; display_name: string }>) })),
    // W8-02. The institution's own templates, and the catalogue they may select
    // from. Both are ordinary reads under this viewer's own RLS: the template
    // rows are their school's, and the catalogue is PINTAR's, readable by anyone
    // signed in and writable by nobody through this surface.
    // BOB-18 (e): read beside everything above rather than after it, so the
    // page a save returns to costs one round trip here instead of three.
    Promise.all([
      supabase.from("report_templates").select("id, institution_id, template_version, standard_report, title_key").order("title_key"),
      supabase.from("report_template_metrics").select("template_id, metric_id, ordinal, visualization").order("ordinal"),
      (async (): Promise<{ data: MetricDefinition[] }> => {
        const liveCatalogue = (await supabase.rpc("current_metric_catalogue")).data as string | null;
        if (!liveCatalogue) return { data: [] };
        const { data } = await supabase.from("metric_definitions")
          .select("metric_id, label_key, scope, allowed_visualizations, deprecated")
          .eq("catalogue_version", liveCatalogue).eq("deprecated", false).order("metric_id");
        return { data: (data ?? []) as MetricDefinition[] };
      })(),
    ]),
  ]);

  // DAISY-05. The school whose structure is shown: an active, real school the
  // reader administers -- never the national library, whose name sorts first
  // (audit S7b) -- the one asked for if it is on offer, else the first. Its
  // read starts now and runs beside the reads below; `school_structure`
  // decides again who may see it.
  const sekolahKu = sekolahDitawarkan(institutions ?? [], (id) => isSys === true || adminInstitutionIds.includes(id));
  const sekolahStruktur = sekolahDipilih(sekolahKu, sp.sekolah);
  const bacaanStruktur = sekolahStruktur ? bacaStruktur(sekolahStruktur.id) : Promise.resolve(null);
  // DAISY-07 (B6b): the school's own root node, for its school summary
  const bacaanAkar = sekolahStruktur
    ? supabase.from("org_nodes").select("id").eq("institution_id", sekolahStruktur.id).eq("kind", "INSTITUTION").limit(1).maybeSingle()
    : Promise.resolve({ data: null });

  const awaitingPersons = Array.from(new Map(((awaiting ?? []) as Array<{ person_id: string; display_name: string }>)
    .map((p) => [p.person_id, p])).values());

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
  // BOB-19: the card judges each check by the one rule F01-T13 uses
  // (src/lib/kesehatan-skema), never "anything but 0 is a problem"
  let kesehatan: KeadaanKesehatan;
  if (isSys !== true) kesehatan = { jenis: "bukan_admin" };
  else if (sp.periksa !== "skema") kesehatan = { jenis: "belum" };
  else if (lintError || !lint || typeof lint !== "object") {
    const ref = rujukan();
    console.error(`[konfigurasi ${ref}] platform_schema_lint failed`, lintError?.code, lintError?.message);
    kesehatan = { jenis: "gagal", rujukan: ref };
  } else kesehatan = { jenis: "diperiksa", hasil: nilaiSkema(lint as Record<string, unknown>) };
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

  // DAISY-18: the result sits under the form it answers, in the shared line.
  const result = (section: string) =>
    sp.bagian === section && sp.hasil ? (
      <BarisHasil nada={sp.hasil === "ok" ? "ok" : "gagal"}>
        {kalimatHasil(sp, s, { ok: "config.result.ok", gagal: "config.result.failed" })}
      </BarisHasil>
    ) : null;

  // DAISY-17: "Menambahkan orang" is offered only to a reader /pendataan
  // admits -- the same predicate it asks on arrival. A platform administrator
  // holds no school's CAN_PROVISION_PEOPLE and was sent to a refusal.
  // D-088(b): the lessons the school can give, each with its pass mark (or none) and its history
  const [struktur, locale, { data: akar }, bolehPendataan, ketuntasan] = await Promise.all([
    bacaanStruktur, currentLocale(), bacaanAkar, sekolahPendataan().then((x) => x.length > 0).catch(() => false),
    sekolahStruktur ? pelajaranDanBatas(supabase, sekolahStruktur.id) : Promise.resolve(null),
  ]);
  const kelasAktif = struktur?.ok ? struktur.rows.filter((r) => r.level === "KELAS" && r.is_active) : [];
  // M9: the Kelas whose students «Pindah kelas» lists, if one was chosen, and
  // where they may go; J3.6: or a Tingkat whose learners are not yet in a Kelas.
  // Read only when asked: a plain visit costs nothing.
  const asal = asalPindah(struktur?.ok ? struktur.rows : []);
  const kelasDari = [...asal.kelas, ...asal.tingkat].find((k) => k.node_id === sp.dari) ?? null;
  const tujuan = kelasDari && struktur?.ok ? tujuanPindah(struktur.rows, kelasDari.node_id) : [];
  const muridDari = kelasDari ? await muridDiKelas(supabase, kelasDari.node_id) : [];
  const sl = (event: HleEvent) => t(event, "staff", { locale });
  // J3.2 (ADM-02): what setup remains at the school shown, from what this page already read
  const persiapan = struktur?.ok
    ? persiapanSekolah(struktur.rows, (assignments ?? []) as PeranTerbaca[],
        new Map((nodes ?? []).map((n) => [n.id as string, ((n as { jalur?: string[] }).jalur ?? []) as string[]])), new Date().valueOf())
    : null;

  const nav: Array<[string, string]> = [
    ["struktur", s("config.section.struktur")],
    ["ketuntasan", s("config.section.ketuntasan")],
    ["pindah", s("config.section.pindah")],
    ["laporan", s("config.laporan.judul")],
    ["system", s("config.section.system")], ["rollover", s("config.section.rollover")], ["transfers", s("config.section.transfers")],
    ["roles", s("config.section.roles")], ["audit", s("config.section.audit")], ["flags", s("config.section.flags")],
    // Polish batch 2 (UX-30): no menu item for a section that does not exist yet
    ["intelligence", s("config.section.intelligence")],
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
        <SesiSaya locale={await currentLocale()} persona="staff" viewer={viewer} peran={peran} />
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
        {bolehPendataan ? <Link href="/pendataan" className={tautanTempat}>{s("pendataan.judul")}<TandaTautan /></Link> : null}
        <Link href="/aktivasi" className={tautanTempat}>{s("nav.aktivasi")}<TandaTautan /></Link>
        <Link href="/studio" className={tautanTempat}>{s("nav.studio")}<TandaTautan /></Link>
        <TabTempat
          tempat={tempatDariPeran(peran)}
          kecuali={["/konfigurasi"]}
          locale={await currentLocale()}
          persona="staff"
          kelas={tautanTempat}
        />
      </nav>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <KartuKesehatan locale={await currentLocale()} keadaan={kesehatan} kelas={card} tautan={tautanTempat} />
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
          {/* DAISY-05 (D-006, D-022). Struktur sekolah: first, because a new
              school cannot place a student or assign a teacher until it has a
              Kelas, and until now nothing here could make one. */}
          <section id="struktur" className={card}>
            <h2 className="font-medium">{sl("config.section.struktur")}</h2>
            {sekolahStruktur && struktur ? (
              <>
                <p className="mt-1 text-sm text-ink-2">{sl("config.struktur.intro")}</p>
                {sekolahKu.length > 1 ? (
                  <nav className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" aria-label={sl("config.struktur.sekolah")}>
                    <span className="text-ink-3">{sl("config.struktur.sekolah")}</span>
                    {sekolahKu.map((i) => (
                      <a
                        key={i.id}
                        href={`?sekolah=${i.id}#struktur`}
                        aria-current={i.id === sekolahStruktur.id ? "page" : undefined}
                        className={
                          i.id === sekolahStruktur.id
                            ? "rounded-[var(--radius-pill)] bg-surface-2 px-3 py-1 font-medium text-ink-1 no-underline"
                            : tautanTempat
                        }
                      >
                        {i.name}
                      </a>
                    ))}
                  </nav>
                ) : (
                  <p className="mt-3 text-sm text-ink-2">
                    {sl("config.struktur.sekolah")}: <span className="font-medium text-ink-1">{sekolahStruktur.name}</span>
                  </p>
                )}
                <div className="mt-4">
                  <PanelStruktur
                    key={sekolahStruktur.id}
                    locale={locale}
                    institusi={sekolahStruktur.id}
                    rows={struktur.ok ? struktur.rows : null}
                    gagalBaca={struktur.ok ? null : { code: struktur.code, ref: struktur.ref }}
                    tahunKini={tahunAjaranPada(new Date())}
                  />
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-3">{sl("config.struktur.tanpa_sekolah")}</p>
            )}
          </section>

          {/* J3.2 (ADM-02, P1). PERSIAPAN SEKOLAH: what is done and what remains
              at the school shown, each with the place it is done, right after
              the structure that comes first (DAISY-05). Read only;
              the facts are the structure, its placements and its roles, as
              this reader already sees them. */}
          {sekolahStruktur && persiapan ? (
            <section id="persiapan" className={card} aria-labelledby="pin-persiapan">
              <h2 id="pin-persiapan" className="font-medium">{sl("config.persiapan.judul")}</h2>
              <p className="mt-1 text-sm text-ink-2">{sl("config.persiapan.arti")}</p>
              <ul className="mt-3 grid gap-2 text-sm">
                {persiapan.map((l) => (
                  <li key={l.kunci} data-langkah={l.kunci} data-selesai={l.selesai ? "ya" : "belum"}
                    className="grid gap-1 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
                    <span className="text-ink-1">
                      <strong>{sl(l.selesai ? "config.persiapan.sudah" : "config.persiapan.belum")}</strong>
                      {" · "}{sl(`config.persiapan.${l.kunci}` as HleEvent)}
                      {l.kunci !== "guru" ? <> · <span className="pin-num">{l.jumlah}</span></> : null}
                    </span>
                    {l.kunci === "guru" && l.tanpaGuru.length > 0 ? (
                      <span className="text-ink-2">{sl("config.persiapan.guru.kurang")} {l.tanpaGuru.join(", ")}</span>
                    ) : null}
                    {/* the way to each step: the section on this page, or for students
                        Pendataan, whose one link is in the places above (DAISY-17) */}
                    {!l.selesai ? (
                      l.kunci === "murid" ? (
                        <span className="text-ink-2">{sl("config.persiapan.murid.cara")}</span>
                      ) : (
                        <a href={l.kunci === "guru" ? "#roles" : "#struktur"} className={tautanTempat}>{sl(`config.persiapan.${l.kunci}.cara` as HleEvent)}</a>
                      )
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* D-088(b), BOB-49 / DAISY-38. BATAS KETUNTASAN: each lesson the school can give, with its pass mark or
              «Batas ketuntasan belum ditetapkan», its history, and a form to set it. A teacher cannot give a lesson
              to a class until its mark is set; a change applies to what is given afterwards. set_school_pass_mark
              decides who may set it (the school's admin), keeps every change and audits it. */}
          <section id="ketuntasan" className={card} aria-labelledby="pin-ketuntasan">
            <h2 id="pin-ketuntasan" className="font-medium">{sl("config.section.ketuntasan")}</h2>
            {sekolahStruktur ? (
              <>
                <p className="mt-1 text-sm text-ink-2">{sl("config.ketuntasan.arti")}</p>
                {ketuntasan && ketuntasan.length > 0 ? (
                  <ul className="mt-3 grid gap-2 text-sm">
                    {ketuntasan.map((p) => (
                      <li key={p.course_id} data-pelajaran={p.course_id} className="grid gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
                        <span className="text-ink-1">
                          <strong>{p.title}</strong> · {p.subject} · {p.grade_label}
                          {p.canonical ? <> · <span className="text-ink-3">{sl("config.ketuntasan.materi_pintar")}</span></> : null}
                        </span>
                        <span className="pin-batas text-ink-2">
                          {p.percent === null
                            ? sl("config.ketuntasan.belum")
                            : <>{sl("config.ketuntasan.sekarang")} <span className="pin-num">{format.percent(p.percent / 100, locale)}</span></>}
                        </span>
                        <form action={tetapkanBatasAction} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="sekolah" value={sekolahStruktur.id} />
                          <input type="hidden" name="pelajaran" value={p.course_id} />
                          <label className={label}>{sl("config.ketuntasan.nilai")}
                            <input name="persen" type="number" inputMode="numeric" min={0} max={100} step={1} required
                              defaultValue={p.percent ?? undefined} className={`${field} w-24`} />
                          </label>
                          <label className={label}>{sl("config.ketuntasan.alasan")}
                            <input name="alasan" type="text" required maxLength={300} placeholder={sl("config.ketuntasan.alasan_contoh")} className={field} />
                          </label>
                          <TombolKirim className={button} sibuk={s("tombol.memproses")}>{sl("config.ketuntasan.tombol")}</TombolKirim>
                        </form>
                        {p.history.length > 0 ? (
                          <details>
                            <summary className="cursor-pointer text-ink-3">{sl("config.ketuntasan.riwayat")}</summary>
                            <ul className="mt-1 grid gap-1 text-ink-2">
                              {p.history.map((h, i) => (
                                <li key={`${h.set_at}-${i}`}>
                                  <span className="pin-num">{format.percent(h.percent / 100, locale)}</span>
                                  {" · "}{format.date(h.set_at, locale)}
                                  {h.set_by ? <> · {sl("config.ketuntasan.oleh")} {h.set_by}</> : null}
                                  {" · "}{h.reason}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-ink-3">{sl("config.ketuntasan.kosong")}</p>
                )}
                {result("ketuntasan")}
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-3">{sl("config.struktur.tanpa_sekolah")}</p>
            )}
          </section>

          {/* D-085 M9 (J3.12, ADM-J13). PINDAH KELAS: the administrator opens
              the Kelas a student is in, finds them, and moves them to another
              Kelas of the same year. move_learner_to_class decides each move
              again as this administrator, in one transaction; what was done in
              the old Kelas stays recorded there. */}
          <section id="pindah" className={card}>
            <h2 className="font-medium">{sl("config.section.pindah")}</h2>
            {sekolahStruktur && struktur ? (
              <>
                <p className="mt-1 text-sm text-ink-2">{sl("config.pindah.arti")}</p>
                {asal.kelas.length > 0 ? (
                  <form method="get" action="/konfigurasi#pindah" className="mt-3 flex flex-wrap items-end gap-2">
                    {sekolahKu.length > 1 ? <input type="hidden" name="sekolah" value={sekolahStruktur.id} /> : null}
                    <label className={label}>{sl("config.pindah.dari")}
                      <select id="pin-pindah-dari" name="dari" className={field} required defaultValue={kelasDari?.node_id ?? ""}>
                        <option value="" disabled>—</option>
                        <optgroup label={sl("config.pindah.grup_kelas")}>
                          {asal.kelas.map((k) => <option key={k.node_id} value={k.node_id}>{namaKelas(k)}</option>)}
                        </optgroup>
                        {asal.tingkat.length > 0 ? (
                          <optgroup label={sl("config.pindah.grup_tingkat")}>
                            {asal.tingkat.map((k) => <option key={k.node_id} value={k.node_id}>{namaKelas(k)}</option>)}
                          </optgroup>
                        ) : null}
                      </select>
                    </label>
                    <button type="submit" className={button}>{sl("config.pindah.lihat")}</button>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-ink-3">{sl("config.pindah.tanpa_kelas")}</p>
                )}
                {kelasDari ? (
                  <div className="mt-3 grid gap-2">
                    <p className="text-sm font-medium text-ink-1">{namaKelas(kelasDari)}</p>
                    {tujuan.length === 0 ? <p className="text-sm text-ink-3">{sl("config.pindah.tanpa_tujuan")}</p> : null}
                    {muridDari.length > 0 ? (
                      <ul className="grid gap-1 text-sm text-ink-2">
                        {muridDari.map((m) => (
                          <li key={m.penempatan} className="grid gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
                            <span className="text-ink-1">{m.nama}</span>
                            {tujuan.length > 0 ? (
                              <form action={pindahKelasAction} className="flex flex-wrap items-center gap-2">
                                <input type="hidden" name="penempatan" value={m.penempatan} />
                                <input type="hidden" name="dari" value={kelasDari.node_id} />
                                <input type="hidden" name="sekolah" value={sekolahStruktur.id} />
                                <select name="kelas" className={field} required defaultValue="" aria-label={`${m.nama}: ${sl("config.pindah.ke")}`}>
                                  <option value="" disabled>{sl("config.pindah.ke")}</option>
                                  {tujuan.map((k) => <option key={k.node_id} value={k.node_id}>{namaKelas(k)}</option>)}
                                </select>
                                <TombolKirim className={button} sibuk={s("tombol.memproses")}>{sl("config.pindah.tombol")}</TombolKirim>
                              </form>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-ink-3">{sl("config.pindah.kosong")}</p>
                    )}
                  </div>
                ) : null}
                {result("pindah")}
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-3">{sl("config.struktur.tanpa_sekolah")}</p>
            )}
          </section>

          {/* DAISY-07 (B6b). THE SCHOOL'S REPORTS, one click away. BOB-06 gave
              every school PINTAR's standard class and school reports; nothing
              linked to them, so an administrator had to type an id. The school
              summary is read at the school's own root node and each class's at
              that class, for the school chosen above. A link decides nothing:
              generate_report decides every figure for this reader. */}
          <section id="laporan" className={card}>
            <h2 className="font-medium">{sl("config.laporan.judul")}</h2>
            {sekolahStruktur ? (
              <>
                <p className="mt-1 text-sm text-ink-2">{sl("config.laporan.arti")}</p>
                <nav className="mt-3 grid gap-2 text-sm" aria-label={sl("config.laporan.judul")}>
                  {akar ? (
                    <Link href={`/dekan/ringkasan?simpul=${(akar as { id: string }).id}`} className={tautanTempat}>
                      {sl("config.laporan.sekolah")} · {sekolahStruktur.name}
                      <TandaTautan />
                    </Link>
                  ) : null}
                  <span className="text-ink-3">{sl("config.laporan.kelas")}</span>
                  {kelasAktif.length > 0 ? (
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {kelasAktif.map((k) => (
                        <li key={k.node_id}>
                          <Link href={`/edukator/ringkasan?kelas=${k.node_id}`} className={tautanTempat}>
                            {k.name}{k.academic_year ? ` (${k.academic_year})` : ""}
                            <TandaTautan />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-ink-3">{sl("config.laporan.tanpa_kelas")}</p>
                  )}
                </nav>
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-3">{sl("config.struktur.tanpa_sekolah")}</p>
            )}
          </section>

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
                  <div><TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("config.action.rollover")}</TombolKirim></div>
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
                        <form action={transferAuthorizeAction}><input type="hidden" name="transfer" value={x.id} /><TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("config.action.authorize")}</TombolKirim></form>
                      )}
                      {x.status === "AUTHORIZED" && (
                        <form action={transferExecuteAction}><input type="hidden" name="transfer" value={x.id} /><TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("config.action.execute")}</TombolKirim></form>
                      )}
                      <form action={transferRejectAction} className="flex gap-1">
                        <input type="hidden" name="transfer" value={x.id} />
                        <input name="reason" className={field} placeholder={s("config.label.reason")} />
                        <TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("config.action.reject")}</TombolKirim>
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
              <div><TombolKirim className={button} sibuk={s("tombol.mengirim")}>{s("config.action.request_transfer")}</TombolKirim></div>
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
                    <form action={revokeRoleAction}><input type="hidden" name="assignment" value={a.id} /><TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("config.action.revoke")}</TombolKirim></form>
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
              <div><TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("config.action.grant")}</TombolKirim></div>
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
                    <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("config.action.save")}</TombolKirim>
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
                <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("config.action.save")}</TombolKirim>
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
                <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("laporan.templat.simpan")}</TombolKirim>
              </form>
            )}
            {result("intelligence")}
          </section>
        </div>
      </div>
    </main>
  );
}

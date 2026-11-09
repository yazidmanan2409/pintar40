import Link from "next/link";
import Kosong from "@/components/Kosong";
import TandaTautan from "@/components/TandaTautan";
import Ikon from "@/components/Ikon";
import { t, format, allKeys, hariIniSekolah, type HleEvent } from "@/lib/hle";
import { zonaSekolah } from "@/lib/zona-sekolah";
import { zonaSah, ZONA_SEKOLAH } from "@/lib/hle";
import Penomoran, { UKURAN, halamanDiminta, rentang, satuHalaman, tautanHalaman } from "@/components/koleksi/Penomoran";

// L4 (CR-88): the audit trail's page is the newest 50, the size CR-39 (J1.6) reads; other staff lists are 20 a page
const UKURAN_JEJAK = 50;
/** W2.17: the people pickers offer at most this many, the newest or those a name search finds. */
const UKURAN_ORANG = 50;
import { asalHasil, kalimatHasil, rujukan } from "@/lib/galat-kontrak";
import { nilaiSkema } from "@/lib/kesehatan-skema";
import KartuKesehatan, { type KeadaanKesehatan } from "@/components/konfigurasi/KartuKesehatan";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import {
  daftarkanPesertaAction, grantRoleAction, hentikanSekarangAction, jadwalkanPemeliharaanAction, pindahKelasAction,
  akhiriPendaftaranAction, daftarkanKembaliAction, revokeRoleAction, saveReportTemplateAction, tarikPengumumanAction, terbitkanPengumumanAction,
  tetapkanBatasAction, transferAuthorizeAction, transferExecuteAction, transferRejectAction, transferRequestAction,
  tunjukAdminPertamaAction, ubahPemeliharaanAction, tempatkanMuridAction, aturZonaWaktuAction } from "./actions";
import { adaAdminSekolah, calonAdminPertama } from "@/lib/admin-pertama";
import { pelajaranDanBatas } from "@/lib/batas-ketuntasan";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { currentLocale } from "@/lib/locale";
import TabTempat, { tempatDariPeran } from "@/components/TabTempat";
import { navKonteks } from "@/components/NavKonteks";
import { CangkangStaf } from "@/components/CangkangPengalaman";
import ItemNav from "@/components/ItemNav";
import { alasanAudit, kataAksiAudit, kataTabelAudit } from "@/lib/jejak-audit";
import { konteksHalaman } from "@/lib/konteks-server";
import { melayani } from "@/lib/konteks";
import { redirect } from "next/navigation";
import { KELOMPOK_KONFIGURASI, adalahBagian, alamatBagian, bagianDariParameter } from "@/lib/bagian-konfigurasi";
import TerusBagian from "@/components/konfigurasi/TerusBagian";
import { peranSaya } from "@/lib/tur-negara";
import { bacaStruktur } from "@/lib/struktur";
import { tahunAjaranPada } from "@/lib/struktur-kontrak";
import PanelStruktur from "@/components/struktur/PanelStruktur";
import TombolKirim from "@/components/TombolKirim";
import TanggalDenganGema from "@/components/bentuk/TanggalDenganGema";
import { tanggal, type BentukTanggal } from "@/lib/tanggal";
import BarisHasil from "@/components/BarisHasil";
import { sekolahPendataan } from "@/lib/pendataan";
import { sekolahDipilih, sekolahDitawarkan } from "@/components/sekolah";
import { asalPindah, muridDiKelas, namaKelas, tujuanPindah } from "@/lib/pindah-kelas";
import { jumlahAdminSekolah, persiapanSekolah, type PeranTerbaca } from "@/lib/persiapan-sekolah";
import { lingkupPeran } from "@/lib/lingkup-peran";
import { alamatCatatan, formulirPeserta, tempatCatatan } from "@/lib/pengembangan";
import { kunciKodeLaporan, kunciStatusLaporan, langkahBerikut, laporanTriase, type KodeLaporan } from "@/lib/lapor-masalah";
import { pindahkanLaporanAksi } from "@/app/lapor/actions";
import { daftarKelola, KONFIRMASI_HENTIKAN, waktuWib } from "@/lib/pemeliharaan";
import { judulHalaman } from "@/lib/judul-halaman";
import { transferMintaAction, transferTerimaAction } from "./actions";
import KonfirmasiBahaya from "@/components/KonfirmasiBahaya";
import KenaikanKelas, { type ParamKenaikan } from "@/components/kenaikan/KenaikanKelas";

/** E3 «Akhiri pendaftaran»: the reasons a school records here (akhiri_pendaftaran's list; Daisy's, owner-approved). */
const ALASAN_AKHIRI = ["GRADUATED", "WITHDRAWN", "TRANSFER_EXTERNAL", "MOVED_ABROAD", "DECEASED", "OTHER"] as const;

export const generateMetadata = judulHalaman("/konfigurasi");

/**
 * Super Admin & Configuration Studio — shell (FABLE-01 §10).
 * Gated server-side by the database's own authority (role assignments via
 * RLS/RPC), never by the display role alone. A lower role receives a clean,
 * calm refusal — never a broken partial render. Panels for later phases are
 * empty placeholders; nothing is faked into them.
 *
 * Phase-1 surfaces wired here call only RPCs and tables that already exist:
 * period rollover, transfer request/authorize/execute/reject (policy hooks
 * only — OD-9), role grant/revoke and the audit reader. Every read is the
 * signed-in user's own RLS view.
 *
 * D-093 O3 (owner ruling, 3 Oct): no control here claims an operational change
 * PINTAR does not enforce. «Mode pemeliharaan», «Kunci pendaftaran» and the
 * feature-flag form were saved and audited but read by nothing, so they are
 * gone from this page. Their tables stay; #148 builds the real maintenance
 * control when its behaviour exists.
 */

const s = (event: HleEvent) => t(event, "staff");
const short = (id: string | null | undefined) => (id ? id.slice(0, 8) : "—");
// L4 (CR-85, investigation §E item 15): a name this reader cannot resolve shows the dash, never a fragment of an id
const TANPA_NAMA = "\u2014";
// FD-4: each person's name travels with the row that names them (the foreign key says which person)
const KOLOM_PINDAH = "id, person_id, from_institution_id, to_institution_id, status, reason, created_at, requested_by_institution, to_academic_period_id, persons!transfers_person_id_fkey(display_name)";
/** L4 finding 6: roles drawn a page at a time (the size the audit trail uses) */
const UKURAN_PERAN = 50;
const KOLOM_PERAN = "id, person_id, role, scope_node_id, institution_id, valid_until, revoked_at, persons!role_assignments_person_id_fkey(display_name)";
const namaDari = (v: unknown): string | null => {
  const o = (Array.isArray(v) ? v[0] : v) as { display_name?: unknown } | null | undefined;
  return typeof o?.display_name === "string" ? o.display_name : null;
};
const tautanTempat = "text-ink-2 underline underline-offset-4 hover:text-ink-1";
const roleLabel = (r: string) => (["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"].includes(r) ? s(`role.${r}` as HleEvent) : TANPA_NAMA);
const transferLabel = (st: string) => (["REQUESTED", "AUTHORIZED", "EXECUTED", "REJECTED", "CANCELLED"].includes(st) ? s(`transfer.${st}` as HleEvent) : TANPA_NAMA);

const card = "rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4";
const field = "pin-input"; // D-138 step 4d/4f: the v3 Field (44 px, the 3:1 outline), not a Tailwind look-alike
const button = "pin-btn justify-self-start"; // D-138 step 4d/4f: the v3 Button (44 px, its states), at its own width in a grid
// D-140 (review RV-17): one primary action per form (its own verb), and the platform's emergency stop drawn as
// destructive; every other action (look, check, withdraw, refuse, revoke) stays the secondary Button
const primer = "pin-btn pin-primary justify-self-start";
const bahaya = "pin-btn pin-str-bahaya justify-self-start";
const label = "grid gap-1 text-sm text-ink-2";

/** The three reports PINTAR defines. The table's own CHECK is the authority. */
const STANDARD_REPORTS = ["class_learning_intelligence", "institution_learning_intelligence", "learner_result"] as const;
/** The report titles a template may carry, chosen by their words (D-140(c)). */
const JUDUL_LAPORAN = ["laporan.institusi.judul", "laporan.kelas.judul"] as const;
/** A standard report's or a visualization's words; an unknown value says nothing rather than its code. */
const kataLaporan = (jenis: "standar" | "tampilan", v: string) =>
  allKeys().includes(`laporan.${jenis}.${v}` as HleEvent) ? s(`laporan.${jenis}.${v}` as HleEvent) : TANPA_NAMA;

type MetricDefinition = {
  metric_id: string;
  label_key: string;
  scope: string;
  allowed_visualizations: string[];
  deprecated: boolean;
};

type SearchParams = Promise<{
  bagian?: string; hasil?: string; kode?: string; ref?: string; n?: string; sekolah?: string; periksa?: string; dari?: string; lapor?: string;
  /** E-K4: the report row a move answers (checked against the rows on this page). */
  baris?: string;
  // W2.15 (F-10): the directory search, a plain GET
  cari_sekolah?: string;
  cari_orang?: string;
  // #148: the first step of scheduling, asked by a plain GET so the second step can show what the window would meet
  pm_cek?: string; pm_platform?: string; pm_sekolah?: string | string[]; pm_mulai?: string; pm_selesai?: string;
  // D-101 (2): «Admin sekolah» named on Peran & akses, waiting for its second press
  angkat?: string; lingkup?: string; sampai?: string; pertama?: string;
  /** B1: the record whose one action is open in place (its row shows its short form), one at a time. */
  ubah?: string;
  // L4 (CR-88): the page of each bounded list
  hal_pindah?: string; hal_jejak?: string; hal_peran?: string; hal_sekolah?: string; hal_lapor?: string;
  hal_jendela?: string; hal_pengumuman?: string;
  /** E-K4: which form of a section sent the result (asalHasil validates it). */
  asal?: string;
  /** E3: the learner's row whose «Akhiri pendaftaran» panel is open. */
  akhiri?: string;
} & ParamKenaikan>;

export default async function Konfigurasi({ searchParams, params }: { searchParams: SearchParams; params?: Promise<{ bagian?: string }> }) {
  // One parallel read of the viewer and their roles (DAISY-02/03).
  const [viewer, peran] = await Promise.all([currentViewer(), peranSaya()]);
  const supabase = await supabaseServer();
  const sp = await searchParams;
  // B1 (D-166(a)): the index (/konfigurasi) or one section's page (/konfigurasi/<section>), the same page drawn either
  // way. E-B1-1: an older address naming a section (`?bagian=…`, every action's result before B1) goes to its page
  // with every parameter it carried; a page for no section goes to the index.
  const bagianDiminta = params ? (await params).bagian ?? null : null;
  if (bagianDiminta !== null && !adalahBagian(bagianDiminta)) redirect("/konfigurasi");
  const bagianIni = bagianDiminta && adalahBagian(bagianDiminta) ? bagianDiminta : null;
  const keBagian = bagianIni === null ? bagianDariParameter(sp) : null;
  if (keBagian !== null) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v === undefined ? [] : [v]) q.append(k, x);
    redirect(alamatBagian(keBagian, q));
  }
  const jalanIni = bagianIni ? alamatBagian(bagianIni) : "/konfigurasi";

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
        backKey="galat.beranda"
      />
    );
  }

  // L3 (CR-83; D-127 Q2, Q11; D-132 C7): KONFIGURASI IS THE WORKING CONTEXT'S. Mengelola · a school: that school's
  // structure, people, roles, reports and audit, and nothing of another, whoever the reader is (an Admin platform
  // included: platform-wide authority does not imply platform-wide presentation). Mengelola · «Seluruh platform»: the
  // deliberately platform-wide parts alone (the system check, platform maintenance, the platform's audit, every
  // school's problem reports, Admin platform's own grants); the school-shaped sections are not drawn. The gate above
  // is unchanged and the database decides every act. An evaluation persona keeps the page as it was (C10).
  const kh = await konteksHalaman();
  const lama = kh === "TANPA_KONTEKS";
  const platformKonteks = !lama && kh?.platform === true;
  const platformIni = lama ? isSys === true : platformKonteks && isSys === true;
  const sekolahIni: string[] = lama ? adminInstitutionIds : kh && !kh.platform && kh.tempat ? [kh.tempat] : [];
  const dikelola = (id: string) => (lama && isSys === true) || sekolahIni.includes(id);
  const satuSekolah = !lama && sekolahIni.length === 1 ? sekolahIni[0] : null;
  const adminPlatformDiSekolah = !lama && isSys === true && kh !== null && !kh.platform && kh.peran.includes("SYSTEM_ADMIN");

  // A school administrator's enrolments and audit trail are their own schools'. The policies return exactly those
  // rows (has_scope('INSTITUTION_ADMIN', ...) holds only for a school the viewer administers), but asked without the
  // schools named the database checks the policy on every row of every school, and the cost grows with the whole
  // platform's history. Named, it reads the (institution_id, ...) indexes. Measured as gs-001's administrator on
  // staging (whole-system efficiency audit, 2 Oct): the audit trail 1,979 ms -> 15 ms, the enrolments 490 -> 6 ms,
  // the same rows. The platform administrator's reads are unchanged.
  // BOB-45: member_kind (a computed field) says whether an enrolment is a learner's or a professional-learning
  // participant's; the transfer picker lists learners' only
  //
  // FD-4 (CR-89): NOTHING HERE GROWS WITH THE PLATFORM. A school's context reads that school's rows; «Seluruh platform»
  // reads no school-shaped rows at all (it draws no school-shaped section); only an evaluation persona keeps the
  // platform-wide reads it had (C10). And each person's name comes back WITH the row that names them, under the same
  // row security as before, instead of a second request listing every id, whose address outgrew what the server
  // accepts at platform scale (staging's 400s, and every name an 8-character fragment).
  const semuaSekolah = lama && isSys === true;
  const halSekolah = halamanDiminta(sp.hal_sekolah);
  const halLapor = halamanDiminta(sp.hal_lapor);
  const halJendela = halamanDiminta(sp.hal_jendela);
  const halPengumuman = halamanDiminta(sp.hal_pengumuman);
  const tanpaBaris = Promise.resolve({ data: [] as never[] });
  // W2.17 (FD-4 at 10× staging): the enrolments the two people pickers offer are a page of at most UKURAN_ORANG, the
  // newest, or those whose name holds what was searched (cari_orang), read by school_people_page (migration
  // 20261230100000). Through the enrolments policy, which runs on every enrolment a school ever had before ACTIVE can
  // prune, a school of 13,300 ran past the statement timeout even for a page of 50, and the page drew both pickers empty.
  const cariOrang = typeof sp.cari_orang === "string" ? sp.cari_orang.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  const enrolmen = (sekolah: string[] | null) => supabase
    .rpc("school_people_page", { p_institutions: sekolah, p_search: cariOrang.length >= 2 ? cariOrang : null, p_limit: UKURAN_ORANG })
    .then(({ data, error }) => ({
      error,
      data: ((data ?? []) as Array<{ id: string; person_id: string; institution_id: string; academic_period_id: string;
        status: string; member_kind: string; display_name: string }>)
        .map(({ display_name, ...e }) => ({ ...e, persons: { display_name } })),
    }));
  const jejak = supabase.from("audit_log").select("id, at, action, target_table, target_id, institution_id, build_sha, actor_person_id, summary");

  const [
    { data: institutionsDibaca }, { data: periodsDibaca }, { data: nodes }, { data: enrollments }, { data: transfers },
    { data: assignments }, { data: audit }, { data: lint, error: lintError }, { data: env },
    { data: awaiting }, [{ data: reportTemplates }, { data: templateMetrics }, { data: metricDefs }],
  ] = await Promise.all([
    satuSekolah
      ? supabase.from("institutions").select("id, name, slug, is_synthetic, is_active, tenant_kind, zona_waktu").eq("id", satuSekolah)
      // W2.10 (Batch 4; CR-49, CAP-10): «Seluruh platform» lists the schools a page at a time, never every school at once
      : platformKonteks
        ? supabase.from("institutions").select("id, name, slug, is_synthetic, is_active, tenant_kind, zona_waktu").order("name").order("id")
            .range(...rentang(halSekolah))
        : supabase.from("institutions").select("id, name, slug, is_synthetic, is_active, tenant_kind, zona_waktu").order("name"),
    satuSekolah
      ? supabase.from("academic_periods").select("id, institution_id, name, starts_on, ends_on").eq("institution_id", satuSekolah).order("starts_on")
      // W2.10: in «Seluruh platform» the school years of the page's schools alone, read below
      : platformKonteks
        ? tanpaBaris
        : supabase.from("academic_periods").select("id, institution_id, name, starts_on, ends_on").order("starts_on"),
    satuSekolah
      ? supabase.from("org_nodes").select("id, institution_id, kind, name, academic_period_id, is_active, jalur").eq("institution_id", satuSekolah).order("name")
      : platformKonteks
        ? tanpaBaris
        : supabase.from("org_nodes").select("id, institution_id, kind, name, academic_period_id, is_active, jalur").order("name"),
    semuaSekolah ? enrolmen(null) : sekolahIni.length > 0 ? enrolmen(sekolahIni) : tanpaBaris,
    satuSekolah
      ? supabase.from("transfers").select(KOLOM_PINDAH)
          .or(`from_institution_id.eq.${satuSekolah},to_institution_id.eq.${satuSekolah}`).order("created_at", { ascending: false }).limit(50)
      : platformKonteks
        ? tanpaBaris
        : supabase.from("transfers").select(KOLOM_PINDAH).order("created_at", { ascending: false }).limit(50),
    (satuSekolah
      ? supabase.from("role_assignments").select(KOLOM_PERAN).eq("institution_id", satuSekolah)
      : platformKonteks
        ? supabase.from("role_assignments").select(KOLOM_PERAN).eq("role", "SYSTEM_ADMIN")
        : supabase.from("role_assignments").select(KOLOM_PERAN))
      // L4 finding 6: a stable order (id breaks a tie in created_at), so a page boundary never repeats or drops a role
      .is("revoked_at", null).order("created_at", { ascending: false }).order("id"),
    // L4 (CR-88): one page of the trail at a time, the newest first, never a fixed 50 with no way past them
    // (the newest 50 a page, as CR-39 / J1.6 has read them since the audit reader was built; then the next 50)
    // W6.2 (U-PERF, staging 5 Nov): since B1 only «Jejak audit»'s own page draws the trail, so only that page reads it.
    // Read on every render, it was the slowest request of every Konfigurasi page (2,271 ms for the synthetic school's
    // admin, journey run 42105894283), and the reads after the batch waited for it
    bagianIni !== "audit"
      ? tanpaBaris
      // and one school is named with eq, not in: PostgREST sends a prepared statement, and its generic plan for
      // `institution_id = any($1)` cannot use (institution_id, at desc)'s order, so it read all 6,386 of the school's rows,
      // the row policy on each, to keep 51 (2,538 ms); `= $1` stops at the page (21 ms). Read-only EXPLAIN, staging
      : (platformIni ? jejak : satuSekolah ? jejak.eq("institution_id", satuSekolah) : jejak.in("institution_id", sekolahIni))
          .order("at", { ascending: false }).order("id")
          .range(...rentang(halamanDiminta(sp.hal_jejak), UKURAN_JEJAK)),
    // BOB-18 (D-046): the schema lint runs when an operator asks for it, never
    // on an ordinary load -- it reads the whole catalogue, and every sign-in of
    // the platform admin lands here.
    platformIni && sp.periksa === "skema" ? supabase.rpc("platform_schema_lint") : Promise.resolve({ data: null, error: null }),
    platformIni ? supabase.from("platform_environment").select("environment").maybeSingle() : Promise.resolve({ data: null }),
    // FINAL DELTA 2. The people the three sources above cannot reach: no active
    // role, no enrolment, no transfer. The platform administrator asks the
    // platform's list, which refuses everyone else (the school administrator's
    // asking was 338 refusals in U-PERF's 30-session run on staging).
    // BOB-20 (D-048): a school administrator asks each school they administer
    // for its own list -- the people it has recorded who hold nothing there
    // yet, such as a newly recorded teacher. The database decides again who
    // may ask; a school it refuses simply adds nobody.
    // BOB19-K01 (the owner's ruling, 8 Oct, Option B): a school's context never shows the platform's list; its first
    // administrator is appointed by «Menunjuk admin sekolah pertama» below, the one exception (src/lib/admin-pertama.ts)
    Promise.all([
      platformIni ? supabase.rpc("persons_awaiting_first_role") : Promise.resolve({ data: [] }),
      ...(platformIni ? [] : sekolahIni.map((sekolah) => supabase.rpc("persons_awaiting_first_role_at", { p_institution: sekolah }))),
    ]).then((jawaban) => ({ data: jawaban.flatMap((j) => (j.data ?? []) as Array<{ person_id: string; display_name: string }>) })),
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

  // W2.10: one page of schools in «Seluruh platform» (one row more was read, so the next page's existence is known), and
  // the school years of those schools alone
  const lagiSekolah = platformKonteks && (institutionsDibaca ?? []).length > UKURAN;
  const institutions = platformKonteks ? (institutionsDibaca ?? []).slice(0, UKURAN) : institutionsDibaca;
  const { data: periodsHalaman } = platformKonteks && (institutions ?? []).length > 0
    ? await supabase.from("academic_periods").select("id, institution_id, name, starts_on, ends_on")
        .in("institution_id", (institutions ?? []).map((i) => i.id)).order("starts_on")
    : { data: null };
  const periods = platformKonteks ? (periodsHalaman ?? []) : periodsDibaca;

  // DAISY-05. The school whose structure is shown: an active, real school the
  // reader administers -- never the national library, whose name sorts first
  // (audit S7b) -- the one asked for if it is on offer, else the first. Its
  // read starts now and runs beside the reads below; `school_structure`
  // decides again who may see it.
  const sekolahKu = sekolahDitawarkan(institutions ?? [], dikelola);
  const sekolahStruktur = sekolahDipilih(sekolahKu, sp.sekolah);
  const bacaanStruktur = sekolahStruktur ? bacaStruktur(sekolahStruktur.id) : Promise.resolve(null);
  // DAISY-07 (B6b): the school's own root node, for its school summary
  const bacaanAkar = sekolahStruktur
    ? supabase.from("org_nodes").select("id").eq("institution_id", sekolahStruktur.id).eq("kind", "INSTITUTION").limit(1).maybeSingle()
    : Promise.resolve({ data: null });

  const awaitingPersons = Array.from(new Map(((awaiting ?? []) as Array<{ person_id: string; display_name: string }>)
    .map((p) => [p.person_id, p])).values());

  // Names for the people this viewer may see (RLS decides who that is), each read with its row (FD-4)
  const persons = Array.from(new Map([...(enrollments ?? []), ...(transfers ?? []), ...(assignments ?? [])]
    .map((r) => [String(r.person_id), namaDari(r.persons)] as const)
    .filter((x): x is readonly [string, string] => typeof x[1] === "string")).entries())
    .map(([id, display_name]) => ({ id, display_name }));
  const personName = new Map(persons.map((p) => [p.id, p.display_name]));
  // L4 (the Second Eye's finding 5): the transfers LIST is its own read, a page at a time, so every transfer is reachable;
  // the newest 50 read above still feed the people the roles form knows, as before.
  // Each listed transfer names its person from its own row and its schools from the read below (the re-review's N1)
  const halPindah = halamanDiminta(sp.hal_pindah);
  const { data: pindahHalaman } = satuSekolah
    ? await supabase.from("transfers").select(KOLOM_PINDAH)
        .or(`from_institution_id.eq.${satuSekolah},to_institution_id.eq.${satuSekolah}`).order("created_at", { ascending: false }).order("id")
        .range(...rentang(halPindah))
    : platformKonteks
      ? { data: [] as NonNullable<typeof transfers> }
      : await supabase.from("transfers").select(KOLOM_PINDAH).order("created_at", { ascending: false }).order("id").range(...rentang(halPindah));
  const daftarPindah = (pindahHalaman ?? []).slice(0, UKURAN);
  // W2.15 (Batch 4, F-10 / D-152(c)): in a school's context the destination is found in the directory by its exact name
  // or code (cari_sekolah_tujuan: name and code only, every search audited), and the school's incoming requests are
  // accepted into one of its own school years (pindah_masuk, transfer_terima)
  const cariSekolah = typeof sp.cari_sekolah === "string" ? sp.cari_sekolah.trim().slice(0, 120) : "";
  const { data: sekolahDitemukan, error: galatCari } = satuSekolah && cariSekolah
    ? await supabase.rpc("cari_sekolah_tujuan", { p_kata: cariSekolah })
    : { data: null, error: null };
  const tujuanDitemukan = ((Array.isArray(sekolahDitemukan) ? sekolahDitemukan : []) as Array<{ institution_id: string; nama: string; kode: string | null }>)
    .filter((x) => x.institution_id !== satuSekolah);
  const { data: masukData } = satuSekolah ? await supabase.rpc("pindah_masuk", { p_sekolah: satuSekolah }) : { data: null };
  const masukSemua = (Array.isArray(masukData) ? masukData : []) as Array<{
    transfer_id: string; nama_murid: string; dari_sekolah: string; dari_kode: string | null; alasan: string | null; diminta_pada: string;
    keadaan: string;
  }>;
  // the requests to accept; and, for every incoming transfer, the learner's name the receiving school may read before
  // the transfer is executed (pindah_masuk), so an accepted transfer is executed by name, never as «—»
  const pindahMasuk = masukSemua.filter((m) => m.keadaan === "REQUESTED");
  const namaMasuk = new Map(masukSemua.map((m) => [m.transfer_id, m.nama_murid] as const));
  const lagiPindah = (pindahHalaman ?? []).length > UKURAN;
  // L4 finding 6 (CR-88): Peran & akses draws one page of roles, each with its revoke form; the read stays whole,
  // because the school's readiness and its count of admins below are taken from every active role
  const halPeran = halamanDiminta(sp.hal_peran);
  const { isi: daftarPeran, lagi: lagiPeran } = satuHalaman(assignments ?? [], halPeran, UKURAN_PERAN);
  const namaPindah = new Map(daftarPindah.map((x) => [String(x.person_id), namaDari(x.persons)] as const)
    .filter((x): x is readonly [string, string] => typeof x[1] === "string"));
  // L4 (CR-85): a transfer names the other school too; in a school's context only that school was read above
  // W2.10: and the trail names its schools, which in «Seluruh platform» are no longer all read above
  const sekolahPindah = [...new Set([...([...(transfers ?? []), ...daftarPindah] as Array<{ from_institution_id: string; to_institution_id: string }>)
    .flatMap((x) => [x.from_institution_id, x.to_institution_id]),
    ...((audit ?? []) as Array<{ institution_id: string | null }>).map((r) => r.institution_id).filter((x): x is string => !!x)])]
    .filter((id) => !(institutions ?? []).some((i) => i.id === id));
  const { data: sekolahLain } = sekolahPindah.length > 0
    ? await supabase.from("institutions").select("id, name").in("id", sekolahPindah)
    : { data: [] as Array<{ id: string; name: string }> };
  const institutionName = new Map([...(institutions ?? []), ...(sekolahLain ?? [])].map((i) => [i.id, i.name]));
  // L4 (CR-85, §E item 13): a metric and a report title in PINTAR's own words, from the key the catalogue already
  // carries (label_key, title_key); the metric id stays beside it, secondary
  const kunciSalinan = new Set<string>(allKeys());
  const kata = (k: string | null | undefined) => (k && kunciSalinan.has(k) ? s(k as HleEvent) : null);
  const namaMetrik = new Map(((metricDefs ?? []) as MetricDefinition[]).map((d) => [d.metric_id, kata(d.label_key)]));
  const periodName = new Map((periods ?? []).map((p) => [p.id, p.name]));
  const nodeName = new Map((nodes ?? []).map((n) => [n.id, `${n.name}`]));
  // D-101 (2): a School Admin's «Admin sekolah» comes back here once, to be confirmed by a second press; the
  // database decides again on that press (role_assignments_guard: at the school itself, a person the school has)
  const uuidSah = (v: string | undefined) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v ?? "");
  // B1 §1 «Records»: a record's one action opens in place, one row at a time, carried in the address so no client state
  // is needed and a reload keeps it; the link that opens it and «Batal» keep the school and the list's page
  const ubah = uuidSah(sp.ubah) ? sp.ubah! : null;
  const tautanUbah = (id: string | null, jangkar: string) => {
    const q = new URLSearchParams();
    for (const k of ["sekolah", "hal_peran", "hal_lapor", "hal_pindah", "hal_jendela", "hal_pengumuman"] as const) if (typeof sp[k] === "string" && sp[k]) q.set(k, sp[k]!);
    if (id) q.set("ubah", id);
    return `${jalanIni}${q.size ? `?${q.toString()}` : ""}#${jangkar}`;
  };
  const angkat = uuidSah(sp.angkat) && uuidSah(sp.lingkup) && /^\d{4}-\d{2}-\d{2}$/.test(sp.sampai ?? "")
    ? {
        person: sp.angkat!, scope: sp.lingkup!, sampai: sp.sampai!,
        nama: personName.get(sp.angkat!) ?? awaitingPersons.find((p) => p.person_id === sp.angkat)?.display_name ?? TANPA_NAMA,
        tempat: nodeName.get(sp.lingkup!) ?? institutionName.get(sp.lingkup!) ?? TANPA_NAMA,
      }
    : null;
  // BOB19-K01 (Option B): a school with no active Admin sekolah, in Admin platform's hands, is offered its first
  // administrator from the people recorded at no school; the action asks every condition again
  const bukaAdminPertama = adminPlatformDiSekolah && satuSekolah !== null && !(await adaAdminSekolah(supabase, satuSekolah));
  const calonPertama = bukaAdminPertama ? await calonAdminPertama(supabase) : [];
  const pertama = bukaAdminPertama && uuidSah(sp.pertama) && /^\d{4}-\d{2}-\d{2}$/.test(sp.sampai ?? "")
    ? calonPertama.find((p) => p.person_id === sp.pertama) ?? null
    : null;


  // BOB-19: the card judges each check by the one rule F01-T13 uses
  // (src/lib/kesehatan-skema), never "anything but 0 is a problem"
  let kesehatan: KeadaanKesehatan;
  if (!platformIni) kesehatan = { jenis: "bukan_admin" };
  else if (sp.periksa !== "skema") kesehatan = { jenis: "belum" };
  else if (lintError || !lint || typeof lint !== "object") {
    const ref = rujukan();
    console.error(`[konfigurasi ${ref}] platform_schema_lint failed`, lintError?.code, lintError?.message);
    kesehatan = { jenis: "gagal", rujukan: ref };
  } else kesehatan = { jenis: "diperiksa", hasil: nilaiSkema(lint as Record<string, unknown>) };
  const myInstitutions = (institutions ?? []).filter((i) => dikelola(i.id));
  const myInstitutionIds = myInstitutions.map((i) => i.id);
  const myTemplates = (reportTemplates ?? []).filter((t) => myInstitutionIds.includes(t.institution_id));
  const metricsByTemplate = new Map<string, Array<{ metric_id: string; visualization: string }>>();
  for (const m of templateMetrics ?? []) {
    const list = metricsByTemplate.get(m.template_id) ?? [];
    list.push({ metric_id: m.metric_id, visualization: m.visualization });
    metricsByTemplate.set(m.template_id, list);
  }

  // DAISY-18: the result sits under the form it answers, in the shared line.
  // E-K4 (D-173(d)): a section with several forms says each result at the form that sent it (`asal`); a result that
  // names no form is said where the section's one line has always been
  const asalKini = asalHasil(typeof sp.asal === "string" ? sp.asal : null);
  const hasilLapor = () => sp.lapor ? (
    <BarisHasil nada={sp.lapor === "MOVED" ? "ok" : "gagal"}>
      {sl(sp.lapor === "MOVED" ? "lapor.triase.ok" : kunciKodeLaporan(sp.lapor as KodeLaporan))}
    </BarisHasil>
  ) : null;
  const result = (section: string, asal?: string) =>
    sp.bagian === section && sp.hasil && (asal ? asalKini === asal : asalKini === null) ? (
      <BarisHasil nada={sp.hasil === "ok" ? "ok" : "gagal"}>
        {kalimatHasil(sp, s, { ok: "config.result.ok", gagal: "config.result.failed" })}
      </BarisHasil>
    ) : null;

  // DAISY-17: "Menambahkan orang" is offered only to a reader /pendataan
  // admits -- the same predicate it asks on arrival. A platform administrator
  // holds no school's CAN_PROVISION_PEOPLE and was sent to a refusal.
  // D-088(b): the lessons the school can give, each with its pass mark (or none) and its history
  // BOB-44 / DAISY-32: the enrol form's places and people, and (DAISY-34) the records this administrator may open
  // BOB-15 (D-037 tier 1 and 2): the problem reports of the schools this reader administers, or every one for Admin
  // platform; row security decides the set
  // #148: the maintenance windows and notices this reader may act on; and, at the first step of scheduling, the
  // assessments the proposed window would meet (D-094(g)), asked of the database for exactly that scope and time
  const pmSekolah = (Array.isArray(sp.pm_sekolah) ? sp.pm_sekolah : sp.pm_sekolah ? [sp.pm_sekolah] : [])
    .filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  const pmPlatform = platformIni && sp.pm_platform === "1";
  const pmMulai = sp.pm_mulai ? waktuWib(sp.pm_mulai) : null;
  const pmSelesai = waktuWib(sp.pm_selesai);
  const pmCek = sp.pm_cek === "1" && (pmPlatform || pmSekolah.length > 0) && (!sp.pm_mulai || pmMulai !== null);
  const [struktur, locale, { data: akar }, bolehPendataan, ketuntasan, peserta, catatanPd, { isi: laporan, lagi: lagiLapor }, kelolaSemua, { data: tabrakan }] = await Promise.all([
    bacaanStruktur, currentLocale(), bacaanAkar,
    // L3: sekolahPendataan is already the working context's school (none in «Seluruh platform»), /pendataan's own rule
    sekolahPendataan().then((x) => x.length > 0).catch(() => false),
    sekolahStruktur ? pelajaranDanBatas(supabase, sekolahStruktur.id) : Promise.resolve(null),
    sekolahStruktur ? formulirPeserta(sekolahStruktur.id) : Promise.resolve(null),
    tempatCatatan(),
    laporanTriase(platformIni ? null : sekolahIni, halLapor),
    daftarKelola({ jendela: halJendela, pengumuman: halPengumuman, sekolah: !lama && !platformKonteks ? satuSekolah : null }),
    pmCek
      ? supabase.rpc("maintenance_collisions", { p_platform: pmPlatform, p_institutions: pmPlatform ? [] : pmSekolah, p_starts_at: pmMulai, p_ends_at: pmSelesai })
      : Promise.resolve({ data: null }),
  ]);
  // L3: maintenance windows and notices of this context: the school's own in Mengelola · a school; every one the
  // reader may act on in «Seluruh platform» (and before L3, for an evaluation persona)
  // W2.10 (Batch 4): the database narrows them to the school (maintenance_list's p_sekolah) and pages them; the
  // browser compared the schools' names with the context's school id, so a school's own windows never showed
  const kelola = kelolaSemua;

  // W2.13 / UX-33 (Batch 4): WHAT WAITS, WITH A COUNT, EACH OPENING WHERE IT IS DONE. Only what this reader may act on in
  // this working context, each counted by the database under the reader's own row security (never listed): a school's
  // imports waiting for a person's go (Pendataan), its people waiting for an account (Aktivasi) and its packages
  // waiting on the reader (Studio, studio_home's own counts); in «Seluruh platform», every school's people waiting for
  // an account. Nothing is shown when nothing waits.
  const konteksAda = typeof kh === "object" && kh !== null;
  const [nImpor, nAkun, nStudio] = await Promise.all([
    satuSekolah && bolehPendataan
      ? supabase.from("import_jobs").select("id", { count: "exact", head: true }).eq("institution_id", satuSekolah)
          .in("state", ["AWAITING_CONFIRMATION", "AWAITING_PILOT_VERIFICATION"]).then((r) => r.count ?? 0)
      : Promise.resolve(0),
    konteksAda && melayani(kh, "/aktivasi") && (satuSekolah || platformIni)
      ? (satuSekolah
          ? supabase.rpc("persons_awaiting_account", {}, { count: "exact", head: true }).eq("institution_id", satuSekolah)
          : supabase.rpc("persons_awaiting_account", {}, { count: "exact", head: true })).then((r) => r.count ?? 0)
      : Promise.resolve(0),
    satuSekolah && konteksAda && melayani(kh, "/studio")
      ? supabase.rpc("studio_home").then(({ data }) => ((data ?? []) as Array<{ bucket: string; institution_id: string; count: number }>)
          .filter((r) => r.institution_id === satuSekolah
            && (r.bucket === "ACTION_REQUIRED" || r.bucket === "AWAITING_MY_REVIEW" || r.bucket === "RELEASE_STEP"))
          .reduce((n, r) => n + Number(r.count ?? 0), 0))
      : Promise.resolve(0),
  ]);
  // D-195(2), CONTOH LAPORAN 7-admin: inside this same «Yang menunggu», never a second dashboard: the people waiting for
  // an account by their real reason, each with its one remedy. The database says which may be given a class card
  // (persons_awaiting_account's boleh_kartu: no staff role) and which need an email account (a staff role, CR-91);
  // counted, never listed
  const nMurid = nAkun > 0
    ? await (satuSekolah
        ? supabase.rpc("persons_awaiting_account", {}, { count: "exact", head: true }).eq("institution_id", satuSekolah).eq("boleh_kartu", true)
        : supabase.rpc("persons_awaiting_account", {}, { count: "exact", head: true }).eq("boleh_kartu", true)).then((r) => r.count ?? null)
    : 0;
  // 4.0 completion (owner decision 1): learners recorded without a class wait for a place, counted where they are placed
  const nTanpaKelas = satuSekolah && bolehPendataan
    ? await supabase.rpc("murid_tanpa_kelas", { p_sekolah: satuSekolah }).then(({ data }) => (Array.isArray(data) ? data.length : 0))
    : 0;
  const alasanAkun: Array<{ k: string; kunci: HleEvent; n: number }> = nMurid === null ? [] : [
    { k: "kartu", kunci: "config.menunggu.alasan.kartu" as HleEvent, n: nMurid },
    { k: "email", kunci: "config.menunggu.alasan.email" as HleEvent, n: Math.max(0, nAkun - nMurid) },
  ].filter((x) => x.n > 0);
  const menunggu: Array<{ k: string; href: string; kunci: HleEvent; n: number; alasan?: HleEvent }> = [
    { k: "impor", href: "/pendataan", kunci: "config.menunggu.pendataan" as HleEvent, n: nImpor, alasan: "config.menunggu.alasan.pendataan" as HleEvent },
    { k: "akun", href: "/aktivasi", kunci: "config.menunggu.aktivasi" as HleEvent, n: nAkun },
    { k: "kelas", href: "/konfigurasi/pindah#tempatkan", kunci: "config.menunggu.tanpa_kelas" as HleEvent, n: nTanpaKelas },
    { k: "studio", href: "/studio", kunci: "config.menunggu.studio" as HleEvent, n: nStudio },
  ].filter((m) => m.n > 0);
  const kelasAktif = struktur?.ok ? struktur.rows.filter((r) => r.level === "KELAS" && r.is_active) : [];
  // M9: the Kelas whose students «Pindah kelas» lists, if one was chosen, and
  // where they may go; J3.6: or a Tingkat whose learners are not yet in a Kelas.
  // Read only when asked: a plain visit costs nothing.
  const asal = asalPindah(struktur?.ok ? struktur.rows : []);
  const kelasDari = [...asal.kelas, ...asal.tingkat].find((k) => k.node_id === sp.dari) ?? null;
  const tujuan = kelasDari && struktur?.ok ? tujuanPindah(struktur.rows, kelasDari.node_id) : [];
  const muridDari = kelasDari ? await muridDiKelas(supabase, kelasDari.node_id) : [];
  // 4.0 completion (owner decision 1): the school's learners recorded without a class, and the Kelas they may go to
  // (a learners' Kelas only: a professional-learning Kelas holds participants)
  const { data: tanpaKelasRows } = bagianIni === "pindah" && sekolahStruktur
    ? await supabase.rpc("murid_tanpa_kelas", { p_sekolah: sekolahStruktur.id })
    : { data: [] as Array<{ person_id: string; display_name: string; institutional_id: string }> };
  const tanpaKelas = (tanpaKelasRows ?? []) as Array<{ person_id: string; display_name: string; institutional_id: string }>;
  const kelasMurid = asal.kelas.filter((k) => (k.member_kind ?? "LEARNER") === "LEARNER");
  // E3/E4 on the screen: the learners who left this school («Murid yang sudah keluar», murid_keluar decides who), and
  // today's date as the effective date's default and its latest value
  const { data: keluarRows } = bagianIni === "pindah" && sekolahStruktur
    ? await supabase.rpc("murid_keluar", { p_sekolah: sekolahStruktur.id })
    : { data: [] };
  const keluar = (keluarRows ?? []) as Array<{ person_id: string; display_name: string; institutional_id: string | null;
    enrollment_id: string; end_reason: string | null; ended_at: string | null; bisa_dikoreksi: boolean; di_sekolah_lain: boolean }>;
  // Sharon F1: the school's own today (WIB, WITA or WIT), as akhiri_pendaftaran decides it
  const hariIni = hariIniSekolah(undefined, await zonaSekolah(supabase, sekolahStruktur?.id));
  const sl = (event: HleEvent) => t(event, "staff", { locale });
  // W3.3 (Batch 2; RV-16): every moment through the one date helper, on WIB, with its year and «WIB» —
  // a record as the timestamp («9 Okt 2026, 07.30 WIB»), a window someone acts on with its day.
  const when = (iso: string, bentuk: BentukTanggal = "cap") => tanggal(iso, bentuk, locale) || TANPA_NAMA;
  // J3.2 (ADM-02): what setup remains at the school shown, from what this page already read
  const persiapan = struktur?.ok
    ? persiapanSekolah(struktur.rows, (assignments ?? []) as PeranTerbaca[],
        new Map((nodes ?? []).map((n) => [n.id as string, ((n as { jalur?: string[] }).jalur ?? []) as string[]])), new Date().valueOf(), nTanpaKelas)
    : null;
  // D-101(e): one School Admin is never an error; a second is recommended quietly, as recovery cover
  const satuAdmin = sekolahStruktur
    ? jumlahAdminSekolah((assignments ?? []) as Array<PeranTerbaca & { institution_id: string | null; person_id: string }>,
        sekolahStruktur.id, new Date().valueOf()) === 1
    : false;

  // L3: «Seluruh platform» draws no school-shaped section, and lists none
  const BAGIAN_SEKOLAH = ["struktur", "persiapan", "ketuntasan", "pindah", "peserta", "laporan", "rollover", "transfers", "intelligence"];
  const tampil = (bagian: string) => !(platformKonteks && BAGIAN_SEKOLAH.includes(bagian));
  // B1: a section is drawn on its own page, where its context draws it (tampil, the one rule the index reads too); a
  // school-shaped section asked for in «Seluruh platform» goes to the index (B1 §3)
  const tampilDi = (bagian: string) => bagianIni === bagian && tampil(bagian);
  if (bagianIni !== null && !tampil(bagianIni)) redirect("/konfigurasi");
  // B1 / RV-24: the audit trail's page, and whether any row on it carries a build («Versi», Admin platform's alone)
  const barisJejak = (audit ?? []).slice(0, UKURAN_JEJAK);
  const adaVersi = platformIni && barisJejak.some((r) => Boolean(r.build_sha));
  // E7 (owner, 9 Nov): who acted, by their name where the reader may see the person, and in what role (the row's own
  // actor_role); a row with no actor is the system's
  const idPelaku = [...new Set(barisJejak.map((r) => r.actor_person_id as string | null).filter((x): x is string => Boolean(x)))];
  const { data: pelakuRows } = idPelaku.length && tampilDi("audit")
    ? await supabase.from("persons").select("id, display_name").in("id", idPelaku)
    : { data: [] as Array<{ id: string; display_name: string }> };
  const namaPelaku = new Map(((pelakuRows ?? []) as Array<{ id: string; display_name: string }>).map((p) => [p.id, p.display_name]));
  const navSemua: Array<[string, string]> = [
    ["struktur", s("config.section.struktur")],
    ["ketuntasan", s("config.section.ketuntasan")],
    ["pindah", s("config.section.pindah")],
    ["peserta", s("config.section.peserta")],
    ["laporan-masalah", s("config.section.laporan_masalah")],
    ["pemeliharaan", s("config.section.pemeliharaan")],
    ["laporan", s("config.laporan.judul")],
    ["system", s("config.section.system")], ["rollover", s("config.section.rollover")], ["transfers", s("config.section.transfers")],
    ["roles", s("config.section.roles")], ["audit", s("config.section.audit")],
    // Polish batch 2 (UX-30): no menu item for a section that does not exist yet
    // B1 / RV-24: the row is titled by the section it opens, «Templat laporan»; «Inteligensi & Laporan» retires
    ["intelligence", sl("laporan.templat.judul")],
  ];
  const nav = navSemua.filter(([bagian]) => tampil(bagian));
  const judulBagian = (b: string) => navSemua.find(([k]) => k === b)?.[1] ?? sl("config.title");
  const namaKonteks = platformKonteks ? sl("config.pemeliharaan.platform")
    : satuSekolah ? ((institutions ?? []) as Array<{ id: string; name: string }>).find((i) => i.id === satuSekolah)?.name ?? null : null;

  // W2.17: the people pickers search by name; the list is a page of at most UKURAN_ORANG (the newest when nothing is searched)
  const cariOrangForm = (bagian: "transfers" | "roles", tetap: Record<string, string> = {}) => (
    <form method="get" className="flex flex-wrap items-end gap-2" data-cari-orang={bagian}>
      <input type="hidden" name="bagian" value={bagian} />
      {Object.entries(tetap).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <label className={label}>{s("config.cari_orang.label")}
        <input name="cari_orang" className={field} defaultValue={cariOrang} minLength={2} maxLength={80} autoComplete="off" />
      </label>
      <button type="submit" className={button}>{s("config.cari_orang.tombol")}</button>
      <p className="w-full text-xs text-ink-3">{s("config.cari_orang.arti")}</p>
    </form>
  );

  return (
    <>
    {/* D-138 step 3: the staff shell (AppShell). The places below are this page's own, unchanged: each asks its own
        gate on arrival and a link decides nothing (DAISY-03, D-010); «Laporkan masalah», the language and the way out
        are the shell's, as on every staff surface (DAISY-02, DAISY-12). */}
    <CangkangStaf
      locale={await currentLocale()}
      kini={s("nav.konfigurasi")}
      nav={
        <>
          <ItemNav href="/konfigurasi" label={s("nav.konfigurasi")} kini />
          {bolehPendataan ? <ItemNav href="/pendataan" label={s("nav.pendataan")} /> : null}
          {lama || (kh && melayani(kh, "/aktivasi")) ? <ItemNav href="/aktivasi" label={s("nav.aktivasi")} /> : null}
          {lama || (kh && melayani(kh, "/studio")) ? <ItemNav href="/studio" label={s("nav.studio")} /> : null}
          {platformIni ? <ItemNav href="/konfigurasi/email-uji" label={s("emailuji.judul")} /> : null}
          {(platformIni || sekolahIni.length > 0) ? <ItemNav href="/konfigurasi/keamanan" label={s("keamanan.judul")} /> : null}
          {/* W2.5 (CR-05): the school's certificates, for whom revoke_certificate accepts (the page asks the database) */}
          {(platformIni || satuSekolah) ? <ItemNav href="/konfigurasi/sertifikat" label={s("sertifikat.kelola.judul")} /> : null}
          {lama ? (
            <TabTempat tempat={tempatDariPeran(peran)} kecuali={["/konfigurasi"]} locale={await currentLocale()} persona="staff" bentuk="nav" />
          ) : (
            await navKonteks({ locale: await currentLocale(), persona: "staff", kecuali: ["/konfigurasi", "/pendataan", "/aktivasi", "/studio"], bentuk: "nav" })
          )}
        </>
      }
    />
    <main id="isi" tabIndex={-1} className="py-6">
      {/* E-K7 (D-173(d)): one page-head rule — no app-name eyebrow inside the shell, which already names PINTAR */}
      {/* B1 (D-166(a)): the index is «Konfigurasi»; a section's page is its section, with the way back named by its
          destination (D-172 K1) and the context it acts in */}
      <header>
        {bagianIni ? (
          <Link className="pin-back pin-noprint" href={`/konfigurasi${sp.sekolah ? `?sekolah=${encodeURIComponent(sp.sekolah)}` : ""}`}>← {sl("nav.konfigurasi")}</Link>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight">{bagianIni ? judulBagian(bagianIni) : sl("config.title")}</h1>
        {namaKonteks ? (
          <p className="mt-1 text-sm text-ink-2" data-konfigurasi-konteks="">
            {platformKonteks ? namaKonteks : <>{sl("config.struktur.sekolah")}: <strong className="text-ink-1">{namaKonteks}</strong></>}
          </p>
        ) : null}
      </header>
      {bagianIni === null ? <TerusBagian /> : null}


      {bagianIni === null && menunggu.length > 0 ? (
        <section className={`mt-6 ${card}`} aria-labelledby="pin-menunggu" data-menunggu="">
          <h2 id="pin-menunggu" className="font-medium">{s("config.menunggu.judul")}</h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {menunggu.map((m) => (
              <li key={m.k} data-menunggu-jenis={m.k}>
                <Link className="pin-tautan" href={m.href}><span className="pin-num">{m.n}</span> {s(m.kunci)}</Link>
                {m.alasan ? <p className="pin-meta">{s(m.alasan)}</p> : null}
                {/* D-195(2): why each cannot sign in yet, and the one thing that resolves it */}
                {m.k === "akun" && alasanAkun.length > 0 ? (
                  <ul className="pin-meta" data-menunggu-alasan="">
                    {alasanAkun.map((x) => (
                      <li key={x.k} data-alasan={x.k}><span className="pin-num">{x.n}</span> {s(x.kunci)}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* B1 / RV-24: Admin platform's two panels on the index alone; no tile is drawn for a value the reader cannot
          have (a school administrator's «Lingkungan —»), and the classes' count is Persiapan sekolah's */}
      {bagianIni === null && platformIni ? (
        <section className="mt-6 grid gap-3 sm:grid-cols-2" data-konfigurasi-panel="">
          <KartuKesehatan locale={await currentLocale()} keadaan={kesehatan} kelas={card} tautan={tautanTempat} />
          {/* B1: with no environment row the panel is omitted, never «—» (its words wait on Dr Gladys, pack A8) */}
          {env?.environment ? (
            <div className={card}>
              <p className="text-sm text-ink-3">{s("config.environment")}</p>
              <p className="mt-1 text-ink-2">{env.environment}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-6 grid gap-4">

        <div className="grid gap-4" data-bagian-ini={bagianIni ?? undefined}>
          {/* DAISY-05 (D-006, D-022). Struktur sekolah: first, because a new
              school cannot place a student or assign a teacher until it has a
              Kelas, and until now nothing here could make one. */}
          {/* B1: only the page's own section is drawn */}{tampilDi("struktur") ? (
<section id="struktur" hidden={!tampilDi("struktur") || undefined} className={card}>
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
          ) : null}

          {/* J3.2 (ADM-02, P1). PERSIAPAN SEKOLAH: what is done and what remains
              at the school shown, each with the place it is done, right after
              the structure that comes first (DAISY-05). Read only;
              the facts are the structure, its placements and its roles, as
              this reader already sees them. */}
          {sekolahStruktur && persiapan ? (
            <section id="persiapan" hidden={bagianIni !== null || !tampil("persiapan") || undefined} className={card} aria-labelledby="pin-persiapan">
              <h2 id="pin-persiapan" className="font-medium">{sl("config.persiapan.judul")}</h2>
              <p className="mt-1 text-sm text-ink-2">{sl("config.persiapan.arti")}</p>
              <ul className="mt-3 grid gap-2 text-sm">
                {persiapan.map((l) => (
                  <li key={l.kunci} data-langkah={l.kunci} data-selesai={l.selesai ? "ya" : "belum"}
                    className="grid gap-1 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
                    <span className="text-ink-1">
                      {/* B1 §1 (J3.2): each step's state a badge, «Sudah» the ok one with its icon, «Belum» neutral */}
                      {l.selesai
                        ? <strong className="pin-pill pin-ok pin-pill-ikon"><Ikon nama="check" />{sl("config.persiapan.sudah")}</strong>
                        : <strong className="pin-pill pin-neutral">{sl("config.persiapan.belum")}</strong>}
                      {" "}{sl(`config.persiapan.${l.kunci}` as HleEvent)}
                      {l.kunci !== "guru" ? <> · <span className="pin-num">{l.jumlah}</span></> : null}
                    </span>
                    {l.kunci === "guru" && l.tanpaGuru.length > 0 ? (
                      <span className="text-ink-2">{sl("config.persiapan.guru.kurang")} {l.tanpaGuru.join(", ")}</span>
                    ) : null}
                    {/* the way to each step: the section on this page, or for students
                        Pendataan, whose one link is in the places above (DAISY-17) */}
                    {!l.selesai ? (
                      l.kunci === "murid" ? (
                        l.tanpaKelas > 0
                          ? <a href={alamatBagian("pindah", undefined, "tempatkan")} className={tautanTempat}>{sl("config.persiapan.murid.tanpa_kelas").replace("{n}", String(l.tanpaKelas))}</a>
                          : <span className="text-ink-2">{sl("config.persiapan.murid.cara")}</span>
                      ) : (
                        <a href={alamatBagian(l.kunci === "guru" ? "roles" : "struktur")} className={tautanTempat}>{sl(`config.persiapan.${l.kunci}.cara` as HleEvent)}</a>
                      )
                    ) : null}
                  </li>
                ))}
              </ul>
              {satuAdmin ? <p className="mt-3 text-sm text-ink-2">{sl("config.persiapan.admin_kedua")}</p> : null}
            </section>
          ) : null}

          {/* D-088(b), BOB-49 / DAISY-38. BATAS KETUNTASAN: each lesson the school can give, with its pass mark or
              «Batas ketuntasan belum ditetapkan», its history, and a form to set it. A teacher cannot give a lesson
              to a class until its mark is set; a change applies to what is given afterwards. set_school_pass_mark
              decides who may set it (the school's admin), keeps every change and audits it. */}
          {/* B1: only the page's own section is drawn */}{tampilDi("ketuntasan") ? (
<section id="ketuntasan" hidden={!tampilDi("ketuntasan") || undefined} className={card} aria-labelledby="pin-ketuntasan">
            <h2 id="pin-ketuntasan" className="font-medium">{sl("config.section.ketuntasan")}</h2>
            {sekolahStruktur ? (
              <>
                <p className="mt-1 text-sm text-ink-2">{sl("config.ketuntasan.arti")}</p>
                {ketuntasan && ketuntasan.length > 0 ? (
                  <ul className="mt-3 grid gap-2 text-sm">
                    {ketuntasan.map((p) => (
                      <li key={p.course_id} id={`batas-${p.course_id}`} data-pelajaran={p.course_id} data-terbuka={ubah === p.course_id ? "" : undefined}
                        className={`grid gap-2 rounded-[var(--radius-1)] px-3 py-2 ${ubah === p.course_id ? "bg-surface-2" : "border-b border-line-1"}`}>
                        <span className="text-ink-1">
                          <strong>{p.title}</strong> · {p.subject} · {p.grade_label}
                          {p.canonical ? <> · <span className="text-ink-3">{sl("config.ketuntasan.materi_pintar")}</span></> : null}
                        </span>
                        <span className="pin-batas text-ink-2">
                          {p.percent === null
                            ? sl("config.ketuntasan.belum")
                            : <>{sl("config.ketuntasan.sekarang")} <span className="pin-num">{format.percent(p.percent / 100, locale)}</span></>}
                        </span>
                        {ubah !== p.course_id ? (
                          // B1: the row's one action, named with its record, opens its short form in place
                          <Link href={tautanUbah(p.course_id, `batas-${p.course_id}`)} className={button} data-buka-ubah="">
                            {sl("config.ketuntasan.tombol")}<span className="pin-sr"> · {p.title}</span>
                          </Link>
                        ) : (
                        <form action={tetapkanBatasAction} className="flex flex-wrap items-end gap-2" aria-label={`${sl("config.ketuntasan.tombol")} · ${p.title}`}>
                          <input type="hidden" name="sekolah" value={sekolahStruktur.id} />
                          <input type="hidden" name="pelajaran" value={p.course_id} />
                          <label className={label}>{sl("config.ketuntasan.nilai")}
                            <input name="persen" type="number" inputMode="numeric" min={0} max={100} step={1} required
                              defaultValue={p.percent ?? undefined} className={`${field} w-24`} />
                          </label>
                          <label className={label}>{sl("config.ketuntasan.alasan")}
                            <input name="alasan" type="text" required maxLength={300} placeholder={sl("config.ketuntasan.alasan_contoh")} className={field} />
                          </label>
                          <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.ketuntasan.tombol")}</TombolKirim>
                          <Link href={tautanUbah(null, `batas-${p.course_id}`)} className={tautanTempat}>{s("config.angkat.batal")}</Link>
                        </form>
                        )}
                        {p.history.length > 0 ? (
                          <details className="pin-disclosure">
                            <summary className="cursor-pointer text-ink-3">{sl("config.ketuntasan.riwayat")}<Ikon nama="chevron-down" kelas="pin-chevron" /></summary>
                            <ul className="mt-1 grid gap-1 text-ink-2">
                              {p.history.map((h, i) => (
                                <li key={`${h.set_at}-${i}`}>
                                  <span className="pin-num">{format.percent(h.percent / 100, locale)}</span>
                                  {" · "}{when(h.set_at)}
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
                  <Kosong jenis="belum" kalimat={sl("config.ketuntasan.kosong")} />
                )}
                {result("ketuntasan")}
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-3">{sl("config.struktur.tanpa_sekolah")}</p>
            )}
          </section>
          ) : null}

          {/* D-085 M9 (J3.12, ADM-J13). PINDAH KELAS: the administrator opens
              the Kelas a student is in, finds them, and moves them to another
              Kelas of the same year. move_learner_to_class decides each move
              again as this administrator, in one transaction; what was done in
              the old Kelas stays recorded there. */}
          {/* B1: only the page's own section is drawn */}{tampilDi("pindah") ? (
<section id="pindah" hidden={!tampilDi("pindah") || undefined} className={card}>
            <h2 className="font-medium">{sl("config.section.pindah")}</h2>
            {sekolahStruktur && struktur ? (
              <>
                <p className="mt-1 text-sm text-ink-2">{sl("config.pindah.arti")}</p>
                {asal.kelas.length > 0 ? (
                  <form method="get" action="/konfigurasi/pindah#pindah" className="mt-3 grid max-w-[var(--measure-narrow)] gap-2">
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
                    <div><button type="submit" className={button}>{sl("config.pindah.lihat")}</button></div>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-ink-3">{sl("config.pindah.tanpa_kelas")}</p>
                )}
                {kelasDari ? (
                  <div className="mt-3 grid gap-2">
                    <h2 className="text-sm font-medium text-ink-1">{namaKelas(kelasDari)}</h2>
                    {tujuan.length === 0 ? <p className="text-sm text-ink-3">{sl("config.pindah.tanpa_tujuan")}</p> : null}
                    {muridDari.length > 0 ? (
                      <ul className="grid gap-1 text-sm text-ink-2">
                        {muridDari.map((m) => (
                          <li key={m.penempatan} className="grid gap-2 border-b border-line-1 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
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
                                <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.pindah.tombol")}<span className="pin-sr"> · {m.nama}</span></TombolKirim>
                              </form>
                            ) : null}
                            <a className="pin-tautan text-sm" href={`/konfigurasi/pindah?${new URLSearchParams({ dari: kelasDari.node_id, sekolah: sekolahStruktur.id, akhiri: m.penempatan }).toString()}#akhiri-${m.penempatan}`} data-akhiri={m.penempatan}>{sl("config.akhiri.buka")}<span className="pin-sr"> · {m.nama}</span></a>
                            {sp.akhiri === m.penempatan ? (
                              <form id={`akhiri-${m.penempatan}`} action={akhiriPendaftaranAction} className="grid gap-2 sm:col-span-2 rounded-[var(--radius-1)] bg-surface-2 p-3" data-akhiri-form={m.penempatan}>
                                <h3 className="text-sm font-medium text-ink-1">{sl("config.akhiri.judul")} · {m.nama}</h3>
                                <p className="text-sm text-ink-2">{sl("config.akhiri.arti")}</p>
                                <input type="hidden" name="penempatan" value={m.penempatan} />
                                <input type="hidden" name="dari" value={kelasDari.node_id} />
                                <input type="hidden" name="sekolah" value={sekolahStruktur.id} />
                                <label className={label}>{sl("config.akhiri.alasan")}
                                  <select name="alasan" className={field} required defaultValue="">
                                    <option value="" disabled>—</option>
                                    {ALASAN_AKHIRI.map((a) => <option key={a} value={a}>{sl(`config.akhiri.alasan.${a.toLowerCase()}` as HleEvent)}</option>)}
                                  </select>
                                </label>
                                <div className={label}>
                                  <label htmlFor="akhiri-tanggal">{sl("config.akhiri.tanggal")}</label>
                                  <TanggalDenganGema jenis="date" id="akhiri-tanggal" name="tanggal" className={field} required defaultValue={hariIni} max={hariIni} locale={locale} />
                                </div>
                                <label className={label}>{sl("config.akhiri.keterangan")}
                                  <textarea name="keterangan" className={field} maxLength={300} rows={2} />
                                </label>
                                <div><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.akhiri.tombol")}<span className="pin-sr"> · {m.nama}</span></TombolKirim></div>
                                {result("akhiri")}
                              </form>
                            ) : null}

                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Kosong jenis="belum" kalimat={sl("config.pindah.kosong")} />
                    )}
                  </div>
                ) : null}
                {result("pindah")}
                {/* 4.0 completion (owner decision 1): learners recorded without a class, placed by tempatkan_murid */}
                <div id="tempatkan" className="mt-4 grid gap-2">
                  <h2 className="text-sm font-medium text-ink-1">{sl("config.tempatkan.judul")}</h2>
                  <p className="text-sm text-ink-2">{sl("config.tempatkan.arti")}</p>
                  {tanpaKelas.length > 0 && kelasMurid.length > 0 ? (
                    <ul className="grid gap-1 text-sm text-ink-2" data-tanpa-kelas="">
                      {tanpaKelas.map((m) => (
                        <li key={m.person_id} className="grid gap-2 border-b border-line-1 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
                          <span className="text-ink-1">{m.display_name} · <span className="pin-num">{m.institutional_id}</span></span>
                          <form action={tempatkanMuridAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="orang" value={m.person_id} />
                            <input type="hidden" name="sekolah" value={sekolahStruktur.id} />
                            <select name="kelas" className={field} required defaultValue="" aria-label={`${m.display_name}: ${sl("config.tempatkan.ke")}`}>
                              <option value="" disabled>{sl("config.tempatkan.ke")}</option>
                              {kelasMurid.map((k) => <option key={k.node_id} value={k.node_id}>{namaKelas(k)}</option>)}
                            </select>
                            <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.tempatkan.tombol")}<span className="pin-sr"> · {m.display_name}</span></TombolKirim>
                          </form>
                        </li>
                      ))}
                    </ul>
                  ) : tanpaKelas.length > 0 ? (
                    <p className="text-sm text-ink-3">{sl("config.pindah.tanpa_kelas")}</p>
                  ) : (
                    <Kosong jenis="belum" kalimat={sl("config.tempatkan.kosong")} />
                  )}
                  {result("tempatkan")}
                </div>
                <div id="kembali" className="mt-4 grid gap-2">
                  <h2 className="text-sm font-medium text-ink-1">{sl("config.kembali.judul")}</h2>
                  <p className="text-sm text-ink-2">{sl("config.kembali.arti")}</p>
                  {keluar.length > 0 ? (
                    <ul className="grid gap-1 text-sm text-ink-2" data-murid-keluar="">
                      {keluar.map((m) => (
                        <li key={m.person_id} className="grid gap-2 border-b border-line-1 px-3 py-2" data-keluar={m.person_id}>
                          <span className="text-ink-1">{m.display_name}{m.institutional_id ? <> · <span className="pin-num">{m.institutional_id}</span></> : null}
                            <span className="text-ink-3"> · {sl(`config.kembali.akhir.${(m.end_reason ?? "withdrawn").toLowerCase()}` as HleEvent)}{m.ended_at ? ` · ${when(m.ended_at, "baca")}` : ""}</span></span>
                          {m.di_sekolah_lain ? (
                            <p className="text-sm text-ink-3">{sl("config.kembali.di_sekolah_lain")}</p>
                          ) : (
                            <form action={daftarkanKembaliAction} className="grid gap-2 sm:grid-cols-[auto_auto_1fr_auto] sm:items-end">
                              <input type="hidden" name="orang" value={m.person_id} />
                              <input type="hidden" name="sekolah" value={sekolahStruktur.id} />
                              <input type="hidden" name="pendaftaran" value={m.enrollment_id} />
                              <label className={label}>{sl("config.kembali.jenis")}
                                <select name="jenis" className={field} required defaultValue={m.bisa_dikoreksi ? "" : "RETURN"}>
                                  <option value="" disabled>—</option>
                                  {m.bisa_dikoreksi ? <option value="CORRECTION">{sl("config.kembali.jenis.koreksi")}</option> : null}
                                  <option value="RETURN">{sl("config.kembali.jenis.kembali")}</option>
                                </select>
                              </label>
                              <label className={label}>{sl("config.kembali.kelas")}
                                <select name="kelas" className={field} defaultValue="">
                                  <option value="">{sl("config.kembali.kelas_semula")}</option>
                                  {kelasMurid.map((k) => <option key={k.node_id} value={k.node_id}>{namaKelas(k)}</option>)}
                                </select>
                              </label>
                              <label className={label}>{sl("config.kembali.alasan")}
                                <input name="alasan" className={field} required maxLength={300} />
                              </label>
                              <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.kembali.tombol")}<span className="pin-sr"> · {m.display_name}</span></TombolKirim>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Kosong jenis="belum" kalimat={sl("config.kembali.kosong")} />
                  )}
                  {result("kembali")}
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-3">{sl("config.struktur.tanpa_sekolah")}</p>
            )}
          </section>
          ) : null}

          {/* BOB-44 / DAISY-32 (D-069(e), D-070(c)). PESERTA PENGEMBANGAN PROFESI: an existing teacher or staff member of
              this school is enrolled as a participant in a professional-learning Kelas. The people offered are those the
              database says hold a staff role here now; the places, this school's professional-learning Kelas and
              Tingkat. enrol_for_professional_learning decides again, creates no person, account or number, and audits.
              DAISY-34: the records this administrator may open are linked here, read-only, never as a figure. */}
          {/* B1: only the page's own section is drawn */}{tampilDi("peserta") ? (
<section id="peserta" hidden={!tampilDi("peserta") || undefined} className={card} aria-labelledby="pin-peserta">
            <h2 id="pin-peserta" className="font-medium">{sl("config.section.peserta")}</h2>
            {sekolahStruktur && peserta ? (
              <>
                <p className="mt-1 text-sm text-ink-2">{sl("config.peserta.arti")}</p>
                {/* Readiness (Daisy, 8 Nov): the person list is the school's staff; with none yet, say what makes one */}
                {peserta.tempat.length > 0 && peserta.calon.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-2" data-peserta-tanpa-calon="">{sl("config.peserta.tanpa_calon")}</p>
                ) : null}
                {peserta.tempat.length > 0 && peserta.calon.length > 0 ? (
                  <form action={daftarkanPesertaAction} className="mt-3 grid max-w-[var(--measure-narrow)] gap-2">
                    <input type="hidden" name="sekolah" value={sekolahStruktur.id} />
                    <div className="pin-baris-isian">
                    <label className={label}>{sl("config.peserta.orang")}
                      <select name="orang" className={field} required defaultValue="">
                        <option value="" disabled>—</option>
                        {peserta.calon.map((o) => <option key={o.id} value={o.id}>{o.nama}</option>)}
                      </select>
                    </label>
                    <label className={label}>{sl("config.peserta.tempat")}
                      <select name="tempat" className={field} required defaultValue="">
                        <option value="" disabled>—</option>
                        {peserta.tempat.map((k) => (
                          <option key={k.id} value={k.id}>{[k.tingkat, k.nama].filter(Boolean).join(" · ")}{k.tahun ? ` (${k.tahun})` : ""}</option>
                        ))}
                      </select>
                    </label>
                    </div>
                    <div><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.peserta.daftarkan")}</TombolKirim></div>
                  </form>
                ) : peserta.tempat.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-3">{sl("config.peserta.tanpa_tempat")}</p>
                ) : null}
                {result("peserta")}
                {catatanPd.length > 0 ? (
                  <nav className="mt-3 text-sm" aria-label={sl("config.peserta.catatan")}>
                    <h2 className="font-medium text-ink-1">{sl("config.peserta.catatan")}</h2>
                    <ul className="mt-1 grid gap-1">
                      {catatanPd.map((k) => (
                        <li key={k.id}>
                          <Link href={alamatCatatan(k.id)} className={tautanTempat}>
                            {k.nama}{k.tahun ? ` (${k.tahun})` : ""}<TandaTautan />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ) : null}
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-3">{sl("config.struktur.tanpa_sekolah")}</p>
            )}
          </section>
          ) : null}

          {/* BOB-15 + DAISY-12 (D-037 step 2; D-101(f)). LAPORAN MASALAH: the school resolves what it can (tier 1), the
              PINTAR team reads every school's (tier 2). Open reports first, a stopped class first among them. Each is
              moved forward once at a time with the next step written to its reporter; move_support_report decides
              who may, and audits it. */}
          {/* B1: only the page's own section is drawn */}{tampilDi("laporan-masalah") ? (
<section id="laporan-masalah" hidden={!tampilDi("laporan-masalah") || undefined} className={card} aria-labelledby="pin-laporan-masalah">
            <h2 id="pin-laporan-masalah" className="font-medium">{sl("config.section.laporan_masalah")}</h2>
            <p className="mt-1 text-sm text-ink-2">{sl(platformKonteks ? "lapor.triase.arti_platform" : "lapor.triase.arti")}</p>
            {/* E-K4: a move is answered in its report's row (it comes back with the row and its page); a refusal that
                names no row on this page is said here, above the list */}
            {sp.bagian === "laporan-masalah" && sp.lapor && !laporan.some((l) => l.id === sp.baris) ? hasilLapor() : null}
            {laporan.length === 0 ? (
              <Kosong jenis="belum" kalimat={sl("lapor.triase.kosong")} />
            ) : (
              <ul className="mt-3 grid gap-2 text-sm">
                {laporan.map((l) => (
                  // B1 §1 «Laporan masalah»: each report an article named by what happened; its state a badge, «Menghentikan
                  // kelas» an attention badge with its icon; the two other answers a description list; its one action,
                  // «Ubah status», opens in place (?ubah=), named with its report
                  <li key={l.id} id={`laporan-${l.id}`} data-laporan={l.id} data-terbuka={ubah === l.id ? "" : undefined}
                    className={`rounded-[var(--radius-1)] px-3 py-3 ${ubah === l.id ? "bg-surface-2" : "border-b border-line-1"}`}>
                    <article className="grid gap-2" aria-labelledby={`laporan-judul-${l.id}`}>
                      <h2 id={`laporan-judul-${l.id}`} className="font-medium text-ink-1">{l.terjadi}</h2>
                      <p className="text-ink-2">{when(l.dibuat)} · {l.pelapor} · {roleLabel(l.peran)}{l.sekolah ? ` · ${l.sekolah}` : ""}</p>
                      <p className="flex flex-wrap items-center gap-2">
                        <strong className="pin-pill pin-neutral" data-status-laporan="">{sl(kunciStatusLaporan(l.status))}</strong>
                        {l.hentikanKelas ? <span className="pin-pill pin-attention pin-pill-ikon"><Ikon nama="triangle-alert" />{sl("lapor.hentikan.singkat")}</span> : null}
                      </p>
                      <dl className="grid gap-1 text-ink-2">
                        <div><dt className="text-ink-3">{sl("lapor.lakukan")}</dt><dd>{l.lakukan}</dd></div>
                        <div><dt className="text-ink-3">{sl("lapor.harapan")}</dt><dd>{l.harapan}</dd></div>
                      </dl>
                      <p className="text-ink-3">
                        <span className="pin-num">{l.halaman}</span>
                        {l.rujukan ? <> · {sl("lapor.rujukan")} <span className="pin-num">{l.rujukan}</span></> : null}
                        {/* L4 (CR-85): the build, the kept technical exception, in the platform operator's triage only (investigation §E item 22) */}
                        {platformIni && l.build ? <> · <span className="pin-num">{l.build.slice(0, 7)}</span></> : null}
                      </p>
                      {l.perangkat ? <p className="text-xs text-ink-3">{l.perangkat}</p> : null}
                      {l.tangkapan ? (
                        <a className={tautanTempat} href={`/api/assets/read-url?alih=1&path=${encodeURIComponent(l.tangkapan)}`}>{sl("lapor.triase.tangkapan")}</a>
                      ) : null}
                      {l.langkah ? <p className="text-ink-1">{sl("lapor.langkah")} {l.langkah}</p> : null}
                      {langkahBerikut(l.status).length > 0 && ubah !== l.id ? (
                        <Link href={tautanUbah(l.id, `laporan-${l.id}`)} className={button} data-buka-ubah="">
                          {sl("lapor.triase.ubah")}<span className="pin-sr"> · {l.terjadi.slice(0, 80)}</span>
                        </Link>
                      ) : null}
                      {langkahBerikut(l.status).length > 0 && ubah === l.id ? (
                        <form action={pindahkanLaporanAksi} className="flex flex-wrap items-end gap-2" aria-label={`${sl("lapor.triase.ubah")} · ${l.terjadi.slice(0, 80)}`}>
                          <input type="hidden" name="laporan" value={l.id} />
                          <input type="hidden" name="hal_lapor" value={String(halLapor)} />
                          <label className={label}>{sl("lapor.triase.ubah")}
                            <select name="status" className={field} required defaultValue={langkahBerikut(l.status)[0]}>
                              {langkahBerikut(l.status).map((x) => <option key={x} value={x}>{sl(kunciStatusLaporan(x))}</option>)}
                            </select>
                          </label>
                          <label className={label}>{sl("lapor.triase.langkah")}
                            <input name="langkah" className={field} required maxLength={500} autoComplete="off" autoFocus />
                          </label>
                          <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("lapor.triase.simpan")}</TombolKirim>
                          <Link href={tautanUbah(null, `laporan-${l.id}`)} className={tautanTempat}>{s("config.angkat.batal")}</Link>
                        </form>
                      ) : null}
                      {sp.bagian === "laporan-masalah" && sp.lapor && sp.baris === l.id ? hasilLapor() : null}
                    </article>
                  </li>
                ))}
              </ul>
            )}
            <Penomoran halaman={halLapor} lagi={lagiLapor} ke={(n) => tautanHalaman(jalanIni, sp, "hal_lapor", n, "laporan-masalah")} locale={locale}
              benda={sl("koleksi.benda.laporan")} jumlah={laporan.length} />
          </section>
          ) : null}

          {/* #148 (D-094(a)(b)(g)(h), D-100). PEMELIHARAAN DAN PENGUMUMAN. Scheduling is two steps: the scope and the
              time are checked first (a plain GET), and the second step shows the assessments that window would meet,
              with the latest one's end, before anything is saved (D-094(g)); it warns, it does not forbid. The list
              ends or starts a window with a reason; «Hentikan sekarang» is Admin platform's alone, separate, and
              confirmed by the typed phrase. The database decides who may do each, and audits it (D-093). */}
          {/* B1: only the page's own section is drawn */}{tampilDi("pemeliharaan") ? (
<section id="pemeliharaan" hidden={!tampilDi("pemeliharaan") || undefined} className={card} aria-labelledby="pin-pemeliharaan">
            <h2 id="pin-pemeliharaan" className="font-medium">{sl("config.section.pemeliharaan")}</h2>
            <p className="mt-1 text-sm text-ink-2">{sl("config.pemeliharaan.arti")}</p>
            {result("pemeliharaan")}
            {/* B1 §1 «Pemeliharaan dan pengumuman»: a form in two steps, then the windows as records, then the notices,
                then (Admin platform only) «Hentikan sekarang», last and set apart. Each part is a region under its h2,
                the section page's h1 naming the whole. */}
            <section className="mt-3 grid gap-2" aria-labelledby="pin-pm-jadwal">
              <h2 id="pin-pm-jadwal" className="font-medium">{sl("config.pemeliharaan.jadwalkan")}</h2>
              <form method="get" action="/konfigurasi/pemeliharaan#pin-pm-jadwal" className="grid max-w-[var(--measure-narrow)] gap-2">
                <input type="hidden" name="pm_cek" value="1" />
                <fieldset className="grid gap-1 text-sm">
                  <legend className="text-ink-2">{sl("config.pemeliharaan.cakupan")}</legend>
                  {platformIni ? (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="pm_platform" value="1" defaultChecked={pmPlatform} /> {sl("config.pemeliharaan.platform")}
                    </label>
                  ) : null}
                  {sekolahKu.map((i) => (
                    <label key={i.id} className="flex items-center gap-2">
                      <input type="checkbox" name="pm_sekolah" value={i.id} defaultChecked={pmSekolah.includes(i.id)} /> {i.name}
                    </label>
                  ))}
                </fieldset>
                <div className="pin-baris-isian">
                  <div className={label}>
                    <label htmlFor="cfg-pm-mulai">{sl("config.pemeliharaan.mulai")}</label>
                    <TanggalDenganGema jenis="datetime-local" id="cfg-pm-mulai" name="pm_mulai" className={field} defaultValue={sp.pm_mulai ?? ""} locale={locale} />
                  </div>
                  <div className={label}>
                    <label htmlFor="cfg-pm-selesai">{sl("config.pemeliharaan.selesai")}</label>
                    <TanggalDenganGema jenis="datetime-local" id="cfg-pm-selesai" name="pm_selesai" className={field} defaultValue={sp.pm_selesai ?? ""} locale={locale} />
                  </div>
                </div>
                <div><button type="submit" className={button}>{sl("config.pemeliharaan.periksa")}</button></div>
              </form>
              {pmCek ? (
                <div className="grid max-w-[var(--measure-narrow)] gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2 text-sm" data-tabrakan="1">
                  {tabrakan && Number((tabrakan as { asesmen?: number }).asesmen) > 0 ? (
                    <div className="pin-banner pin-attention" role="status" data-tabrakan-perhatian="">
                      <Ikon nama="triangle-alert" />
                      <p className="text-ink-1">
                        <strong>{sl("config.pemeliharaan.tabrakan.perhatian")}</strong>{" "}
                        {Number((tabrakan as { asesmen: number }).asesmen)} {sl("config.pemeliharaan.tabrakan.jumlah")}{" "}
                        {(tabrakan as { terakhir_selesai?: string | null }).terakhir_selesai ? (
                          <>
                            {sl("config.pemeliharaan.tabrakan.terakhir")} {when((tabrakan as { terakhir_selesai: string }).terakhir_selesai)}.{" "}
                            {sl("config.pemeliharaan.tabrakan.saran")} {when((tabrakan as { terakhir_selesai: string }).terakhir_selesai)}.
                          </>
                        ) : null}
                      </p>
                    </div>
                  ) : tabrakan ? (
                    <p role="status">{sl("config.pemeliharaan.tabrakan.nihil")}</p>
                  ) : null}
                  <form action={jadwalkanPemeliharaanAction} className="grid gap-2"><input type="hidden" name="asal" value="jadwal" />
                    {pmPlatform ? <input type="hidden" name="platform" value="1" /> : null}
                    {pmPlatform ? null : pmSekolah.map((id) => <input key={id} type="hidden" name="sekolah" value={id} />)}
                    <input type="hidden" name="mulai" value={sp.pm_mulai ?? ""} />
                    <input type="hidden" name="selesai" value={sp.pm_selesai ?? ""} />
                    <label className={label}>{sl("config.pemeliharaan.pesan")} <span className="pin-opsional">{sl("bentuk.opsional")}</span>
                      <textarea name="pesan" className={field} maxLength={500} rows={2} />
                    </label>
                    <label className={label}>{sl("config.pemeliharaan.alasan")}
                      <input name="alasan" className={field} required maxLength={300} autoComplete="off" />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="umumkan" value="1" /> {sl("config.pemeliharaan.umumkan")}
                    </label>
                    <div><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.pemeliharaan.jadwalkan")}</TombolKirim></div>
                  </form>
                </div>
              ) : null}
              {result("pemeliharaan", "jadwal")}
            </section>

            <section className="mt-4" aria-labelledby="pin-pm-daftar">
              <h2 id="pin-pm-daftar" className="font-medium">{sl("config.pemeliharaan.daftar")}</h2>
              {kelola && kelola.pemeliharaan.length > 0 ? (
                <ul className="mt-2 grid gap-2 text-sm">
                  {kelola.pemeliharaan.map((w) => {
                    // B1 §1 «Records»: a window's one action (end or cancel it) at its row's end, named with the window,
                    // opening its reason in place
                    const kata = sl(w.keadaan === "AKTIF" ? "config.pemeliharaan.akhiri" : "config.pemeliharaan.batalkan");
                    const nama = `${w.platform ? sl("config.pemeliharaan.platform") : w.sekolah.join(", ")}, ${when(w.mulai, "hariJam")}`;
                    return (
                    <li key={w.id} id={`jendela-${w.id}`} data-jendela={w.id} data-terbuka={ubah === w.id ? "" : undefined}
                      className={`grid gap-1 rounded-[var(--radius-1)] px-3 py-2 ${ubah === w.id ? "bg-surface-2" : "border-b border-line-1"}`}>
                      <span className="text-ink-1">
                        <strong>{sl(`config.pemeliharaan.keadaan.${w.keadaan}` as HleEvent)}</strong>
                        {" · "}{sl(`config.pemeliharaan.jenis.${w.jenis}` as HleEvent)}
                        {" · "}{w.platform ? sl("config.pemeliharaan.platform") : w.sekolah.join(", ")}
                      </span>
                      <span className="text-ink-2">
                        {when(w.mulai, "hariJam")} {w.selesai ? <>{sl("config.pemeliharaan.hingga")} {when(w.selesai, "hariJam")}</> : <>· {sl("config.pemeliharaan.tanpa_akhir")}</>}
                      </span>
                      {w.pesan ? <span className="text-ink-2">{w.pesan}</span> : null}
                      <span className="text-xs text-ink-3">{sl("config.pemeliharaan.alasan")}: {w.alasan}</span>
                      {w.menguasai && w.keadaan !== "BERAKHIR" ? (
                        ubah !== w.id ? (
                          <div>
                            <Link href={tautanUbah(w.id, `jendela-${w.id}`)} className={button} data-buka-ubah="">
                              {kata}<span className="pin-sr"> · {nama}</span>
                            </Link>
                          </div>
                        ) : (
                          <form action={ubahPemeliharaanAction} className="flex flex-wrap items-end gap-2" aria-label={`${kata} · ${nama}`}><input type="hidden" name="asal" value="jendela" /><input type="hidden" name="hal_jendela" value={String(halJendela)} />
                            <input type="hidden" name="jendela" value={w.id} />
                            <label className={label}>{sl("config.pemeliharaan.alasan")}
                              <input name="alasan" className={field} required maxLength={300} autoComplete="off" autoFocus />
                            </label>
                            {w.keadaan !== "AKTIF" ? (
                              <TombolKirim className={button} name="aksi" value="MULAI" sibuk={s("tombol.memproses")}>{sl("config.pemeliharaan.mulai_sekarang")}</TombolKirim>
                            ) : null}
                            <KonfirmasiBahaya sibuk={s("tombol.memproses")} id={`jendela-${w.id}`} tombol={kata} tanya={sl("config.pemeliharaan.akhiri.tanya")} ya={kata}
                              batal={s("bahaya.batal")} nama="aksi" nilai="AKHIRI" />
                            <Link href={tautanUbah(null, `jendela-${w.id}`)} className={tautanTempat}>{s("config.angkat.batal")}</Link>
                          </form>
                        )
                      ) : null}
                    </li>
                    );
                  })}
                </ul>
              ) : (
                <Kosong jenis="belum" kalimat={sl("config.pemeliharaan.kosong")} />
              )}
              {result("pemeliharaan", "jendela")}
              <Penomoran halaman={halJendela} lagi={kelola?.lagiPemeliharaan === true} ke={(n) => tautanHalaman(jalanIni, sp, "hal_jendela", n, "pemeliharaan")} locale={locale}
                benda={sl("koleksi.benda.jendela")} jumlah={kelola?.pemeliharaan.length ?? 0} />
            </section>

            <section className="mt-4" aria-labelledby="pin-pm-umum">
              <h2 id="pin-pm-umum" className="font-medium">{sl("config.pemeliharaan.pengumuman")}</h2>
              <p className="mt-1 text-sm text-ink-2">{sl("config.pemeliharaan.pengumuman.arti")}</p>
              {kelola && kelola.pengumuman.length > 0 ? (
                <ul className="mt-2 grid gap-2 text-sm">
                  {kelola.pengumuman.map((n) => {
                    const kata = sl("config.pemeliharaan.pengumuman.tarik");
                    const nama = n.pesan.slice(0, 80);
                    return (
                    <li key={n.id} id={`pengumuman-${n.id}`} data-pengumuman={n.id} data-terbuka={ubah === n.id ? "" : undefined}
                      className={`grid gap-1 rounded-[var(--radius-1)] px-3 py-2 ${ubah === n.id ? "bg-surface-2" : "border-b border-line-1"}`}>
                      <span className="text-ink-1">{n.pesan}</span>
                      <span className="text-ink-2">
                        {when(n.terbit, "hariJam")} {sl("config.pemeliharaan.hingga")} {when(n.sampai, "hariJam")}
                        {n.platform ? <> · {sl("config.pemeliharaan.platform")}</> : null}
                        {n.ditarik ? <> · <strong className="pin-pill pin-neutral">{sl("config.pemeliharaan.pengumuman.ditarik")}</strong></> : null}
                      </span>
                      {n.boleh && !n.ditarik ? (
                        ubah !== n.id ? (
                          <div>
                            <Link href={tautanUbah(n.id, `pengumuman-${n.id}`)} className={button} data-buka-ubah="">
                              {kata}<span className="pin-sr"> · {nama}</span>
                            </Link>
                          </div>
                        ) : (
                          <form action={tarikPengumumanAction} className="flex flex-wrap items-end gap-2" aria-label={`${kata} · ${nama}`}><input type="hidden" name="asal" value="tarik" /><input type="hidden" name="hal_pengumuman" value={String(halPengumuman)} />
                            <input type="hidden" name="pengumuman" value={n.id} />
                            <label className={label}>{sl("config.pemeliharaan.alasan")}
                              <input name="alasan" className={field} required maxLength={300} autoComplete="off" autoFocus />
                            </label>
                            <KonfirmasiBahaya sibuk={s("tombol.memproses")} id={`pengumuman-${n.id}`} tombol={kata} tanya={sl("config.pemeliharaan.pengumuman.tarik.tanya")} ya={kata}
                              batal={s("bahaya.batal")} />
                            <Link href={tautanUbah(null, `pengumuman-${n.id}`)} className={tautanTempat}>{s("config.angkat.batal")}</Link>
                          </form>
                        )
                      ) : null}
                    </li>
                    );
                  })}
                </ul>
              ) : (
                <Kosong jenis="belum" kalimat={sl("config.pemeliharaan.pengumuman.kosong")} />
              )}
              {result("pemeliharaan", "tarik")}
              <Penomoran halaman={halPengumuman} lagi={kelola?.lagiPengumuman === true} ke={(n) => tautanHalaman(jalanIni, sp, "hal_pengumuman", n, "pemeliharaan")} locale={locale}
                benda={sl("koleksi.benda.pengumuman")} jumlah={kelola?.pengumuman.length ?? 0} />
              <form action={terbitkanPengumumanAction} className="mt-3 grid max-w-[var(--measure-narrow)] gap-2"><input type="hidden" name="asal" value="umumkan" />
                <fieldset className="grid gap-1 text-sm">
                  <legend className="text-ink-2">{sl("config.pemeliharaan.cakupan")}</legend>
                  {platformIni ? (
                    <label className="flex items-center gap-2"><input type="checkbox" name="platform" value="1" /> {sl("config.pemeliharaan.platform")}</label>
                  ) : null}
                  {sekolahKu.map((i) => (
                    <label key={i.id} className="flex items-center gap-2"><input type="checkbox" name="sekolah" value={i.id} /> {i.name}</label>
                  ))}
                </fieldset>
                <label className={label}>{sl("config.pemeliharaan.pengumuman.pesan")}
                  <input name="pesan" className={field} required maxLength={500} autoComplete="off" />
                </label>
                <div className="pin-baris-isian">
                  <div className={label}>
                    <label htmlFor="cfg-pengumuman-terbit">{sl("config.pemeliharaan.pengumuman.terbit")}</label>
                    <TanggalDenganGema jenis="datetime-local" id="cfg-pengumuman-terbit" name="terbit" className={field} locale={locale} />
                  </div>
                  <div className={label}>
                    <label htmlFor="cfg-pengumuman-sampai">{sl("config.pemeliharaan.pengumuman.sampai")}</label>
                    <TanggalDenganGema jenis="datetime-local" id="cfg-pengumuman-sampai" name="sampai" className={field} required locale={locale} />
                  </div>
                </div>
                <div><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.pemeliharaan.pengumuman.terbitkan")}</TombolKirim></div>
              </form>
              {result("pemeliharaan", "umumkan")}
            </section>

            {platformIni ? (
              <section className="mt-6 grid gap-2 rounded-[var(--radius-1)] border border-line-1 px-3 py-3" data-hentikan="1" aria-labelledby="pin-pm-henti">
                <h2 id="pin-pm-henti" className="font-medium">{sl("config.pemeliharaan.darurat.judul")}</h2>
                <p className="text-sm text-ink-2">{sl("config.pemeliharaan.darurat.arti")}</p>
                <form action={hentikanSekarangAction} className="grid max-w-[var(--measure-narrow)] gap-2"><input type="hidden" name="asal" value="henti" />
                  <fieldset className="grid gap-1 text-sm">
                    <legend className="text-ink-2">{sl("config.pemeliharaan.cakupan")}</legend>
                    <label className="flex items-center gap-2"><input type="checkbox" name="platform" value="1" /> {sl("config.pemeliharaan.platform")}</label>
                    {sekolahKu.map((i) => (
                      <label key={i.id} className="flex items-center gap-2"><input type="checkbox" name="sekolah" value={i.id} /> {i.name}</label>
                    ))}
                  </fieldset>
                  <label className={label}>{sl("config.pemeliharaan.alasan")}
                    <input name="alasan" className={field} required maxLength={300} autoComplete="off" />
                  </label>
                  <label className={label}>{sl("config.pemeliharaan.darurat.ketik")}
                    <input name="konfirmasi" className={field} required autoComplete="off" pattern={KONFIRMASI_HENTIKAN} />
                  </label>
                  <div><TombolKirim className={bahaya} sibuk={s("tombol.memproses")}>{sl("config.pemeliharaan.darurat.tombol")}</TombolKirim></div>
                </form>
                {result("pemeliharaan", "henti")}
              </section>
            ) : null}
          </section>
          ) : null}

          {/* DAISY-07 (B6b). THE SCHOOL'S REPORTS, one click away. BOB-06 gave
              every school PINTAR's standard class and school reports; nothing
              linked to them, so an administrator had to type an id. The school
              summary is read at the school's own root node and each class's at
              that class, for the school chosen above. A link decides nothing:
              generate_report decides every figure for this reader. */}
          {/* B1: only the page's own section is drawn */}{tampilDi("laporan") ? (
<section id="laporan" hidden={!tampilDi("laporan") || undefined} className={card}>
            <h2 className="font-medium">{sl("config.laporan.judul")}</h2>
            {sekolahStruktur ? (
              <>
                <p className="mt-1 text-sm text-ink-2">{sl("config.laporan.arti")}</p>
                {/* B1 §1 «Laporan»: link rows, the school's summary first, then each active class's */}
                <nav className="mt-3 grid gap-3 text-sm" aria-label={sl("config.laporan.judul")}>
                  {akar ? (
                    <ul className="grid">
                      <li className="border-b border-line-1 px-3 py-2">
                        <Link href={`/dekan/ringkasan?simpul=${(akar as { id: string }).id}&dari=konfigurasi`} className={tautanTempat}>
                          {sl("config.laporan.sekolah")} · {sekolahStruktur.name}
                          <TandaTautan />
                        </Link>
                      </li>
                    </ul>
                  ) : null}
                  <h2 className="font-medium text-ink-1">{sl("config.laporan.kelas")}</h2>
                  {kelasAktif.length > 0 ? (
                    <ul className="grid">
                      {kelasAktif.map((k) => (
                        <li key={k.node_id} className="border-b border-line-1 px-3 py-2">
                          <Link href={`/edukator/ringkasan?kelas=${k.node_id}&dari=konfigurasi`} className={tautanTempat}>
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
          ) : null}

          {/* System & Configuration: institutions and periods */}
          {/* B1: only the page's own section is drawn */}{tampilDi("system") ? (<>
<section id="system" hidden={!tampilDi("system") || undefined} className={card}>
            <h2 className="font-medium">{s("config.section.system")}</h2>
            {/* B1 §1 «Sistem & Konfigurasi»: read-only records; the state and «data uji» as badges, the years in words */}
            <ul className="mt-2 grid text-sm text-ink-2">
              {(institutions ?? []).map((i) => (
                <li key={i.id} className="border-b border-line-1 px-3 py-2" data-sekolah-baris="">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2 text-ink-1">{i.name}{i.is_synthetic && platformIni ? <span className="pin-pill pin-info">{s("config.sekolah.sintetis")}</span> : null}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      {/* Sharon F1: the school's own clock, the one its dates are decided on */}
                      <span className="pin-pill pin-neutral" data-zona={zonaSah(i.zona_waktu)}>{s(`config.sekolah.zona.${zonaSah(i.zona_waktu)}` as HleEvent)}</span>
                      <span className={`pin-pill ${i.is_active ? "pin-ok" : "pin-neutral"}`}>{s(i.is_active ? "config.sekolah.aktif" : "config.sekolah.nonaktif")}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-3">
                    {(periods ?? []).filter((p) => p.institution_id === i.id).map((p) => `${p.name} (${when(p.starts_on, "baca")} – ${when(p.ends_on, "baca")})`).join(" · ") || s("config.empty")}
                  </p>
                </li>
              ))}
              {(institutions ?? []).length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
            {platformKonteks ? (
              <Penomoran halaman={halSekolah} lagi={lagiSekolah} ke={(n) => tautanHalaman(jalanIni, sp, "hal_sekolah", n, "system")} locale={locale}
                benda={sl("koleksi.benda.sekolah")} jumlah={(institutions ?? []).length} />
            ) : null}
          </section>
          {/* Sharon F1 (7a2c1751): the Admin PINTAR sets a school's own clock, apart from the read-only rows above */}
          {platformIni && (institutions ?? []).length > 0 ? (
            <section id="zona" className={card} aria-labelledby="pin-zona">
              <h2 id="pin-zona" className="font-medium">{s("config.sekolah.zona.label")}</h2>
              <form action={aturZonaWaktuAction} className="mt-2 flex flex-wrap items-end gap-2" data-zona-form="">
                <input type="hidden" name="asal" value="zona" />
                <label className="grid gap-1 text-xs text-ink-2">
                  {s("config.sekolah.zona.sekolah")}
                  <select name="sekolah" className="pin-input" required defaultValue="">
                    <option value="" disabled>—</option>
                    {(institutions ?? []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-ink-2">
                  {s("config.sekolah.zona.label")}
                  <select name="zona" className="pin-input" required defaultValue="">
                    <option value="" disabled>—</option>
                    {ZONA_SEKOLAH.map((z) => <option key={z} value={z}>{s(`config.sekolah.zona.${z}` as HleEvent)}</option>)}
                  </select>
                </label>
                <TombolKirim className="pin-btn justify-self-start" sibuk={s("tombol.memproses")}>{s("config.sekolah.zona.simpan")}</TombolKirim>
              </form>
              {result("system", "zona")}
            </section>
          ) : null}
          </>) : null}

          {/* Period rollover (INV-23) */}
          {/* B1: only the page's own section is drawn */}{tampilDi("rollover") ? (
<section id="rollover" hidden={!tampilDi("rollover") || undefined} className={card}>
            <h2 className="font-medium">{s("config.section.rollover")}</h2>
            {/* «Kenaikan kelas dan kelulusan» (Daisy's approved flow; owner, 9 Nov): every learner of the class decided,
                reviewed and confirmed once, replacing the class-to-class run (period_rollover) the demonstration found blind */}
            {myInstitutions.map((inst) => (
              <div key={inst.id} className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3" data-kenaikan-sekolah={inst.id}>
                {myInstitutions.length > 1 ? <h2 className="text-sm font-medium">{inst.name}</h2> : null}
                <KenaikanKelas sekolah={inst.id} sp={sp} locale={locale} />
              </div>
            ))}
            {result("rollover")}
          </section>
          ) : null}

          {/* Transfers (INV-25; policy hooks only — OD-9) */}
          {/* B1: only the page's own section is drawn */}{tampilDi("transfers") ? (
<section id="transfers" hidden={!tampilDi("transfers") || undefined} className={card}>
            <h2 className="font-medium">{s("config.section.transfers")}</h2>
            <ul className="mt-2 grid gap-1 text-sm text-ink-2">
              {daftarPindah.map((x) => (
                // B1 §1 «Perpindahan murid»: each transfer a record, its status the Badge, its actions at its end and named
                // with it; «Tolak» opens its reason in place (?ubah=)
                <li key={x.id} id={`pindah-${x.id}`} data-terbuka={ubah === x.id ? "" : undefined}
                  className={`grid gap-2 rounded-[var(--radius-1)] px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center ${ubah === x.id ? "bg-surface-2" : "border-b border-line-1"}`}>
                  <div>
                    <span>{namaPindah.get(x.person_id) ?? namaMasuk.get(x.id) ?? TANPA_NAMA}</span>
                    <span className="text-ink-3"> · {institutionName.get(x.from_institution_id) ?? TANPA_NAMA} → {institutionName.get(x.to_institution_id) ?? TANPA_NAMA}</span>
                    <span className="pin-pill pin-info ml-2">{transferLabel(x.status)}</span>
                    {x.reason ? <p className="text-xs text-ink-3">{x.reason}</p> : null}
                    {/* W2.15: a request this school sent waits on the receiving school, which chooses its school year */}
                    {x.status === "REQUESTED" && x.to_academic_period_id === null && x.from_institution_id === satuSekolah
                      ? <p className="text-xs text-ink-3">{s("pindah.menunggu_tujuan")}</p> : null}
                  </div>
                  {(x.status === "REQUESTED" || x.status === "AUTHORIZED") && (
                    <div className="flex flex-wrap gap-2">
                      {x.status === "REQUESTED" && x.to_academic_period_id !== null && (
                        <form action={transferAuthorizeAction}><input type="hidden" name="asal" value="baris" /><input type="hidden" name="hal_pindah" value={String(halPindah)} /><input type="hidden" name="transfer" value={x.id} /><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("config.action.authorize")}<span className="pin-sr"> · {namaPindah.get(x.person_id) ?? namaMasuk.get(x.id) ?? TANPA_NAMA}</span></TombolKirim></form>
                      )}
                      {x.status === "AUTHORIZED" && (
                        <form action={transferExecuteAction}><input type="hidden" name="asal" value="baris" /><input type="hidden" name="hal_pindah" value={String(halPindah)} /><input type="hidden" name="transfer" value={x.id} /><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("config.action.execute")}<span className="pin-sr"> · {namaPindah.get(x.person_id) ?? namaMasuk.get(x.id) ?? TANPA_NAMA}</span></TombolKirim></form>
                      )}
                      {ubah !== x.id ? (
                        <Link href={tautanUbah(x.id, `pindah-${x.id}`)} className={button} data-buka-ubah="">
                          {s("config.action.reject")}<span className="pin-sr"> · {namaPindah.get(x.person_id) ?? namaMasuk.get(x.id) ?? TANPA_NAMA}</span>
                        </Link>
                      ) : (
                        <form action={transferRejectAction} className="flex flex-wrap gap-2" aria-label={`${s("config.action.reject")} · ${namaPindah.get(x.person_id) ?? namaMasuk.get(x.id) ?? TANPA_NAMA}`}><input type="hidden" name="asal" value="baris" /><input type="hidden" name="hal_pindah" value={String(halPindah)} />
                          <input type="hidden" name="transfer" value={x.id} />
                          <label className="flex items-center gap-1 text-xs text-ink-3" htmlFor={`alasan-${x.id}`}>{s("config.label.reason")}</label>
                          <input id={`alasan-${x.id}`} name="reason" className={field} autoFocus />
                          <TombolKirim className={bahaya} sibuk={s("tombol.memproses")}>{s("config.action.reject")}</TombolKirim>
                          <Link href={tautanUbah(null, `pindah-${x.id}`)} className={tautanTempat}>{s("config.angkat.batal")}</Link>
                        </form>
                      )}
                    </div>
                  )}
                </li>
              ))}
              {daftarPindah.length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
            {result("transfers", "baris")}
            <Penomoran halaman={halPindah} lagi={lagiPindah} ke={(n) => tautanHalaman(jalanIni, sp, "hal_pindah", n, "transfers")} locale={locale}
              benda={sl("koleksi.benda.pindah")} jumlah={daftarPindah.length} />
            {/* W2.15: the receiving school's incoming requests, accepted into one of its own school years */}
            {satuSekolah && pindahMasuk.length > 0 ? (
              <div className="mt-3 grid gap-2" data-pindah="masuk">
                <h2 className="text-sm font-medium">{s("pindah.masuk.judul")}</h2>
                {pindahMasuk.map((m) => (
                  <form key={m.transfer_id} action={transferTerimaAction} className="grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3 sm:grid-cols-2" data-pindah-masuk={m.transfer_id}><input type="hidden" name="asal" value="terima" />
                    <input type="hidden" name="transfer" value={m.transfer_id} />
                    <p className="sm:col-span-2 text-sm">
                      <strong>{m.nama_murid}</strong> · {s("pindah.masuk.dari")} {m.dari_sekolah}{m.dari_kode ? ` (${m.dari_kode})` : ""}
                      {m.alasan ? <span className="block text-xs text-ink-3">{m.alasan}</span> : null}
                    </p>
                    <label className={label}>{s("pindah.masuk.tahun")}
                      <select name="to_period" className={field} required defaultValue="">
                        <option value="" disabled>—</option>
                        {(periods ?? []).filter((p) => p.institution_id === satuSekolah).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </label>
                    <label className={label}>{s("pindah.masuk.program")} <span className="pin-opsional">{s("bentuk.opsional")}</span>
                      <select name="to_programme" className={field} defaultValue="">
                        <option value="">—</option>
                        {(nodes ?? []).filter((n) => n.kind === "PROGRAMME" && n.is_active && n.institution_id === satuSekolah).map((n) => (
                          <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                      </select>
                    </label>
                    {/* the place the learner is placed in on arrival (20261231100000): an active Kelas or Tingkat of this
                        school; transfer_terima refuses one outside the chosen school year (PLACE_INVALID) */}
                    <label className={label}>{s("pindah.masuk.kelas")}
                      <select name="to_place" className={field} required defaultValue="">
                        <option value="" disabled>—</option>
                        {(nodes ?? []).filter((n) => (n.kind === "CLASS" || n.kind === "COHORT") && n.is_active && n.institution_id === satuSekolah).map((n) => (
                          <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                      </select>
                    </label>
                    <div><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("pindah.masuk.terima")}</TombolKirim></div>
                  </form>
                ))}
              </div>
            ) : null}
            {result("transfers", "terima")}
            {/* W2.15 (F-10): a transfer out, to a school found by its exact name or code */}
            {satuSekolah ? (
              <div className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3" data-pindah="keluar">
                <h2 className="text-sm font-medium">{s("pindah.keluar.judul")}</h2>
                <p className="text-xs text-ink-3">{s("pindah.keluar.arti")}</p>
                <form method="get" action="/konfigurasi/transfers#transfers" className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="bagian" value="transfers" />
                  <label className={label}>{s("pindah.cari.label")}
                    <input name="cari_sekolah" className={field} defaultValue={cariSekolah} minLength={3} maxLength={120} required autoComplete="off" />
                  </label>
                  <button type="submit" className={button}>{s("pindah.cari.tombol")}</button>
                </form>
                {cariSekolah && galatCari ? <BarisHasil nada="gagal">{s("galat.transfer_search_short")}</BarisHasil> : null}
                {cariSekolah && !galatCari && tujuanDitemukan.length === 0 ? <Kosong jenis="tidak_cocok" kalimat={s("pindah.cari.kosong")} /> : null}
                {tujuanDitemukan.length > 0 ? cariOrangForm("transfers", { cari_sekolah: cariSekolah }) : null}
                {tujuanDitemukan.length > 0 ? (
                  <form action={transferMintaAction} className="grid gap-2 sm:grid-cols-2">
                    <fieldset className="sm:col-span-2 grid gap-1">
                      <legend className={label}>{s("pindah.tujuan")}</legend>
                      {tujuanDitemukan.map((x, i) => (
                        <label key={x.institution_id} className="flex items-center gap-2 text-sm">
                          <input type="radio" name="to_institution" value={x.institution_id} defaultChecked={i === 0} required />
                          {x.nama}{x.kode ? ` (${x.kode})` : ""}
                        </label>
                      ))}
                    </fieldset>
                    <label className={`${label} sm:col-span-2`}>{s("config.label.enrollment")}
                      <select name="from_enrollment" className={field} required defaultValue="">
                        <option value="" disabled>—</option>
                        {(enrollments ?? []).filter((e) => e.institution_id === satuSekolah && e.member_kind !== "PARTICIPANT").map((e) => (
                          <option key={e.id} value={e.id}>{personName.get(e.person_id) ?? TANPA_NAMA} · {periodName.get(e.academic_period_id) ?? ""}</option>
                        ))}
                      </select>
                    </label>
                    <label className={`${label} sm:col-span-2`}>{s("config.label.reason")}
                      <input name="reason" className={field} required minLength={3} maxLength={500} />
                    </label>
                    <div><TombolKirim className={primer} sibuk={s("tombol.mengirim")}>{s("config.action.request_transfer")}</TombolKirim></div>
                  </form>
                ) : null}
              </div>
            ) : null}
            {/* the evaluation persona's page keeps the platform-wide form it had (C10) */}
            {lama ? (
            <form action={transferRequestAction} className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3 sm:grid-cols-2">
              <label className={`${label} sm:col-span-2`}>{s("config.label.enrollment")}
                <select name="from_enrollment" className={field} required defaultValue="">
                  <option value="" disabled>—</option>
                  {(enrollments ?? []).filter((e) => (platformIni || sekolahIni.includes(e.institution_id))
                    && e.member_kind !== "PARTICIPANT").map((e) => (
                    <option key={e.id} value={e.id}>
                      {personName.get(e.person_id) ?? TANPA_NAMA} · {institutionName.get(e.institution_id) ?? TANPA_NAMA} · {periodName.get(e.academic_period_id) ?? ""}
                    </option>
                  ))}
                </select>
              </label>
              {/* CR-41 (D-140(c)): the destination is chosen by name from the schools, school years and programmes this
                  reader may already read, never typed as an internal id. Nothing new becomes readable: a school the
                  reader cannot see is not offered (the application pass log, CR-41, records that limit). */}
              <label className={label}>{s("config.label.destination_institution")}
                <select name="to_institution" className={field} required defaultValue="">
                  <option value="" disabled>—</option>
                  {(institutions ?? []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </label>
              <label className={label}>{s("config.label.destination_period")}
                <select name="to_period" className={field} required defaultValue="">
                  <option value="" disabled>—</option>
                  {(periods ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{institutionName.get(p.institution_id) ?? TANPA_NAMA} · {p.name}</option>
                  ))}
                </select>
              </label>
              <label className={label}>{s("config.label.destination_programme")} <span className="pin-opsional">{s("bentuk.opsional")}</span>
                <select name="to_programme" className={field} defaultValue="">
                  <option value="">—</option>
                  {(nodes ?? []).filter((n) => n.kind === "PROGRAMME" && n.is_active).map((n) => (
                    <option key={n.id} value={n.id}>{institutionName.get(n.institution_id) ?? TANPA_NAMA} · {n.name}{n.academic_period_id ? ` · ${periodName.get(n.academic_period_id) ?? ""}` : ""}</option>
                  ))}
                </select>
              </label>
              <label className={label}>{s("config.label.reason")}<input name="reason" className={field} /></label>
              <p className="text-xs text-ink-3 sm:col-span-2">{s("config.label.destination_help")}</p>
              <div><TombolKirim className={primer} sibuk={s("tombol.mengirim")}>{s("config.action.request_transfer")}</TombolKirim></div>
            </form>
            ) : null}
            {result("transfers")}
          </section>
          ) : null}

          {/* Roles (INV-16) */}
          {/* B1: only the page's own section is drawn */}{tampilDi("roles") ? (
<section id="roles" hidden={!tampilDi("roles") || undefined} className={card}>
            <h2 className="font-medium">{s("config.section.roles")}</h2>
            {/* Readiness (Daisy, 8 Nov): what this section is, and the teacher's order (B2) */}
            <p className="mt-1 text-sm text-ink-2" data-peran-arti="">{s("config.roles.arti")}</p>
            <ul className="mt-2 grid gap-1 text-sm text-ink-2">
              {daftarPeran.map((a) => (
                // CR-94: below 640 px the revoke form wraps below the name instead of past the window; wider, as before
                <li key={a.id} id={`peran-${a.id}`} data-terbuka={ubah === a.id ? "" : undefined}
                  className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 rounded-[var(--radius-1)] px-3 py-2 ${ubah === a.id ? "bg-surface-2" : "border-b border-line-1"}`}>
                  <span>
                    {/* E5 and §11 (owner, 9 Nov): the name opens the person's page, where their roles change or end at this school */}
                    {a.scope_node_id && a.person_id !== viewer.personId
                      ? <Link href={`/konfigurasi/staf?orang=${a.person_id}`} className={tautanTempat} data-staf-buka={a.person_id}>{personName.get(a.person_id) ?? TANPA_NAMA}</Link>
                      : (personName.get(a.person_id) ?? TANPA_NAMA)} · {roleLabel(a.role)}
                    <span className="text-ink-3"> · {a.scope_node_id ? nodeName.get(a.scope_node_id) ?? TANPA_NAMA : s("role.SYSTEM_ADMIN")} · {s("config.label.valid_until").toLowerCase()} {when(a.valid_until, "baca")}</span>
                  </span>
                  {a.person_id !== viewer.personId && ubah !== a.id ? (
                    // B1: the row's one action, named with its record so a list of links is unambiguous («Cabut · Citra Lestari»)
                    <Link href={tautanUbah(a.id, `peran-${a.id}`)} className={button} data-buka-ubah="">
                      {s("config.action.revoke")}<span className="pin-sr"> · {personName.get(a.person_id) ?? TANPA_NAMA}</span>
                    </Link>
                  ) : null}
                  {a.person_id !== viewer.personId && ubah === a.id ? (
                    // D-097(a): a revocation states why; opened in place, its form is named like its action, and destructive
                    <form action={revokeRoleAction} className="flex flex-wrap items-center gap-2" aria-label={`${s("config.action.revoke")} · ${personName.get(a.person_id) ?? TANPA_NAMA}`}><input type="hidden" name="asal" value="cabut" /><input type="hidden" name="hal_peran" value={String(halPeran)} />
                      <input type="hidden" name="assignment" value={a.id} />
                      <label className="flex items-center gap-1 text-xs text-ink-3">{s("config.label.reason")}
                        <input name="alasan" className={field} required maxLength={300} autoComplete="off" autoFocus />
                      </label>
                      <TombolKirim className={bahaya} sibuk={s("tombol.memproses")}>{s("config.action.revoke")}</TombolKirim>
                      <Link href={tautanUbah(null, `peran-${a.id}`)} className={tautanTempat}>{s("config.angkat.batal")}</Link>
                    </form>
                  ) : null}
                </li>
              ))}
              {daftarPeran.length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
            {result("roles", "cabut")}
            <Penomoran halaman={halPeran} lagi={lagiPeran} ke={(n) => tautanHalaman(jalanIni, sp, "hal_peran", n, "roles")} locale={locale}
              benda={sl("koleksi.benda.peran")} jumlah={daftarPeran.length} ukuran={UKURAN_PERAN} />
            {angkat ? (
              <div className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3" role="group" aria-labelledby="pin-angkat">
                <h2 id="pin-angkat" className="font-medium">{s("config.angkat.judul")}</h2>
                <p className="text-sm text-ink-1"><strong>{angkat.nama}</strong> · {roleLabel("INSTITUTION_ADMIN")} · {angkat.tempat}</p>
                <p className="text-sm text-ink-2">{s("config.angkat.arti")}</p>
                <form action={grantRoleAction} className="flex flex-wrap items-center gap-3"><input type="hidden" name="asal" value="angkat" />
                  <input type="hidden" name="person" value={angkat.person} />
                  <input type="hidden" name="role" value="INSTITUTION_ADMIN" />
                  <input type="hidden" name="scope" value={angkat.scope} />
                  <input type="hidden" name="valid_until" value={angkat.sampai} />
                  <input type="hidden" name="yakin" value="ya" />
                  <TombolKirim className={primer} sibuk={s("tombol.menyimpan")}>{s("config.angkat.ya")}</TombolKirim>
                  <Link href={alamatBagian("roles", undefined, "roles")} className={tautanTempat}>{s("config.angkat.batal")}</Link>
                </form>
              </div>
            ) : null}
            {result("roles", "angkat")}
            {bukaAdminPertama && satuSekolah ? (
              <div className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3" role="group" aria-labelledby="pin-admin-pertama" data-admin-pertama="">
                <h2 id="pin-admin-pertama" className="font-medium">{s("config.pertama.judul")}</h2>
                <p className="text-sm text-ink-2">{s("config.pertama.arti")}</p>
                {pertama ? (
                  <form action={tunjukAdminPertamaAction} className="flex flex-wrap items-center gap-3"><input type="hidden" name="asal" value="pertama" />
                    <p className="w-full text-sm text-ink-1">{s("config.pertama.yakin")}</p>
                    <p className="w-full text-sm text-ink-1"><strong>{pertama.display_name}</strong> · {roleLabel("INSTITUTION_ADMIN")} · {institutionName.get(satuSekolah) ?? TANPA_NAMA}</p>
                    <input type="hidden" name="person" value={pertama.person_id} />
                    <input type="hidden" name="sekolah" value={satuSekolah} />
                    <input type="hidden" name="valid_until" value={sp.sampai} />
                    <input type="hidden" name="yakin" value="ya" />
                    <TombolKirim className={primer} sibuk={s("tombol.menyimpan")}>{s("config.angkat.ya")}</TombolKirim>
                    <Link href={alamatBagian("roles", undefined, "roles")} className={tautanTempat}>{s("config.angkat.batal")}</Link>
                  </form>
                ) : (
                  <form action={tunjukAdminPertamaAction} className="grid gap-2 sm:grid-cols-2"><input type="hidden" name="asal" value="pertama" />
                    <input type="hidden" name="sekolah" value={satuSekolah} />
                    <label className={label}>{s("config.label.person")}
                      <select name="person" className={field} required defaultValue="">
                        <option value="" disabled>—</option>
                        {calonPertama.map((p) => <option key={p.person_id} value={p.person_id}>{p.display_name}</option>)}
                      </select>
                    </label>
                    <div className={label}>
                      <label htmlFor="cfg-admin-pertama-sampai">{s("config.label.valid_until")}</label>
                      <TanggalDenganGema id="cfg-admin-pertama-sampai" name="valid_until" className={field} required locale={locale} />
                    </div>
                    <div><TombolKirim className={primer} sibuk={s("tombol.menyimpan")}>{s("config.action.grant")}</TombolKirim></div>
                  </form>
                )}
              </div>
            ) : null}
            {result("roles", "pertama")}
            <div className="mt-3">{cariOrangForm("roles")}</div>
            <form action={grantRoleAction} className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3 sm:grid-cols-2" aria-labelledby="pin-beri-peran">
              <h2 id="pin-beri-peran" className="font-medium sm:col-span-2">{s("config.action.grant")}</h2>
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
                  {/* D-101 (2): a School Admin may appoint another, at the school itself; Admin platform stays the platform's */}
                  {(["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", ...(sekolahIni.length > 0 || (lama && isSys === true) ? ["INSTITUTION_ADMIN"] : []), ...(platformIni ? ["SYSTEM_ADMIN"] : [])]).map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </label>
              <label className={label}>{s("config.label.scope")}
                <span className="text-xs text-ink-3">{s("config.roles.lingkup_arti")}</span>
                {/* a school role needs its place; only the platform's own role (SYSTEM_ADMIN) has none */}
                <select name="scope" className={field} defaultValue="" required={!platformIni}>
                  <option value="">—</option>
                  {lingkupPeran(platformKonteks ? [] : nodes ?? [], institutionName).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <div className={label}>
                <label htmlFor="cfg-peran-sampai">{s("config.label.valid_until")}</label>
                <span className="text-xs text-ink-3" id="cfg-peran-sampai-arti">{s("config.roles.sampai_arti")}</span>
                <TanggalDenganGema id="cfg-peran-sampai" name="valid_until" className={field} required locale={locale} />
              </div>
              <div><TombolKirim className={primer} sibuk={s("tombol.menyimpan")}>{s("config.action.grant")}</TombolKirim></div>
            </form>
            {result("roles")}
          </section>
          ) : null}

          {/* Audit reader (INV-18) — read only */}
          {/* B1: only the page's own section is drawn */}{tampilDi("audit") ? (
<section id="audit" hidden={!tampilDi("audit") || undefined} className={card}>
            <h2 className="font-medium">{s("config.section.audit")}</h2>
            {/* B1 (D-166(a)), RV-24: the audit trail is the design system's Table (TableRows: striped, and the stripes
                print), with its caption. «Versi» is a platform operator's diagnostic: drawn for Admin platform only, and
                only when a row on this page carries a build; a row without one leaves its cell empty, never «—». */}
            <div className="pin-tabel-bingkai mt-2" role="region" tabIndex={0} aria-labelledby="pin-jejak-judul">
              <table className="pin-tabel text-sm text-ink-2" data-jejak="">
                <caption id="pin-jejak-judul" className="pin-sr">{s("config.section.audit")}</caption>
                <thead>
                  <tr><th scope="col">{s("config.label.when")}</th><th scope="col">{s("config.label.action")}</th><th scope="col">{s("config.label.target")}</th><th scope="col">{s("audit.kolom.oleh")}</th><th scope="col">{s("audit.kolom.alasan")}</th>{adaVersi ? <th scope="col">{s("config.label.build")}</th> : null}</tr>
                </thead>
                <tbody>
                  {barisJejak.map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap">{when(r.at)}</td>
                      {/* D-138(c), D-140(c): the action and the record in words; never the code, the table or an id. */}
                      <td>{kataAksiAudit(r.action, locale)}</td>
                      <td className="text-ink-3">{[kataTabelAudit(r.target_table, locale), r.institution_id ? institutionName.get(r.institution_id) ?? TANPA_NAMA : null].filter(Boolean).join(" · ") || TANPA_NAMA}</td>
                      {(() => {
                        // E7: who and why, from the summary keys written for it (src/lib/jejak-audit.ts alasanAudit)
                        const a = alasanAudit(r.summary, locale);
                        const nama = r.actor_person_id ? namaPelaku.get(r.actor_person_id as string) ?? null : null;
                        return (<>
                          <td data-jejak-oleh="">{r.actor_person_id ? [nama, a.peran].filter(Boolean).join(" · ")
                            // Sharon (ruling 8 on 7a2c1751): on a transfer row the unnamed actor is the other school's
                            || s(String(r.action).startsWith("transfer.") ? "audit.oleh.sekolah_lain" : "audit.oleh.tidak_terlihat")
                            : s("audit.oleh.sistem")}</td>
                          <td data-jejak-alasan="">{[a.alasan, a.berlaku ? s("audit.berlaku").replace("{tanggal}", when(a.berlaku, "baca")) : null].filter(Boolean).join(" · ") || ""}</td>
                        </>);
                      })()}
                      {adaVersi ? <td className="pin-num text-ink-3">{r.build_sha ? short(r.build_sha) : ""}</td> : null}
                    </tr>
                  ))}
                  {barisJejak.length === 0 && <tr className="pin-tabel-kosong"><td className="text-ink-3" colSpan={adaVersi ? 6 : 5}>{s("config.empty")}</td></tr>}
                </tbody>
              </table>
            </div>
            <Penomoran halaman={halamanDiminta(sp.hal_jejak)} lagi={(audit ?? []).length > UKURAN_JEJAK}
              ke={(n) => tautanHalaman(jalanIni, sp, "hal_jejak", n, "audit")} locale={locale}
              benda={sl("koleksi.benda.jejak")} jumlah={Math.min((audit ?? []).length, UKURAN_JEJAK)} ukuran={UKURAN_JEJAK} />
          </section>
          ) : null}

          {/* W8-02 — REPORT CONFIGURATION.
              PINTAR owns the metrics; the school owns the selection. The form
              below can send a metric id, an order and a visualization, and
              nothing else: there is no field for a formula, a meaning, an
              audience or a minimum sample, because those are not an
              institution's to set. `save_report_template` asks for
              CAN_MANAGE_REPORT_TEMPLATES before it resolves anything, and the
              row guards ask again on every write — this panel is a form, not
              an authority. */}
          {/* B1: only the page's own section is drawn */}{tampilDi("intelligence") ? (
<section id="intelligence" hidden={!tampilDi("intelligence") || undefined} className={card}>
            <h2 className="font-medium">{s("laporan.templat.judul")}</h2>
            <p className="mt-2 text-sm text-ink-3">{s("laporan.templat.penjelasan")}</p>

            {myTemplates.length === 0 ? (
              <Kosong jenis="belum" kalimat={s("laporan.templat.kosong")} />
            ) : (
              <ul className="mt-3 grid text-sm">
                {myTemplates.map((tpl) => (
                  <li key={tpl.id} className="border-b border-line-1 px-3 py-2">
                    <span className="font-medium">{kata(tpl.title_key) ?? TANPA_NAMA}</span>
                    <span className="text-ink-3"> · {kataLaporan("standar", tpl.standard_report)} · {s("laporan.templat.versi")} {tpl.template_version}</span>
                    <p className="mt-1 text-ink-2">
                      {(metricsByTemplate.get(tpl.id) ?? []).map((m) => `${namaMetrik.get(m.metric_id) ?? TANPA_NAMA} (${kataLaporan("tampilan", m.visualization)})`).join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {myInstitutions.length === 0 || (metricDefs ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-ink-3">{s("laporan.templat.tak_berwenang")}</p>
            ) : (
              <form action={saveReportTemplateAction} className="mt-4 grid max-w-[var(--measure-narrow)] gap-3">
                <div className="pin-baris-isian">
                <label className={label}>{s("laporan.templat.institusi")}
                  <select name="institution" className={field} required defaultValue={myInstitutions[0]?.id}>
                    {myInstitutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </label>
                <label className={label}>{s("laporan.templat.jenis")}
                  <select name="standard_report" className={field} required>
                    {STANDARD_REPORTS.map((r) => <option key={r} value={r}>{kataLaporan("standar", r)}</option>)}
                  </select>
                </label>
                </div>
                <label className={label}>{s("laporan.templat.judul_kunci")}
                  {/* D-140(c): the title is chosen by its words; the copy key it stores is never typed */}
                  <select name="title_key" className={field} required defaultValue="laporan.kelas.judul">
                    {JUDUL_LAPORAN.map((k) => <option key={k} value={k}>{s(k)}</option>)}
                  </select>
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
                      <span className="min-w-[14rem] text-ink-2">{namaMetrik.get(d.metric_id) ?? TANPA_NAMA}{/* D-140 (RV-6): a class
                        figure and a school figure can share a name, so the scope is said beside it */}
                        {d.metric_id.startsWith("class.") ? <span className="text-ink-3"> · {s("laporan.templat.lingkup.kelas")}</span>
                          : d.metric_id.startsWith("institution.") ? <span className="text-ink-3"> · {s("laporan.templat.lingkup.sekolah")}</span> : null}</span>
                      {/* No selection is the default: an empty visualization
                          is how a metric is left out, so the form cannot
                          silently include one nobody ticked. */}
                      <select name={`metric[${d.metric_id}]`} className={field} defaultValue="">
                        <option value="">{s("laporan.templat.tidak_dipakai")}</option>
                        {(d.allowed_visualizations ?? []).map((v: string) => <option key={v} value={v}>{kataLaporan("tampilan", v)}</option>)}
                      </select>
                    </label>
                  ))}
                </fieldset>
                <div><TombolKirim className={primer} sibuk={s("tombol.menyimpan")}>{s("laporan.templat.simpan")}</TombolKirim></div>
              </form>
            )}
            {result("intelligence")}
          </section>
          ) : null}
        </div>
        {/* B1: the index's sections, in five groups, each row the section's own title opening its page; the rows are
            the menu that was (navSemua through tampil, so the index and the sections agree, E-B1-5). The index is the
            page's navigation and never reaches the paper (W3.22). */}
        {bagianIni === null ? (
          <nav className="grid gap-4 pin-noprint" data-menu-bagian="" aria-label={sl("config.title")}>
            {KELOMPOK_KONFIGURASI.map((g) => {
              const baris = g.bagian.filter((b) => nav.some(([k]) => k === b));
              return baris.length === 0 ? null : (
                <section key={g.kunci} className={card} aria-labelledby={`pin-kelompok-${g.kunci.split(".").pop()}`} data-kelompok={g.kunci}>
                  <h2 id={`pin-kelompok-${g.kunci.split(".").pop()}`} className="font-medium">{sl(g.kunci as HleEvent)}</h2>
                  <ul className="mt-2 grid gap-1">
                    {baris.map((b) => (
                      <li key={b}>
                        <Link href={alamatBagian(b, sp.sekolah ? `sekolah=${encodeURIComponent(sp.sekolah)}` : undefined)}
                          className="flex min-h-[var(--control-md)] items-center justify-between gap-3 rounded-[var(--radius-1)] px-3 text-sm hover:bg-surface-2" data-bagian-ke={b}>
                          {judulBagian(b)}
                          <Ikon nama="chevron-right" />
                          <TandaTautan />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </nav>
        ) : null}
      </div>
    </main>
    </>
  );
}

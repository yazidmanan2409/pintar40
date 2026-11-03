import Link from "next/link";
import TandaTautan from "@/components/TandaTautan";
import Ikon from "@/components/Ikon";
import { t, format, allKeys, type HleEvent } from "@/lib/hle";
import Penomoran, { UKURAN, halamanDiminta, rentang, satuHalaman, tautanHalaman } from "@/components/koleksi/Penomoran";

// L4 (CR-88): the audit trail's page is the newest 50, the size CR-39 (J1.6) reads; other staff lists are 20 a page
const UKURAN_JEJAK = 50;
import { kalimatHasil, rujukan } from "@/lib/galat-kontrak";
import { nilaiSkema } from "@/lib/kesehatan-skema";
import KartuKesehatan, { type KeadaanKesehatan } from "@/components/konfigurasi/KartuKesehatan";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import {
  daftarkanPesertaAction, grantRoleAction, hentikanSekarangAction, jadwalkanPemeliharaanAction, pindahKelasAction,
  revokeRoleAction, rolloverAction, saveReportTemplateAction, tarikPengumumanAction, terbitkanPengumumanAction,
  tetapkanBatasAction, transferAuthorizeAction, transferExecuteAction, transferRejectAction, transferRequestAction,
  tunjukAdminPertamaAction, ubahPemeliharaanAction,
} from "./actions";
import { adaAdminSekolah, calonAdminPertama } from "@/lib/admin-pertama";
import { pelajaranDanBatas } from "@/lib/batas-ketuntasan";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { currentLocale } from "@/lib/locale";
import TabTempat, { tempatDariPeran } from "@/components/TabTempat";
import { navKonteks } from "@/components/NavKonteks";
import { CangkangStaf } from "@/components/CangkangPengalaman";
import ItemNav from "@/components/ItemNav";
import { kataAksiAudit, kataTabelAudit } from "@/lib/jejak-audit";
import { konteksHalaman } from "@/lib/konteks-server";
import { melayani } from "@/lib/konteks";
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
  // W2.15 (F-10): the directory search, a plain GET
  cari_sekolah?: string;
  // #148: the first step of scheduling, asked by a plain GET so the second step can show what the window would meet
  pm_cek?: string; pm_platform?: string; pm_sekolah?: string | string[]; pm_mulai?: string; pm_selesai?: string;
  // D-101 (2): «Admin sekolah» named on Peran & akses, waiting for its second press
  angkat?: string; lingkup?: string; sampai?: string; pertama?: string;
  // L4 (CR-88): the page of each bounded list
  hal_pindah?: string; hal_jejak?: string; hal_peran?: string; hal_sekolah?: string; hal_lapor?: string;
  hal_jendela?: string; hal_pengumuman?: string;
}>;

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
  const enrolmen = supabase.from("enrollments")
    .select("id, person_id, institution_id, academic_period_id, status, member_kind, persons(display_name)").eq("status", "ACTIVE");
  const jejak = supabase.from("audit_log").select("id, at, action, target_table, target_id, institution_id, build_sha");

  const [
    { data: institutionsDibaca }, { data: periodsDibaca }, { data: nodes }, { data: enrollments }, { data: transfers },
    { data: assignments }, { data: audit }, { data: lint, error: lintError }, { data: env },
    { data: awaiting }, [{ data: reportTemplates }, { data: templateMetrics }, { data: metricDefs }],
  ] = await Promise.all([
    satuSekolah
      ? supabase.from("institutions").select("id, name, slug, is_synthetic, is_active, tenant_kind").eq("id", satuSekolah)
      // W2.10 (Batch 4; CR-49, CAP-10): «Seluruh platform» lists the schools a page at a time, never every school at once
      : platformKonteks
        ? supabase.from("institutions").select("id, name, slug, is_synthetic, is_active, tenant_kind").order("name").order("id")
            .range(...rentang(halSekolah))
        : supabase.from("institutions").select("id, name, slug, is_synthetic, is_active, tenant_kind").order("name"),
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
    semuaSekolah ? enrolmen.order("created_at")
      : sekolahIni.length > 0 ? enrolmen.in("institution_id", sekolahIni).order("created_at") : tanpaBaris,
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
    (platformIni ? jejak : jejak.in("institution_id", sekolahIni)).order("at", { ascending: false }).order("id")
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
  const pindahMasuk = (Array.isArray(masukData) ? masukData : []) as Array<{
    transfer_id: string; nama_murid: string; dari_sekolah: string; dari_kode: string | null; alasan: string | null; diminta_pada: string;
  }>;
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

  const activeClassCount = (nodes ?? []).filter((n) => n.kind === "CLASS" && n.is_active).length;

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
          .filter((r) => r.institution_id === satuSekolah && (r.bucket === "ACTION_REQUIRED" || r.bucket === "AWAITING_MY_REVIEW"))
          .reduce((n, r) => n + Number(r.count ?? 0), 0))
      : Promise.resolve(0),
  ]);
  const menunggu: Array<{ k: string; href: string; kunci: HleEvent; n: number }> = [
    { k: "impor", href: "/pendataan", kunci: "config.menunggu.pendataan" as HleEvent, n: nImpor },
    { k: "akun", href: "/aktivasi", kunci: "config.menunggu.aktivasi" as HleEvent, n: nAkun },
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
  const sl = (event: HleEvent) => t(event, "staff", { locale });
  // W3.3 (Batch 2; RV-16): every moment through the one date helper, on WIB, with its year and «WIB» —
  // a record as the timestamp («9 Okt 2026, 07.30 WIB»), a window someone acts on with its day.
  const when = (iso: string, bentuk: BentukTanggal = "cap") => tanggal(iso, bentuk, locale) || TANPA_NAMA;
  // J3.2 (ADM-02): what setup remains at the school shown, from what this page already read
  const persiapan = struktur?.ok
    ? persiapanSekolah(struktur.rows, (assignments ?? []) as PeranTerbaca[],
        new Map((nodes ?? []).map((n) => [n.id as string, ((n as { jalur?: string[] }).jalur ?? []) as string[]])), new Date().valueOf())
    : null;
  // D-101(e): one School Admin is never an error; a second is recommended quietly, as recovery cover
  const satuAdmin = sekolahStruktur
    ? jumlahAdminSekolah((assignments ?? []) as Array<PeranTerbaca & { institution_id: string | null; person_id: string }>,
        sekolahStruktur.id, new Date().valueOf()) === 1
    : false;

  // L3: «Seluruh platform» draws no school-shaped section, and lists none
  const BAGIAN_SEKOLAH = ["struktur", "persiapan", "ketuntasan", "pindah", "peserta", "laporan", "rollover", "transfers", "intelligence"];
  const tampil = (bagian: string) => !(platformKonteks && BAGIAN_SEKOLAH.includes(bagian));
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
    ["intelligence", s("config.section.intelligence")],
  ];
  const nav = navSemua.filter(([bagian]) => tampil(bagian));

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
          {lama ? (
            <TabTempat tempat={tempatDariPeran(peran)} kecuali={["/konfigurasi"]} locale={await currentLocale()} persona="staff" bentuk="nav" />
          ) : (
            await navKonteks({ locale: await currentLocale(), persona: "staff", kecuali: ["/konfigurasi", "/pendataan", "/aktivasi", "/studio"], bentuk: "nav" })
          )}
        </>
      }
    />
    <main id="isi" tabIndex={-1} className="py-6">
      <header>
        <p className="text-sm text-ink-3">{s("app.name")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{s("config.title")}</h1>
      </header>


      {menunggu.length > 0 ? (
        <section className={`mt-6 ${card}`} aria-labelledby="pin-menunggu" data-menunggu="">
          <h2 id="pin-menunggu" className="font-medium">{s("config.menunggu.judul")}</h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {menunggu.map((m) => (
              <li key={m.k} data-menunggu-jenis={m.k}>
                <Link className="pin-tautan" href={m.href}><span className="pin-num">{m.n}</span> {s(m.kunci)}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
          <section id="struktur" hidden={!tampil("struktur") || undefined} className={card}>
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
            <section id="persiapan" hidden={!tampil("persiapan") || undefined} className={card} aria-labelledby="pin-persiapan">
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
              {satuAdmin ? <p className="mt-3 text-sm text-ink-2">{sl("config.persiapan.admin_kedua")}</p> : null}
            </section>
          ) : null}

          {/* D-088(b), BOB-49 / DAISY-38. BATAS KETUNTASAN: each lesson the school can give, with its pass mark or
              «Batas ketuntasan belum ditetapkan», its history, and a form to set it. A teacher cannot give a lesson
              to a class until its mark is set; a change applies to what is given afterwards. set_school_pass_mark
              decides who may set it (the school's admin), keeps every change and audits it. */}
          <section id="ketuntasan" hidden={!tampil("ketuntasan") || undefined} className={card} aria-labelledby="pin-ketuntasan">
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
                          <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.ketuntasan.tombol")}</TombolKirim>
                        </form>
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
          <section id="pindah" hidden={!tampil("pindah") || undefined} className={card}>
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
                                <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.pindah.tombol")}</TombolKirim>
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

          {/* BOB-44 / DAISY-32 (D-069(e), D-070(c)). PESERTA PENGEMBANGAN PROFESI: an existing teacher or staff member of
              this school is enrolled as a participant in a professional-learning Kelas. The people offered are those the
              database says hold a staff role here now; the places, this school's professional-learning Kelas and
              Tingkat. enrol_for_professional_learning decides again, creates no person, account or number, and audits.
              DAISY-34: the records this administrator may open are linked here, read-only, never as a figure. */}
          <section id="peserta" hidden={!tampil("peserta") || undefined} className={card} aria-labelledby="pin-peserta">
            <h2 id="pin-peserta" className="font-medium">{sl("config.section.peserta")}</h2>
            {sekolahStruktur && peserta ? (
              <>
                <p className="mt-1 text-sm text-ink-2">{sl("config.peserta.arti")}</p>
                {peserta.tempat.length > 0 ? (
                  <form action={daftarkanPesertaAction} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="sekolah" value={sekolahStruktur.id} />
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
                    <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.peserta.daftarkan")}</TombolKirim>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-ink-3">{sl("config.peserta.tanpa_tempat")}</p>
                )}
                {result("peserta")}
                {catatanPd.length > 0 ? (
                  <nav className="mt-3 text-sm" aria-label={sl("config.peserta.catatan")}>
                    <p className="text-ink-3">{sl("config.peserta.catatan")}</p>
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

          {/* BOB-15 + DAISY-12 (D-037 step 2; D-101(f)). LAPORAN MASALAH: the school resolves what it can (tier 1), the
              PINTAR team reads every school's (tier 2). Open reports first, a stopped class first among them. Each is
              moved forward once at a time with the next step written to its reporter; move_support_report decides
              who may, and audits it. */}
          <section id="laporan-masalah" className={card} aria-labelledby="pin-laporan-masalah">
            <h2 id="pin-laporan-masalah" className="font-medium">{sl("config.section.laporan_masalah")}</h2>
            <p className="mt-1 text-sm text-ink-2">{sl("lapor.triase.arti")}</p>
            {sp.bagian === "laporan-masalah" && sp.lapor ? (
              <BarisHasil nada={sp.lapor === "MOVED" ? "ok" : "gagal"}>
                {sl(sp.lapor === "MOVED" ? "lapor.triase.ok" : kunciKodeLaporan(sp.lapor as KodeLaporan))}
              </BarisHasil>
            ) : null}
            {laporan.length === 0 ? (
              <p className="mt-3 text-sm text-ink-3">{sl("lapor.triase.kosong")}</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm">
                {laporan.map((l) => (
                  <li key={l.id} data-laporan={l.id} className="grid gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
                    <span className="text-ink-1">
                      <strong>{sl(kunciStatusLaporan(l.status))}</strong>
                      {l.hentikanKelas ? <> · <strong>{sl("lapor.hentikan.singkat")}</strong></> : null}
                      {" · "}{when(l.dibuat)} · {l.pelapor} · {roleLabel(l.peran)}{l.sekolah ? ` · ${l.sekolah}` : ""}
                    </span>
                    <span className="text-ink-2">
                      <span className="pin-num">{l.halaman}</span>
                      {l.rujukan ? <> · {sl("lapor.rujukan")} <span className="pin-num">{l.rujukan}</span></> : null}
                      {/* L4 (CR-85): the build, the kept technical exception, in the platform operator's triage only (investigation §E item 22) */}
                      {platformIni && l.build ? <> · <span className="pin-num">{l.build.slice(0, 7)}</span></> : null}
                    </span>
                    <span className="text-ink-2">{sl("lapor.lakukan")} {l.lakukan}</span>
                    <span className="text-ink-2">{sl("lapor.harapan")} {l.harapan}</span>
                    <span className="text-ink-2">{sl("lapor.terjadi")} {l.terjadi}</span>
                    {l.perangkat ? <span className="text-xs text-ink-3">{l.perangkat}</span> : null}
                    {l.tangkapan ? (
                      <a className={tautanTempat} href={`/api/assets/read-url?alih=1&path=${encodeURIComponent(l.tangkapan)}`}>{sl("lapor.triase.tangkapan")}</a>
                    ) : null}
                    {l.langkah ? <span className="text-ink-1">{sl("lapor.langkah")} {l.langkah}</span> : null}
                    {langkahBerikut(l.status).length > 0 ? (
                      <form action={pindahkanLaporanAksi} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="laporan" value={l.id} />
                        <label className={label}>{sl("lapor.triase.ubah")}
                          <select name="status" className={field} required defaultValue={langkahBerikut(l.status)[0]}>
                            {langkahBerikut(l.status).map((x) => <option key={x} value={x}>{sl(kunciStatusLaporan(x))}</option>)}
                          </select>
                        </label>
                        <label className={label}>{sl("lapor.triase.langkah")}
                          <input name="langkah" className={field} required maxLength={500} autoComplete="off" />
                        </label>
                        <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("lapor.triase.simpan")}</TombolKirim>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Penomoran halaman={halLapor} lagi={lagiLapor} ke={(n) => tautanHalaman("/konfigurasi", sp, "hal_lapor", n, "laporan-masalah")} locale={locale} />
          </section>

          {/* #148 (D-094(a)(b)(g)(h), D-100). PEMELIHARAAN DAN PENGUMUMAN. Scheduling is two steps: the scope and the
              time are checked first (a plain GET), and the second step shows the assessments that window would meet,
              with the latest one's end, before anything is saved (D-094(g)); it warns, it does not forbid. The list
              ends or starts a window with a reason; «Hentikan sekarang» is Admin platform's alone, separate, and
              confirmed by the typed phrase. The database decides who may do each, and audits it (D-093). */}
          <section id="pemeliharaan" className={card} aria-labelledby="pin-pemeliharaan">
            <h2 id="pin-pemeliharaan" className="font-medium">{sl("config.section.pemeliharaan")}</h2>
            <p className="mt-1 text-sm text-ink-2">{sl("config.pemeliharaan.arti")}</p>
            {result("pemeliharaan")}
            <form method="get" action="/konfigurasi#pemeliharaan" className="mt-3 grid gap-2">
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
              <div className="flex flex-wrap items-end gap-2">
                <div className={label}>
                  <label htmlFor="cfg-pm-mulai">{sl("config.pemeliharaan.mulai")}</label>
                  <TanggalDenganGema jenis="datetime-local" id="cfg-pm-mulai" name="pm_mulai" className={field} defaultValue={sp.pm_mulai ?? ""} locale={locale} />
                </div>
                <div className={label}>
                  <label htmlFor="cfg-pm-selesai">{sl("config.pemeliharaan.selesai")}</label>
                  <TanggalDenganGema jenis="datetime-local" id="cfg-pm-selesai" name="pm_selesai" className={field} defaultValue={sp.pm_selesai ?? ""} locale={locale} />
                </div>
                <button type="submit" className={button}>{sl("config.pemeliharaan.periksa")}</button>
              </div>
            </form>
            {pmCek ? (
              <div className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2 text-sm" data-tabrakan="1">
                {tabrakan && Number((tabrakan as { asesmen?: number }).asesmen) > 0 ? (
                  <p role="status">
                    <strong>{sl("config.pemeliharaan.tabrakan.perhatian")}</strong>{" "}
                    {Number((tabrakan as { asesmen: number }).asesmen)} {sl("config.pemeliharaan.tabrakan.jumlah")}{" "}
                    {(tabrakan as { terakhir_selesai?: string | null }).terakhir_selesai ? (
                      <>
                        {sl("config.pemeliharaan.tabrakan.terakhir")} {when((tabrakan as { terakhir_selesai: string }).terakhir_selesai)}.{" "}
                        {sl("config.pemeliharaan.tabrakan.saran")} {when((tabrakan as { terakhir_selesai: string }).terakhir_selesai)}.
                      </>
                    ) : null}
                  </p>
                ) : tabrakan ? (
                  <p role="status">{sl("config.pemeliharaan.tabrakan.nihil")}</p>
                ) : null}
                <form action={jadwalkanPemeliharaanAction} className="grid gap-2">
                  {pmPlatform ? <input type="hidden" name="platform" value="1" /> : null}
                  {pmPlatform ? null : pmSekolah.map((id) => <input key={id} type="hidden" name="sekolah" value={id} />)}
                  <input type="hidden" name="mulai" value={sp.pm_mulai ?? ""} />
                  <input type="hidden" name="selesai" value={sp.pm_selesai ?? ""} />
                  <label className={label}>{sl("config.pemeliharaan.pesan")}
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

            <h3 className="mt-4 text-sm font-medium">{sl("config.pemeliharaan.daftar")}</h3>
            {kelola && kelola.pemeliharaan.length > 0 ? (
              <ul className="mt-2 grid gap-2 text-sm">
                {kelola.pemeliharaan.map((w) => (
                  <li key={w.id} data-jendela={w.id} className="grid gap-1 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
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
                      <form action={ubahPemeliharaanAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="jendela" value={w.id} />
                        <label className={label}>{sl("config.pemeliharaan.alasan")}
                          <input name="alasan" className={field} required maxLength={300} autoComplete="off" />
                        </label>
                        {w.keadaan !== "AKTIF" ? (
                          <TombolKirim className={button} name="aksi" value="MULAI" sibuk={s("tombol.memproses")}>{sl("config.pemeliharaan.mulai_sekarang")}</TombolKirim>
                        ) : null}
                        <TombolKirim className={button} name="aksi" value="AKHIRI" sibuk={s("tombol.memproses")}>
                          {sl(w.keadaan === "AKTIF" ? "config.pemeliharaan.akhiri" : "config.pemeliharaan.batalkan")}
                        </TombolKirim>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-3">{sl("config.pemeliharaan.kosong")}</p>
            )}
            <Penomoran halaman={halJendela} lagi={kelola?.lagiPemeliharaan === true} ke={(n) => tautanHalaman("/konfigurasi", sp, "hal_jendela", n, "pemeliharaan")} locale={locale} />

            <h3 className="mt-4 text-sm font-medium">{sl("config.pemeliharaan.pengumuman")}</h3>
            <p className="mt-1 text-sm text-ink-2">{sl("config.pemeliharaan.pengumuman.arti")}</p>
            <form action={terbitkanPengumumanAction} className="mt-2 grid gap-2">
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
              <div className="flex flex-wrap items-end gap-2">
                <div className={label}>
                  <label htmlFor="cfg-pengumuman-terbit">{sl("config.pemeliharaan.pengumuman.terbit")}</label>
                  <TanggalDenganGema jenis="datetime-local" id="cfg-pengumuman-terbit" name="terbit" className={field} locale={locale} />
                </div>
                <div className={label}>
                  <label htmlFor="cfg-pengumuman-sampai">{sl("config.pemeliharaan.pengumuman.sampai")}</label>
                  <TanggalDenganGema jenis="datetime-local" id="cfg-pengumuman-sampai" name="sampai" className={field} required locale={locale} />
                </div>
                <TombolKirim className={primer} sibuk={s("tombol.memproses")}>{sl("config.pemeliharaan.pengumuman.terbitkan")}</TombolKirim>
              </div>
            </form>
            {kelola && kelola.pengumuman.length > 0 ? (
              <ul className="mt-2 grid gap-2 text-sm">
                {kelola.pengumuman.map((n) => (
                  <li key={n.id} data-pengumuman={n.id} className="grid gap-1 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
                    <span className="text-ink-1">{n.pesan}</span>
                    <span className="text-ink-2">
                      {when(n.terbit, "hariJam")} {sl("config.pemeliharaan.hingga")} {when(n.sampai, "hariJam")}
                      {n.platform ? <> · {sl("config.pemeliharaan.platform")}</> : null}
                      {n.ditarik ? <> · <strong>{sl("config.pemeliharaan.pengumuman.ditarik")}</strong></> : null}
                    </span>
                    {n.boleh && !n.ditarik ? (
                      <form action={tarikPengumumanAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="pengumuman" value={n.id} />
                        <label className={label}>{sl("config.pemeliharaan.alasan")}
                          <input name="alasan" className={field} required maxLength={300} autoComplete="off" />
                        </label>
                        <TombolKirim className={button} sibuk={s("tombol.memproses")}>{sl("config.pemeliharaan.pengumuman.tarik")}</TombolKirim>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-3">{sl("config.pemeliharaan.pengumuman.kosong")}</p>
            )}
            <Penomoran halaman={halPengumuman} lagi={kelola?.lagiPengumuman === true} ke={(n) => tautanHalaman("/konfigurasi", sp, "hal_pengumuman", n, "pemeliharaan")} locale={locale} />

            {platformIni ? (
              <div className="mt-4 grid gap-2 rounded-[var(--radius-1)] border border-line-1 px-3 py-2" data-hentikan="1">
                <h3 className="text-sm font-medium">{sl("config.pemeliharaan.darurat.judul")}</h3>
                <p className="text-sm text-ink-2">{sl("config.pemeliharaan.darurat.arti")}</p>
                <form action={hentikanSekarangAction} className="grid gap-2">
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
              </div>
            ) : null}
          </section>

          {/* DAISY-07 (B6b). THE SCHOOL'S REPORTS, one click away. BOB-06 gave
              every school PINTAR's standard class and school reports; nothing
              linked to them, so an administrator had to type an id. The school
              summary is read at the school's own root node and each class's at
              that class, for the school chosen above. A link decides nothing:
              generate_report decides every figure for this reader. */}
          <section id="laporan" hidden={!tampil("laporan") || undefined} className={card}>
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
                    <span>{i.name}{i.is_synthetic && platformIni ? <span className="ml-2 rounded bg-info-soft px-1.5 text-xs text-info">{s("config.sekolah.sintetis")}</span> : null}</span>
                    <span className="text-ink-3">{s(i.is_active ? "config.sekolah.aktif" : "config.sekolah.nonaktif")}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-3">
                    {(periods ?? []).filter((p) => p.institution_id === i.id).map((p) => `${p.name} (${p.starts_on} – ${p.ends_on})`).join(" · ") || s("config.empty")}
                  </p>
                </li>
              ))}
              {(institutions ?? []).length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
            {platformKonteks ? (
              <Penomoran halaman={halSekolah} lagi={lagiSekolah} ke={(n) => tautanHalaman("/konfigurasi", sp, "hal_sekolah", n, "system")} locale={locale} />
            ) : null}
          </section>

          {/* Period rollover (INV-23) */}
          <section id="rollover" hidden={!tampil("rollover") || undefined} className={card}>
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
                      <label key={n.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-2">
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
                  <div><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("config.action.rollover")}</TombolKirim></div>
                </form>
              );
            })}
            {result("rollover")}
          </section>

          {/* Transfers (INV-25; policy hooks only — OD-9) */}
          <section id="transfers" className={card}>
            <h2 className="font-medium">{s("config.section.transfers")}</h2>
            <ul className="mt-2 grid gap-1 text-sm text-ink-2">
              {daftarPindah.map((x) => (
                <li key={x.id} className="grid gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <span>{namaPindah.get(x.person_id) ?? TANPA_NAMA}</span>
                    <span className="text-ink-3"> · {institutionName.get(x.from_institution_id) ?? TANPA_NAMA} → {institutionName.get(x.to_institution_id) ?? TANPA_NAMA}</span>
                    <span className="ml-2 rounded bg-info-soft px-1.5 text-xs text-info">{transferLabel(x.status)}</span>
                    {x.reason ? <p className="text-xs text-ink-3">{x.reason}</p> : null}
                    {/* W2.15: a request this school sent waits on the receiving school, which chooses its school year */}
                    {x.status === "REQUESTED" && x.to_academic_period_id === null && x.from_institution_id === satuSekolah
                      ? <p className="text-xs text-ink-3">{s("pindah.menunggu_tujuan")}</p> : null}
                  </div>
                  {(x.status === "REQUESTED" || x.status === "AUTHORIZED") && (
                    <div className="flex flex-wrap gap-2">
                      {x.status === "REQUESTED" && x.to_academic_period_id !== null && (
                        <form action={transferAuthorizeAction}><input type="hidden" name="transfer" value={x.id} /><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("config.action.authorize")}</TombolKirim></form>
                      )}
                      {x.status === "AUTHORIZED" && (
                        <form action={transferExecuteAction}><input type="hidden" name="transfer" value={x.id} /><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("config.action.execute")}</TombolKirim></form>
                      )}
                      <form action={transferRejectAction} className="flex gap-1">
                        <input type="hidden" name="transfer" value={x.id} />
                        <label className="sr-only" htmlFor={`alasan-${x.id}`}>{s("config.label.reason")}</label>
                        <input id={`alasan-${x.id}`} name="reason" className={field} placeholder={s("config.label.reason")} />
                        <TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("config.action.reject")}</TombolKirim>
                      </form>
                    </div>
                  )}
                </li>
              ))}
              {daftarPindah.length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
            <Penomoran halaman={halPindah} lagi={lagiPindah} ke={(n) => tautanHalaman("/konfigurasi", sp, "hal_pindah", n, "transfers")} />
            {/* W2.15: the receiving school's incoming requests, accepted into one of its own school years */}
            {satuSekolah && pindahMasuk.length > 0 ? (
              <div className="mt-3 grid gap-2" data-pindah="masuk">
                <h3 className="text-sm font-medium">{s("pindah.masuk.judul")}</h3>
                {pindahMasuk.map((m) => (
                  <form key={m.transfer_id} action={transferTerimaAction} className="grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3 sm:grid-cols-2" data-pindah-masuk={m.transfer_id}>
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
                    <label className={label}>{s("pindah.masuk.program")}
                      <select name="to_programme" className={field} defaultValue="">
                        <option value="">—</option>
                        {(nodes ?? []).filter((n) => n.kind === "PROGRAMME" && n.is_active && n.institution_id === satuSekolah).map((n) => (
                          <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                      </select>
                    </label>
                    <div><TombolKirim className={primer} sibuk={s("tombol.memproses")}>{s("pindah.masuk.terima")}</TombolKirim></div>
                  </form>
                ))}
              </div>
            ) : null}
            {/* W2.15 (F-10): a transfer out, to a school found by its exact name or code */}
            {satuSekolah ? (
              <div className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3" data-pindah="keluar">
                <h3 className="text-sm font-medium">{s("pindah.keluar.judul")}</h3>
                <p className="text-xs text-ink-3">{s("pindah.keluar.arti")}</p>
                <form method="get" action="/konfigurasi" className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="bagian" value="transfers" />
                  <label className={label}>{s("pindah.cari.label")}
                    <input name="cari_sekolah" className={field} defaultValue={cariSekolah} minLength={3} maxLength={120} required autoComplete="off" />
                  </label>
                  <button type="submit" className={button}>{s("pindah.cari.tombol")}</button>
                </form>
                {cariSekolah && galatCari ? <BarisHasil nada="gagal">{s("galat.transfer_search_short")}</BarisHasil> : null}
                {cariSekolah && !galatCari && tujuanDitemukan.length === 0 ? <p className="text-sm text-ink-3">{s("pindah.cari.kosong")}</p> : null}
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
              <label className={label}>{s("config.label.destination_programme")}
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

          {/* Roles (INV-16) */}
          <section id="roles" className={card}>
            <h2 className="font-medium">{s("config.section.roles")}</h2>
            <ul className="mt-2 grid gap-1 text-sm text-ink-2">
              {daftarPeran.map((a) => (
                // CR-94: below 640 px the revoke form wraps below the name instead of past the window; wider, as before
                <li key={a.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 rounded-[var(--radius-1)] bg-surface-2 px-3 py-2">
                  <span>
                    {personName.get(a.person_id) ?? TANPA_NAMA} · {roleLabel(a.role)}
                    <span className="text-ink-3"> · {a.scope_node_id ? nodeName.get(a.scope_node_id) ?? TANPA_NAMA : s("role.SYSTEM_ADMIN")} · {s("config.label.valid_until").toLowerCase()} {when(a.valid_until, "baca")}</span>
                  </span>
                  {a.person_id !== viewer.personId && (
                    // D-097(a): a revocation states why
                    <form action={revokeRoleAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="assignment" value={a.id} />
                      <label className="flex items-center gap-1 text-xs text-ink-3">{s("config.label.reason")}
                        <input name="alasan" className={field} required maxLength={300} autoComplete="off" />
                      </label>
                      <TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("config.action.revoke")}</TombolKirim>
                    </form>
                  )}
                </li>
              ))}
              {daftarPeran.length === 0 && <li className="text-ink-3">{s("config.empty")}</li>}
            </ul>
            <Penomoran halaman={halPeran} lagi={lagiPeran} ke={(n) => tautanHalaman("/konfigurasi", sp, "hal_peran", n, "roles")} />
            {angkat ? (
              <div className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3" role="group" aria-labelledby="pin-angkat">
                <h3 id="pin-angkat" className="font-medium">{s("config.angkat.judul")}</h3>
                <p className="text-sm text-ink-1"><strong>{angkat.nama}</strong> · {roleLabel("INSTITUTION_ADMIN")} · {angkat.tempat}</p>
                <p className="text-sm text-ink-2">{s("config.angkat.arti")}</p>
                <form action={grantRoleAction} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="person" value={angkat.person} />
                  <input type="hidden" name="role" value="INSTITUTION_ADMIN" />
                  <input type="hidden" name="scope" value={angkat.scope} />
                  <input type="hidden" name="valid_until" value={angkat.sampai} />
                  <input type="hidden" name="yakin" value="ya" />
                  <TombolKirim className={primer} sibuk={s("tombol.menyimpan")}>{s("config.angkat.ya")}</TombolKirim>
                  <Link href="/konfigurasi?bagian=roles#roles" className={tautanTempat}>{s("config.angkat.batal")}</Link>
                </form>
              </div>
            ) : null}
            {bukaAdminPertama && satuSekolah ? (
              <div className="mt-3 grid gap-2 rounded-[var(--radius-1)] bg-surface-2 p-3" role="group" aria-labelledby="pin-admin-pertama" data-admin-pertama="">
                <h3 id="pin-admin-pertama" className="font-medium">{s("config.pertama.judul")}</h3>
                <p className="text-sm text-ink-2">{s("config.pertama.arti")}</p>
                {pertama ? (
                  <form action={tunjukAdminPertamaAction} className="flex flex-wrap items-center gap-3">
                    <p className="w-full text-sm text-ink-1">{s("config.pertama.yakin")}</p>
                    <p className="w-full text-sm text-ink-1"><strong>{pertama.display_name}</strong> · {roleLabel("INSTITUTION_ADMIN")} · {institutionName.get(satuSekolah) ?? TANPA_NAMA}</p>
                    <input type="hidden" name="person" value={pertama.person_id} />
                    <input type="hidden" name="sekolah" value={satuSekolah} />
                    <input type="hidden" name="valid_until" value={sp.sampai} />
                    <input type="hidden" name="yakin" value="ya" />
                    <TombolKirim className={primer} sibuk={s("tombol.menyimpan")}>{s("config.angkat.ya")}</TombolKirim>
                    <Link href="/konfigurasi?bagian=roles#roles" className={tautanTempat}>{s("config.angkat.batal")}</Link>
                  </form>
                ) : (
                  <form action={tunjukAdminPertamaAction} className="grid gap-2 sm:grid-cols-2">
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
                  {/* D-101 (2): a School Admin may appoint another, at the school itself; Admin platform stays the platform's */}
                  {(["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", ...(sekolahIni.length > 0 || (lama && isSys === true) ? ["INSTITUTION_ADMIN"] : []), ...(platformIni ? ["SYSTEM_ADMIN"] : [])]).map((r) => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </label>
              <label className={label}>{s("config.label.scope")}
                <select name="scope" className={field} defaultValue="">
                  <option value="">—</option>
                  {lingkupPeran(platformKonteks ? [] : nodes ?? [], institutionName).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
              <div className={label}>
                <label htmlFor="cfg-peran-sampai">{s("config.label.valid_until")}</label>
                <TanggalDenganGema id="cfg-peran-sampai" name="valid_until" className={field} required locale={locale} />
              </div>
              <div><TombolKirim className={primer} sibuk={s("tombol.menyimpan")}>{s("config.action.grant")}</TombolKirim></div>
            </form>
            {result("roles")}
          </section>

          {/* Audit reader (INV-18) — read only */}
          <section id="audit" className={card}>
            <h2 className="font-medium">{s("config.section.audit")}</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-sm text-ink-2">
                <thead className="text-xs text-ink-3">
                  <tr><th className="py-1 pr-3">{s("config.label.when")}</th><th className="py-1 pr-3">{s("config.label.action")}</th><th className="py-1 pr-3">{s("config.label.target")}</th>{platformIni ? <th className="py-1 pr-3">{s("config.label.build")}</th> : null}</tr>
                </thead>
                <tbody>
                  {(audit ?? []).slice(0, UKURAN_JEJAK).map((r) => (
                    <tr key={r.id} className="border-t border-line-1">
                      <td className="py-1 pr-3 whitespace-nowrap">{when(r.at)}</td>
                      {/* D-138(c), D-140(c): the action and the record in words; never the code, the table or an id.
                          The build stays a platform operator's diagnostic. */}
                      <td className="py-1 pr-3">{kataAksiAudit(r.action, locale)}</td>
                      <td className="py-1 pr-3 text-ink-3">{[kataTabelAudit(r.target_table, locale), r.institution_id ? institutionName.get(r.institution_id) ?? TANPA_NAMA : null].filter(Boolean).join(" · ") || TANPA_NAMA}</td>
                      {platformIni ? <td className="py-1 pr-3 text-ink-3">{short(r.build_sha)}</td> : null}
                    </tr>
                  ))}
                  {(audit ?? []).length === 0 && <tr><td className="py-1 text-ink-3" colSpan={4}>{s("config.empty")}</td></tr>}
                </tbody>
              </table>
            </div>
            <Penomoran halaman={halamanDiminta(sp.hal_jejak)} lagi={(audit ?? []).length > UKURAN_JEJAK}
              ke={(n) => tautanHalaman("/konfigurasi", sp, "hal_jejak", n, "audit")} />
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
          <section id="intelligence" hidden={!tampil("intelligence") || undefined} className={card}>
            <h2 className="font-medium">{s("laporan.templat.judul")}</h2>
            <p className="mt-2 text-sm text-ink-3">{s("laporan.templat.penjelasan")}</p>

            {myTemplates.length === 0 ? (
              <p className="mt-3 text-sm text-ink-3">{s("laporan.templat.kosong")}</p>
            ) : (
              <ul className="mt-3 grid gap-2 text-sm">
                {myTemplates.map((tpl) => (
                  <li key={tpl.id} className="rounded-[var(--radius-1)] border border-line-1 p-2">
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
              <form action={saveReportTemplateAction} className="mt-4 grid gap-3">
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
                <TombolKirim className={primer} sibuk={s("tombol.menyimpan")}>{s("laporan.templat.simpan")}</TombolKirim>
              </form>
            )}
            {result("intelligence")}
          </section>
        </div>
      </div>
    </main>
    </>
  );
}

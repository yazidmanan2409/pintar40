import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { supabaseServer } from "@/lib/supabase/server";
import { sekolahPendataan } from "@/lib/pendataan";
import { konteksHalaman } from "@/lib/konteks-server";
import { pilihanTempat, type SimpulPohon } from "@/lib/struktur-kontrak";
import { kelasDitawarkan, type KelasKartu } from "@/components/aktivasi/kelas";
import Penomoran, { halamanDiminta } from "@/components/koleksi/Penomoran";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import FormAktivasi from "@/components/aktivasi/FormAktivasi";
import CariTunggu from "@/components/aktivasi/CariTunggu";
import { KeAktifkan } from "@/components/aktivasi/HasilAktivasi";
import KartuUlang, { type PemegangKartu } from "@/components/aktivasi/KartuUlang";
import KartuJadiEmail from "@/components/aktivasi/KartuJadiEmail";
import { judulHalaman } from "@/lib/judul-halaman";
import { adaPemegangKartu, cariPemegangKartu, kataAman } from "@/lib/pemegang-kartu";

export const generateMetadata = judulHalaman("/aktivasi");

export const dynamic = "force-dynamic";

/**
 * ACCOUNT ACTIVATION (F-01) — where a provisioned person becomes someone who
 * can sign in.
 *
 * The intake provisions people and deliberately activates nothing ("provisioned
 * is not active", WP5B). This screen is the step after it, and it is a screen
 * of its own so that rule stays true of the intake. Everything shown comes from
 * `persons_awaiting_account()` — the people in the institutions where the
 * reader holds CAN_PROVISION_PEOPLE who hold no account — and every action goes
 * through `/api/akun/aktivasi`, where the database decides before an identity
 * is created. A reader with no such institution sees the one refusal page.
 *
 * BOB-28 (D-088(e)): below it, «Kartu hilang atau rusak»: a learner who has a
 * class card gets a new one (`card_holders()`, `/api/akun/kartu-kelas`).
 */
export default async function Aktivasi({ searchParams }: { searchParams: Promise<{ cari_kartu?: string; cari_staf?: string; hal?: string; cari_tunggu?: string; hal_tunggu?: string }> }) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();

  const { data: sistem } = await supabase.rpc("is_system_admin");
  const adminSistem = sistem === true;
  // L3 (CR-83; D-127 Q2; D-132 C7): Aktivasi is the working context's. Mengelola · a school: that school's people
  // waiting for an account and its card holders, whoever the reader is. «Seluruh platform»: every school's, and the
  // platform's own act of making a person outside intake. An evaluation persona keeps the page as it was (C10). The
  // database decides each activation either way.
  const kh = await konteksHalaman();
  const lama = kh === "TANPA_KONTEKS";
  const platformIni = lama ? adminSistem : kh?.platform === true && adminSistem;
  const sekolahIni = !lama && kh && !kh.platform ? kh.tempat : null;
  // W2.10 (Batch 5; CR-49, D-153): the people waiting for an account, a page of 20 from the database
  // (persons_awaiting_account_page), narrowed to the context's school there, searched by name or nomor induk; never
  // every waiting person at once. A school context with no school reads none.
  const lingkupTunggu = lama || platformIni ? null : sekolahIni ?? "00000000-0000-0000-0000-000000000000";
  const cariTunggu = kataAman(sp.cari_tunggu);
  const halTunggu = halamanDiminta(sp.hal_tunggu);
  const { data: menunggu, error } = await supabase.rpc("persons_awaiting_account_page", {
    p_sekolah: lingkupTunggu, p_cari: cariTunggu || null, p_hal: halTunggu,
  });
  const orang = (Array.isArray(menunggu) ? menunggu : []) as Array<{
    person_id: string; display_name: string; institutional_id: string; institution_id: string; boleh_kartu: boolean; total: number;
  }>;
  const totalTunggu = orang[0] ? Number(orang[0].total) : 0;
  // BOB-28 (D-088(e)) and D-152(a): the class-card holders a card can be re-issued for, or converted. W2.10 (Batch 4;
  // CR-49, CAP-10): searched on the server, at most twenty for the words asked, never every holder at once; in a
  // school's context only that school's learners (cariPemegangKartu)
  const sekolahKartu = lama || platformIni ? null : sekolahIni ?? "00000000-0000-0000-0000-000000000000";
  const cariKartu = kataAman(sp.cari_kartu);
  const cariStaf = kataAman(sp.cari_staf);
  const [adaPemegang, pemegangUlang, pemegangStaf] = await Promise.all([
    adaPemegangKartu(supabase, sekolahKartu),
    cariPemegangKartu(supabase, cariKartu, sekolahKartu) as Promise<PemegangKartu[]>,
    cariPemegangKartu(supabase, cariStaf, sekolahKartu) as Promise<PemegangKartu[]>,
  ]);

  // who may use this screen at all: a SYSTEM_ADMIN, or anyone the intake
  // already recognises as provisioning for a school (the same predicate)
  const sekolah = adminSistem ? [] : await sekolahPendataan();
  if (error || (!adminSistem && sekolah.length === 0)) {
    return (
      <HalamanPenolakan messageKey="aktivasi.ditolak" persona="staff" locale={locale}
        backHref="/" backKey="galat.beranda" />
    );
  }

  // M7 (D-085): the Kelas with learners waiting for an account, so a whole class's cards are one press. W2.10: counted
  // by the database (kelas_menunggu_akun; CR-91: learners who may hold a card only), the learners read at the run
  const kelas = await kelasMenunggu(supabase, lingkupTunggu);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" current="aktivasi" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("aktivasi.eyebrow")}</p>
          <h1 className="pin-h1">{s("aktivasi.judul")}</h1>
          {/* Polish batch 2 (UX-11): the sign-in address, not the path /masuk */}
          <p className="pin-intro">{s("aktivasi.intro")} <KeAktifkan s={s} sebelum="aktivasi.intro.buka" /></p>
        </div>
        {/* W2.1-W2.3 (Batch 4): a person who already has an account is corrected on their own page */}
        <p className="pin-meta">
          <Link className="pin-tautan" href="/aktivasi/orang">{s("aktivasi.orang.tautan")}</Link> · {s("aktivasi.orang.arti")}
        </p>
        <FormAktivasi locale={locale} orang={orang} adminSistem={platformIni} kelas={kelas} dicari={cariTunggu}
          pencarian={orang.length > 0 || cariTunggu ? <CariTunggu locale={locale} total={totalTunggu} dicari={cariTunggu} /> : null}
          penomoran={<Penomoran locale={locale} halaman={halTunggu} lagi={halTunggu * 20 < totalTunggu}
            ke={(n) => halamanTunggu(cariTunggu, n)} />} />
        <KartuUlang locale={locale} pemegang={pemegangUlang} ada={adaPemegang} dicari={cariKartu} />
        {/* D-152(a): a card learner who becomes staff gets an email account first, as the same person (CR-91) */}
        <KartuJadiEmail locale={locale} pemegang={pemegangStaf} ada={adaPemegang} dicari={cariStaf} />
        <KakiPintar />
      </main>
    </>
  );
}

/**
 * M7 with W2.10: THE KELAS WITH LEARNERS WAITING FOR AN ACCOUNT. The database counts them per Kelas
 * (kelas_menunggu_akun: current members, an enrolment still PENDING or ACTIVE, no account, and no staff role, CR-91);
 * the places are labelled as the intake labels them (pilihanTempat, RLS-bounded reads of those schools' structure).
 * Nothing here grants anything: each card is still decided per person by `/api/akun/aktivasi`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function kelasMenunggu(db: any, sekolah: string | null): Promise<KelasKartu[]> {
  const { data: hitung } = await db.rpc("kelas_menunggu_akun", { p_sekolah: sekolah });
  const hitungan = ((Array.isArray(hitung) ? hitung : []) as Array<{ node_id: string; institution_id: string; jumlah: number }>)
    .map((h) => ({ node_id: String(h.node_id), institution_id: String(h.institution_id), jumlah: Number(h.jumlah) }));
  if (hitungan.length === 0) return [];
  const sekolahKelas = [...new Set(hitungan.map((h) => h.institution_id))];
  const [simpul, periode] = await Promise.all([
    db.from("org_nodes").select("id, name, kind, parent_id, jalur, academic_period_id, is_active")
      .in("institution_id", sekolahKelas).order("name").limit(2000),
    db.from("academic_periods").select("id, name").in("institution_id", sekolahKelas),
  ]);
  const tahun = new Map(((periode.data ?? []) as Array<{ id: string; name: string }>).map((p) => [String(p.id), String(p.name)]));
  return kelasDitawarkan(hitungan, pilihanTempat((simpul.data ?? []) as SimpulPohon[], tahun));
}

/** W2.10: page n of the waiting list, keeping the words it was searched with (and nothing else). */
function halamanTunggu(cari: string, n: number): string {
  const q = new URLSearchParams();
  if (cari) q.set("cari_tunggu", cari);
  if (n > 1) q.set("hal_tunggu", String(n));
  const x = q.toString();
  return x ? `/aktivasi?${x}` : "/aktivasi";
}

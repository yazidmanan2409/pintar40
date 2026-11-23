import { t, type Locale } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { konteksHalaman } from "@/lib/konteks-server";
import { melayani } from "@/lib/konteks";
import { sekolahPendataan } from "@/lib/pendataan";
import { peranSaya } from "@/lib/tur-negara";
import { CangkangStaf } from "@/components/CangkangPengalaman";
import ItemNav from "@/components/ItemNav";
import TabTempat, { tempatDariPeran } from "@/components/TabTempat";
import { navKonteks } from "@/components/NavKonteks";

/**
 * R-10 (X-4; Daisy, Z-SIAP-DAISY-7ba18b03.md §1, option A): KONFIGURASI'S NAVIGATION, FROM ONE SOURCE.
 *
 * The index (/konfigurasi, and each section's page through it) and its six standalone pages (catatan-masuk, kesempatan,
 * keamanan, sertifikat, email-uji, staf) draw this one «Tempat kerja Anda», so the reader sees the same places wherever
 * they are in Konfigurasi. Before, the six used the intake shell and showed only their own item.
 *
 * - The place word in the bar is «Konfigurasi». `kini` marks the page's own item (aria-current="page"); a page with no
 *   item of its own (catatan-masuk, kesempatan, staf) marks «Konfigurasi», the item it is reached from.
 * - The items are offered by the rules the index has always used: Pendataan by /pendataan's own admission, Aktivasi and
 *   Studio by the working context, «Kirim email uji» to the Admin PINTAR in «Seluruh platform», «Keamanan akun» to it or
 *   a school's administrator, «Sertifikat sekolah» to it or one school's. A link decides nothing: each page asks its own
 *   gate on arrival.
 * - The 14-row section list stays the index's body (B1, D-166(a)).
 */
export type KiniKonfigurasi = "konfigurasi" | "keamanan" | "sertifikat" | "emailuji";

export default async function NavKonfigurasi({ locale, kini }: { locale: Locale; kini: KiniKonfigurasi }) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "staff", { locale });
  const supabase = await supabaseServer();
  const [peran, kh, { data: isSys }, { data: adminAssignments }, bolehPendataan] = await Promise.all([
    peranSaya(),
    konteksHalaman(),
    supabase.rpc("is_system_admin"),
    supabase.from("role_assignments").select("institution_id").eq("role", "INSTITUTION_ADMIN").is("revoked_at", null)
      .gt("valid_until", new Date().toISOString()),
    sekolahPendataan().then((x) => x.length > 0).catch(() => false),
  ]);
  const adminInstitutionIds = Array.from(new Set((adminAssignments ?? []).map((r) => r.institution_id).filter(Boolean))) as string[];
  // the index's own reading of the working context (src/app/konfigurasi/page.tsx, L3)
  const lama = kh === "TANPA_KONTEKS";
  const platformKonteks = !lama && kh?.platform === true;
  const platformIni = lama ? isSys === true : platformKonteks && isSys === true;
  const sekolahIni: string[] = lama ? adminInstitutionIds : kh && !kh.platform && kh.tempat ? [kh.tempat] : [];
  const satuSekolah = !lama && sekolahIni.length === 1 ? sekolahIni[0] : null;

  return (
    <CangkangStaf
      locale={locale}
      kini={s("nav.konfigurasi")}
      nav={
        <>
          <ItemNav href="/konfigurasi" label={s("nav.konfigurasi")} kini={kini === "konfigurasi"} />
          {bolehPendataan ? <ItemNav href="/pendataan" label={s("nav.pendataan")} /> : null}
          {lama || (kh && melayani(kh, "/aktivasi")) ? <ItemNav href="/aktivasi" label={s("nav.aktivasi")} /> : null}
          {lama || (kh && melayani(kh, "/studio")) ? <ItemNav href="/studio" label={s("nav.studio")} /> : null}
          {platformIni ? <ItemNav href="/konfigurasi/email-uji" label={s("emailuji.judul")} kini={kini === "emailuji"} /> : null}
          {(platformIni || sekolahIni.length > 0) ? <ItemNav href="/konfigurasi/keamanan" label={s("keamanan.judul")} kini={kini === "keamanan"} /> : null}
          {/* W2.5 (CR-05): the school's certificates, for whom revoke_certificate accepts (the page asks the database) */}
          {(platformIni || satuSekolah) ? <ItemNav href="/konfigurasi/sertifikat" label={s("sertifikat.kelola.judul")} kini={kini === "sertifikat"} /> : null}
          {lama ? (
            <TabTempat tempat={tempatDariPeran(peran)} kecuali={["/konfigurasi"]} locale={locale} persona="staff" bentuk="nav" />
          ) : (
            await navKonteks({ locale, persona: "staff", kecuali: ["/konfigurasi", "/pendataan", "/aktivasi", "/studio"], bentuk: "nav" })
          )}
        </>
      }
    />
  );
}

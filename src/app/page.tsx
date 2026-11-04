import Link from "next/link";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { currentViewer } from "@/lib/auth";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import SesiSaya from "@/components/SesiSaya";
import Ikon from "@/components/Ikon";
import TombolKirim from "@/components/TombolKirim";
import { namaSapaan } from "@/components/sesi";
import { berandaPasangan, bacaPermintaan, kunciPasangan, pintuPilihan, samaPasangan, type Pasangan } from "@/lib/konteks";
import { konteksSaya, tempatSaya } from "@/lib/konteks-server";
import { istilah } from "@/lib/istilah-menunggu";
import { pilihKonteks } from "./konteks-actions";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/");

const PINTU = "rounded-[var(--radius-2)] border border-line-1 bg-surface-1 px-5 py-4 text-lg hover:bg-surface-2";

/**
 * Entry by purpose, not a homepage (FABLE-00 "Entry is by purpose"). One
 * screen, one question.
 *
 * SIGNED IN, THIS IS THE CHOOSER (L3; D-127 Q1, Q2; D-132 C3): «what do you want to do, and where?». The one place
 * a working context changes after arriving, and there is no other switch. Its doors are exactly the purpose · place
 * pairs the reader holds now (konteks_tempat_saya: Belajar with learning participation; Mengajar from teaching
 * appointments; Mengelola from leadership and administration, Admin platform everywhere and «Seluruh platform»),
 * the current one marked. VISITING IT CHANGES NOTHING: a door is a form, and only its POST (pilihKonteks) sets the
 * context. Sent here from a page of another context, from sign-in with several places, or after a context stopped
 * being held, it offers what serves that page and continues there once chosen. Nobody holding none is told so
 * plainly (entry.kosong). The sentences saying why the reader was sent here are semantic keys awaiting Dr Gladys's
 * words (D-132(m)) and draw nothing until then.
 *
 * GREETED BY FIRST NAME (D-020), so the next child on a shared tablet does not
 * read a full name; staff may be greeted in full. The session strip is here too
 * (D-009), and it names only a reader who holds a staff role (S15).
 *
 * One parallel read: viewer, roles and language together.
 */
export default async function Entry({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [viewer, peran, locale] = await Promise.all([currentViewer(), peranSaya(), currentLocale()]);
  const s = (k: HleEvent) => t(k, "public", { locale });

  if (!viewer) {
    return (
      <main id="isi" tabIndex={-1} className="mx-auto max-w-xl py-16">
        <p className="text-sm text-ink-3">{s("app.name")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{s("entry.title")}</h1>
        <div className="mt-8 grid gap-3">
          {/* L3 (D-127 Q1, D-132): each door carries a PURPOSE to the sign-in, never a role. After signing in, the
              session's working context is that purpose in a place this person holds for it (/mulai); the door
              itself grants nothing. */}
          <Link href="/masuk?pintu=belajar" className={PINTU}>
            {s("entry.learner")}
          </Link>
          <Link href="/masuk?pintu=mengajar" className={PINTU}>
            {s("entry.educator")}
          </Link>
          <Link href="/masuk?pintu=mengelola" className={PINTU}>
            {s("entry.staff")}
          </Link>
        </div>
      </main>
    );
  }

  const nama = namaSapaan(viewer.displayName, peran);
  const [k, tempat] = await Promise.all([konteksSaya(), tempatSaya()]);
  const minta = bacaPermintaan(await searchParams);
  const pintu = pintuPilihan(tempat, minta);
  const kini = k?.keadaan === "ADA" ? k : null;
  // D-132(m): the sentence for why the person is here is a semantic key awaiting Dr Gladys's words; until then none
  const kalimat = minta.alasan === "tidak_dipegang" ? istilah("context.not_held")
    : minta.alasan === "tidak_berlaku" ? istilah("context.invalid")
    : minta.alasan === "lain" ? istilah("context.other_context")
    : minta.untuk && pintu.length > 1 ? istilah("context.choose_place") : null;

  return (
    <main id="isi" tabIndex={-1} className="mx-auto max-w-xl py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-3">{s("app.name")}</p>
        <SesiSaya locale={locale} persona="public" viewer={viewer} peran={peran} />
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{s("entry.title")}</h1>
      <p className="mt-4 text-ink-2">
        {s("entry.halo")}
        {nama ? `, ${nama}` : ""}.
      </p>
      {kalimat ? <p className="mt-4 text-ink-2" role="status">{kalimat}</p> : null}

      {pintu.length > 0 ? (
        <div className="mt-8 grid gap-3" data-pemilih="konteks">
          {pintu.map((p) => {
            const di = kini !== null && samaPasangan(kini, p);
            return (
              <form key={kunciPasangan(p)} action={pilihKonteks}>
                <input type="hidden" name="pasangan" value={kunciPasangan(p)} />
                {minta.lanjut ? <input type="hidden" name="lanjut" value={minta.lanjut} /> : null}
                {/* E2 (D-169(c)): the purpose in 18/26 600, the place under it, a chevron; the current door is marked
                    four ways (a check for the chevron, the primary edge, the primary-soft ground, aria-current), never by
                    weight alone. Its name stays «purpose · place» (the separator is read, not drawn). */}
                <TombolKirim className={`${PINTU} pin-pintu w-full text-left`} sibuk={s("tombol.memproses")}
                  aria-current={di ? "true" : undefined} data-konteks={kunciPasangan(p)}>
                  <span className="pin-pintu-teks">
                    <span className="pin-pintu-tujuan">{bagianPintu(p, locale).tujuan}</span>
                    {bagianPintu(p, locale).tempat ? (
                      <>
                        <span className="pin-sr"> · </span>
                        <span className="pin-pintu-tempat">{bagianPintu(p, locale).tempat}</span>
                      </>
                    ) : null}
                  </span>
                  <Ikon nama={di ? "check" : "chevron-right"} />
                </TombolKirim>
              </form>
            );
          })}
        </div>
      ) : (
        <p className="mt-8 text-ink-2">{s("entry.kosong")}</p>
      )}
    </main>
  );
}

/**
 * A door's words: the purpose's own door, in the words the signed-out doors already use, and the place by its name
 * (data), or «Seluruh platform» (D-128(g): no new words; the purpose's short name in the shell is
 * context.manage_label's, still Dr Gladys's).
 */
function bagianPintu(p: Pasangan, locale: Locale): { tujuan: string; tempat: string | null } {
  const kata = p.tujuan === "BELAJAR" ? "entry.learner"
    : p.tujuan === "MENGAJAR" ? "entry.educator"
    : berandaPasangan(p) === "/pimpinan" ? "entry.pimpinan" : "entry.staff";
  const tempat = p.platform ? t("config.pemeliharaan.platform", "staff", { locale }) : p.nama;
  return { tujuan: t(kata, "public", { locale }), tempat: tempat || null };
}

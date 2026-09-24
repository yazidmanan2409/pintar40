import Link from "next/link";
import { t, type HleEvent } from "@/lib/hle";
import { currentViewer } from "@/lib/auth";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import SesiSaya from "@/components/SesiSaya";
import { namaSapaan } from "@/components/sesi";
import { pintuMasuk, type Pintu } from "@/components/tempat";

/** Each door's words, for somebody signed in. */
const LABEL_PINTU: Record<Pintu, HleEvent> = {
  "/belajar": "entry.learner",
  "/mengajar": "entry.educator",
  "/pimpinan": "entry.pimpinan",
  "/konfigurasi": "entry.staff",
};

const PINTU = "rounded-[var(--radius-2)] border border-line-1 bg-surface-1 px-5 py-4 text-lg hover:bg-surface-2";

/**
 * Entry by purpose, not a homepage (FABLE-00 "Entry is by purpose"). One
 * screen, one question.
 *
 * SIGNED IN, THE DOORS ARE THE READER'S OWN (DAISY-03, D-010). The first
 * version kept three fixed doors and pointed them somewhere plausible, so a
 * student was offered /mengajar and a teacher a staff door that refused them.
 * Now the doors are exactly the places the reader holds (`pintuMasuk`: Belajar
 * for a learner, and one staff door per active role), and nobody holding none
 * is told so plainly instead of being handed a door to a refusal.
 *
 * GREETED BY FIRST NAME (D-020), so the next child on a shared tablet does not
 * read a full name; staff may be greeted in full. The session strip is here too
 * (D-009), and it names only a reader who holds a staff role (S15).
 *
 * One parallel read: viewer, roles and language together.
 */
export default async function Entry() {
  const [viewer, peran, locale] = await Promise.all([currentViewer(), peranSaya(), currentLocale()]);
  const s = (k: HleEvent) => t(k, "public", { locale });

  if (!viewer) {
    return (
      <main className="mx-auto max-w-xl py-16">
        <p className="text-sm text-ink-3">{s("app.name")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{s("entry.title")}</h1>
        <div className="mt-8 grid gap-3">
          {/* The learner route, not the sign-in form: the proxy sends an
              anonymous visitor to /masuk and back again, so the QR-code arrival
              in FABLE-03's cycle lands on the learning surface either way. */}
          <Link href="/belajar" className={PINTU}>
            {s("entry.learner")}
          </Link>
          <Link href="/masuk?peran=guru" className={PINTU}>
            {s("entry.educator")}
          </Link>
          <Link href="/masuk?peran=staf" className={PINTU}>
            {s("entry.staff")}
          </Link>
        </div>
      </main>
    );
  }

  const nama = namaSapaan(viewer.displayName, peran);
  const pintu = pintuMasuk(viewer.displayRole, peran);

  return (
    <main className="mx-auto max-w-xl py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-3">{s("app.name")}</p>
        <SesiSaya locale={locale} persona="public" viewer={viewer} peran={peran} />
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{s("entry.title")}</h1>
      <p className="mt-4 text-ink-2">
        {s("entry.halo")}
        {nama ? `, ${nama}` : ""}.
      </p>

      {pintu.length > 0 ? (
        <div className="mt-8 grid gap-3">
          {pintu.map((href) => (
            <Link key={href} href={href} className={PINTU}>
              {s(LABEL_PINTU[href])}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-ink-2">{s("entry.kosong")}</p>
      )}
    </main>
  );
}

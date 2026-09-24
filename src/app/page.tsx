import Link from "next/link";
import { t } from "@/lib/hle";
import { currentViewer } from "@/lib/auth";
import { currentLocale } from "@/lib/locale";
import { berandaPeran } from "@/lib/beranda";

/**
 * Entry by purpose, not a homepage (FABLE-00 "Entry is by purpose"). One
 * screen, one question. A signed-in person is sent where their role lives;
 * anyone else chooses what they came to do.
 */
export default async function Entry() {
  const viewer = await currentViewer();
  const locale = await currentLocale();
  // DAISY-03 (M15, the UI half). For somebody already signed in, the two staff
  // doors went to /masuk, whose signed-in screen offers "Lanjutkan" back to
  // here: a loop, and the reason a dean or head of department could never
  // reach Pimpinan. A signed-in reader is sent to a real place instead, by
  // D-010's own map; the destination still asks its own gate.
  const rumah = viewer ? berandaPeran(viewer.displayRole) : null;
  const pintuStaf = !viewer ? "/masuk?peran=staf" : rumah === "/pimpinan" || rumah === "/konfigurasi" ? rumah : "/konfigurasi";
  const pintuGuru = viewer ? "/mengajar" : "/masuk?peran=guru";

  return (
    <main className="mx-auto max-w-xl py-16">
      <p className="text-sm text-ink-3">{t("app.name", "public", { locale })}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("entry.title", "public", { locale })}</h1>

      {viewer && (
        <p className="mt-4 text-ink-2">
          {t("entry.halo", "public", { locale })}{viewer.displayName ? `, ${viewer.displayName}` : ""}.
        </p>
      )}

      <div className="mt-8 grid gap-3">
        {/* The learner route, not the sign-in form: the proxy sends an
            anonymous visitor to /masuk and back again, so the QR-code arrival
            in FABLE-03's cycle lands on the learning surface either way. */}
        <Link href="/belajar" className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 px-5 py-4 text-lg hover:bg-surface-2">
          {t("entry.learner", "public", { locale })}
        </Link>
        <Link href={pintuGuru} className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 px-5 py-4 text-lg hover:bg-surface-2">
          {t("entry.educator", "public", { locale })}
        </Link>
        <Link
          href={pintuStaf}
          className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 px-5 py-4 text-lg hover:bg-surface-2"
        >
          {t("entry.staff", "public", { locale })}
        </Link>
      </div>
    </main>
  );
}

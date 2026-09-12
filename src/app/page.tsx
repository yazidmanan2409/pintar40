import Link from "next/link";
import { t } from "@/lib/hle";
import { currentViewer } from "@/lib/auth";

/**
 * Entry by purpose, not a homepage (FABLE-00 "Entry is by purpose"). One
 * screen, one question. A signed-in person is sent where their role lives;
 * anyone else chooses what they came to do.
 */
export default async function Entry() {
  const viewer = await currentViewer();
  const staffRoles = new Set(["INSTITUTION_ADMIN", "SYSTEM_ADMIN"]);

  return (
    <main className="mx-auto max-w-xl py-16">
      <p className="text-sm text-ink-3">{t("app.name", "public")}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("entry.title", "public")}</h1>

      {viewer && (
        <p className="mt-4 text-ink-2">
          Halo, {viewer.displayName ?? "kamu"}.
        </p>
      )}

      <div className="mt-8 grid gap-3">
        <Link href="/masuk" className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 px-5 py-4 text-lg hover:bg-surface-2">
          {t("entry.learner", "public")}
        </Link>
        <Link href="/masuk?peran=guru" className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 px-5 py-4 text-lg hover:bg-surface-2">
          {t("entry.educator", "public")}
        </Link>
        <Link
          href={viewer && staffRoles.has(viewer.displayRole ?? "") ? "/konfigurasi" : "/masuk?peran=staf"}
          className="rounded-[var(--radius-2)] border border-line-1 bg-surface-1 px-5 py-4 text-lg hover:bg-surface-2"
        >
          {t("entry.staff", "public")}
        </Link>
      </div>
    </main>
  );
}

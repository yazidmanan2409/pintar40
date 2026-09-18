import { t, type Persona } from "@/lib/hle";
import { sendMagicLink, signInWithCard } from "./actions";
import Link from "next/link";
import { tujuanInternal } from "@/lib/tujuan";

type Search = Promise<{ peran?: string; lanjut?: string; kartu?: string; terkirim?: string }>;

export default async function Masuk({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const persona: Persona = sp.peran === "staf" ? "staff" : sp.peran === "guru" ? "educator" : "learner";
  // L-1. This value is written into a hidden field and posted straight back,
  // so narrowing it here is what stops the page itself from carrying a
  // poisoned destination forward; the actions narrow it again on receipt.
  const next = tujuanInternal(sp.lanjut);

  async function submitLink(formData: FormData) {
    "use server";
    const r = await sendMagicLink(formData);
    const { redirect } = await import("next/navigation");
    redirect(`/masuk?peran=${sp.peran ?? ""}&terkirim=${r.ok ? "1" : "0"}`);
  }

  return (
    <main className="mx-auto max-w-md py-12">
      <p className="text-sm text-ink-3"><Link href="/">{t("app.name", "public")}</Link></p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("auth.title", persona)}</h1>

      <section className="mt-8 rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-5">
        {sp.terkirim === "1" ? (
          <p className="text-ink-2">{t("auth.link_sent", persona)}</p>
        ) : (
          <form action={submitLink} className="grid gap-3">
            <input type="hidden" name="lanjut" value={next} />
            <label className="text-sm text-ink-2" htmlFor="email">{t("auth.email_label", persona)}</label>
            <input id="email" name="email" type="email" required autoComplete="email"
              className="rounded-[var(--radius-1)] border border-line-1 bg-surface-0 px-3 py-2" />
            <p className="text-sm text-ink-3">{t("auth.email_help", persona)}</p>
            <button type="submit" className="rounded-[var(--radius-1)] bg-primary px-4 py-2 text-primary-ink">
              {t("auth.send_link", persona)}
            </button>
          </form>
        )}
      </section>

      {persona === "learner" && (
        <section className="mt-6 rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-5">
          <h2 className="text-lg font-medium">{t("auth.card_title", "learner")}</h2>
          <form action={signInWithCard} className="mt-3 grid gap-3">
            <input type="hidden" name="lanjut" value={next} />
            <label className="text-sm text-ink-2" htmlFor="kartu">{t("auth.card_number", "learner")}</label>
            <input id="kartu" name="kartu" inputMode="numeric" autoComplete="off" required
              className="rounded-[var(--radius-1)] border border-line-1 bg-surface-0 px-3 py-2" />
            <label className="text-sm text-ink-2" htmlFor="pin">{t("auth.card_pin", "learner")}</label>
            <input id="pin" name="pin" type="password" inputMode="numeric" autoComplete="off" required
              className="rounded-[var(--radius-1)] border border-line-1 bg-surface-0 px-3 py-2" />
            {sp.kartu === "gagal" && <p className="text-sm text-attention">{t("auth.card_failed", "learner")}</p>}
            <button type="submit" className="rounded-[var(--radius-1)] border border-line-1 px-4 py-2 hover:bg-surface-2">
              {t("auth.card_enter", "learner")}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

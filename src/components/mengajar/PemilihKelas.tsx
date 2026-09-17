"use client";

import Link from "next/link";
import { t, type Locale } from "@/lib/hle";

/**
 * PemilihKelas — moving between the classes of the teaching context.
 *
 * IT OFFERS EXACTLY THE LIST THE SERVER DERIVED, AND CANNOT BE PERSUADED TO
 * OFFER MORE. A class that is not in `kelas` is not in the DOM, and the server
 * re-derives the context from the viewer's own grants on every request — so a
 * hand-typed id lands on the same refusal a nonexistent one does.
 *
 * IT IS NOT AN AUTHORIZATION CONTROL, and the copy around it does not say it
 * is. It holds no capability and decides nothing: every action reached from the
 * class it selects is authorized again server-side, by the database.
 *
 * Plain links rather than a client router push: switching class is a page, the
 * URL is worth keeping, and a control that swallows navigation would break the
 * back button for no gain.
 */
export default function PemilihKelas({
  kelas,
  terpilih,
  locale = "id",
}: {
  kelas: Array<{ id: string; nama: string }>;
  terpilih: string;
  locale?: Locale;
}) {
  if (kelas.length < 2) return null;
  return (
    <div className="pin-switch" role="group" aria-label={t("mengajar.pindah", "educator", { locale })}>
      {kelas.map((k) => (
        <Link
          key={k.id}
          href={`/mengajar/${k.id}`}
          aria-current={k.id === terpilih ? "page" : undefined}
        >
          {k.nama}
        </Link>
      ))}
    </div>
  );
}

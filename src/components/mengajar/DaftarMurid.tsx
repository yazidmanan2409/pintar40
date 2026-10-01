import Link from "next/link";
import { t, type Locale } from "@/lib/hle";

/**
 * DaftarMurid — names, and nothing beside them.
 *
 * NO STATUS, NO COLOUR, NO ORDER BUT THE ALPHABET. A roster is the one place a
 * surface is most tempted to be helpful — a red dot beside the child who has
 * not submitted, the stragglers floated to the top — and every one of those is
 * a judgment PINTAR has no evidence for. It knows a session exists or does not.
 * It does not know why, and a mark beside a name says it does.
 *
 * So this component renders a name per row and offers no slot for anything
 * else. Where the product genuinely needs to separate who has submitted from
 * who has not, it renders TWO of these under two neutral headings, which says
 * the same fact without attaching it to anybody as a property.
 *
 * M4 (D-085): given the class, each name opens that learner's record for the
 * teacher (/mengajar/[kelas]/murid/[orang]); the link is the name itself, with
 * nothing added beside it.
 *
 * The names themselves are bounded by the database, not by this list:
 * `persons_select` goes through `person_visible_to_me()`, whose educator branch
 * is subtree containment, so a learner outside the educator's grants never
 * arrives here to be filtered out.
 */
export default function DaftarMurid({
  murid,
  locale = "id",
  kelas,
}: {
  murid: Array<{ id: string; nama: string }>;
  locale?: Locale;
  /** The class, when each name should open that learner's record (M4). */
  kelas?: string;
}) {
  if (murid.length === 0) {
    return <p className="pin-empty">{t("mengajar.murid.kosong", "educator", { locale })}</p>;
  }
  return (
    <ul className="pin-roster">
      {murid.map((m) => (
        <li key={m.id}>
          {kelas ? <Link href={`/mengajar/${kelas}/murid/${m.id}`}>{m.nama}</Link> : m.nama}
        </li>
      ))}
    </ul>
  );
}

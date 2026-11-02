import Link from "next/link";

/**
 * W3.2 · Empty state (Batch 2; Daisy, components/EmptyState; CR-46): three different sentences for three different
 * emptinesses, and the way on.
 *
 *   belum        not yet: what will appear here, and the first action («Siapkan materi pertama»)
 *   kurang       not enough yet: how much there is and how much is needed («Sekarang 2 murid; perlu 5.»), no action
 *   tidak_cocok  nothing matches: what was searched, and the way back («Hapus pencarian»)
 *
 * No illustration, no zero standing in for an unknown. A refusal is never drawn as empty (that is HalamanPenolakan or
 * KartuKetiadaan's «not for you»), and a section with nothing needing attention is absent, not this box. The words
 * are the caller's, from hle.ts; this component only gives every empty state the same shape.
 */
export default function Kosong({
  jenis, kalimat, aksi,
}: {
  jenis: "belum" | "kurang" | "tidak_cocok";
  kalimat: string;
  /** The first action (belum) or the way back (tidak_cocok); never for kurang. */
  aksi?: { href: string; label: string } | null;
}) {
  return (
    <div className="pin-empty pin-kosong" data-kosong={jenis}>
      <p className="pin-kosong-kalimat">{kalimat}</p>
      {aksi && jenis !== "kurang" ? <Link className="pin-btn" href={aksi.href}>{aksi.label}</Link> : null}
    </div>
  );
}

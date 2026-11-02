/**
 * W3.3 · the disabled button's reason (Batch 2; Daisy, components/Button: «A disabled button always has its reason
 * written beside it, or it stays enabled and explains on press»). A button that is disabled for a reason the person
 * can act on names this line with aria-describedby, so the reason is seen and heard:
 *
 *   <button disabled={!berkas} aria-describedby={!berkas ? "periksa-alasan" : undefined}>…</button>
 *   {!berkas ? <AlasanNonaktif id="periksa-alasan">{s("…")}</AlasanNonaktif> : null}
 *
 * A button disabled only while its own request is working is not this case: that is TombolKirim's processing state.
 */
export default function AlasanNonaktif({ id, children }: { id: string; children: React.ReactNode }) {
  return <p className="pin-alasan" id={id}>{children}</p>;
}

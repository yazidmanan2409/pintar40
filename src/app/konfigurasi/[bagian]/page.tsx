import Konfigurasi from "../page";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/konfigurasi/[bagian]");

/**
 * B1 (D-166(a)): one Konfigurasi section's page, `/konfigurasi/<section>`. It is the same page as the index, drawn for
 * its one section (src/app/konfigurasi/page.tsx reads `params.bagian`), so the gate, the context, the database's reads
 * and every action are the ones the section always had. Keamanan akun, Kirim email uji and Sertifikat sekolah are their
 * own pages and keep their routes (a static route wins over this one).
 */
export default function BagianKonfigurasi(props: { params: Promise<{ bagian: string }>; searchParams: Parameters<typeof Konfigurasi>[0]["searchParams"] }) {
  return <Konfigurasi {...props} />;
}

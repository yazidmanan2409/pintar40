// Review tooling: the sign-in screen's email-link action, which runs on the
// server in the app. Here it answers the one outcome D2 leaves it.
export type HasilKirim = "terkirim" | "gagal";
export async function sendMagicLink(): Promise<HasilKirim> {
  return "terkirim";
}

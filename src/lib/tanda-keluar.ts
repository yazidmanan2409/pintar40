/**
 * L3 · THE SIGN-OUT MARK: 4.0'S STALE-CONTINUATION GUARD (D-132(e); design §2.9). NOT PART OF THE WORKING CONTEXT.
 *
 * «A continuation belongs to the authenticated/session journey that created it, not merely to a browser.» After a
 * sign-out, a Back that reached the server became `/masuk?lanjut=<that page>`, and the next sign-in, by anyone, landed
 * there (CR-90's open line). 4.0 cannot tell whose continuation a signed-out browser carries without keeping an
 * identity on it, so it keeps none, and takes the conservative fallback the Second Eye accepted: the first sign-in
 * after a session ended on a browser ignores any carried destination and lands by the person's own door and context.
 *
 *   pintar_hadir    this browser holds a signed-in session (set by the proxy while one is)
 *   pintar_selesai  THE MARK: a session ended on this browser and nobody has signed in since. Set by «Keluar», by
 *                   «Keluar dari semua perangkat», by S15's «Keluar», by the proxy when the session it finds has
 *                   ended, and by the proxy when a browser that held a session arrives without one (ended from
 *                   another device, by a credential change, or its cookies simply lapsed). While it is present the
 *                   proxy mints no `lanjut`, and the next sign-in (`/mulai`) ignores one and removes the mark.
 *
 * Neither holds an identity: the value is "1". Both are httpOnly. Pure: the proxy, the routes and the tests read the
 * same names and rules.
 */
export const COOKIE_HADIR = "pintar_hadir";
export const COOKIE_SELESAI = "pintar_selesai";

/** Kept as long as a personal computer's session may live, so a mark outlives any session it guards against. */
export const UMUR_TANDA = 7 * 24 * 60 * 60;

export function opsiTanda(aman: boolean) {
  return { path: "/", sameSite: "lax" as const, httpOnly: true, secure: aman, maxAge: UMUR_TANDA };
}

/**
 * What the proxy does with the two cookies for one request.
 *
 *   masuk      a signed-in session was found
 *   berakhir   the session found has ended (sesi_periksa: BERAKHIR)
 *   hadir      the browser sent pintar_hadir
 *   selesai    the browser sent pintar_selesai
 *   aksi       a server action (cookies written there redraw the page: BOB-23)
 */
export function aturTanda(a: { masuk: boolean; berakhir: boolean; hadir: boolean; selesai: boolean; aksi: boolean }): {
  pasangHadir: boolean; hapusHadir: boolean; pasangSelesai: boolean; tandai: boolean;
} {
  if (a.berakhir || (!a.masuk && a.hadir)) {
    return { pasangHadir: false, hapusHadir: a.hadir, pasangSelesai: !a.selesai, tandai: true };
  }
  if (a.masuk) {
    return { pasangHadir: !a.hadir && !a.aksi, hapusHadir: false, pasangSelesai: false, tandai: a.selesai };
  }
  return { pasangHadir: false, hapusHadir: false, pasangSelesai: false, tandai: a.selesai };
}

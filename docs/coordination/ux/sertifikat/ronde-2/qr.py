"""
Sertifikat round 2: QR symbols for the study (byte and uppercase alphanumeric).

  python qr.py '<json list of [text, mode, error]>'  ->  JSON list of {versi, ecc, mode, matriks}

The app's own encoder (src/lib/qr.ts) makes byte mode only; the render script
checks that segno's byte symbol is the same version as the app's. segno makes
the alphanumeric symbols, which the app's encoder cannot yet.
"""
import json
import sys

import segno

out = []
for teks, mode, ecc in json.loads(sys.argv[1]):
    q = segno.make_qr(teks, error=ecc, mode=mode, boost_error=False)
    matriks = [[1 if v else 0 for v in baris] for baris in q.matrix]
    out.append({"versi": q.version, "ecc": q.error, "mode": q.mode, "matriks": matriks})
json.dump(out, sys.stdout)

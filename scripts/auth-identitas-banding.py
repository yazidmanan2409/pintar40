#!/usr/bin/env python3
"""BOB-26 (D-079 addendum): compare a project's deployed Auth settings with the
ONE canonical source, supabase/auth-identitas.json.

    auth-identitas-banding.py <config.json> <label> [--report-only] [--hibp-unavailable]

<config.json> is the Management API's /config/auth answer. Only the canonical
file's keys are read and printed (no secret is among them). Exit 1 on any
difference, unless --report-only (production before the release applies them,
C-11; the canonical file's production_applied says which).

`--body` prints the PATCH body for the settings workflow instead:

    auth-identitas-banding.py --body
"""
import json
import os
import sys

KANONIK = os.path.join(os.path.dirname(__file__), "..", "supabase", "auth-identitas.json")


def muat():
    with open(KANONIK) as f:
        return json.load(f)


def main(argv):
    k = muat()
    # The leaked-password check is a plan feature (Pro, GATE-0-FACTS §1, C18). It
    # is written on its own, so a plan that does not provide it refuses only
    # that write; the workflow then says so, and the read-back reports it
    # instead of failing (D-082(a): on only if the plan provides it, read back).
    if argv[1:2] == ["--body"]:
        print(json.dumps({key: v for key, v in k["settings"].items() if key != "password_hibp_enabled"}))
        return 0
    if argv[1:2] == ["--body-hibp"]:
        print(json.dumps({"password_hibp_enabled": k["settings"]["password_hibp_enabled"]}))
        return 0
    path, label = argv[1], argv[2]
    report_only = "--report-only" in argv
    hibp_unavailable = "--hibp-unavailable" in argv
    with open(path) as f:
        d = json.load(f)
    beda = []
    for key, want in k["settings"].items():
        got = d.get(key)
        if want == "" and got is None:
            got = ""  # the API may answer an empty requirement as null
        ok = got == want
        print(f"{label:11} {key:52} {'ok ' if ok else 'DRIFT'} deployed={got!r} canonical={want!r}")
        if not ok and key == "password_hibp_enabled" and hibp_unavailable:
            print(f"::warning::{label}: the plan does not provide the leaked-password check; it stays off")
            continue
        if not ok:
            beda.append(key)
    if beda and not report_only:
        print(f"::error::{label}: the deployed Auth settings differ from supabase/auth-identitas.json: {', '.join(beda)}")
        return 1
    if beda:
        print(f"::notice::{label}: differs from supabase/auth-identitas.json ({', '.join(beda)}); reported only, "
              "because production_applied is false (the release applies them, C-11)")
    else:
        print(f"{label}: every Gate 3 Auth setting equals supabase/auth-identitas.json")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

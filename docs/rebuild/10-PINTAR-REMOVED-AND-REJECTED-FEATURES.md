# 10 — PINTAR Removed & Rejected Features

Prevents Fable 5.1 from discovering old code/docs and accidentally
resurrecting something that was deliberately left behind.

| Feature | Historical purpose | Why removed/rejected | Replaced by | Recreate in PINTAR 4.0? |
|---|---|---|---|---|
| Legacy `soal`-table question bank (`/asesmen`, `/hasil`, `/sertifikat`) | Original assessment engine for the herbal EBM course, predates the PLP schema | Superseded by the PLP-native model; kept running in parallel only as a stability bridge, never intended as permanent | PLP-native items/item_options/assessment_blueprints | **NO** |
| Legacy SD5 "Pecahan" fraction-pilot bank (same `soal` table) | Thin-slice pilot to prove the PLP concept before full PLP schema existed | Superseded by the 9-chapter PLP-native SD5 curriculum; relationship between the two was never resolved, which is itself the reason to not carry either forward | PLP-native SD5 Math ch1–9 | **NO** — author fresh SD5 content directly in the PLP model |
| `migrations-legacy-warisan-akar/` colliding migration series | A second SMA10 seed series that collided in filename numbering with the canonical series | Numbering collision, required manual interleave instructions to run at all | One linear migration history (ground-zero rule) | **NO** |
| In-memory certificate store (`lib/penyimpanan.ts`-style Map) | Fast to build for an early demo | Doesn't survive restarts or multiple serverless instances; certificates must be durable | Postgres-backed certificates from migration one | **NO** |
| Dummy-data fallback in the briefing pipeline (`getStatusKohortLive()` stub, "Mode Pengujian" banner) | Let the briefing UI be built and demoed before real cohort data existed | Risk of permanently masking whether real data was ever wired in; erodes trust in an evidence-based product | Honest "not enough data yet" empty state | **NO** |
| `NEXT_PUBLIC_GDRIVE_BASE_URL` / `NEXT_PUBLIC_GDRIVE_ROOT_FOLDER_ID` env vars | An earlier asset-hosting approach via Google Drive | Read by nothing in the final tree — dead configuration asserting a contract the app never implemented | Supabase Storage with signed URLs | **NO** |
| Direct-from-browser anon-key storage upload (`lib/plp/storage.ts` client `.upload()`) | Fastest path to a working Studio upload UI | Root dependency that made the C2 storage vulnerability's fix a two-part coordinated change instead of one migration | Server-side signed-upload route, `service_role`-gated | **NO** |
| `~90` dated `delivery-*`/`handoff_*` patch folders as the primary "repo" structure | Organic result of many independent AI-assisted work sessions, each producing its own delivery bundle | Required a manual reconciliation manifest just to know which files were current; enormous archaeology overhead | One git trunk, real commit history | **NO** |
| Parallel static/legacy exports (`archive/PINTAR-2.0-baked/`, `site-full-2026-07-31/`) | Earlier product iterations kept for historical reference | Not part of the running product; kept only for provenance research | N/A | **NO** |
| Two public certificate-verification URL shapes (`/verify/[hash]` and `/verifikasi/[id]`) coexisting with no redirect | Organic result of a route naming change mid-project without cleaning up the old one | Confusing surface area, printed QR codes pointing at two different implementations | One canonical route | **NO — build exactly one from the start** |
| Provisional, never-classified migrations `0085`–`0088` | Written speculatively ahead of confirmed need | Left in an ambiguous "maybe already applied, maybe not" state with no resolution | N/A — a ground-zero rebuild has no provisional-migration backlog to inherit | **NO** |
| Physical ID-1 credential card with NFC glyph + 3D flip animation (discussed at length in the uploaded design conversations) | A proposed premium credential-design direction | Never implemented; a print/physical-goods concept, not validated against any real requirement | A4 printable certificate (in scope) | **ONLY IF product owner explicitly requests it for V1** — currently category C/D per doc 09 |
| Bulk Excel/CSV importer describing itself with parser/validation jargon in end-user copy | Early Studio import UI language | Conflicts with the "offer creation, never configuration" doctrine — exposes internal mechanics as user-facing verbs | "Create Learning Package" framed UI (doc 09 category A) | **Recreate the underlying capability, NOT the user-facing framing** |

If Fable 5.1 encounters any of the above referenced in an old document or
old code sample during the rebuild, treat it as historical record only —
never as a spec to satisfy.

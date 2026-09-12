# SPEC v2: Dr. Gladys Learning Cycle — PINTAR
Next.js 14 App Router · Supabase PG · Upstash Redis · TS strict
Files touched: `lib/tipe.ts` · `lib/skor.ts` · `lib/soal.ts` · `/pre-test` · `/hasil`

Flow: `Pre-Test (diagnosa) → Peta Bacaan → Post-Test (20 soal, safety gate) → Hasil + Delta`

---

## 1. `lib/tipe.ts` — extended interfaces

Extends the existing shapes rather than replacing them; `HasilAsesmen` stays the post-test result type and gains optional comparative fields.

```ts
export type TestMode = 'pre' | 'post';

export type DomainId =
  | 'keamanan'        // Fase II · Bab V — safety gate
  | 'ebm'             // Fase II · Bab III
  | 'kondisi-klinis'  // Fase II · Bab IV
  | 'dosis'
  | 'komunikasi';

// ── existing, extended ──────────────────────────────
export interface SkorDomain {
  domain: DomainId;
  label: string;
  benar: number;
  total: number;
  pct: number;                     // benar/total * 100, 1 decimal
}

export interface HasilAsesmen {
  // ...existing fields (skor, lulus, safetyGate, tinjauan, dst.)
  mode: TestMode;                  // NEW — 'post' for the formal run
  preTestScore?: number;           // NEW — baseline overall %, if pre exists
  domainDeltas?: DomainDelta[];    // NEW — populated only when pre exists
}

// ── new ─────────────────────────────────────────────
export interface DomainDelta {
  domain: DomainId;
  label: string;
  prePct: number;
  postPct: number;
  deltaPct: number;                // postPct − prePct (can be negative)
}

export interface HasilPreTest {
  sessionId: string;
  totalBenar: number;
  totalSoal: number;
  skorDomain: SkorDomain[];
  readingMap: ReadingMapEntry[];
  itemIds: string[];               // fed to drawItems() exclusion on post
  // deliberately ABSENT: lulus, safetyGate, rationales
}

export interface ReadingMapEntry {
  domain: DomainId;
  label: string;                   // "Keamanan & Interaksi"
  chapterRef: string;              // "Bab V, Hal. 102–104"
  priority: 'wajib' | 'disarankan' | 'kuat';
  reason: string;                  // "1/2 benar pada pemetaan awal"
}

export interface PreTestSessionState {   // Redis hash, TTL 24h: sesi:{id}:progress
  mode: TestMode;
  itemIds: string[];               // locked at start — refresh never re-rolls
  answers: Record<string, string | null>;
  cursor: number;
  startedAt: string;               // ISO
}
```

---

## 2. `lib/skor.ts` — scoring & delta engine

Both functions are pure (no I/O) — unit-testable, callable from Server Actions.

```ts
import { CHAPTER_REFS } from './konten';   // domain → {label, chapterRef}

/** Baseline scorer: NO pass/fail, NO safety-gate lockout, NO rationales. */
export function hitungHasilPreTest(
  items: SoalItem[],
  answers: Record<string, string | null>,
  sessionId: string
): HasilPreTest {
  const skorDomain = hitungSkorDomain(items, answers);   // reuse existing helper
  return {
    sessionId,
    totalBenar: skorDomain.reduce((a, d) => a + d.benar, 0),
    totalSoal: items.length,
    skorDomain,
    itemIds: items.map(i => i.id),
    readingMap: buatPetaBacaan(skorDomain, items, answers),
  };
}

function buatPetaBacaan(
  skor: SkorDomain[],
  items: SoalItem[],
  answers: Record<string, string | null>
): ReadingMapEntry[] {
  const safetyMissed = items.some(
    i => i.isSafety && answers[i.id] !== i.kunci
  );
  return skor
    .map((d): ReadingMapEntry => ({
      domain: d.domain,
      label: CHAPTER_REFS[d.domain].label,
      chapterRef: CHAPTER_REFS[d.domain].chapterRef,
      priority:
        d.domain === 'keamanan' && safetyMissed ? 'wajib'
        : d.pct < 50 ? 'wajib'
        : d.pct < 80 ? 'disarankan'
        : 'kuat',
      reason: `${d.benar}/${d.total} benar pada pemetaan awal`,
    }))
    // safety-missed pinned first, then wajib → disarankan → kuat
    .sort((a, b) => rank(a) - rank(b));
}
const rank = (e: ReadingMapEntry) =>
  e.domain === 'keamanan' && e.priority === 'wajib' ? 0
  : e.priority === 'wajib' ? 1 : e.priority === 'disarankan' ? 2 : 3;

/** Pre vs Post growth per domain. Domains absent from pre get delta vs 0. */
export function hitungDelta(
  pre: SkorDomain[],
  post: SkorDomain[]
): DomainDelta[] {
  return post.map(p => {
    const b = pre.find(d => d.domain === p.domain);
    const prePct = b ? b.pct : 0;
    return {
      domain: p.domain,
      label: p.label,
      prePct,
      postPct: p.pct,
      deltaPct: +(p.pct - prePct).toFixed(1),
    };
  });
}
```

Post-test path change (existing `hitungHasil`): after scoring, if a `pre` attempt exists for the session → attach `preTestScore` + `domainDeltas: hitungDelta(pre.skorDomain, post.skorDomain)`. Safety gate logic untouched.

---

## 3. `lib/soal.ts` — parallel item selection

```ts
const PRE_BLUEPRINT:  Partial<Record<DomainId, number>> =
  { keamanan: 2, ebm: 2, 'kondisi-klinis': 2 };            // 6 items, ~3 min
const POST_BLUEPRINT: Record<DomainId, number> =
  { keamanan: 5, ebm: 5, 'kondisi-klinis': 4, dosis: 3, komunikasi: 3 }; // 20

export function drawItems(
  mode: TestMode,
  excludeIds: string[] = [],        // pre-test item_ids when mode === 'post'
  seed = Date.now()
): SoalItem[] {
  const blueprint = mode === 'pre' ? PRE_BLUEPRINT : POST_BLUEPRINT;
  const rng = mulberry32(seed);
  return Object.entries(blueprint).flatMap(([domain, n]) => {
    const pool = bankSoal.filter(s =>
      s.domain === domain &&
      !excludeIds.includes(s.id) &&
      // exclude siblings (same stem reworded) via parallelGroup:
      !bankSoal.some(p => excludeIds.includes(p.id) &&
                          p.parallelGroup && p.parallelGroup === s.parallelGroup)
    );
    if (pool.length < n!) throw new Error(`Bank soal kurang: ${domain}`);
    return shuffle(pool, rng).slice(0, n!);
  });
}
```

Bank invariant: per domain, distinct items ≥ pre + post quota. Unit tests: `pre ∩ post = ∅`; parallelGroup respected; blueprint counts exact.

---

## 4. Storage design

**Supabase (durable):**

```sql
create table learning_sessions (
  id         uuid primary key default gen_random_uuid(),
  nama       text not null,
  institusi  text,
  email      text,
  status     text not null default 'pre_test'
             check (status in ('pre_test','membaca','post_test','selesai')),
  created_at timestamptz not null default now()
);

create table test_attempts (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references learning_sessions(id) on delete cascade,
  mode               text not null check (mode in ('pre','post')),
  score_pct          numeric(5,2) not null,
  correct_items      int not null,
  total_items        int not null,
  safety_gate_passed boolean,          -- null on pre (gate not enforced)
  domain_breakdown   jsonb not null,   -- SkorDomain[]
  item_ids           text[] not null,  -- parallel exclusion source
  answers            jsonb not null,
  duration_sec       int,
  completed_at       timestamptz not null default now()
);
create unique index uq_attempt_mode on test_attempts(session_id, mode);
```

Retries create a new session (pre/post pairing stays 1:1). **Redis** holds only in-progress `PreTestSessionState` (`sesi:{id}:progress`, TTL 24h); items lock at start.

---

## 5. Component plan — Reading Map & Delta UI

```
app/pre-test/page.tsx      <TestRunner config={RUNNER_CONFIG.pre}/>
app/pre-test/hasil/page.tsx  <PetaBacaan hasil={hasilPreTest}/>
app/hasil/page.tsx           existing + <DeltaGrowth/> when pre exists
components/ TestRunner.tsx · PetaBacaan.tsx · DeltaGrowth.tsx · SafetyGateBadge.tsx
```

**One runner, two configs** (never fork the test screen):

```ts
const RUNNER_CONFIG: Record<TestMode, RunnerConfig> = {
  pre:  { showTimer: false, showPassFail: false, showRationales: false,
          allowPause: false, headerLabel: 'Pemetaan Awal · ±3 menit' },
  post: { showTimer: true,  showPassFail: true,  showRationales: true,
          allowPause: true,  headerLabel: 'Uji Penguasaan' },
};
```

**`PetaBacaan.tsx`** (pre-test result — deliberately NOT `/hasil`):
- Header: "Peta Bacaan Personal Anda" — neutral tone, no score banner, no lulus/gagal.
- One card per `ReadingMapEntry`, ordered by `rank`: priority chip (`Wajib` / `Disarankan` / `Sudah kuat` — kuat collapsed), chapterRef as CTA "Buka Bab V, Hal. 102–104 →", reason line.
- Footer CTA: "Saya siap — Uji Penguasaan →" → `drawItems('post', hasil.itemIds)`.
- No rationales anywhere on this screen.

**`DeltaGrowth.tsx`** (post-test `/hasil`, renders only if `domainDeltas` present):
- Overall line: `Pemetaan 50% → Hasil 85% (+35)`.
- Per-domain rows: paired bars (pre muted, post filled) + delta chip; negative delta rendered honestly in alert color, no spin.
- `<SafetyGateBadge/>` beside overall: passed → "Gerbang Keamanan ✓ 100%"; failed → existing red callout (with the "di atas/di bawah ambang" conditional copy fix).

---

## 6. Build order
1. `tipe.ts` + migration (no UI risk)
2. `skor.ts`: `hitungHasilPreTest` + `hitungDelta` + unit tests
3. `soal.ts` `drawItems` + exclusion tests
4. TestRunner config split (`/pre-test` shippable dark)
5. `PetaBacaan` page → 6. `DeltaGrowth` + gate-copy fix on `/hasil`

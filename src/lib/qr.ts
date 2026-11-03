/**
 * A QR symbol for the certificate's verification link.
 *
 * WHY THIS IS IN THE REPOSITORY RATHER THAN A DEPENDENCY OR AN IMAGE SERVICE.
 * The code on a printed certificate is the only part of the credential a
 * stranger uses without reading it: they point a camera and go where it says.
 * A code fetched from a third-party image service would mean a URL carrying a
 * learner's verification token leaves PINTAR every time a certificate is
 * rendered, and whoever answers that request learns the token. So the symbol is
 * computed here, server-side, from the link, and nothing leaves.
 *
 * Byte mode, the smallest version that fits, at one of two error-correction
 * levels. M (about 15% recoverable) is the default, and what the Digital Card
 * and the on-screen certificate use. Q (about 25% recoverable) is the printed
 * certificate's (D-160(b); Daisy's sertifikat ronde-2 §2): a certificate is
 * kept for years, folded, stamped and photocopied, so recovery matters more than
 * the extra modules. The 43-character token stays (ADR-0012), so the symbol is
 * byte mode, not Daisy's version-4 alphanumeric: a recorded deviation.
 *
 * ISO/IEC 18004. Verified against an independent decoder — see
 * UX1-S1-QR-01, which encodes a real verification link, decodes the matrix
 * back with jsQR and fails unless the text round-trips.
 */

// ------------------------------------------------------------------ GF(256)
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // the primitive polynomial QR is defined over
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** The generator polynomial for `degree` error-correction codewords. */
function generator(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let d = 0; d < degree; d++) {
    const next = new Uint8Array(poly.length + 1);
    for (let i = 0; i < poly.length; i++) {
      next[i] ^= poly[i];
      next[i + 1] ^= mul(poly[i], EXP[d]);
    }
    poly = next;
  }
  return poly;
}

function ecCodewords(data: Uint8Array, count: number): Uint8Array {
  const gen = generator(count);
  const rem = new Uint8Array(count);
  for (const byte of data) {
    const factor = byte ^ rem[0];
    rem.copyWithin(0, 1);
    rem[count - 1] = 0;
    for (let i = 0; i < count; i++) rem[i] ^= mul(gen[i + 1], factor);
  }
  return rem;
}

// ------------------------------------------------------- version parameters
export type QrLevel = "M" | "Q";

type Blocks = Array<[number, Array<[number, number]>]>;

/** [ec codewords per block, [blocks, data codewords per block] …] at level M. */
const M_BLOCKS: Blocks = [
  [10, [[1, 16]]],                  // 1
  [16, [[1, 28]]],                  // 2
  [26, [[1, 44]]],                  // 3
  [18, [[2, 32]]],                  // 4
  [24, [[2, 43]]],                  // 5
  [16, [[4, 27]]],                  // 6
  [18, [[4, 31]]],                  // 7
  [22, [[2, 38], [2, 39]]],         // 8
  [22, [[3, 36], [2, 37]]],         // 9
  [26, [[4, 43], [1, 44]]],         // 10
];

/** The same at level Q (ISO/IEC 18004 table 9). */
const Q_BLOCKS: Blocks = [
  [13, [[1, 13]]],                  // 1
  [22, [[1, 22]]],                  // 2
  [18, [[2, 17]]],                  // 3
  [26, [[2, 24]]],                  // 4
  [18, [[2, 15], [2, 16]]],         // 5
  [24, [[4, 19]]],                  // 6
  [18, [[2, 14], [4, 15]]],         // 7
  [22, [[4, 18], [2, 19]]],         // 8
  [20, [[4, 16], [4, 17]]],         // 9
  [24, [[6, 19], [2, 20]]],         // 10
];

const BLOCKS: Record<QrLevel, Blocks> = { M: M_BLOCKS, Q: Q_BLOCKS };
/** The two format bits of each level: M is 00, Q is 11. */
const LEVEL_BITS: Record<QrLevel, number> = { M: 0b00, Q: 0b11 };

const ALIGNMENT: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

function dataCodewords(version: number, level: QrLevel): number {
  const [, groups] = BLOCKS[level][version - 1];
  return groups.reduce((n, [blocks, per]) => n + blocks * per, 0);
}

/** Bytes encodable in byte mode at this version and level. */
function byteCapacity(version: number, level: QrLevel): number {
  const headerBits = 4 + (version >= 10 ? 16 : 8);
  return Math.floor((dataCodewords(version, level) * 8 - headerBits) / 8);
}

// -------------------------------------------------------------- bit stream
class Bits {
  private bytes: number[] = [];
  private length = 0;
  push(value: number, width: number) {
    for (let i = width - 1; i >= 0; i--) {
      const bit = (value >>> i) & 1;
      if (this.length % 8 === 0) this.bytes.push(0);
      if (bit) this.bytes[this.bytes.length - 1] |= 0x80 >>> (this.length % 8);
      this.length++;
    }
  }
  get bitLength() { return this.length; }
  toBytes(): number[] { return this.bytes; }
}

// ------------------------------------------------------------------ masking
const MASKS: Array<(i: number, j: number) => boolean> = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (_i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0,
];

function formatBits(mask: number, level: QrLevel): number {
  // the level's two bits and the mask; BCH(15,5) with the QR generator, then the fixed XOR
  const data = (LEVEL_BITS[level] << 3) | mask;
  let rem = data << 10;
  for (let i = 4; i >= 0; i--) {
    if ((rem >>> (10 + i)) & 1) rem ^= 0b10100110111 << i;
  }
  return ((data << 10) | rem) ^ 0b101010000010010;
}

function versionBits(version: number): number {
  let rem = version << 12;
  for (let i = 5; i >= 0; i--) {
    if ((rem >>> (12 + i)) & 1) rem ^= 0b1111100100101 << i;
  }
  return (version << 12) | rem;
}

type Grid = { size: number; modules: Int8Array; reserved: Uint8Array };

function at(g: Grid, r: number, c: number): number { return g.modules[r * g.size + c]; }
function set(g: Grid, r: number, c: number, dark: boolean, reserve = true) {
  g.modules[r * g.size + c] = dark ? 1 : 0;
  if (reserve) g.reserved[r * g.size + c] = 1;
}

/**
 * Where each of the 15 format bits lives, bit 0 first, in both copies.
 * Index 0..14 is the copy beside the top-left finder; 15..29 is the split copy
 * beside the other two. The dark module at (size-8, 8) is deliberately NOT in
 * this list: it is a fixed module, not format information.
 */
function formatPositions(size: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < 15; i++) {
    if (i < 6) out.push([i, 8]);
    else if (i < 8) out.push([i + 1, 8]);
    else out.push([size - 15 + i, 8]);
  }
  for (let i = 0; i < 15; i++) {
    if (i < 8) out.push([8, size - i - 1]);
    else if (i < 9) out.push([8, 7]);
    else out.push([8, 15 - i - 1]);
  }
  return out;
}

function placeFunctionPatterns(g: Grid, version: number) {
  const n = g.size;
  const finder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = top + r, cc = left + c;
        if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
        const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
        set(g, rr, cc, ring !== 2 && ring <= 3);
      }
    }
  };
  finder(0, 0); finder(0, n - 7); finder(n - 7, 0);

  for (let i = 8; i < n - 8; i++) {
    set(g, 6, i, i % 2 === 0);
    set(g, i, 6, i % 2 === 0);
  }

  for (const r of ALIGNMENT[version - 1]) {
    for (const c of ALIGNMENT[version - 1]) {
      // the three finder corners have no alignment pattern
      if ((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          set(g, r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        }
      }
    }
  }

  set(g, n - 8, 8, true); // the dark module

  // Reserve the format areas through the SAME mapping that later writes them,
  // so a reservation and a write can never disagree about which module is
  // format information and which is the dark module.
  for (const [r, c] of formatPositions(n)) set(g, r, c, false);

  if (version >= 7) {
    const bits = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1;
      set(g, Math.floor(i / 3), n - 11 + (i % 3), dark);
      set(g, n - 11 + (i % 3), Math.floor(i / 3), dark);
    }
  }
}

function placeData(g: Grid, codewords: Uint8Array) {
  const n = g.size;
  let bit = 0;
  let upward = true; // the walk starts at the bottom-right corner, going up
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // column 6 is the vertical timing pattern
    for (let vert = 0; vert < n; vert++) {
      const r = upward ? n - 1 - vert : vert;
      for (let k = 0; k < 2; k++) {
        const c = right - k;
        if (g.reserved[r * n + c]) continue;
        const dark = bit < codewords.length * 8
          && ((codewords[bit >>> 3] >>> (7 - (bit & 7))) & 1) === 1;
        set(g, r, c, dark, false);
        bit++;
      }
    }
    upward = !upward;
  }
}

function penalty(g: Grid): number {
  const n = g.size;
  let score = 0;
  // rule 1 — runs of five or more
  for (let i = 0; i < n; i++) {
    for (const row of [true, false]) {
      let run = 1;
      for (let j = 1; j < n; j++) {
        const a = row ? at(g, i, j) : at(g, j, i);
        const b = row ? at(g, i, j - 1) : at(g, j - 1, i);
        if (a === b) { run++; if (run === 5) score += 3; else if (run > 5) score += 1; }
        else run = 1;
      }
    }
  }
  // rule 2 — 2×2 blocks of one colour
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = at(g, r, c);
      if (v === at(g, r, c + 1) && v === at(g, r + 1, c) && v === at(g, r + 1, c + 1)) score += 3;
    }
  }
  // rule 3 — the finder-like sequence, in either orientation
  const A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (get: (k: number) => number, start: number, pat: number[]) =>
    pat.every((p, k) => get(start + k) === p);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j + 11 <= n; j++) {
      const row = (k: number) => at(g, i, k);
      const col = (k: number) => at(g, k, i);
      if (matches(row, j, A) || matches(row, j, B)) score += 40;
      if (matches(col, j, A) || matches(col, j, B)) score += 40;
    }
  }
  // rule 4 — deviation from an even light/dark balance
  let dark = 0;
  for (let i = 0; i < n * n; i++) dark += g.modules[i];
  const percent = (dark * 100) / (n * n);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;
  return score;
}

/**
 * The symbol for `text`, as a square matrix of booleans (true = dark).
 * Throws rather than truncating if the text does not fit: a QR code that
 * silently encodes half a verification link is worse than no QR code.
 */
export function qrMatrix(text: string, level: QrLevel = "M"): boolean[][] {
  const data = new TextEncoder().encode(text);
  const version = BLOCKS[level].findIndex((_, i) => byteCapacity(i + 1, level) >= data.length) + 1;
  if (version === 0) throw new Error(`QR: ${data.length} bytes exceed the supported capacity`);

  // 1. the bit stream: mode, length, payload, terminator, pad
  const bits = new Bits();
  bits.push(0b0100, 4);
  bits.push(data.length, version >= 10 ? 16 : 8);
  for (const b of data) bits.push(b, 8);
  const total = dataCodewords(version, level) * 8;
  bits.push(0, Math.min(4, total - bits.bitLength));
  if (bits.bitLength % 8 !== 0) bits.push(0, 8 - (bits.bitLength % 8));
  const stream = bits.toBytes();
  for (let pad = 0; stream.length < dataCodewords(version, level); pad++) {
    stream.push(pad % 2 === 0 ? 0xec : 0x11);
  }

  // 2. blocks, their error correction, and the interleave
  const [ecPerBlock, groups] = BLOCKS[level][version - 1];
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (const [blocks, per] of groups) {
    for (let b = 0; b < blocks; b++) {
      const block = Uint8Array.from(stream.slice(offset, offset + per));
      offset += per;
      dataBlocks.push(block);
      ecBlocks.push(ecCodewords(block, ecPerBlock));
    }
  }
  const interleaved: number[] = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const b of dataBlocks) if (i < b.length) interleaved.push(b[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const b of ecBlocks) interleaved.push(b[i]);
  }

  // 3. the matrix, once per mask; the least penalised one wins
  const size = 17 + 4 * version;
  let best: { grid: Grid; mask: number; score: number } | null = null;
  for (let mask = 0; mask < 8; mask++) {
    const g: Grid = { size, modules: new Int8Array(size * size), reserved: new Uint8Array(size * size) };
    placeFunctionPatterns(g, version);
    placeData(g, Uint8Array.from(interleaved));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!g.reserved[r * size + c] && MASKS[mask](r, c)) {
          g.modules[r * size + c] ^= 1;
        }
      }
    }
    const fmt = formatBits(mask, level);
    const positions = formatPositions(size);
    for (let i = 0; i < 30; i++) {
      const [r, c] = positions[i];
      set(g, r, c, ((fmt >>> (i % 15)) & 1) === 1);
    }
    const score = penalty(g);
    if (!best || score < best.score) best = { grid: g, mask, score };
  }

  const g = best!.grid;
  const out: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) row.push(at(g, r, c) === 1);
    out.push(row);
  }
  return out;
}

/**
 * The symbol as an SVG path, ready to inline. One path for every dark module,
 * so the whole code is a single element that scales to any size and prints at
 * the printer's own resolution rather than at a raster's.
 */
export function qrSvgPath(matrix: boolean[][]): { path: string; size: number } {
  const size = matrix.length;
  let path = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) path += `M${c} ${r}h1v1h-1z`;
    }
  }
  return { path, size };
}

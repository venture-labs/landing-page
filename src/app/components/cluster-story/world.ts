/**
 * The cluster story's world: ONE connected map that only grows, seen through ONE camera.
 * (VL-11-S7, design drawing "Cluster Grafik" v2.) Pure model: no React, no DOM, no `window`,
 * no `document`; it runs under plain Node. The renderer (`ClusterStoryWorld.tsx`) draws whatever
 * this file says for a given `(f, t)`; the page (`ClusterStorySection.tsx`) only decides `f`.
 *
 * ---------------------------------------------------------------------------------------------
 * Story position `f` (continuous, 0-based) and the step marks
 *   - Step k (k = 0..8; the page calls it "Schritt k+1", the ninth is the "Ausblick")
 *     is centred at `f = k`. Its elements build over `k - 0.5 ... k + 0.2` (`buildAt`).
 *   - The step mark is `f = k + 0.2` (`STEP_MARKS`): every element of steps 0..k is built
 *     (`buildAt = 1`, a documented transformation in its final form) and every element of the
 *     steps above k is not there yet (`buildAt = 0`). The server and the first client render
 *     show `FINAL_F = 7.2`, the finished step 9 (k = 8).
 *   - The camera moves only inside `k - 0.75 ... k - 0.2` and holds its step-k value until
 *     `k + 0.25` (`cameraAt`). Before the first move it sits at the `pre` camera.
 *   - `f` is a pure function of the scroll position; scrolling back un-builds. `t` (seconds)
 *     only drives the quiet loops: packets, operating rings, the waveform, the channel pulse.
 *     `t = null` means "at rest": packets at (i + 0.5) / n, rotations 0, waveform at half height.
 *   - Dynamic parts that used to overrun in the drawing are compressed so that each is finished
 *     by its step mark (`dynAt`).
 *
 * The video contract (`?video=1`, installed by `ClusterStorySection`, nowhere else)
 *   - `?video=1` turns the stage into `position: fixed; inset: 0`, opaque, above everything; the
 *     page does not scroll; there is no clock and no scroll listener.
 *   - `window.setF(f, t = 0)` renders the frame for `(f, t)` synchronously and sets the stage
 *     root's `data-f` to `f`. Same arguments, same markup, whenever it is called.
 *   - `window.setStep(n, p = 1, t = 0)` is `setF(n - 0.5 + 0.7 * p, t)` (n = 0..8, p = 0..1):
 *     `p = 1` is the step mark minus 0.0, i.e. step n fully built at `f = n + 0.2`.
 *   - Without the query neither function exists. The camera uses `preserveAspectRatio` "meet":
 *     in a 16:9 window the visible part is the camera rectangle widened to the window.
 *
 * Geometry: world units, 940 x 780 for steps 0..7, widened to 1220 for step 9. The camera is
 * `[centreX, centreY, visibleWidth]`; the visible height is width * 470 / 600 (desktop) or
 * width * 300 / 358 (phone). Two camera sets: `CAM_D` and `CAM_M`.
 *
 * Vocabulary (the node / arrow / card parts the video reuses) and the colour of each group,
 * all from `theme.css` or the hexes the section already used:
 *   channel cards, Du, zone, labels ...... lavender #d9aeff / blue #5db1ff text, violet #8129ff zone tint
 *   hub, agents .......................... violet #8129ff / #a318f8, lavender #d9aeff, blue #2b95f6 nodes
 *   concept card, decision check ......... lavender #d9aeff, violet #a318f8
 *   company circle, first node, cluster .. blue #2b95f6 (dotted ring in lavender at 55 %)
 *   build line, tile bar ................. lavender at 55 %, violet #8129ff -> lavender #d9aeff
 *   telemetry line ....................... blue #2b95f6; updates line, loop arrow, operating ring: amber #fda700
 *   lock and release cards ............... card, blue #5db1ff icon
 *   monthly call, rings, area tiles ...... lavender / blue / amber / violet per tile
 *   offer frames ......................... violet #a318f8 on steps 1..4, amber #fda700 on steps 5..7
 *   phone, waveform ...................... lavender #d9aeff / violet #a318f8 
 *
 * Documented transformations (`transforms: true`; everything else only grows, AC "cumulative"):
 *   the concept card (flies hub -> Du -> back into the hub), the hub pulse, the build line
 *   (packets hand over to the update path), the example card (flies onto the ring and becomes the
 *   first area tile), its line and its "Example" tag, and the channel pulse.
 * ---------------------------------------------------------------------------------------------
 */

export type Pt = [number, number];
export type Cam = [number, number, number];
export type Fx = "fade" | "up" | "left" | "pop" | "draw" | "none";
export type Grad = "vio" | "blue" | "amber" | "lav";
/** c = carries the step (never hidden for want of size), s = secondary, o = orientation. */
export type Tier = "c" | "s" | "o";
export type DynName =
  | "cc"
  | "hubpulse"
  | "tb"
  | "orb"
  | "ord"
  | "cpulse"
  | "wave"
  | "b1"
  | "b2";

export interface Bg {
  px: number;
  h: number;
  f?: string;
  fo?: number;
  s?: string;
  so?: number;
  sw?: number;
  d?: string;
}
export interface Rect {
  t: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  f?: string;
  fo?: number;
  s?: string;
  so?: number;
  sw?: number;
  d?: string;
  /** Card gradient plus the step-9 highlight overlay of the element's `hl` group. */
  card?: boolean;
  /** Fill with one of the gradients instead of a flat colour. */
  grad?: "fvio";
}
export interface Circle {
  t: "circle";
  cx: number;
  cy: number;
  r: number;
  f?: string;
  fo?: number;
  s?: string;
  so?: number;
  sw?: number;
  d?: string;
  grad?: "fvio";
}
export interface PathP {
  t: "path";
  d: string;
  s: string;
  so?: number;
  sw: number;
  dash?: string;
}
export interface NodeP {
  t: "node";
  x: number;
  y: number;
  r: number;
  g: Grad;
}
export interface IconP {
  t: "icon";
  id: string;
  x: number;
  y: number;
  s: number;
  c: string;
  sw: number;
}
export interface Txt {
  t: "text";
  x: number;
  y: number;
  /** `g:<key>` graphic label, `ch:<i>` channel, `area:<i>` area, `ex` / `extap` example tags. */
  src: string;
  fs: number;
  wt: number;
  f: string;
  /** s = start, m = middle, e = end */
  a: "s" | "m" | "e";
  mw?: number;
  tier: Tier;
  /** Centre the block of lines around y instead of starting at y. */
  vc?: boolean;
  bg?: Bg;
}
export interface DynP {
  t: "dyn";
  n: DynName;
}
export type Prim = Rect | Circle | PathP | NodeP | IconP | Txt | DynP;

export interface WorldElement {
  id: string;
  /** Step 0..8 */
  k: number;
  /** Offset inside the build window (0..0.7) and length (0..1). */
  o: number;
  l: number;
  fx: Fx;
  /** 0 lines, 1 cards, 2 nodes, 3 labels */
  layer: 0 | 1 | 2 | 3;
  art: Prim[];
  /**
   * The same element drawn for the phone camera, where a text must be at least `MIN_EFF` px and a
   * card has to grow with it. Absent: `art` is drawn on both. (Anchors, windows and tiers are the same.)
   */
  narrow?: Prim[];
  /** Further steps at which the texts of this element count as the current step's (see `textSize`). */
  cur?: number[];
  hl?: "a" | "b";
  transforms?: boolean;
  /** The element flies (see `moveAt`). */
  fly?: boolean;
}

export interface Labels {
  g: Record<string, string>;
  ch: string[];
  areas: string[];
  example: string;
}

/* ------------------------------------------------------------------------------------------- */
/* Small maths                                                                                  */

export const clamp = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x));
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const smooth = (u: number): number => u * u * (3 - 2 * u);
export const ease = {
  io: (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t: number): number => {
    const c = 1.4;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
};

/* ------------------------------------------------------------------------------------------- */
/* Colours (theme.css tokens / hexes the section already used); alpha through the *o props       */

const W = "#ffffff";
const MUT = "#c7c4d1";
const DIM = "#9ca3af";
const LAV = "#d9aeff";
const VIO = "#8129ff";
const VIO2 = "#a318f8";
const BLUE = "#2b95f6";
const BLT = "#5db1ff";
const AMB = "#fda700";
export const STAGE_BG = "#14131b";

/* ------------------------------------------------------------------------------------------- */
/* Anchors                                                                                      */

const HUB: Pt = [315, 250];
const CC: Pt = [720, 250];
const R_OUT = 140;
const chY = (k: number): number => 120 + 70 * k;
const chMid = (k: number): number => chY(k) + 29;
const SAT: Pt[] = [
  [754, 284],
  [686, 284],
  [686, 216],
  [754, 216],
];
const AGENTS: [number, number, Grad][] = [
  [272, 170, "lav"],
  [358, 170, "blue"],
  [272, 330, "vio"],
  [358, 330, "lav"],
];
const RING2: Pt[] = Array.from({ length: 6 }, (_, k) => {
  const a = (k * Math.PI) / 3 + 0.3;
  return [Math.round((CC[0] + Math.cos(a) * 92) * 10) / 10, Math.round((CC[1] + Math.sin(a) * 92) * 10) / 10] as Pt;
});
const DOCK: Pt[] = [
  [720, 110],
  [841.2, 180],
  [841.2, 320],
  [720, 390],
];
const TILE_W = 188;
const TILE_H = 60;
const TILES = [
  { c: VIO2, ic: "receipt", tx: LAV },
  { c: BLUE, ic: "user", tx: BLT },
  { c: AMB, ic: "phone", tx: AMB },
  { c: VIO2, ic: "chip", tx: LAV },
];
const tileXY = (i: number): Pt => [Math.round(DOCK[i][0] - TILE_W / 2), Math.round(DOCK[i][1] - TILE_H / 2)];
const EX_START_Y = 304;
const CH_ICONS = ["video", "hash", "mail", "chat"];

/** Geometry of the dynamic parts, shared with the renderer. */
export const GEO = {
  hub: HUB,
  cc: CC,
  tb: { x: 746, y: 642, w: 126, h: 10 },
  /** The same bar on the phone, where the metric cards are larger. */
  tbN: { x: 770, y: 664, w: 126, h: 10 },
  orb: { r: 70 },
  ord: { r: R_OUT + 24 },
  cpulse: { x: 78, y: chMid(3) },
  wave: { x: 1006, cy: 285, n: 9, step: 22, w: 12 },
  b1: { x: 930, y: 502, w: 290, h: 16 },
  b2: { x: 930, y: 564, w: 290, h: 16 },
  exFlight: 224,
} as const;

/* ------------------------------------------------------------------------------------------- */
/* Builders                                                                                     */

const rect = (x: number, y: number, w: number, h: number, r: number, o: Partial<Rect> = {}): Rect => ({
  t: "rect",
  x,
  y,
  w,
  h,
  r,
  ...o,
});
const card = (x: number, y: number, w: number, h: number, r = 20, o: Partial<Rect> = {}): Rect =>
  rect(x, y, w, h, r, { card: true, ...o });
const txt = (x: number, y: number, src: string, fs: number, f: string, o: Partial<Txt> = {}): Txt => ({
  t: "text",
  x,
  y,
  src,
  fs,
  wt: 700,
  f,
  a: "s",
  tier: "c",
  ...o,
});
const ico = (id: string, x: number, y: number, s: number, c: string, sw = 1.7): IconP => ({
  t: "icon",
  id,
  x,
  y,
  s,
  c,
  sw,
});
const path = (d: string, s: string, sw: number, o: Partial<PathP> = {}): PathP => ({ t: "path", d, s, sw, ...o });
const LINE = { so: 0.55 } as const;
const arrow = (x: number, y: number, dir: "l" | "r" | "u" | "d", s: string): PathP => {
  const d = {
    l: `M${x + 14} ${y - 9}L${x} ${y}L${x + 14} ${y + 9}`,
    r: `M${x - 14} ${y - 9}L${x} ${y}L${x - 14} ${y + 9}`,
    u: `M${x - 9} ${y + 14}L${x} ${y}L${x + 9} ${y + 14}`,
    d: `M${x - 9} ${y - 14}L${x} ${y}L${x + 9} ${y - 14}`,
  }[dir];
  return path(d, s, 3.5);
};
const checkDot = (x: number, y: number, r: number, c: string): Prim[] => [
  { t: "circle", cx: x, cy: y, r, f: c },
  ico("check", x - r * 0.62, y - r * 0.62, r * 1.24, W, 3),
];
const dyn = (n: DynName): DynP => ({ t: "dyn", n });
const GLOW = { dash: "3 11" } as const;

const L: WorldElement[][] = [[], [], [], []];
function add(
  layer: 0 | 1 | 2 | 3,
  id: string,
  k: number,
  o: number,
  fx: Fx,
  l: number,
  art: Prim[],
  x: Partial<WorldElement> = {},
): void {
  L[layer].push({ id, k, o, l, fx, layer, art, ...x });
}

/* Paths the packets run on (single sub-paths, absolute commands only) */
export const PATHS = {
  chl0: `M156 ${chMid(0)} L${HUB[0]} ${HUB[1]}`,
  chl1: `M156 ${chMid(1)} L${HUB[0]} ${HUB[1]}`,
  chl2: `M156 ${chMid(2)} L${HUB[0]} ${HUB[1]}`,
  chl3: `M156 ${chMid(3)} L${HUB[0]} ${HUB[1]}`,
  build: `M${HUB[0] + 34} 250 H${CC[0] - 26}`,
  tel: "M584 216 H402",
  upl: "M402 284 H582",
  arc: "M610 164 V22 Q610 6 594 6 H94 Q78 6 78 22",
  phl: `M${CC[0] + R_OUT + 10} 250 H962`,
} as const;

/* ---- Step 1 (k = 0): Du, four channels, the zone Venture Labs, the hub --------------------- */
add(0, "in-bus", 0, 0.1, "draw", 0.5, [
  path(
    `M0 52 H-12 V${chMid(3)} M-12 ${chMid(0)} H0 M-12 ${chMid(1)} H0 M-12 ${chMid(2)} H0 M-12 ${chMid(3)} H0`,
    LAV,
    2,
    LINE,
  ),
]);
[0, 1, 2].forEach((k) =>
  add(0, `chl${k}`, 0, 0.4 + k * 0.08, "draw", 0.4, [path(PATHS[`chl${k}` as "chl0"], LAV, 2.5, LINE)]),
);
add(0, "chl3", 0, 0.4 + 3 * 0.08, "fade", 0.3, [path(PATHS.chl3, LAV, 3, { ...LINE, ...GLOW })]);

add(
  1,
  "you",
  0,
  0.05,
  "left",
  0.3,
  [
    card(0, 20, 156, 64),
    ico("user", 16, 35, 34, LAV, 1.6),
    txt(62, 52, "g:you", 24, W, { wt: 800, tier: "o" }),
  ],
  { hl: "a" },
);
for (let k = 0; k < 4; k++) {
  const y = chY(k);
  add(
    1,
    `ch${k}`,
    0,
    0.12 + k * 0.1,
    "left",
    0.3,
    [
      card(0, y, 156, 58, 20),
      ico(CH_ICONS[k], 12, y + 15, 28, BLT),
      txt(50, y + 29, `ch:${k}`, 18, W),
    ],
    { hl: "a" },
  );
}
add(
  1,
  "zone",
  0,
  0.25,
  "pop",
  0.3,
  [
    rect(230, 90, 170, 320, 26, { f: VIO, fo: 0.07, s: W, so: 0.12, sw: 1.5, card: false }),
    txt(315, 114, "g:zone", 22, LAV, { a: "m", tier: "o" }),
  ],
  { hl: "a" },
);
add(2, "hub", 0, 0, "pop", 0.4, [{ t: "node", x: HUB[0], y: HUB[1], r: 30, g: "vio" }]);
add(2, "hub-icon", 0, 0.1, "pop", 0.4, [ico("net", HUB[0] - 24, HUB[1] - 24, 48, W, 1.6)]);

/* ---- Step 2 (k = 1): the concept travels to Du, the decision -------------------------------- */
add(0, "cl", 1, 0.1, "draw", 0.4, [path(`M${HUB[0]} ${HUB[1]} L172 74`, LAV, 2.5)]);
add(2, "dec-check", 1, 0.8, "pop", 0.3, checkDot(156, 22, 15, VIO2));
add(3, "decision", 1, 0.75, "pop", 0.3, [
  txt(184, 29, "g:decision", 16, W, { bg: { px: 12, h: 30, f: VIO2, fo: 0.14, s: VIO2, so: 0.7, sw: 1.5 } }),
]);
add(3, "concept-lbl", 1, 0.4, "fade", 0.3, [txt(170, 113, "g:concept", 16, LAV, { tier: "s" })]);
add(3, "cc", 1, 0.1, "none", 0.1, [dyn("cc")], { transforms: true });

/* ---- Step 3 (k = 2): four agents ------------------------------------------------------------ */
AGENTS.forEach(([x, y], i) =>
  add(0, `agent-l${i}`, 2, 0.25 + i * 0.1, "draw", 0.35, [path(`M${HUB[0]} ${HUB[1]} L${x} ${y}`, LAV, 2.5, LINE)]),
);
AGENTS.forEach(([x, y, g], i) => add(2, `agent${i}`, 2, 0.4 + i * 0.1, "pop", 0.3, [{ t: "node", x, y, r: 16, g }]));
add(3, "agents-lbl", 2, 0.7, "up", 0.3, [txt(315, 384, "g:agents", 18, LAV, { a: "m" })]);
add(2, "hubpulse", 2, 0.1, "none", 0.1, [dyn("hubpulse")], { transforms: true });

/* ---- Step 4 (k = 3): build line, the company circle, first node, the small cluster, example card ---- */
add(0, "agent-b0", 3, 0, "draw", 0.3, [path("M358 170 L400 250", LAV, 2, LINE)]);
add(0, "agent-b1", 3, 0.05, "draw", 0.3, [path("M358 330 L400 250", LAV, 2, LINE)]);
add(0, "build", 3, 0.15, "draw", 0.45, [path(PATHS.build, LAV, 3, LINE)], { transforms: true });
add(0, "company-ring", 3, 0.2, "fade", 0.4, [
  { t: "circle", cx: CC[0], cy: CC[1], r: R_OUT, f: BLUE, fo: 0.04, s: LAV, so: 0.55, sw: 3, d: "3 14" },
]);
add(3, "company-lbl", 3, 0.3, "up", 0.3, [txt(CC[0], 62, "g:company", 21, MUT, { a: "m", tier: "o" })]);
add(2, "seed", 3, 0.55, "pop", 0.3, [{ t: "node", x: CC[0], y: CC[1], r: 21, g: "blue" }]);
SAT.forEach(([x, y], i) => add(0, `sat-l${i}`, 3, 0.75 + i * 0.05, "draw", 0.2, [path(`M${CC[0]} ${CC[1]} L${x} ${y}`, LAV, 2, LINE)]));
SAT.forEach(([x, y], i) =>
  add(2, `sat${i}`, 3, 0.8 + i * 0.05, "pop", 0.2, [{ t: "node", x, y, r: 11, g: i % 2 === 0 ? "blue" : "lav" }]),
);
add(0, "exline", 3, 0.7, "draw", 0.25, [path(`M${CC[0]} 270 V${EX_START_Y + 2}`, LAV, 2, LINE)], { transforms: true });
const tx0 = tileXY(0);
const tileArt = (i: number, x: number, y: number): Prim[] => [
  card(x, y, TILE_W, TILE_H, 20, { s: TILES[i].c, so: 0.7 }),
  ico(TILES[i].ic, x + 10, y + 18, 24, TILES[i].tx),
  txt(x + 42, y + TILE_H / 2, `area:${i}`, 16, W, { mw: TILE_W - 50, vc: true }),
];
/* On the phone a tile is larger (text 26 on the step-7 camera), centred on the same dock point. */
const TILE_NW = 262;
const TILE_NH = 68;
const TILE_NY = [EX_START_Y - 224, 154, 290, 366];
const tileArtN = (i: number, x: number, y: number): Prim[] => [
  card(x, y, TILE_NW, TILE_NH, 20, { s: TILES[i].c, so: 0.7 }),
  ico(TILES[i].ic, x + 10, y + (TILE_NH - 28) / 2, 28, TILES[i].tx),
  txt(x + 48, y + TILE_NH / 2, `area:${i}`, 26, W, { mw: TILE_NW - 60, vc: true }),
];
const tileXN = (i: number): number => Math.round(DOCK[i][0] - TILE_NW / 2);
add(3, "excard", 3, 0.72, "pop", 0.3, tileArt(0, tx0[0], EX_START_Y), {
  hl: "b",
  transforms: true,
  fly: true,
  narrow: tileArtN(0, tileXN(0), EX_START_Y),
  cur: [6],
});
add(3, "ex-tag", 3, 0.85, "fade", 0.3, [
  txt(CC[0], EX_START_Y + TILE_H + 18, "ex", 15, MUT, {
    a: "m",
    tier: "s",
    wt: 800,
    bg: { px: 11, h: 24, f: W, fo: 0.08, s: W, so: 0.12, sw: 1.5 },
  }),
], { transforms: true });

/* ---- Step 5 (k = 4): telemetry back, updates out, lock, release, operating ring --------------- */
add(0, "tel", 4, 0.1, "draw", 0.4, [path(PATHS.tel, BLUE, 3)]);
add(0, "tel-head", 4, 0.45, "fade", 0.3, [arrow(402, 216, "l", BLUE)]);
add(0, "upl", 4, 0.5, "fade", 0.4, [path(PATHS.upl, AMB, 3.5, GLOW)]);
add(0, "upl-head", 4, 0.75, "fade", 0.3, [arrow(582, 284, "r", AMB)]);
add(3, "only-lbl", 4, 0.2, "fade", 0.3, [txt(404, 76, "g:onlyToUs", 16, MUT, { wt: 600 })], {
  narrow: [txt(404, 72, "g:onlyToUs", 20, MUT, { wt: 600 })],
});
const CHIP_BG: Bg = { px: 12, h: 30, f: BLUE, fo: 0.12, s: BLUE, so: 0.65, sw: 1.5 };
["runtime", "errors", "costs"].forEach((key, i) =>
  add(3, `chip${i}`, 4, 0.3 + i * 0.1, "up", 0.3, [txt(416, 106 + i * 34, `g:${key}`, 17, W, { bg: CHIP_BG })], {
    narrow: [txt(416, 106 + i * 32, `g:${key}`, 20, W, { bg: { ...CHIP_BG, h: 28 } })],
  }),
);
add(3, "tel-lbl", 4, 0.25, "fade", 0.3, [txt(404, 200, "g:telemetry", 18, LAV)]);
add(3, "upd-lbl", 4, 0.6, "fade", 0.3, [txt(404, 304, "g:updates", 18, AMB)]);
add(
  1,
  "lock",
  4,
  0.55,
  "left",
  0.3,
  [
    card(404, 336, 176, 100),
    ico("lock", 416, 346, 26, BLT, 1.8),
    txt(416, 392, "g:lock", 17, W, { mw: 152 }),
  ],
  /* phone: 44 units wider (the German label needs three lines at size 20 in the design width) */
  { hl: "b", narrow: [card(404, 336, 220, 100), ico("lock", 416, 346, 26, BLT, 1.8), txt(416, 392, "g:lock", 20, W, { mw: 196 })] },
);
add(0, "lock-link", 4, 0.7, "fade", 0.3, [path("M580 384 H640", LAV, 3, { ...LINE, ...GLOW })], {
  narrow: [path("M624 384 H664", LAV, 3, { ...LINE, ...GLOW })],
});
add(
  1,
  "release",
  4,
  0.7,
  "left",
  0.3,
  [
    card(404, 448, 176, 118),
    rect(416, 460, 50, 28, 14, { f: W, fo: 0.08, s: W, so: 0.12, sw: 1.5 }),
    { t: "circle", cx: 432.5, cy: 474, r: 9.5, f: DIM },
    txt(416, 508, "g:release", 17, W, { mw: 152 }),
  ],
  {
    hl: "b",
    /* wider to the right (nothing stands there below the company ring): two lines at text size 20 */
    narrow: [
      card(404, 448, 236, 118),
      rect(416, 460, 50, 28, 14, { f: W, fo: 0.08, s: W, so: 0.12, sw: 1.5 }),
      { t: "circle", cx: 432.5, cy: 474, r: 9.5, f: DIM },
      txt(416, 508, "g:release", 20, W, { mw: 212 }),
    ],
  },
);
add(2, "orb", 4, 0.5, "none", 0.4, [dyn("orb")]);

/* ---- Step 6 (k = 5): the monthly call, the loop back to the start ---------------------------- */
const CALL_ROWS: [string, string, string][] = [
  ["flag", "reviewWorked", BLT],
  ["sliders", "rules", LAV],
  ["chip", "models", LAV],
  ["target", "nextProject", AMB],
];
add(
  1,
  "call",
  5,
  0.1,
  "up",
  0.4,
  [
    card(0, 450, 340, 190),
    ico("cal", 16, 462, 26, LAV),
    txt(50, 475, "g:month", 22, LAV),
    txt(268, 476, "g:callWithYou", 14, W, {
      a: "m",
      tier: "s",
      wt: 800,
      bg: { px: 12, h: 28, f: VIO, fo: 0.3, s: VIO, sw: 1.5 },
    }),
  ],
  /* phone: the whole picture is on screen, so the card grows to hold its text at size 30 (no "Call mit dir" pill) */
  { hl: "b", narrow: [card(0, 450, 396, 236), ico("cal", 16, 464, 30, LAV), txt(56, 484, "g:month", 30, LAV)] },
);
CALL_ROWS.forEach(([ic, key, c], i) =>
  add(1, `call-row${i}`, 5, 0.35 + i * 0.1, "left", 0.3, [
    ico(ic, 16, 502 + i * 33, 22, c),
    txt(48, 513 + i * 33, `g:${key}`, 16, W),
  ], {
    narrow: [ico(ic, 16, 517 + i * 40, 26, c), txt(52, 530 + i * 40, `g:${key}`, 30, W, { wt: 600 })],
  }),
);
add(0, "loop-up", 5, 0.45, "draw", 0.3, [path("M60 450 V396", AMB, 3.5)]);
add(0, "loop-up-head", 5, 0.65, "fade", 0.3, [arrow(60, 392, "u", AMB)]);
add(3, "newinput", 5, 0.7, "fade", 0.3, [txt(74, 416, "g:newInput", 16, AMB, { wt: 600 })]);
add(0, "arc", 5, 0.55, "draw", 0.45, [path(PATHS.arc, AMB, 3.5)]);
add(0, "arc-head", 5, 0.9, "fade", 0.3, [arrow(78, 20, "d", AMB)]);
add(3, "loop-lbl", 5, 0.8, "up", 0.3, [txt(318, 26, "g:loop", 22, AMB)]);
add(2, "cpulse", 5, 0.1, "none", 0.1, [dyn("cpulse")], { transforms: true });

/* ---- Step 7 (k = 6): second ring, dock points, four area tiles, schematic indicators ---------- */
[48, 92, R_OUT].forEach((r, i) =>
  add(0, `ring${i}`, 6, i * 0.1, "fade", 0.3, [{ t: "circle", cx: CC[0], cy: CC[1], r, s: LAV, so: 0.55, sw: 2.5 }]),
);
const NODE_G: Grad[] = ["vio", "blue", "lav"];
RING2.forEach(([x, y], i) => add(2, `ring2-n${i}`, 6, 0.2 + i * 0.05, "pop", 0.3, [{ t: "node", x, y, r: 10, g: NODE_G[i % 3] }]));
DOCK.forEach(([x, y], i) => add(2, `dock${i}`, 6, 0.45 + i * 0.06, "pop", 0.3, [{ t: "node", x, y, r: 8, g: "lav" }]));
for (let i = 1; i < 4; i++) {
  const [x, y] = tileXY(i);
  add(3, `tile${i}`, 6, 0.55 + i * 0.07, "pop", 0.3, tileArt(i, x, y), { hl: "b", narrow: tileArtN(i, tileXN(i), TILE_NY[i]) });
}
add(3, "tap-tag", 6, 0.9, "fade", 0.3, [
  txt(DOCK[2][0], 272, "extap", 15, MUT, {
    a: "m",
    tier: "s",
    wt: 800,
    bg: { px: 11, h: 24, f: W, fo: 0.08, s: W, so: 0.12, sw: 1.5 },
  }),
]);
const metX = (i: number): number => 404 + i * 164;
const MET_Y = 580;
const MET_W = 154;
const MET_H = 84;
const MET_WN = 190;
const MET_HN = 108;
const metXN = (i: number): number => 404 + i * 198;
const METS: [string, string][] = [
  ["errors", "down"],
  ["metResults", "up"],
  ["metTasks", "bar"],
];
METS.forEach(([key, kind], i) => {
  const x = metX(i);
  const art: Prim[] = [card(x, MET_Y, MET_W, MET_H, 18), txt(x + 14, MET_Y + 22, `g:${key}`, 18, W, { mw: 100 })];
  /* phone: wider and taller cards, text 26, the bar under the text */
  const xn = metXN(i);
  const ax = xn + 166;
  const nart: Prim[] = [card(xn, MET_Y, MET_WN, MET_HN, 18), txt(xn + 14, MET_Y + 26, `g:${key}`, 26, W, { mw: 140 })];
  if (kind === "down") nart.push(path(`M${ax} ${MET_Y + 46} V${MET_Y + 76} M${ax - 9} ${MET_Y + 67}L${ax} ${MET_Y + 77}L${ax + 9} ${MET_Y + 67}`, AMB, 3.5));
  if (kind === "up") nart.push(path(`M${ax} ${MET_Y + 77} V${MET_Y + 47} M${ax - 9} ${MET_Y + 56}L${ax} ${MET_Y + 47}L${ax + 9} ${MET_Y + 56}`, BLT, 3.5));
  if (kind === "bar") nart.push(rect(xn + 14, MET_Y + 88, GEO.tbN.w, GEO.tbN.h, 5, { f: W, fo: 0.08 }), dyn("tb"));
  if (kind === "down") art.push(path(`M${x + 130} ${MET_Y + 48} V${MET_Y + 70} M${x + 121} ${MET_Y + 62}L${x + 130} ${MET_Y + 71}L${x + 139} ${MET_Y + 62}`, AMB, 3.5));
  if (kind === "up") art.push(path(`M${x + 130} ${MET_Y + 71} V${MET_Y + 49} M${x + 121} ${MET_Y + 58}L${x + 130} ${MET_Y + 49}L${x + 139} ${MET_Y + 58}`, BLT, 3.5));
  if (kind === "bar") {
    art.push(rect(x + 14, MET_Y + 62, GEO.tb.w, GEO.tb.h, 5, { f: W, fo: 0.08 }), dyn("tb"));
  }
  add(1, `met${i}`, 6, 0.7 + i * 0.1, "up", 0.3, art, { hl: "b", narrow: nart });
});
add(3, "schem-8", 6, 0.95, "fade", 0.3, [txt(404, 682, "g:schematic", 17, MUT, { wt: 600, mw: 496 })], {
  narrow: [txt(404, 712, "g:schematic", 26, MUT, { wt: 600, mw: 560 })],
});

/* ---- Step 8 (k = 7): the offer, Aufbau and Betrieb, frames, the ring around the company ------ */
/* phone: the whole picture is on screen again, the offer cards grow to hold their text at size 33 */
add(
  1,
  "build-card",
  7,
  0.1,
  "pop",
  0.3,
  [
    card(0, 706, 450, 72),
    txt(18, 728, "g:build", 22, LAV),
    txt(18, 758, "g:buildSub", 25, W, { wt: 800 }),
    ...[22, 36, 50].map((h, i) => rect(450 - 24 - 30 - i * 40, 778 - 10 - h, 30, h, 8, { grad: "fvio" })),
  ],
  {
    narrow: [
      card(0, 706, 450, 112),
      txt(18, 732, "g:build", 33, LAV),
      txt(18, 776, "g:buildSub", 33, W, { wt: 800 }),
      ...[28, 46, 64].map((h, i) => rect(450 - 24 - 30 - i * 40, 808 - h, 30, h, 8, { grad: "fvio" })),
    ],
  },
);
add(
  1,
  "run-card",
  7,
  0.25,
  "pop",
  0.3,
  [card(470, 706, 430, 72), txt(488, 728, "g:run", 22, LAV), txt(488, 758, "g:runSub", 22, W, { wt: 800 })],
  { narrow: [card(470, 706, 430, 112), txt(488, 732, "g:run", 33, LAV), txt(488, 776, "g:runSub", 33, W, { wt: 800 })] },
);
add(0, "build-line", 7, 0.05, "draw", 0.3, [path("M0 706 V698 H450 V706", VIO2, 4)]);
add(0, "run-line", 7, 0.2, "draw", 0.3, [path("M470 706 V698 H900 V706", AMB, 4)]);
add(2, "ord", 7, 0.4, "none", 0.4, [dyn("ord")]);

/* ---- Step 9 (k = 8): Ausblick, the phone docks at the company ------------------------ */
add(0, "phl", 8, 0.05, "draw", 0.35, [path(PATHS.phl, LAV, 3)]);
add(0, "phl-head", 8, 0.35, "fade", 0.3, [arrow(962, 250, "r", LAV)]);
add(1, "phone", 8, 0.1, "pop", 0.3, [
  card(980, 120, 220, 330, 40, { s: LAV, so: 0.55 }),
  txt(1090, 150, "g:callAgent", 17, LAV, { a: "m", mw: 196 }),
]);
add(2, "wave", 8, 0.5, "pop", 0.3, [dyn("wave")]);
add(2, "mic", 8, 0.5, "pop", 0.3, [
  { t: "circle", cx: 1090, cy: 402, r: 26, grad: "fvio" },
  ico("mic", 1077, 389, 26, W, 1.8),
]);
add(3, "screen-lbl", 8, 0.55, "up", 0.3, [
  ico("monitor", 930, 472, 24, MUT),
  txt(962, 484, "g:screenTime", 18, MUT, { mw: 258 }),
]);
add(3, "screen-bar", 8, 0.55, "fade", 0.3, [
  rect(GEO.b1.x, GEO.b1.y, GEO.b1.w, GEO.b1.h, 8, { f: W, fo: 0.08 }),
  dyn("b1"),
]);
add(3, "talk-lbl", 8, 0.65, "up", 0.3, [
  ico("phone", 930, 534, 24, LAV),
  txt(962, 546, "g:talkPhone", 18, LAV, { mw: 258 }),
]);
add(3, "talk-bar", 8, 0.65, "fade", 0.3, [
  rect(GEO.b2.x, GEO.b2.y, GEO.b2.w, GEO.b2.h, 8, { f: W, fo: 0.08 }),
  dyn("b2"),
]);
add(3, "schem-10", 8, 0.8, "fade", 0.3, [txt(930, 606, "g:schematic", 16, MUT, { wt: 600, mw: 290 })]);

export const ELEMENTS: readonly WorldElement[] = [...L[0], ...L[1], ...L[2], ...L[3]];
export const STEP_COUNT = 9;
export const FINAL_F = 7.2;
export const STEP_MARKS: readonly number[] = Array.from({ length: STEP_COUNT }, (_, k) => k + 0.2);

/** Highlight groups of the finished picture: violet on steps 1..4, amber on 5..7. */
export const HL_COLOR = { a: VIO2, b: AMB } as const;

/** Every graphic label key (`g:<key>`) the world draws; the locale files carry all of them. */
export const LABEL_KEYS: readonly string[] = (() => {
  const s = new Set<string>();
  for (const el of ELEMENTS)
    for (const p of [...el.art, ...(el.narrow ?? [])]) if (p.t === "text" && p.src.startsWith("g:")) s.add(p.src.slice(2));
  return [...s].sort();
})();

/* ------------------------------------------------------------------------------------------- */
/* Build progress                                                                               */

/** Per step: when the longest element needs more than the window, the window is stretched. */
const SPAN: number[] = Array.from({ length: STEP_COUNT }, (_, k) =>
  Math.max(1, ...ELEMENTS.filter((e) => e.k === k).map((e) => e.o + e.l)),
);

/** 0..1, a function of `f` only. */
export function buildAt(el: WorldElement, f: number): number {
  const u = (f - (el.k - 0.5)) / 0.7;
  const p = clamp((u * SPAN[el.k] - el.o) / el.l);
  return p > 1 - 1e-9 ? 1 : p < 1e-9 ? 0 : p;
}

export interface Fxv {
  p: number;
  op: number;
  dx: number;
  dy: number;
  sc: number;
  off: number;
}

/** What the effect of an element does at `f`: opacity, offset, scale, dash offset. */
export function fxAt(el: WorldElement, f: number): Fxv {
  const p = buildAt(el, f);
  const v: Fxv = { p, op: p, dx: 0, dy: 0, sc: 1, off: 0 };
  switch (el.fx) {
    case "up":
      v.dy = (1 - p) * 24;
      break;
    case "left":
      v.dx = -(1 - p) * 40;
      break;
    case "pop":
      v.op = Math.min(1, p * 2);
      v.sc = 0.55 + 0.45 * ease.back(p);
      break;
    case "draw":
      v.op = p > 0 ? 1 : 0;
      v.off = 1 - p;
      break;
    case "none":
      v.op = 1;
      break;
    default:
      break;
  }
  return v;
}

/** The only flying element: the example card goes from below the company node onto the ring. */
export function moveAt(el: WorldElement, f: number): Pt {
  if (!el.fly) return [0, 0];
  return [0, -GEO.exFlight * flightAt(f)];
}
const flightAt = (f: number): number => ease.io(clamp((f - 5.55) / 0.4));

/* ------------------------------------------------------------------------------------------- */
/* Camera                                                                                       */

export const CAM_D: { pre: Cam; k: Cam[] } = {
  pre: [315, 250, 300],
  k: [
    [225, 209, 520],
    [225, 209, 520],
    [300, 235, 560],
    [640, 270, 720],
    [620, 316, 640],
    [470, 392, 990],
    [700, 394, 780],
    [470, 392, 990],
    [842, 380, 760],
  ],
};
export const CAM_M: { pre: Cam; k: Cam[] } = {
  pre: [315, 250, 240],
  k: [
    [200, 209, 490],
    [200, 209, 490],
    [300, 240, 440],
    [604, 225, 540],
    [596, 313, 610],
    [444, 325, 920],
    [685, 405, 776],
    [490, 412, 1010],
    [1010, 381, 640],
  ],
};
export const ASPECT = { desktop: 470 / 600, phone: 300 / 358 } as const;
export const PHONE_STAGE_W = 358;

/** `[centreX, centreY, visibleWidth]` at `f`: a pure function, holds at the step value from k-0.2 to k+0.25. */
export function cameraAt(f: number, narrow: boolean): Cam {
  const C = narrow ? CAM_M : CAM_D;
  let k = -1;
  for (let i = 0; i < STEP_COUNT; i++) if (f >= i - 0.75) k = i;
  if (k < 0) return C.pre;
  const a = k > 0 ? C.k[k - 1] : C.pre;
  const b = C.k[k];
  const u = smooth(clamp((f - (k - 0.75)) / 0.55));
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** The visible world rectangle for a camera (the stage aspect is fixed per camera set). */
export function cameraRect(f: number, narrow: boolean): Box {
  const [cx, cy, w] = cameraAt(f, narrow);
  const h = w * (narrow ? ASPECT.phone : ASPECT.desktop);
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/* ------------------------------------------------------------------------------------------- */
/* Text                                                                                         */

export const textWidth = (s: string, fs: number, wt: number): number => s.length * fs * (wt >= 700 ? 0.54 : 0.5);

/** Greedy word wrap on the width estimate; without `mw` a single line. */
export function wrapText(s: string, fs: number, wt: number, mw?: number): string[] {
  if (!mw) return [s];
  const out: string[] = [];
  let cur = "";
  for (const w of s.split(" ")) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && textWidth(next, fs, wt) > mw) {
      out.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

export function resolveText(src: string, lb: Labels): string {
  if (src === "ex") return lb.example;
  if (src === "extap") return `${lb.example}: Tap2Link`;
  const [kind, key] = [src.slice(0, src.indexOf(":")), src.slice(src.indexOf(":") + 1)];
  if (kind === "g") return lb.g[key] ?? "";
  if (kind === "ch") return lb.ch[Number(key)] ?? "";
  if (kind === "area") return lb.areas[Number(key)] ?? "";
  return "";
}

export const MIN_EFF = 11.5;
export const LINE_HEIGHT = 1.15;

/**
 * The font size a text is drawn at, or 0 when it is not drawn. Desktop: always the design size.
 * Phone (stage 358 px wide): a text whose effective size would be under `MIN_EFF` is drawn larger
 * when it carries the step (tier c, only while that step is the current one) or orients the reader
 * (tier o, up to 1.6 times its size); secondary texts are left out. No text is ever drawn smaller.
 */
export function textSize(tx: Txt, el: WorldElement, f: number, narrow: boolean): number {
  if (!narrow) return tx.fs;
  const s = PHONE_STAGE_W / cameraAt(f, true)[2];
  const need = MIN_EFF / s;
  if (tx.fs >= need) return tx.fs;
  if (tx.tier === "c" && (Math.round(f) === el.k || el.cur?.includes(Math.round(f)))) return need;
  if (tx.tier === "o" && need <= tx.fs * 1.6) return need;
  return 0;
}

/* ------------------------------------------------------------------------------------------- */
/* Boxes                                                                                        */

export function pathPoints(d: string): Pt[] {
  const tk = d.match(/[MLHVQ]|-?\d*\.?\d+/g) ?? [];
  const out: Pt[] = [];
  let i = 0;
  let x = 0;
  let y = 0;
  let cmd = "";
  const num = (): number => parseFloat(tk[i++]);
  while (i < tk.length) {
    if (/[MLHVQ]/.test(tk[i])) cmd = tk[i++];
    if (cmd === "M" || cmd === "L") {
      x = num();
      y = num();
      out.push([x, y]);
    } else if (cmd === "H") {
      x = num();
      out.push([x, y]);
    } else if (cmd === "V") {
      y = num();
      out.push([x, y]);
    } else if (cmd === "Q") {
      const qx = num();
      const qy = num();
      const ex = num();
      const ey = num();
      for (let s = 1; s <= 8; s++) {
        const u = s / 8;
        out.push([(1 - u) * (1 - u) * x + 2 * (1 - u) * u * qx + u * u * ex, (1 - u) * (1 - u) * y + 2 * (1 - u) * u * qy + u * u * ey]);
      }
      x = ex;
      y = ey;
    } else break;
  }
  return out;
}

const DYN_BOX: Record<DynName, Box> = {
  cc: { x: 126, y: 10, w: 120, h: 120 },
  hubpulse: { x: HUB[0] - 54, y: HUB[1] - 54, w: 108, h: 108 },
  tb: { x: GEO.tb.x, y: GEO.tb.y, w: GEO.tb.w, h: GEO.tb.h },
  orb: { x: CC[0] - 77, y: CC[1] - 77, w: 154, h: 154 },
  ord: { x: CC[0] - GEO.ord.r - 7, y: CC[1] - GEO.ord.r - 7, w: 2 * GEO.ord.r + 14, h: 2 * GEO.ord.r + 14 },
  cpulse: { x: GEO.cpulse.x - 80, y: GEO.cpulse.y - 80, w: 160, h: 160 },
  wave: { x: GEO.wave.x, y: GEO.wave.cy - 50, w: GEO.wave.step * 8 + GEO.wave.w, h: 100 },
  b1: { x: GEO.b1.x, y: GEO.b1.y, w: GEO.b1.w, h: GEO.b1.h },
  b2: { x: GEO.b2.x, y: GEO.b2.y, w: GEO.b2.w, h: GEO.b2.h },
};

function unite(a: Box | null, b: Box): Box {
  if (!a) return b;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** What an element draws on the given camera set: its phone art when it has one, else the design art. */
export const artOf = (el: WorldElement, narrow: boolean): Prim[] => (narrow && el.narrow ? el.narrow : el.art);

/** Bounding box of an element in world units, at its resting place (texts at their drawn design size). */
export function boxOf(el: WorldElement, lb: Labels, narrow = false): Box {
  let box: Box | null = null;
  for (const p of artOf(el, narrow)) {
    let b: Box;
    switch (p.t) {
      case "rect":
        b = { x: p.x, y: p.y, w: p.w, h: p.h };
        break;
      case "circle":
        b = { x: p.cx - p.r, y: p.cy - p.r, w: 2 * p.r, h: 2 * p.r };
        break;
      case "node":
        b = { x: p.x - p.r, y: p.y - p.r, w: 2 * p.r, h: 2 * p.r };
        break;
      case "icon":
        b = { x: p.x, y: p.y, w: p.s, h: p.s };
        break;
      case "path": {
        const pts = pathPoints(p.d);
        const xs = pts.map((q) => q[0]);
        const ys = pts.map((q) => q[1]);
        b = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
        break;
      }
      case "dyn":
        b = narrow && p.n === "tb" ? { ...GEO.tbN } : DYN_BOX[p.n];
        break;
      case "text": {
        const lines = wrapText(resolveText(p.src, lb), p.fs, p.wt, p.mw);
        const tw = Math.max(0, ...lines.map((s) => textWidth(s, p.fs, p.wt)));
        const th = lines.length * p.fs * LINE_HEIGHT;
        const top = p.vc ? p.y - th / 2 : p.y - (p.fs * LINE_HEIGHT) / 2;
        const pad = p.bg ? p.bg.px : 0;
        const x0 = p.a === "s" ? p.x - pad : p.a === "m" ? p.x - tw / 2 - pad : p.x - tw - pad;
        b = { x: x0, y: top, w: tw + 2 * pad, h: p.bg ? Math.max(th, p.bg.h) : th };
        break;
      }
    }
    box = unite(box, b);
  }
  return box as Box;
}

/* ------------------------------------------------------------------------------------------- */
/* Dynamic parts (functions of (f, t))                                                           */

export interface DynState {
  /** concept card: visibility, centre, scale */
  cc: { vis: number; x: number; y: number; s: number };
  hubpulse: { r: number; o: number };
  orbRot: number;
  ordRot: number;
  cpulse: { r: number; o: number };
  /** the tile-bar width in world units */
  tbW: number;
  waveH: number[];
  b1: number;
  b2: number;
  /** offer-step frame highlight 0..1 */
  hv: number;
  /** example card flight 0..1 and the opacity of what it leaves behind */
  fl: number;
}

export function dynAt(f: number, t: number | null): DynState {
  const out = clamp((f - 0.8) / 0.4);
  const back = clamp((f - 1.55) / 0.45);
  const vis = clamp((f - 0.75) / 0.1) * (1 - clamp((f - 1.95) / 0.2));
  const u = ease.io(out) * (1 - ease.io(back));
  const hp = clamp((f - 1.7) / 0.45);
  const cp = clamp((f - 4.75) / 0.2);
  const ck = t === null ? 0.5 : (t * 0.8) % 1;
  const met = ELEMENTS.find((e) => e.id === "met2") as WorldElement;
  const wa = buildAt(ELEMENTS.find((e) => e.id === "wave") as WorldElement, f);
  return {
    cc: { vis, x: lerp(HUB[0], 186, u), y: lerp(HUB[1], 70, u), s: 0.7 + 0.3 * u },
    hubpulse: { r: 30 + hp * 24, o: hp > 0 && hp < 1 ? (1 - hp) * 0.9 : 0 },
    orbRot: t === null ? 0 : t * 40,
    ordRot: t === null ? 0 : -t * 28,
    cpulse: { r: 20 + ck * 60, o: cp > 0 ? (1 - ck) * 0.7 * cp * (1 - clamp((f - 5.45) / 0.3)) : 0 },
    tbW: GEO.tb.w * (0.18 + 0.72 * ease.io(buildAt(met, f))),
    waveH: Array.from({ length: GEO.wave.n }, (_, i) =>
      (t === null ? 50 : 14 + Math.abs(Math.sin(t * 5 + i * 0.9)) * 50 + Math.abs(Math.sin(t * 2.3 + i * 1.7)) * 30) * wa,
    ),
    b1: 1 - 0.62 * ease.io(clamp((f - 7.6) / 0.5)),
    b2: 0.25 + 0.58 * ease.io(clamp((f - 7.7) / 0.5)),
    hv: clamp((f - 6.8) / 0.3) * (1 - clamp((f - 7.7) / 0.3)),
    fl: flightAt(f),
  };
}

/* ------------------------------------------------------------------------------------------- */
/* Packets: analytic positions on the drawn lines                                                */

interface TrackDef {
  id: keyof typeof PATHS;
  g: Grad;
  col: string;
  n: number;
  sp: number;
  fade?: [number, number];
}
const TRACK_DEFS: TrackDef[] = [
  { id: "chl0", g: "blue", col: BLT, n: 1, sp: 0.4 },
  { id: "chl1", g: "blue", col: BLT, n: 1, sp: 0.4 },
  { id: "chl2", g: "blue", col: BLT, n: 1, sp: 0.4 },
  { id: "build", g: "vio", col: LAV, n: 3, sp: 0.35, fade: [3.35, 3.7] },
  { id: "tel", g: "vio", col: LAV, n: 3, sp: 0.4 },
  { id: "upl", g: "amber", col: AMB, n: 2, sp: 0.35 },
  { id: "arc", g: "amber", col: AMB, n: 2, sp: 0.18 },
  { id: "phl", g: "vio", col: LAV, n: 2, sp: 0.4 },
];
interface Track extends TrackDef {
  pts: Pt[];
  cum: number[];
  len: number;
  start: number;
}
const TRACKS: Track[] = TRACK_DEFS.map((d) => {
  const pts = pathPoints(PATHS[d.id]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const el = ELEMENTS.find((e) => e.id === d.id) as WorldElement;
  /* a packet starts once its line is drawn */
  return { ...d, pts, cum, len: cum[cum.length - 1], start: el.k - 0.5 + (0.7 * (el.o + el.l)) / SPAN[el.k] };
});

function samplePath(tr: Track, u: number): Pt {
  const d = u * tr.len;
  let i = 1;
  while (i < tr.cum.length - 1 && tr.cum[i] < d) i++;
  const seg = tr.cum[i] - tr.cum[i - 1] || 1;
  const v = clamp((d - tr.cum[i - 1]) / seg);
  return [lerp(tr.pts[i - 1][0], tr.pts[i][0], v), lerp(tr.pts[i - 1][1], tr.pts[i][1], v)];
}

export interface Packet {
  x: number;
  y: number;
  a: number;
  g: Grad;
  col: string;
}

export function packetsAt(f: number, t: number | null): Packet[] {
  const out: Packet[] = [];
  for (const tr of TRACKS) {
    if (f < tr.start) continue;
    const al = clamp((f - tr.start) / 0.25) * (tr.fade ? 1 - clamp((f - tr.fade[0]) / (tr.fade[1] - tr.fade[0])) : 1);
    if (al <= 0.01) continue;
    for (let i = 0; i < tr.n; i++) {
      const k = t === null ? (i + 0.5) / tr.n : (t * tr.sp + i / tr.n) % 1;
      const [x, y] = samplePath(tr, k);
      out.push({ x, y, a: Math.sin(k * Math.PI) * al, g: tr.g, col: tr.col });
    }
  }
  return out;
}

import { memo, useMemo } from "react";
import {
  ELEMENTS,
  GEO,
  HL_COLOR,
  LINE_HEIGHT,
  STAGE_BG,
  boxOf,
  cameraRect,
  dynAt,
  fxAt,
  moveAt,
  packetsAt,
  resolveText,
  textSize,
  textWidth,
  wrapText,
  type Bg,
  type Box,
  type Circle,
  type DynState,
  type Grad,
  type Labels,
  type Prim,
  type Rect,
  type Txt,
  type WorldElement,
} from "./world";

/**
 * The renderer of the cluster story's world: one `<svg aria-hidden>` that draws whatever
 * `world.ts` says for a frame `(f, t)`. Everything is a plain SVG primitive (no foreignObject),
 * so the markup is the same on the server and in the first client render and has no layout of
 * its own. The frame is a pure function of its props: no state, no effects, no browser API.
 */

const W = "#ffffff";
const LAV = "#d9aeff";
const VIO2 = "#a318f8";
const AMB = "#fda700";
const HUB: [number, number] = [GEO.hub[0], GEO.hub[1]];

const ICONS: Record<string, JSX.Element> = {
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.4" />
      <path d="M11 18.5h2" />
    </>
  ),
  cal: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h3M11 17h9" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  flag: <path d="M6 21V4M6 5h11l-2 4 2 4H6" />,
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2.5v3M15 2.5v3M9 18.5v3M15 18.5v3M2.5 9h3M2.5 15h3M18.5 9h3M18.5 15h3" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" />
    </>
  ),
  warn: (
    <>
      <path d="M12 4.5l9 15.5H3z" />
      <path d="M12 10v4.5M12 17.4v.1" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r=".8" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2.2" />
      <path d="M15.5 10.5l5-3v9l-5-3z" />
    </>
  ),
  hash: <path d="M9 4L7.5 20M16.5 4L15 20M4.5 9h16M3.5 15h16" />,
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path d="M3.5 7.5l8.5 6 8.5-6" />
    </>
  ),
  chat: <path d="M4 5.5h16v10H12l-4.5 4v-4H4z" />,
  doc: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 018 0v2.5" />
    </>
  ),
  net: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <circle cx="5" cy="6" r="1.8" />
      <circle cx="19" cy="7" r="1.8" />
      <circle cx="6" cy="18.5" r="1.8" />
      <circle cx="18.5" cy="18" r="1.8" />
      <path d="M10 10.5L6.4 7.2M14 10.8l3.6-2.7M10.3 13.6l-3 3.5M14 13.7l3 2.9" />
    </>
  ),
};

const GLOWS: Record<Grad, [string, number]> = {
  vio: [VIO2, 0.55],
  blue: ["#2b95f6", 0.5],
  amber: [AMB, 0.45],
  lav: [LAV, 0.45],
};
const FILLS: Record<Grad, [string, string]> = {
  vio: [VIO2, "#8129ff"],
  blue: ["#5db1ff", "#2b95f6"],
  amber: ["#ffc861", AMB],
  lav: [LAV, LAV],
};

const Defs = memo(function Defs() {
  return (
    <defs>
      {Object.entries(ICONS).map(([id, art]) => (
        <symbol key={id} id={`cs-i-${id}`} viewBox="0 0 24 24">
          {art}
        </symbol>
      ))}
      <linearGradient id="cs-card" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1c1a27" />
        <stop offset="1" stopColor="#1e1c27" />
      </linearGradient>
      {(Object.keys(GLOWS) as Grad[]).map((g) => (
        <radialGradient key={g} id={`cs-g-${g}`}>
          <stop offset="0" stopColor={GLOWS[g][0]} stopOpacity={GLOWS[g][1]} />
          <stop offset="1" stopColor={GLOWS[g][0]} stopOpacity="0" />
        </radialGradient>
      ))}
      {(Object.keys(FILLS) as Grad[]).map((g) => (
        <linearGradient key={g} id={`cs-f-${g}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={FILLS[g][0]} />
          <stop offset="1" stopColor={FILLS[g][1]} />
        </linearGradient>
      ))}
      <linearGradient id="cs-bar" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8129ff" />
        <stop offset="1" stopColor={LAV} />
      </linearGradient>
      <linearGradient id="cs-b1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4b5563" />
        <stop offset="1" stopColor="#9ca3af" />
      </linearGradient>
      <pattern id="cs-dots" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="14" cy="14" r="1" fill={W} fillOpacity="0.05" />
      </pattern>
    </defs>
  );
});

const n2 = (v: number): number => Math.round(v * 100) / 100;

function IconUse({ id, x, y, s, c, sw }: { id: string; x: number; y: number; s: number; c: string; sw: number }) {
  return (
    <use
      href={`#cs-i-${id}`}
      x={x}
      y={y}
      width={s}
      height={s}
      fill="none"
      stroke={c}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function RectEl({ p, hl }: { p: Rect; hl: { c: string; v: number } | null }) {
  const fill = p.card ? "url(#cs-card)" : p.grad ? "url(#cs-f-vio)" : p.f;
  const stroke = p.s ?? (p.card ? W : undefined);
  const so = p.so ?? (p.card && !p.s ? (p.d ? 0.3 : 0.12) : undefined);
  return (
    <>
      <rect
        x={p.x}
        y={p.y}
        width={p.w}
        height={p.h}
        rx={p.r}
        fill={fill ?? "none"}
        fillOpacity={p.fo}
        stroke={stroke}
        strokeOpacity={so}
        strokeWidth={stroke ? (p.sw ?? 1.5) : undefined}
        strokeDasharray={p.d}
      />
      {hl && hl.v > 0.001 ? (
        <>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill="none" stroke={hl.c} strokeOpacity={0.3 * hl.v} strokeWidth={9} />
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} fill="none" stroke={hl.c} strokeOpacity={0.9 * hl.v} strokeWidth={2.5} />
        </>
      ) : null}
    </>
  );
}

function CircleEl({ p }: { p: Circle }) {
  return (
    <circle
      cx={p.cx}
      cy={p.cy}
      r={p.r}
      fill={p.grad ? "url(#cs-f-vio)" : (p.f ?? "none")}
      fillOpacity={p.fo}
      stroke={p.s}
      strokeOpacity={p.so}
      strokeWidth={p.s ? (p.sw ?? 1.5) : undefined}
      strokeDasharray={p.d}
      strokeLinecap={p.d ? "round" : undefined}
    />
  );
}

function bgRect(bg: Bg, x: number, y: number, w: number, h: number, k: number) {
  return (
    <rect
      x={x}
      y={y - (h * k) / 2}
      width={w}
      height={h * k}
      rx={(h * k) / 2}
      fill={bg.f ?? "none"}
      fillOpacity={bg.fo}
      stroke={bg.s}
      strokeOpacity={bg.so}
      strokeWidth={bg.s ? (bg.sw ?? 1.5) : undefined}
      strokeDasharray={bg.d}
    />
  );
}

function TextEl({ p, fs, labels }: { p: Txt; fs: number; labels: Labels }) {
  const str = resolveText(p.src, labels);
  if (!str || fs <= 0) return null;
  const k = fs / p.fs;
  const lines = wrapText(str, fs, p.wt, p.mw);
  const tw = Math.max(...lines.map((s) => textWidth(s, fs, p.wt)));
  const lh = fs * LINE_HEIGHT;
  const y0 = p.vc ? p.y - ((lines.length - 1) * lh) / 2 : p.y;
  const anchor = p.a === "s" ? "start" : p.a === "m" ? "middle" : "end";
  let bg = null;
  if (p.bg) {
    const w = tw + 2 * p.bg.px * k;
    const x = p.a === "s" ? p.x - p.bg.px * k : p.a === "m" ? p.x - w / 2 : p.x - w + p.bg.px * k;
    bg = bgRect(p.bg, x, p.y, w, p.bg.h, k);
  }
  return (
    <>
      {bg}
      <text x={p.x} y={y0 + fs * 0.35} fontSize={fs} fontWeight={p.wt} fill={p.f} textAnchor={anchor}>
        {lines.map((s, i) => (
          <tspan key={i} x={p.x} dy={i === 0 ? 0 : lh}>
            {s}
          </tspan>
        ))}
      </text>
    </>
  );
}

function NodeEl({ x, y, r, g }: { x: number; y: number; r: number; g: Grad }) {
  return (
    <>
      <circle cx={x} cy={y} r={r * 2.3} fill={`url(#cs-g-${g})`} />
      <circle cx={x} cy={y} r={r} fill={`url(#cs-f-${g})`} />
    </>
  );
}

function DynEl({ n, d, labels }: { n: string; d: DynState; labels: Labels }) {
  switch (n) {
    case "cc":
      return (
        <g opacity={d.cc.vis} transform={`translate(${n2(d.cc.x)} ${n2(d.cc.y)}) scale(${n2(d.cc.s)})`}>
          <rect x={-30} y={-30} width={60} height={60} rx={14} fill="url(#cs-card)" stroke={LAV} strokeWidth={2} />
          <IconUse id="doc" x={-17} y={-17} s={34} c={LAV} sw={1.7} />
        </g>
      );
    case "hubpulse":
      return d.hubpulse.o > 0 ? (
        <circle cx={HUB[0]} cy={HUB[1]} r={n2(d.hubpulse.r)} fill="none" stroke={LAV} strokeWidth={2.5} strokeOpacity={n2(d.hubpulse.o)} />
      ) : null;
    case "bar":
      return d.ip > 0 ? <rect x={GEO.bar.x} y={GEO.bar.y} width={n2(GEO.bar.w * d.ip)} height={GEO.bar.h} rx={7} fill="url(#cs-bar)" /> : null;
    case "pct":
      return (
        <text x={GEO.pctX} y={452 + 26 * 0.35} fontSize={26} fontWeight={800} fill={W} textAnchor="end">
          {d.pct}
        </text>
      );
    case "ok":
      return d.ok > 0 ? (
        <g opacity={d.ok}>
          <circle cx={GEO.okRow.x} cy={GEO.okRow.y} r={13} fill="url(#cs-f-vio)" />
          <IconUse id="check" x={GEO.okRow.x - 8} y={GEO.okRow.y - 8} s={16} c={W} sw={3} />
          <text x={636} y={GEO.okRow.y + 18 * 0.35} fontSize={18} fontWeight={700} fill={LAV}>
            {labels.g.running}
          </text>
        </g>
      ) : null;
    case "tb":
      return <rect x={GEO.tb.x} y={GEO.tb.y} width={n2(d.tbW)} height={GEO.tb.h} rx={5} fill="url(#cs-bar)" />;
    case "b1":
      return <rect x={GEO.b1.x} y={GEO.b1.y} width={n2(GEO.b1.w * d.b1)} height={GEO.b1.h} rx={8} fill="url(#cs-b1)" />;
    case "b2":
      return <rect x={GEO.b2.x} y={GEO.b2.y} width={n2(GEO.b2.w * d.b2)} height={GEO.b2.h} rx={8} fill="url(#cs-bar)" />;
    default:
      return null;
  }
}

const LOOP_DYN = new Set(["orb", "ord", "cpulse", "wave"]);

function primEl(p: Prim, i: number, el: WorldElement, f: number, narrow: boolean, labels: Labels, d: DynState, hl: { c: string; v: number } | null, first: boolean) {
  switch (p.t) {
    case "rect":
      return <RectEl key={i} p={p} hl={first ? hl : null} />;
    case "circle":
      return <CircleEl key={i} p={p} />;
    case "path":
      return (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={p.s}
          strokeOpacity={p.so}
          strokeWidth={p.sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={p.dash}
          pathLength={el.fx === "draw" ? 1 : undefined}
        />
      );
    case "node":
      return <NodeEl key={i} x={p.x} y={p.y} r={p.r} g={p.g} />;
    case "icon":
      return <IconUse key={i} id={p.id} x={p.x} y={p.y} s={p.s} c={p.c} sw={p.sw} />;
    case "text":
      return <TextEl key={i} p={p} fs={textSize(p, el, f, narrow)} labels={labels} />;
    case "dyn":
      return LOOP_DYN.has(p.n) ? null : <DynEl key={i} n={p.n} d={d} labels={labels} />;
  }
}

function ElementG({ el, f, narrow, labels, d, box }: { el: WorldElement; f: number; narrow: boolean; labels: Labels; d: DynState; box: Box }) {
  const v = fxAt(el, f);
  if (el.art.every((p) => p.t === "dyn" && LOOP_DYN.has(p.n))) return null;
  let transform: string | undefined;
  if (el.fx === "up") transform = `translate(0 ${n2(v.dy)})`;
  else if (el.fx === "left") transform = `translate(${n2(v.dx)} 0)`;
  else if (el.fx === "pop") {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    transform = `translate(${n2(cx)} ${n2(cy)}) scale(${n2(v.sc)}) translate(${n2(-cx)} ${n2(-cy)})`;
  }
  if (el.fly) {
    const [mx, my] = moveAt(el, f);
    transform = `translate(${n2(mx)} ${n2(my)})${transform ? ` ${transform}` : ""}`;
  }
  const hl = el.hl ? { c: HL_COLOR[el.hl], v: d.hv } : null;
  const firstRect = el.art.findIndex((p) => p.t === "rect");
  /* what the example card leaves behind fades while it flies */
  const op = el.id === "ex-tag" ? v.op * (1 - d.fl) : el.id === "exline" ? v.op * (1 - d.fl) : v.op;
  return (
    <g data-id={el.id} data-k={el.k} opacity={n2(op)} transform={transform}>
      {el.fx === "draw" ? (
        <g strokeDasharray={v.p < 1 ? "1 1" : undefined} strokeDashoffset={v.p < 1 ? n2(1 - v.p) : undefined}>
          {el.art.map((p, i) => primEl(p, i, el, f, narrow, labels, d, hl, i === firstRect))}
        </g>
      ) : (
        el.art.map((p, i) => primEl(p, i, el, f, narrow, labels, d, hl, i === firstRect))
      )}
    </g>
  );
}

const Elements = memo(function Elements({ f, narrow, labels }: { f: number; narrow: boolean; labels: Labels }) {
  const boxes = useMemo(() => new Map(ELEMENTS.map((e) => [e.id, boxOf(e, labels)])), [labels]);
  const d = dynAt(f, null);
  return (
    <g>
      {ELEMENTS.map((el) => (
        <ElementG key={el.id} el={el} f={f} narrow={narrow} labels={labels} d={d} box={boxes.get(el.id) as Box} />
      ))}
    </g>
  );
});

/** The quiet loops: packets on the lines, operating rings, the waveform, the channel pulse. */
function Loops({ f, t }: { f: number; t: number | null }) {
  const d = dynAt(f, t);
  const byId = (id: string): WorldElement => ELEMENTS.find((e) => e.id === id) as WorldElement;
  const orb = fxAt(byId("orb"), f).p;
  const ord = fxAt(byId("ord"), f).p;
  const wave = fxAt(byId("wave"), f);
  const cx = GEO.cc[0];
  const cy = GEO.cc[1];
  return (
    <g>
      {orb > 0 ? (
        <g opacity={n2(orb)} transform={`rotate(${n2(d.orbRot)} ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={GEO.orb.r} fill="none" stroke={VIO2} strokeWidth={2.5} strokeDasharray="12 14" strokeLinecap="round" />
          <circle cx={cx} cy={cy - GEO.orb.r} r={7} fill={LAV} />
        </g>
      ) : null}
      {ord > 0 ? (
        <g opacity={n2(ord * 0.9)} transform={`rotate(${n2(d.ordRot)} ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={GEO.ord.r} fill="none" stroke={AMB} strokeWidth={3} strokeDasharray="10 14" strokeLinecap="round" />
        </g>
      ) : null}
      {d.cpulse.o > 0.01 ? (
        <circle cx={GEO.cpulse.x} cy={GEO.cpulse.y} r={n2(d.cpulse.r)} fill="none" stroke={AMB} strokeWidth={2.5} strokeOpacity={n2(d.cpulse.o)} />
      ) : null}
      {wave.p > 0 ? (
        <g opacity={n2(wave.op)}>
          {d.waveH.map((h, i) => (
            <rect
              key={i}
              x={GEO.wave.x + i * GEO.wave.step}
              y={n2(GEO.wave.cy - h / 2)}
              width={GEO.wave.w}
              height={n2(Math.max(h, 0.1))}
              rx={6}
              fill={i % 3 === 0 ? LAV : VIO2}
            />
          ))}
        </g>
      ) : null}
      {packetsAt(f, t).map((p, i) => (
        <g key={i} opacity={n2(p.a)}>
          <circle cx={n2(p.x)} cy={n2(p.y)} r={18} fill={`url(#cs-g-${p.g})`} />
          <circle cx={n2(p.x)} cy={n2(p.y)} r={6.5} fill={p.col} />
        </g>
      ))}
    </g>
  );
}

export interface ClusterStoryWorldProps {
  f: number;
  /** Seconds, or null for the resting frame (also what the server renders). */
  t: number | null;
  narrow: boolean;
  labels: Labels;
}

export const ClusterStoryWorld = memo(function ClusterStoryWorld({ f, t, narrow, labels }: ClusterStoryWorldProps) {
  const r = cameraRect(f, narrow);
  return (
    <svg
      viewBox={`${n2(r.x)} ${n2(r.y)} ${n2(r.w)} ${n2(r.h)}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      className="block h-full w-full"
      fontFamily="inherit"
    >
      <Defs />
      <rect x={-3000} y={-3000} width={7000} height={7000} fill={STAGE_BG} />
      <rect x={-3000} y={-3000} width={7000} height={7000} fill="url(#cs-dots)" />
      <Elements f={f} narrow={narrow} labels={labels} />
      <Loops f={f} t={t} />
    </svg>
  );
});

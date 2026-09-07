import { useId, useMemo } from "react";

/**
 * Layered, endlessly drifting pulse curves.
 *
 * Each wave is generated over two tile widths and shifted by exactly one tile,
 * so the loop is seamless. Layers use different periods and durations, so the
 * combined pattern beats against itself and never visibly repeats. Everything
 * animates through CSS transforms — no per-frame JavaScript.
 *
 * Amplitude envelopes (a signal that swells, fades or grows across the canvas)
 * come from a static gradient mask rather than from the path itself: bending
 * the geometry would break the seamless shift.
 */

const TILE = 1000;
const SPAN = TILE * 2;

type Shape = "sine" | "ripple" | "beat" | "step";
type Envelope = "edges" | "rise" | "center" | "none";

interface Wave {
  /** Baseline position in viewBox units. */
  y: number;
  amplitude: number;
  /** Must divide TILE evenly, or the loop will visibly jump. */
  period: number;
  phase: number;
  shape: Shape;
  /** Seconds for one full tile shift. Larger = slower. */
  duration: number;
  strokeWidth: number;
  opacity: number;
  reverse?: boolean;
}

function shapeAt(shape: Shape, t: number): number {
  const turn = t * Math.PI * 2;
  switch (shape) {
    case "sine":
      return Math.sin(turn);
    case "ripple":
      return 0.62 * Math.sin(turn) + 0.38 * Math.sin(turn * 3 + 0.8);
    case "step":
      return Math.tanh(Math.sin(turn) * 9);
    case "beat": {
      const spike = Math.exp(-((t - 0.5) ** 2) / 0.0016);
      const dip = -0.3 * Math.exp(-((t - 0.44) ** 2) / 0.0007);
      const undershoot = -0.22 * Math.exp(-((t - 0.57) ** 2) / 0.0009);
      return spike + dip + undershoot;
    }
  }
}

function wavePath(wave: Wave): string {
  const perPeriod = wave.shape === "beat" ? 64 : 40;
  const samples = Math.min(1600, Math.max(120, Math.round((SPAN / wave.period) * perPeriod)));
  const points: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * SPAN;
    const t = (x / wave.period + wave.phase) % 1;
    const y = wave.y - wave.amplitude * shapeAt(wave.shape, t);
    points.push(`${x.toFixed(1)} ${y.toFixed(2)}`);
  }
  return `M ${points[0]} L ${points.slice(1).join(" L ")}`;
}

interface Preset {
  height: number;
  envelope: Envelope;
  breathe?: number;
  waves: Wave[];
}

const PRESETS: Record<string, Preset> = {
  /** Barely-there background texture. Meant to be felt, not looked at. */
  ambient: {
    height: 320,
    envelope: "edges",
    breathe: 26,
    waves: [
      { y: 120, amplitude: 26, period: 500, phase: 0, shape: "sine", duration: 78, strokeWidth: 1.2, opacity: 0.5 },
      { y: 165, amplitude: 18, period: 250, phase: 0.3, shape: "ripple", duration: 54, strokeWidth: 1, opacity: 0.36 },
      { y: 205, amplitude: 32, period: 1000, phase: 0.6, shape: "sine", duration: 96, strokeWidth: 1.4, opacity: 0.42 },
      { y: 240, amplitude: 14, period: 200, phase: 0.15, shape: "ripple", duration: 44, strokeWidth: 0.9, opacity: 0.28, reverse: true },
    ],
  },

  /** AI Automation — a machine metronome: tight, identical, relentless beats. */
  automation: {
    height: 340,
    envelope: "edges",
    breathe: 18,
    waves: [
      { y: 190, amplitude: 74, period: 125, phase: 0, shape: "beat", duration: 26, strokeWidth: 2, opacity: 1 },
      { y: 250, amplitude: 30, period: 125, phase: 0.5, shape: "beat", duration: 38, strokeWidth: 1.2, opacity: 0.42 },
      { y: 120, amplitude: 16, period: 250, phase: 0.2, shape: "step", duration: 62, strokeWidth: 1, opacity: 0.3 },
      { y: 285, amplitude: 10, period: 500, phase: 0.7, shape: "sine", duration: 88, strokeWidth: 1, opacity: 0.22 },
    ],
  },

  /** AI Products — square-edged data layers stacking into something solid. */
  products: {
    height: 340,
    envelope: "edges",
    breathe: 22,
    waves: [
      { y: 110, amplitude: 14, period: 200, phase: 0, shape: "step", duration: 72, strokeWidth: 1, opacity: 0.28 },
      { y: 160, amplitude: 22, period: 125, phase: 0.25, shape: "step", duration: 54, strokeWidth: 1.3, opacity: 0.45 },
      { y: 215, amplitude: 34, period: 125, phase: 0.6, shape: "step", duration: 40, strokeWidth: 1.8, opacity: 0.8 },
      { y: 275, amplitude: 44, period: 250, phase: 0.1, shape: "step", duration: 30, strokeWidth: 2.2, opacity: 1 },
    ],
  },

  /** AI Experience — two frequencies interfering: organic, human, never quite even. */
  experience: {
    height: 340,
    envelope: "edges",
    breathe: 30,
    waves: [
      { y: 170, amplitude: 58, period: 500, phase: 0, shape: "ripple", duration: 46, strokeWidth: 2, opacity: 1 },
      { y: 170, amplitude: 58, period: 500, phase: 0.08, shape: "ripple", duration: 52, strokeWidth: 1.4, opacity: 0.5 },
      { y: 170, amplitude: 44, period: 200, phase: 0.4, shape: "sine", duration: 64, strokeWidth: 1.1, opacity: 0.34 },
      { y: 230, amplitude: 26, period: 1000, phase: 0.55, shape: "sine", duration: 92, strokeWidth: 1.2, opacity: 0.3, reverse: true },
    ],
  },

  /** Venture Building — a faint signal that gathers strength as it travels. */
  venture: {
    height: 340,
    envelope: "rise",
    breathe: 20,
    waves: [
      { y: 190, amplitude: 64, period: 500, phase: 0, shape: "beat", duration: 30, strokeWidth: 2.1, opacity: 1 },
      { y: 190, amplitude: 34, period: 250, phase: 0.35, shape: "ripple", duration: 48, strokeWidth: 1.3, opacity: 0.55 },
      { y: 250, amplitude: 20, period: 200, phase: 0.6, shape: "sine", duration: 66, strokeWidth: 1, opacity: 0.34 },
      { y: 130, amplitude: 14, period: 1000, phase: 0.2, shape: "sine", duration: 84, strokeWidth: 1, opacity: 0.26 },
    ],
  },
};

const ENVELOPE_STOPS: Record<Envelope, { offset: string; opacity: number }[]> = {
  edges: [
    { offset: "0%", opacity: 0 },
    { offset: "18%", opacity: 1 },
    { offset: "82%", opacity: 1 },
    { offset: "100%", opacity: 0 },
  ],
  rise: [
    { offset: "0%", opacity: 0 },
    { offset: "35%", opacity: 0.22 },
    { offset: "75%", opacity: 1 },
    { offset: "100%", opacity: 0.85 },
  ],
  center: [
    { offset: "0%", opacity: 0 },
    { offset: "50%", opacity: 1 },
    { offset: "100%", opacity: 0 },
  ],
  none: [
    { offset: "0%", opacity: 1 },
    { offset: "100%", opacity: 1 },
  ],
};

export interface PulseLinesProps {
  preset?: keyof typeof PRESETS;
  accent?: string;
  /** Overall strength. Backgrounds want ~0.1, foreground signatures ~0.9. */
  intensity?: number;
  className?: string;
}

export function PulseLines({
  preset = "ambient",
  accent = "#8129ff",
  intensity = 1,
  className,
}: PulseLinesProps) {
  const uid = useId().replace(/:/g, "");
  const config = PRESETS[preset] ?? PRESETS.ambient;

  const paths = useMemo(() => config.waves.map(wavePath), [config]);

  return (
    <svg
      viewBox={`0 0 ${TILE} ${config.height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={`env-${uid}`} x1="0" y1="0" x2="1" y2="0">
          {ENVELOPE_STOPS[config.envelope].map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor="white" stopOpacity={stop.opacity} />
          ))}
        </linearGradient>
        <mask id={`mask-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={TILE} height={config.height}>
          <rect x="0" y="0" width={TILE} height={config.height} fill={`url(#env-${uid})`} />
        </mask>
      </defs>

      <g mask={`url(#mask-${uid})`}>
        <g
          className="pulse-breathe"
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            animation: config.breathe ? `pulse-breathe ${config.breathe}s ease-in-out infinite` : undefined,
          }}
        >
          {config.waves.map((wave, i) => (
            <g
              key={i}
              className="pulse-drift"
              style={{
                animation: `pulse-drift ${wave.duration}s linear infinite`,
                animationDirection: wave.reverse ? "reverse" : "normal",
              }}
            >
              <path
                d={paths[i]}
                fill="none"
                stroke={accent}
                strokeWidth={wave.strokeWidth}
                strokeLinecap="round"
                strokeOpacity={wave.opacity * intensity}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

import { useMemo } from "react";

/**
 * The one plot every comparison view draws through.
 *
 * Series are measured data (solid, with a marker per point); overlays are
 * reference curves (dashed, no markers) — a fitted n log n, a textbook probe
 * formula, the memory a matrix would cost. Both are given in data coordinates
 * and scaled here, so a caller never touches pixels.
 *
 * Log axes are available per axis because the honest view differs by measure:
 * a growth rate is only checkable by eye on log-log, where a power law is a
 * straight line, while a probe count against load factor is a shape you want
 * to see bend.
 */

const W = 820;
const H = 380;
const PAD = { top: 18, right: 18, bottom: 42, left: 66 };

const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function formatCount(value) {
  const v = Math.abs(value);
  if (v >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  return String(Math.round(value * 100) / 100);
}

function logTicks(min, max) {
  const ticks = [];
  for (let e = Math.floor(Math.log10(Math.max(1e-9, min))); e <= Math.ceil(Math.log10(max)); e++) {
    const value = 10 ** e;
    if (value >= min / 2 && value <= max * 1.5) ticks.push(value);
  }
  return ticks.length ? ticks : [max];
}

function linearTicks(min, max) {
  return [0, 0.25, 0.5, 0.75, 1].map((t) => min + t * (max - min));
}

export default function LineChart({
  series = [],
  overlays = [],
  xTicks,
  xScale = "linear",
  yScale = "linear",
  xLabel,
  xFormat = formatCount,
  yFormat = formatCount,
  ariaLabel = "Chart",
}) {
  const scales = useMemo(() => {
    const all = [...series, ...overlays].flatMap((s) => s.points);
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y).filter((y) => Number.isFinite(y));
    // A log axis has no zero to start from, so its floor is the smallest
    // positive value present; a linear one starts at zero because "twice as
    // many probes" only reads correctly against a true origin.
    const positiveY = ys.filter((y) => y > 0);
    const xMin = xScale === "log" ? Math.min(...xs.filter((x) => x > 0)) : Math.min(0, ...xs);
    const xMax = Math.max(...xs, xScale === "log" ? 1 : 0);
    const yMin = yScale === "log" ? Math.min(...(positiveY.length ? positiveY : [1])) : 0;
    const yMax = Math.max(...ys, yMin * 1.0001, 1);

    const x = (value) => {
      const t =
        xScale === "log"
          ? (Math.log(Math.max(value, xMin)) - Math.log(xMin)) /
            Math.max(1e-9, Math.log(xMax) - Math.log(xMin))
          : (value - xMin) / Math.max(1e-9, xMax - xMin);
      return PAD.left + t * PLOT_W;
    };
    const y = (value) => {
      const safe = Math.max(value, yMin);
      const t =
        yScale === "log"
          ? (Math.log(safe) - Math.log(yMin)) / Math.max(1e-9, Math.log(yMax) - Math.log(yMin))
          : (safe - yMin) / Math.max(1e-9, yMax - yMin);
      return PAD.top + (1 - t) * PLOT_H;
    };
    return { x, y, xMin, xMax, yMin, yMax };
  }, [series, overlays, xScale, yScale]);

  const path = (points) =>
    points
      .filter((p) => Number.isFinite(p.y))
      .map((p, i) => `${i === 0 ? "M" : "L"}${scales.x(p.x).toFixed(1)} ${scales.y(p.y).toFixed(1)}`)
      .join(" ");

  const yTicks = yScale === "log" ? logTicks(scales.yMin, scales.yMax) : linearTicks(scales.yMin, scales.yMax);
  const ticksX = xTicks && xTicks.length ? xTicks : linearTicks(scales.xMin, scales.xMax);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {yTicks.map((tick, i) => (
          <g key={`y${i}`}>
            <line x1={PAD.left} x2={W - PAD.right} y1={scales.y(tick)} y2={scales.y(tick)} className="chart__grid" />
            <text x={PAD.left - 8} y={scales.y(tick) + 4} className="chart__tick" textAnchor="end">
              {yFormat(tick)}
            </text>
          </g>
        ))}

        {ticksX.map((tick, i) => (
          <text key={`x${i}`} x={scales.x(tick)} y={H - PAD.bottom + 20} className="chart__tick" textAnchor="middle">
            {xFormat(tick)}
          </text>
        ))}
        {xLabel && (
          <text x={PAD.left + PLOT_W / 2} y={H - 8} className="chart__axis" textAnchor="middle">
            {xLabel}
          </text>
        )}

        {overlays.map((overlay) => (
          <path key={overlay.key} d={path(overlay.points)} className="chart__overlay" stroke={overlay.color} />
        ))}

        {series.map((s) => (
          <g key={s.key}>
            <path d={path(s.points)} className="chart__series" stroke={s.color} strokeDasharray={s.dashed ? "4 4" : undefined} />
            {s.points
              .filter((p) => Number.isFinite(p.y))
              .map((p, i) => (
                <circle key={i} cx={scales.x(p.x)} cy={scales.y(p.y)} r={3.5} fill={s.color}>
                  <title>{p.title || `${s.label} — ${xFormat(p.x)}: ${yFormat(p.y)}`}</title>
                </circle>
              ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

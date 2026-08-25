import { useCallback, useState } from "react";
import { ALGO_MAP } from "../algorithms";
import {
  runSweep,
  sizesUpTo,
  fitModel,
  bestModel,
  growthExponent,
  MODELS,
  MAX_N_CHOICES,
} from "../algorithms/complexity.js";
import { DISTRIBUTION_MAP } from "../utils/distributions.js";
import LineChart, { formatCount } from "./LineChart.jsx";
import SweepPanel from "./SweepPanel.jsx";

// Lane colours, in the order lanes are selected. Deliberately the same accents
// the rest of the app uses rather than a new palette.
const SERIES_COLORS = ["var(--primary)", "var(--blue)", "var(--green)", "var(--purple)"];

/**
 * Empirical complexity: measured operation counts against n, with n, n log n
 * and n² drawn over the top.
 *
 * This is the part of the comparison that proves rather than asserts. The
 * `time: { avg: "O(n log n)" }` field in an algorithm's metadata is a claim
 * somebody typed; the curve here is the algorithm's own counters at ten sizes
 * spanning nearly three orders of magnitude. Where the two disagree — Lomuto
 * quick sort on already-sorted input, say — the curve is the one telling the
 * truth.
 */
export default function ComplexityPanel({ algos, variants, distribution, seed }) {
  const [maxN, setMaxN] = useState(1280);
  const [logScale, setLogScale] = useState(true);
  const [reference, setReference] = useState(null);

  const setupKey = `${algos.join(",")}|${distribution}|${seed}|${JSON.stringify(variants)}`;

  const run = useCallback(
    ({ token, onProgress }) =>
      runSweep({
        algos,
        distribution,
        seed,
        maxN,
        variants,
        token,
        onProgress: (fraction, n, key) => onProgress(fraction, { n, key }),
      }),
    [algos, distribution, seed, maxN, variants]
  );

  return (
    <SweepPanel
      title="Empirical complexity"
      subtitle={`measured operations against n, over ${sizesUpTo(maxN).length} sizes`}
      setupKey={setupKey}
      run={run}
      progressLabel={(p) =>
        `${ALGO_MAP[p.detail?.key]?.label ?? "starting"} at n = ${p.detail?.n ?? "\u2014"}`
      }
      emptyText={`Nothing measured yet. The sweep runs each selected algorithm at ${sizesUpTo(maxN).join(
        ", "
      )} elements on ${DISTRIBUTION_MAP[distribution]?.label.toLowerCase()} input, counting operations without drawing a single frame, and plots what it finds.`}
      controls={
        <>
          <div className="complexity__control">
            <span className="label label--tight">MAX n</span>
            <div className="seg">
              {MAX_N_CHOICES.map((choice) => (
                <button
                  type="button"
                  key={choice.key}
                  className={`seg__btn ${maxN === choice.key ? "active" : ""}`}
                  onClick={() => setMaxN(choice.key)}
                  title={choice.desc}
                  aria-pressed={maxN === choice.key}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>

          <div className="complexity__control">
            <span className="label label--tight">AXES</span>
            <div className="seg">
              <button
                type="button"
                className={`seg__btn ${logScale ? "active" : ""}`}
                onClick={() => setLogScale(true)}
                title="On log-log axes a power law is a straight line, and its slope is the exponent."
                aria-pressed={logScale}
              >
                LOG-LOG
              </button>
              <button
                type="button"
                className={`seg__btn ${!logScale ? "active" : ""}`}
                onClick={() => setLogScale(false)}
                title="Linear axes show how brutal the gap actually is at the largest n."
                aria-pressed={!logScale}
              >
                LINEAR
              </button>
            </div>
          </div>
        </>
      }
    >
      {(result) => (
        <Chart result={result} logScale={logScale} reference={reference} onReference={setReference} />
      )}
    </SweepPanel>
  );
}

/**
 * Log-log is the default because it is the only view in which the claim is
 * checkable by eye: a power law becomes a straight line whose slope is the
 * exponent, so n, n log n and n² are three visibly different gradients rather
 * than three curves that all look vertical at the right-hand edge.
 *
 * The reference curves are fitted to one chosen series by least squares over
 * its constant factor only — the shape is fixed by the model, so a model that
 * fits lands on the data at every n and one that doesn't can't be rescued by
 * scaling.
 */
function Chart({ result, logScale, reference, onReference }) {
  const keys = Object.keys(result.series).filter((key) => result.series[key]?.length);
  const refKey = keys.includes(reference) ? reference : keys[0];
  const refPoints = result.series[refKey] || [];
  const scale = logScale ? "log" : "linear";

  const series = keys.map((key, i) => ({
    key,
    label: ALGO_MAP[key].label,
    color: SERIES_COLORS[i % SERIES_COLORS.length],
    points: result.series[key].map((p) => ({
      x: p.n,
      y: p.ops,
      title: `${ALGO_MAP[key].label} — n=${p.n}: ${p.ops.toLocaleString()} ops (${p.comparisons.toLocaleString()} cmp, ${p.writes.toLocaleString()} wr)`,
    })),
  }));

  // Sampled densely so a curve on linear axes bends instead of hinging at the
  // measured sizes.
  const nMin = Math.min(...result.sizes);
  const nMax = Math.max(...result.sizes);
  const overlays = MODELS.map((model) => {
    const fit = fitModel(refPoints, model.f);
    const points = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const n = logScale
        ? Math.exp(Math.log(nMin) + t * (Math.log(nMax) - Math.log(nMin)))
        : nMin + t * (nMax - nMin);
      points.push({ x: n, y: fit.scale * model.f(n) });
    }
    return { key: model.key, label: model.label, color: model.color, points };
  });

  return (
    <>
      <LineChart
        series={series}
        overlays={overlays}
        xTicks={result.sizes}
        xScale={scale}
        yScale={scale}
        xLabel="input size n"
        xFormat={(v) => String(Math.round(v))}
        yFormat={formatCount}
        ariaLabel="Operations against input size"
      />

      <div className="complexity__legend">
        {keys.map((key, i) => {
          const points = result.series[key];
          const fitted = bestModel(points);
          const exponent = growthExponent(points);
          return (
            <button
              type="button"
              key={key}
              className={`complexity__legend-row ${refKey === key ? "active" : ""}`}
              onClick={() => onReference(key)}
              aria-pressed={refKey === key}
              title="Anchor the n / n log n / n-squared reference curves to this algorithm"
            >
              <span
                className="complexity__swatch"
                style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
                aria-hidden="true"
              />
              <span className="complexity__legend-name">{ALGO_MAP[key].label}</span>
              <span className="lcd">
                closest fit <strong>{fitted?.label ?? "\u2014"}</strong>
              </span>
              <span className="lcd">
                measured slope <strong>{exponent ? exponent.toFixed(2) : "\u2014"}</strong>
              </span>
              <span className="lcd complexity__legend-claim">claims {ALGO_MAP[key].time.avg}</span>
            </button>
          );
        })}
        <p className="complexity__footnote">
          Dashed lines are n, n log n and n&sup2; fitted to{" "}
          <strong>{ALGO_MAP[refKey]?.label}</strong> — click another row to anchor them there
          instead. The measured slope is the slope of log(ops) against log(n): about 1 for a linear
          sort, about 2 for a quadratic one, and a little over 1 for n log n at these sizes.
        </p>
      </div>
    </>
  );
}

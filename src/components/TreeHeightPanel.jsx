import { useCallback, useState } from "react";
import {
  runHeightSweep,
  sizesUpTo,
  MAX_N_CHOICES,
  HEIGHT_MODELS,
  KIND_MAP,
  ORDER_MAP,
} from "../dataStructures/tree/compare.js";
import LineChart, { formatCount } from "./LineChart.jsx";
import SweepPanel from "./SweepPanel.jsx";

const MEASURES = [
  { key: "height", label: "HEIGHT", title: "Height in edges — how far a lookup can have to walk" },
  { key: "comparisons", label: "COMPARISONS", title: "Key comparisons spent building the whole tree" },
];

/**
 * Height against n, measured.
 *
 * The canvases above cap at a couple of dozen keys, which is enough to see a
 * sorted BST turn into a chain but nowhere near enough to see the *shape* of
 * how the three diverge. This runs the same insert code without keeping any
 * of the intermediate trees, so n can reach the point where log₂ n and n are
 * three orders of magnitude apart.
 */
export default function TreeHeightPanel({ order, seed }) {
  const [maxN, setMaxN] = useState(400);
  const [measure, setMeasure] = useState("height");
  // Log by default: on a linear axis a degenerate BST's height of 399 flattens
  // the two balanced curves onto the baseline, which hides exactly the
  // comparison the panel exists for.
  const [logY, setLogY] = useState(true);

  const setupKey = `${order}|${seed}`;

  const run = useCallback(
    ({ token, onProgress }) =>
      runHeightSweep({
        order,
        seed,
        maxN,
        token,
        onProgress: (fraction, n, kind) => onProgress(fraction, { n, kind }),
      }),
    [order, seed, maxN]
  );

  return (
    <SweepPanel
      title="Height against n"
      subtitle={`measured over ${sizesUpTo(maxN).length} sizes, up to n = ${Math.max(...sizesUpTo(maxN))}`}
      setupKey={setupKey}
      run={run}
      progressLabel={(p) =>
        `${KIND_MAP[p.detail?.kind]?.short ?? "starting"} at n = ${p.detail?.n ?? "\u2014"}`
      }
      emptyText={`Nothing measured yet. The sweep builds all three structures at ${sizesUpTo(maxN).join(
        ", "
      )} keys in ${ORDER_MAP[order]?.label.toLowerCase()} order, keeping only the final numbers, and plots what it finds.`}
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
            <span className="label label--tight">Y AXIS</span>
            <div className="seg">
              <button
                type="button"
                className={`seg__btn ${logY ? "active" : ""}`}
                onClick={() => setLogY(true)}
                title="Keeps the two balanced curves readable next to a BST that is three orders of magnitude taller."
                aria-pressed={logY}
              >
                LOG
              </button>
              <button
                type="button"
                className={`seg__btn ${!logY ? "active" : ""}`}
                onClick={() => setLogY(false)}
                title="Shows how brutal the gap actually is at the largest n."
                aria-pressed={!logY}
              >
                LINEAR
              </button>
            </div>
          </div>

          <div className="complexity__control">
            <span className="label label--tight">MEASURE</span>
            <div className="seg">
              {MEASURES.map((m) => (
                <button
                  type="button"
                  key={m.key}
                  className={`seg__btn ${measure === m.key ? "active" : ""}`}
                  onClick={() => setMeasure(m.key)}
                  title={m.title}
                  aria-pressed={measure === m.key}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </>
      }
    >
      {(result) => <Chart result={result} measure={measure} logY={logY} />}
    </SweepPanel>
  );
}

function Chart({ result, measure, logY }) {
  const isHeight = measure === "height";
  // Comparison counts span six orders of magnitude and have no meaningful
  // linear reading, so they stay logarithmic whatever the toggle says.
  const yScale = isHeight ? (logY ? "log" : "linear") : "log";

  const series = Object.entries(result.series).map(([key, points]) => ({
    key,
    label: KIND_MAP[key].label,
    color: KIND_MAP[key].color,
    points: points.map((p) => ({
      x: p.n,
      y: p[measure],
      title: `${KIND_MAP[key].label} — n=${p.n}: height ${p.height}, ${p.comparisons.toLocaleString()} comparisons, ${p.restructures.toLocaleString()} ${
        key === "twothree" ? "splits" : "rotations"
      }`,
    })),
  }));

  // Height is plotted against the shapes it is supposed to obey; comparisons
  // against n log n and n², which is where a degenerate BST actually shows up
  // as a cost rather than just a tall picture.
  const nMax = Math.max(...result.sizes);
  const nMin = Math.min(...result.sizes);
  const models = isHeight
    ? HEIGHT_MODELS
    : [
        { key: "nlogn", label: "n log n", color: "var(--blue)", f: (n) => n * Math.log2(Math.max(2, n)) },
        { key: "n2", label: "n\u00B2", color: "var(--red)", f: (n) => n * n },
      ];

  // Anchored at the largest n of the structure each model describes, so a
  // reference curve sits on the data it is a reference for rather than being
  // fitted to something arbitrary.
  const anchorFor = (modelKey) => {
    const source =
      modelKey === "n" || modelKey === "n2" ? "bst" : modelKey === "log3" ? "twothree" : "avl";
    const points = result.series[source] || [];
    return points[points.length - 1]?.[measure] ?? 1;
  };

  const overlays = models.map((model) => {
    const anchor = anchorFor(model.key);
    const scale = anchor / Math.max(1e-9, model.f(nMax));
    const points = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const n = Math.exp(Math.log(nMin) + t * (Math.log(nMax) - Math.log(nMin)));
      points.push({ x: n, y: scale * model.f(n) });
    }
    return { key: model.key, label: model.label, color: model.color, points };
  });

  return (
    <>
      <LineChart
        series={series}
        overlays={overlays}
        xTicks={result.sizes}
        xScale="log"
        yScale={yScale}
        xLabel="keys inserted (n)"
        xFormat={(v) => String(Math.round(v))}
        yFormat={isHeight ? (v) => String(Math.round(v)) : formatCount}
        ariaLabel={isHeight ? "Tree height against key count" : "Comparisons against key count"}
      />

      <div className="complexity__legend">
        {Object.entries(result.series).map(([key, points]) => {
          const last = points[points.length - 1];
          return (
            <div className="complexity__legend-row" key={key}>
              <span className="complexity__swatch" style={{ background: KIND_MAP[key].color }} aria-hidden="true" />
              <span className="complexity__legend-name">{KIND_MAP[key].label}</span>
              <span className="lcd">
                height at n={last.n} <strong>{last.height}</strong>
              </span>
              <span className="lcd">
                log&#8322;n <strong>{Math.log2(last.n).toFixed(1)}</strong>
              </span>
              <span className="lcd complexity__legend-claim">{KIND_MAP[key].claim}</span>
            </div>
          );
        })}
        <p className="complexity__footnote">
          Dashed lines are log&#8322;n, log&#8323;n and n, each anchored to the structure it
          describes. A balanced structure tracks its logarithm across three orders of magnitude; on
          an adversarial order the BST tracks n exactly, which is the whole reason the other two
          exist.
        </p>
      </div>
    </>
  );
}

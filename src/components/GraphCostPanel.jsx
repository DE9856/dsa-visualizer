import { useCallback, useMemo, useState } from "react";
import {
  COST_MEASURES,
  COST_MODELS,
  DENSITIES,
  DENSITY_MAP,
  MAX_V_CHOICES,
  MEASURE_MAP,
  REPRESENTATIONS,
  REPR_MAP,
  representationCost,
  runRepresentationSweep,
  sizesUpTo,
} from "../dataStructures/graph/represent.js";
import LineChart, { formatCount } from "./LineChart.jsx";
import SweepPanel from "./SweepPanel.jsx";

/**
 * Adjacency list against adjacency matrix, as a cost rather than a rendering.
 *
 * The panel above shows the two as alternative views of one graph, which is
 * true of a graph with six vertices in it and misleading about every other
 * graph. They are opposite bets: the matrix buys a one-read edge query with V²
 * slots it mostly fills with zeros, and the list buys its memory back by
 * making you walk a row. Which bet pays depends only on density, and the
 * numbers below are the graph on screen and then the same measurement carried
 * out to 256 vertices.
 */
export default function GraphCostPanel({ graph, directed }) {
  const [density, setDensity] = useState("sparse");
  const [maxV, setMaxV] = useState(128);
  const [measure, setMeasure] = useState("memory");

  const setupKey = `${density}|${maxV}`;

  const run = useCallback(
    ({ token, onProgress }) =>
      runRepresentationSweep({
        density,
        maxV,
        token,
        onProgress: (fraction, v) => onProgress(fraction, { v }),
      }),
    [density, maxV]
  );

  const current = useMemo(() => representationCost(graph, directed), [graph, directed]);

  return (
    <SweepPanel
      title="List vs matrix"
      subtitle={
        current.v
          ? `this graph: ${current.memory.matrix} cells against ${current.memory.list} list slots`
          : "memory and lookup cost, measured"
      }
      setupKey={setupKey}
      run={run}
      progressLabel={(p) => `V = ${p.detail?.v ?? "—"}`}
      emptyText={`Nothing measured yet. The sweep builds both representations of the same random graph at ${sizesUpTo(
        maxV
      ).join(", ")} vertices — ${DENSITY_MAP[
        density
      ]?.label.toLowerCase()} — counts the slots each one stores, and runs real lookups against both.`}
      summary={<CurrentGraph current={current} />}
      controls={
        <>
          <div className="complexity__control">
            <span className="label label--tight">DENSITY</span>
            <div className="seg">
              {DENSITIES.map((choice) => (
                <button
                  type="button"
                  key={choice.key}
                  className={`seg__btn ${density === choice.key ? "active" : ""}`}
                  onClick={() => setDensity(choice.key)}
                  title={choice.desc}
                  aria-pressed={density === choice.key}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>

          <div className="complexity__control">
            <span className="label label--tight">MAX V</span>
            <div className="seg">
              {MAX_V_CHOICES.map((choice) => (
                <button
                  type="button"
                  key={choice.key}
                  className={`seg__btn ${maxV === choice.key ? "active" : ""}`}
                  onClick={() => setMaxV(choice.key)}
                  title={choice.desc}
                  aria-pressed={maxV === choice.key}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>

          <div className="complexity__control">
            <span className="label label--tight">MEASURE</span>
            <div className="seg">
              {COST_MEASURES.map((m) => (
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
      {(result) => <Chart result={result} measure={measure} />}
    </SweepPanel>
  );
}

/** Exact numbers for the graph the canvas is drawing — no sweep required. */
function CurrentGraph({ current }) {
  if (!current.v) {
    return (
      <p className="complexity__empty">
        Nothing on the canvas yet. Build a graph and this reads out what each representation would
        cost for it, exactly; the sweep below carries the same measurement out to 256 vertices.
      </p>
    );
  }

  const ratio = current.memory.list ? current.memory.matrix / current.memory.list : 0;

  return (
    <div className="complexity__legend">
      {REPRESENTATIONS.map((repr) => (
        <div className="complexity__legend-row" key={repr.key}>
          <span className="complexity__swatch" style={{ background: repr.color }} aria-hidden="true" />
          <span className="complexity__legend-name">{repr.label}</span>
          <span className="lcd">
            memory <strong>{current.memory[repr.key]}</strong> slots
          </span>
          <span className="lcd">
            edge query <strong>{current.query[repr.key].toFixed(2)}</strong> (worst{" "}
            {current.worstQuery[repr.key]})
          </span>
          <span className="lcd complexity__legend-claim">{repr.claim}</span>
        </div>
      ))}
      <p className="complexity__footnote">
        This graph: <strong>V = {current.v}</strong>, <strong>E = {current.e}</strong>,{" "}
        {(current.density * 100).toFixed(0)}% of the possible pairs joined
        {current.directed ? ", directed" : ""}. The matrix stores{" "}
        <strong>
          {ratio >= 1 ? `${ratio.toFixed(1)}× more` : `${(1 / ratio).toFixed(1)}× less`}
        </strong>{" "}
        than the list, and answers every edge query in one read against the list&apos;s{" "}
        {current.query.list.toFixed(2)} entries on average. These are exact — every ordered pair of
        vertices is actually asked about, not sampled.
      </p>
    </div>
  );
}

function Chart({ result, measure }) {
  const series = REPRESENTATIONS.map((repr) => ({
    key: repr.key,
    label: repr.label,
    color: repr.color,
    points: result.series[repr.key].map((p) => ({
      x: p.v,
      y: p[measure],
      title: `${repr.label} — V=${p.v}, E=${p.edges}: ${formatCount(p.memory)} slots, ${p.query.toFixed(
        2
      )} per edge query, ${formatCount(p.scan)} to traverse`,
    })),
  }));

  // Anchored at the largest V of the representation each model describes, so a
  // reference curve sits on the data it is a reference for.
  const vMin = Math.min(...result.sizes);
  const vMax = Math.max(...result.sizes);
  const anchorFor = (modelKey) => {
    const source = modelKey === "v2" ? "matrix" : "list";
    const points = result.series[source] || [];
    return points[points.length - 1]?.[measure] ?? 1;
  };

  const overlays = COST_MODELS.map((model) => {
    const scale = anchorFor(model.key) / Math.max(1e-9, model.f(vMax));
    const points = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const v = Math.exp(Math.log(vMin) + t * (Math.log(vMax) - Math.log(vMin)));
      points.push({ x: v, y: scale * model.f(v) });
    }
    return { key: model.key, label: model.label, color: model.color, points };
  });

  const last = { matrix: result.series.matrix.at(-1), list: result.series.list.at(-1) };
  const measureLabel = MEASURE_MAP[measure].label.toLowerCase();

  return (
    <>
      <LineChart
        series={series}
        overlays={overlays}
        xTicks={result.sizes}
        xScale="log"
        yScale="log"
        xLabel="vertices (V)"
        xFormat={(v) => String(Math.round(v))}
        yFormat={formatCount}
        ariaLabel={`Adjacency list and matrix ${measureLabel} against vertex count`}
      />

      <div className="complexity__legend">
        {REPRESENTATIONS.map((repr) => (
          <div className="complexity__legend-row" key={repr.key}>
            <span className="complexity__swatch" style={{ background: repr.color }} aria-hidden="true" />
            <span className="complexity__legend-name">{repr.label}</span>
            <span className="lcd">
              at V={last[repr.key].v} <strong>{formatCount(last[repr.key][measure])}</strong>
            </span>
            <span className="lcd">
              worst query <strong>{last[repr.key].worstQuery}</strong>
            </span>
            <span className="lcd complexity__legend-claim">{REPR_MAP[repr.key].claim}</span>
          </div>
        ))}
        <p className="complexity__footnote">
          Dashed lines are V&sup2; and V, anchored to the representation each describes. Memory and
          traversal are counted off the built structures; the edge query is measured by running
          thousands of real lookups over random vertex pairs, so the list&apos;s number is a mix of
          hits and misses in whatever proportion this density produces. The result worth keeping:{" "}
          <strong>at a fixed average degree the matrix grows with V&sup2; while the list grows with
          V</strong>, so the gap is not a constant factor you can shrug off — at V = 256 and average
          degree 4 the matrix is two orders of magnitude bigger. Switch DENSITY to{" "}
          <strong>Complete</strong> and the two land on exactly the same number: V + 2E = V + V(V−1)
          = V&sup2;. That is the whole rule, in one line.
        </p>
      </div>
    </>
  );
}

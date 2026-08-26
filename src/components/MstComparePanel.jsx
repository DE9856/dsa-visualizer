import { useCallback, useMemo, useState } from "react";
import {
  MST_ALGOS,
  MST_MODELS,
  V_CHOICES,
  compareOnGraph,
  edgeCountsFor,
  runMstSweep,
} from "../dataStructures/graph/mstCompare.js";
import LineChart, { formatCount } from "./LineChart.jsx";
import SweepPanel from "./SweepPanel.jsx";

/**
 * Prim against Kruskal on the graph that is on screen, and then on graphs big
 * enough for the difference between them to be a cost rather than a habit.
 *
 * Running both is the only way to see the thing worth seeing: the edges come
 * out in completely different orders — Prim's tree is connected at every
 * moment, Kruskal's is a scattering of fragments until the last edge — and the
 * total is the same anyway. The sweep is the other half: the same answer costs
 * different amounts depending on how dense the graph is, and the crossover is
 * a number you can read off rather than a rule of thumb.
 */
export default function MstComparePanel({ graph, directed, startId }) {
  const [v, setV] = useState(128);

  const setupKey = `${v}`;

  const run = useCallback(
    ({ token, onProgress }) =>
      runMstSweep({ v, token, onProgress: (fraction, e) => onProgress(fraction, { e }) }),
    [v]
  );

  const current = useMemo(() => compareOnGraph(graph, startId), [graph, startId]);

  return (
    <SweepPanel
      title="Prim vs Kruskal"
      subtitle={
        current.e
          ? `this graph: both reach weight ${current.prim.total}, ${current.prim.steps} steps against ${current.kruskal.steps}`
          : "same tree, different order, different cost"
      }
      setupKey={setupKey}
      run={run}
      progressLabel={(p) => `E = ${p.detail?.e ?? "—"}`}
      emptyText={`Nothing measured yet. The sweep runs both algorithms over the same random connected graph at ${
        edgeCountsFor(v).length
      } densities — from a spanning tree (E = ${v - 1}) up to complete (E = ${
        (v * (v - 1)) / 2
      }) — counting each algorithm's own inner-loop operations, and checks at every point that the two totals still agree.`}
      summary={<CurrentGraph current={current} directed={directed} />}
      controls={
        <div className="complexity__control">
          <span className="label label--tight">VERTICES</span>
          <div className="seg">
            {V_CHOICES.map((choice) => (
              <button
                type="button"
                key={choice.key}
                className={`seg__btn ${v === choice.key ? "active" : ""}`}
                onClick={() => setV(choice.key)}
                title={choice.desc}
                aria-pressed={v === choice.key}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {(result) => <Chart result={result} />}
    </SweepPanel>
  );
}

/** Both algorithms run on the graph the canvas is drawing. */
function CurrentGraph({ current, directed }) {
  if (!current.e) {
    return (
      <p className="complexity__empty">
        {current.v
          ? "This graph has no edges to span. Add some and both algorithms run here, in the order they pick them."
          : "Nothing on the canvas yet. Build a weighted graph and both algorithms run here, edge by edge, on it."}
      </p>
    );
  }

  return (
    <div className="complexity__legend">
      {MST_ALGOS.map((algo) => {
        const result = current[algo.key];
        return (
          <div key={algo.key}>
            <div className="complexity__legend-row">
              <span className="complexity__swatch" style={{ background: algo.color }} aria-hidden="true" />
              <span className="complexity__legend-name">{algo.label}</span>
              <span className="lcd">
                weight <strong>{result.total}</strong>
              </span>
              <span className="lcd">
                {result.edges.length} edge{result.edges.length === 1 ? "" : "s"}
              </span>
              <span className="lcd">
                steps <strong>{result.steps}</strong>
              </span>
              <span className="lcd complexity__legend-claim">{algo.claim}</span>
            </div>
            <ol className="mst-seq" style={{ "--seq-color": algo.color }}>
              {result.edges.map((edge, i) => (
                <li className="mst-seq__chip mono" key={edge.id}>
                  <span className="mst-seq__n">{i + 1}</span>
                  {edge.name}
                  <span className="mst-seq__w">{edge.weight}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      })}

      <p className="complexity__footnote">
        {current.sameTotal ? (
          <>
            Both reach <strong>total weight {current.prim.total}</strong>
            {current.sameEdges ? " with the same edges" : " with different edges"} — Prim from{" "}
            <strong>{current.startLabel}</strong>, one connected tree throughout; Kruskal cheapest
            edge first, a forest of fragments until the last one.{" "}
            {current.sameEdges
              ? current.hasTies
                ? "This graph has tied weights, so the two could have picked different edges and happened not to."
                : "No two edges here share a weight, which is exactly when the minimum spanning tree is unique — different edges would have been a bug."
              : "Tied weights mean more than one minimum spanning tree exists; both of these are minimum, and the totals prove it."}
          </>
        ) : (
          <>
            The two totals differ, which should be impossible for a correct pair of
            implementations — Prim reached {current.prim.total} and Kruskal {current.kruskal.total}.
          </>
        )}{" "}
        {current.components > 1 &&
          `The graph is in ${current.components} pieces, so this is a spanning forest — the animated Prim operation stops after ${current.startLabel}'s component instead, while both runs here span every piece so the totals stay comparable. `}
        {directed && "Direction is ignored: a minimum spanning tree is only defined on an undirected graph. "}
        Steps are each algorithm&apos;s own array operations — vertex scans and neighbour reads for
        Prim, sort comparisons and union-find reads and writes for Kruskal.
      </p>
    </div>
  );
}

function Chart({ result }) {
  const series = MST_ALGOS.map((algo) => ({
    key: algo.key,
    label: algo.label,
    color: algo.color,
    points: result.series[algo.key].map((p) => ({
      x: p.e,
      y: p.steps,
      title: `${algo.label} — E=${p.e}: ${p.steps.toLocaleString()} steps, total weight ${p.total}`,
    })),
  }));

  const eMin = Math.min(...result.series.prim.map((p) => p.e));
  const eMax = Math.max(...result.series.prim.map((p) => p.e));
  const anchorFor = (modelKey) => {
    const points = result.series[modelKey === "v2" ? "prim" : "kruskal"];
    return points[points.length - 1]?.steps ?? 1;
  };

  const overlays = MST_MODELS.map((model) => {
    const scale = anchorFor(model.key) / Math.max(1e-9, model.f(eMax, result.v));
    const points = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const e = Math.exp(Math.log(eMin) + t * (Math.log(eMax) - Math.log(eMin)));
      points.push({ x: e, y: scale * model.f(e, result.v) });
    }
    return { key: model.key, label: model.label, color: model.color, points };
  });

  return (
    <>
      <LineChart
        series={series}
        overlays={overlays}
        xTicks={result.series.prim.map((p) => p.e)}
        xScale="log"
        yScale="log"
        xLabel={`edges (E), at V = ${result.v}`}
        xFormat={formatCount}
        yFormat={formatCount}
        ariaLabel="Operations against edge count for Prim and Kruskal"
      />

      <div className="complexity__legend">
        {MST_ALGOS.map((algo) => {
          const points = result.series[algo.key];
          const sparse = points[0];
          const dense = points[points.length - 1];
          return (
            <div className="complexity__legend-row" key={algo.key}>
              <span className="complexity__swatch" style={{ background: algo.color }} aria-hidden="true" />
              <span className="complexity__legend-name">{algo.label}</span>
              <span className="lcd">
                sparse <strong>{formatCount(sparse.steps)}</strong>
              </span>
              <span className="lcd">
                complete <strong>{formatCount(dense.steps)}</strong>
              </span>
              <span className="lcd complexity__legend-claim">{algo.costs}</span>
            </div>
          );
        })}
        <p className="complexity__footnote">
          Dashed lines are V&sup2; and E log&#8322;E. Prim&apos;s curve is nearly flat: with an array
          rather than a heap it scans every vertex on every round whether the graph has V edges or
          V&sup2;, so a spanning tree costs it almost as much as a complete graph.{" "}
          {result.crossover ? (
            <>
              Kruskal is the cheaper of the two at{" "}
              <strong>E = {formatCount(result.crossover.from)}</strong> and no longer at{" "}
              <strong>E = {formatCount(result.crossover.to)}</strong>, so somewhere between them, at
              V = {result.v}, sorting the edges starts costing more than Prim&apos;s V&sup2;.
            </>
          ) : (
            <>
              Kruskal is cheaper across this whole range; push V up to widen the range and the
              crossover appears.
            </>
          )}{" "}
          Both returned the same total weight at{" "}
          <strong>
            {result.disagreements === 0
              ? "every one"
              : `${result.counts.length - result.disagreements}`}
          </strong>{" "}
          of the {result.counts.length} densities measured — that check is the point of running two
          algorithms on one graph, not decoration. Steps are elementary array operations, not time: a sort comparison
          and a union-find parent read are counted alike and do not cost alike.
        </p>
      </div>
    </>
  );
}

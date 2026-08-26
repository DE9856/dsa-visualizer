import { useCallback, useState } from "react";
import {
  CAPACITY_CHOICES,
  MEASURE_MAP,
  PROBE_MEASURES,
  PROBE_MODELS,
  PROBE_SERIES,
  PROBE_SERIES_MAP,
  SWEEP_ALPHAS,
  limitFor,
  runProbeSweep,
} from "../dataStructures/hashTable/probeSweep.js";
import { HASH_FN_MAP } from "../dataStructures/hashTable/helpers.js";
import LineChart from "./LineChart.jsx";
import SweepPanel from "./SweepPanel.jsx";

/**
 * Probes against load factor, for all six collision strategies.
 *
 * The canvas above caps at 24 keys and resizes itself at 0.5 or 0.75, so it
 * can never show what happens past the limit — which is where the strategies
 * stop agreeing with each other. This fills a table of a few hundred slots to
 * each load factor in turn and counts what a lookup costs there.
 *
 * The hash function is the view's own, because it is upstream of everything
 * here: switch to digit folding and every strategy's curve gets worse at once,
 * which is the point that a collision strategy only ever cleans up after the
 * hash.
 */
export default function ProbePanel({ hashFn }) {
  const [capacity, setCapacity] = useState(331);
  const [measure, setMeasure] = useState("miss");

  const setupKey = `${hashFn}|${capacity}`;

  const run = useCallback(
    ({ token, onProgress }) =>
      runProbeSweep({
        capacity,
        hashFn,
        token,
        onProgress: (fraction, alpha, strategy) => onProgress(fraction, { alpha, strategy }),
      }),
    [capacity, hashFn]
  );

  return (
    <SweepPanel
      title="Probes against load factor"
      subtitle={`all six strategies, ${SWEEP_ALPHAS.length} load factors, ${HASH_FN_MAP[hashFn]?.label.toLowerCase()} hashing`}
      setupKey={setupKey}
      run={run}
      progressLabel={(p) =>
        `${PROBE_SERIES_MAP[p.detail?.strategy]?.short ?? "starting"} at α = ${p.detail?.alpha ?? "—"}`
      }
      emptyText={`Nothing measured yet. The sweep fills a ${capacity}-slot table to each load factor from 0.05 to 0.95 — five tables per point, all six strategies dealt the same keys in the same order — and counts the slots a lookup examines.`}
      controls={
        <>
          <div className="complexity__control">
            <span className="label label--tight">TABLE SIZE</span>
            <div className="seg">
              {CAPACITY_CHOICES.map((choice) => (
                <button
                  type="button"
                  key={choice.key}
                  className={`seg__btn ${capacity === choice.key ? "active" : ""}`}
                  onClick={() => setCapacity(choice.key)}
                  title={choice.desc}
                  aria-pressed={capacity === choice.key}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>

          <div className="complexity__control">
            <span className="label label--tight">LOOKUP</span>
            <div className="seg">
              {PROBE_MEASURES.map((m) => (
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

function Chart({ result, measure }) {
  const strategies = PROBE_SERIES.filter((s) => result.series[s.key]?.length);

  const series = strategies.map((strategy) => ({
    key: strategy.key,
    label: strategy.label,
    color: strategy.color,
    points: result.series[strategy.key].map((p) => ({
      x: p.alpha,
      y: p[measure],
      title: `${strategy.label} — α=${p.alpha}: ${p.hit.toFixed(2)} probes on a hit, ${p.miss.toFixed(
        2
      )} on a miss, ${p.longest.toFixed(1)} at worst`,
    })),
  }));

  // Sampled densely so 1/(1−α) bends rather than hinging at the measured
  // points, and stopped short of α = 1 where it goes to infinity.
  const overlays = (PROBE_MODELS[measure] || []).map((model) => {
    const points = [];
    for (let i = 0; i <= 80; i++) {
      const alpha = 0.02 + (i / 80) * 0.94;
      points.push({ x: alpha, y: model.f(alpha) });
    }
    return { key: model.key, label: model.label, color: model.color, points };
  });

  const measureLabel = MEASURE_MAP[measure].label.toLowerCase();

  return (
    <>
      <LineChart
        series={series}
        overlays={overlays}
        xTicks={[0, 0.25, 0.5, 0.75, 0.95]}
        xScale="linear"
        yScale="log"
        xLabel="load factor α = keys / slots"
        xFormat={(v) => v.toFixed(2)}
        yFormat={(v) => (v >= 10 ? String(Math.round(v)) : v.toFixed(1))}
        ariaLabel={`Slots examined on a ${measureLabel} lookup against load factor`}
      />

      <div className="complexity__legend">
        {strategies.map((strategy) => {
          const points = result.series[strategy.key];
          const last = points[points.length - 1];
          const limit = result.limits[strategy.key];
          return (
            <div className="complexity__legend-row" key={strategy.key}>
              <span className="complexity__swatch" style={{ background: strategy.color }} aria-hidden="true" />
              <span className="complexity__legend-name">{strategy.label}</span>
              <span className="lcd">
                at &#945;={last.alpha} <strong>{last[measure].toFixed(2)}</strong>
              </span>
              <span className="lcd">
                worst <strong>{last.longest.toFixed(1)}</strong>
              </span>
              <span className="lcd complexity__legend-claim">
                {limit
                  ? `refuses keys at α ${limit.alpha}`
                  : `this app resizes at α ${limitFor(strategy.key)}`}
              </span>
            </div>
          );
        })}
        <p className="complexity__footnote">
          A probe is a slot examined — the same buckets the canvas lights up, counted by the same{" "}
          <strong>locate()</strong>, with chaining paying one for the bucket plus one per chain node.
          Dashed lines are the textbook curves: ½(1 + 1/(1−&#945;)) for linear probing and
          (1/&#945;)&#183;ln(1/(1−&#945;)) for uniform hashing on a hit, their squared and 1/(1−&#945;)
          counterparts on a miss. Two things worth reading off it: <strong>linear probing and Robin
          Hood have the same average</strong> — Robin Hood moves keys around without changing how
          many there are, so what it buys is the worst case, not the mean — and{" "}
          <strong>the miss is the curve that matters</strong>, because every insert pays it before it
          lands. A strategy&apos;s line stops where a table of this size started refusing keys
          outright. Past about &#945; 0.8 the measurements sit <em>under</em> the dashed curves,
          which is not an error in either: those results are asymptotic in the table size, and a few
          hundred slots is not asymptotic. Step TABLE SIZE up and watch linear probing climb toward
          its curve rather than away from it.
        </p>
      </div>
    </>
  );
}

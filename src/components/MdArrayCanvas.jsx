import { LAYOUT_MAP, showIndex, slotOf } from "../dataStructures/mdArray/helpers";

/**
 * The logical array above, the one dimension it actually has below.
 *
 * Every logical cell is labelled with the slot it maps to, so the mapping is
 * legible without stepping through anything — and the strip underneath is
 * labelled with the index each slot holds, which is the same fact read the
 * other way. A cell with no slot is drawn as a hole, because for the packed
 * layouts that is exactly what it is: not an element with the value zero, but
 * no element.
 *
 * A third dimension is drawn as a stack of slices rather than in perspective.
 * A cube on a flat screen makes the addresses harder to read, and the
 * addresses are the subject.
 */
export default function MdArrayCanvas({ step }) {
  const dims = step.dims || [];
  const meta = LAYOUT_MAP[step.layout];

  if (dims.length === 0) {
    return (
      <div className="panel canvas md-canvas">
        <div className="ll-empty mono">NO ARRAY</div>
      </div>
    );
  }

  // A 3-D array is drawn as dims[0] slices of the remaining two dimensions;
  // 1-D and 2-D are one slice.
  const slices =
    dims.length === 3
      ? Array.from({ length: dims[0] }, (_, s) => ({ prefix: [s], rows: dims[1], cols: dims[2] }))
      : [{ prefix: [], rows: dims.length === 1 ? 1 : dims[0], cols: dims[dims.length - 1] }];

  return (
    <div className="panel canvas md-canvas">
      <div className="md-head">
        <span className="md-head__layout mono">{meta.short}</span>
        <span className="md-head__formula mono">offset = {meta.formula}</span>
        <span className="md-head__shape mono">{dims.join(" × ")}</span>
      </div>

      <div className="canvas-scroll">
        <div className="md-slices">
          {slices.map((slice, s) => (
            <div className="md-slice" key={s}>
              {slice.prefix.length > 0 && <div className="md-slice__label mono">i₀ = {slice.prefix[0]}</div>}
              <div className="md-grid" style={{ gridTemplateColumns: `repeat(${slice.cols}, minmax(0, 1fr))` }}>
                {/* Flattened rather than nested: the grid is one CSS grid, so a
                    wrapper per row would break it, and React wants a key on
                    every child of a list either way. */}
                {Array.from({ length: slice.rows }, (_, r) =>
                  Array.from({ length: slice.cols }, (_, c) => {
                    const index = dims.length === 1 ? [c] : [...slice.prefix, r, c];
                    return <Cell key={`${r}-${c}`} index={index} step={step} />;
                  })
                ).flat()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {step.formula.length > 0 && (
        <div className="md-formula">
          {step.formula.map((line, i) => (
            <div key={i} className={`md-formula__line mono ${line.tone ? `is-${line.tone}` : ""}`}>
              {line.text}
            </div>
          ))}
        </div>
      )}

      {step.tally && (
        <div className="md-tally">
          <span className="md-tally__item is-stored mono">{step.tally.stored} stored</span>
          {step.tally.shared > 0 && <span className="md-tally__item is-shared mono">{step.tally.shared} shared</span>}
          <span className="md-tally__item is-zero mono">{step.tally.zero} structural zeros</span>
        </div>
      )}

      <div className="md-memory-wrap">
        <span className="md-memory__label mono">MEMORY · {step.slots} SLOTS</span>
        <div className="canvas-scroll">
          <div className="md-memory">
            {Array.from({ length: step.slots }, (_, at) => {
              const holds = step.memory[at];
              return (
                <span
                  key={at}
                  className={`md-slot mono ${holds ? "is-filled" : ""} ${step.slot === at ? "is-cur" : ""}`}
                >
                  <b>{holds ? holds.join(",") : ""}</b>
                  <i>{at}</i>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {step.jump !== null && step.jump !== undefined && (
        <div className={`md-jump mono ${step.jump === 1 ? "is-near" : "is-far"}`}>
          {step.jump === 1 ? "+1 — next slot, same cache line" : `${step.jump > 0 ? "+" : ""}${step.jump} slots`}
        </div>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">NOT STORED</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

function Cell({ index, step }) {
  const { slot, stored, redirect } = slotOf(step.layout, step.dims, index);
  const key = index.join(",");
  const isCursor = step.cursor && step.cursor.join(",") === key;
  const isRedirect = step.redirect && step.redirect.join(",") === key;

  return (
    <span
      className={[
        "md-cell mono",
        stored ? (redirect ? "is-shared" : "is-stored") : "is-hole",
        step.visited.has(key) ? "is-visited" : "",
        isCursor ? "is-cur" : "",
        isRedirect ? "is-redirect" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      title={`A${showIndex(index)}`}
    >
      <b>{stored ? slot : "·"}</b>
      <i>{index.join(",")}</i>
    </span>
  );
}

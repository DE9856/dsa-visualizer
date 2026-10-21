import { useEffect, useRef } from "react";

/**
 * The recursion tree for the divide-and-conquer sorts, drawn directly under
 * the bars and sharing their horizontal scale: every call is a segment
 * covering exactly the columns it owns, one row per depth. Containment is
 * then something you can see rather than something you have to infer from
 * lines between boxes.
 *
 * Renders nothing for the algorithms whose frames carry no `calls`.
 */
export default function RecursionPanel({ step, size }) {
  const activeRef = useRef(null);

  // A degenerate quicksort recurses deeper than the panel is tall, so keep
  // the live call in view. "nearest" means it only scrolls when it has to.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [step?.callId]);

  const calls = step?.calls;
  if (!calls || !calls.length || !size) return null;

  // Only the calls entered so far — the tree fills in as the run proceeds
  // instead of showing the whole shape up front.
  const seen = calls.slice(0, step.callCount ?? calls.length);
  const active = calls[step.callId];

  // Ancestors of the active call: the live part of the call stack.
  const onStack = new Set();
  for (let node = active; node; node = node.parent === null ? null : calls[node.parent]) {
    onStack.add(node.id);
  }

  const maxDepth = seen.reduce((m, c) => Math.max(m, c.depth), 0);
  const rows = Array.from({ length: maxDepth + 1 }, () => []);
  seen.forEach((call) => rows[call.depth].push(call));

  const pct = (value) => `${(value / size) * 100}%`;

  return (
    <div className="panel recursion">
      <div className="recursion__head">
        <span className="canvas__note">RECURSION TREE</span>
        <span className="lcd">
          DEPTH <strong>{step.depth ?? 0}</strong> · RANGE{" "}
          <strong>
            {step.range ? `${step.range[0]}–${step.range[1]}` : "—"}
          </strong>
        </span>
      </div>

      <div className="recursion__rows">
        {rows.map((row, depth) => (
          <div className="recursion__row" key={depth}>
            {row.map((call) => {
              const [lo, hi] = call.range;
              const width = hi - lo + 1;
              const isActive = call.id === step.callId;
              const isAncestor = !isActive && onStack.has(call.id);
              return (
                <div
                  key={call.id}
                  ref={isActive ? activeRef : null}
                  className={`recursion__call ${isActive ? "is-active" : ""} ${
                    isAncestor ? "is-ancestor" : ""
                  }`}
                  style={{ left: pct(lo), width: pct(width) }}
                  title={`depth ${call.depth} — indices ${lo}–${hi}`}
                >
                  {/* A label only fits once a call owns a few columns. */}
                  {width / size > 0.14 && (
                    <span className="recursion__label mono">
                      {lo}
                      {width > 1 && `–${hi}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

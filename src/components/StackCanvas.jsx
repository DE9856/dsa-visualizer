import SlotBox from "./SlotBox.jsx";
import { STACK_CAPACITY } from "../dataStructures/stack";

export default function StackCanvas({ step }) {
  const nodes = step.nodes || [];
  // Stored bottom-first (index 0 = base). Reverse only for display so the
  // top of the stack renders visually on top.
  const displayNodes = [...nodes].reverse();
  const topId = nodes.length ? nodes[nodes.length - 1].id : null;

  return (
    <div className="panel canvas sq-canvas">
      <div className="sq-cap-label mono">
        CAPACITY {nodes.length}/{STACK_CAPACITY}
      </div>

      <div className="sq-stack-wrap">
        <div className="sq-stack">
          {displayNodes.length === 0 ? (
            <div className="sq-empty mono">EMPTY STACK</div>
          ) : (
            displayNodes.map((node) => (
              <SlotBox key={node.id} node={node} step={step} tag={node.id === topId ? "TOP" : null} tagClass="sq-tag--top" />
            ))
          )}
        </div>
        <div className="sq-base mono">— base —</div>
      </div>

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && (
        <div className="not-found">{step.overflow ? "OVERFLOW" : step.underflow ? "UNDERFLOW" : "NOT FOUND"}</div>
      )}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

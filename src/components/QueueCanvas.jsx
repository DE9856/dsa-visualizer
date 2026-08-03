import SlotBox from "./SlotBox.jsx";
import { QUEUE_CAPACITY } from "../dataStructures/queue";

export default function QueueCanvas({ step }) {
  const nodes = step.nodes || [];
  // Stored front-first (index 0 = front, last = rear).
  const frontId = nodes.length ? nodes[0].id : null;
  const rearId = nodes.length ? nodes[nodes.length - 1].id : null;

  return (
    <div className="panel canvas sq-canvas">
      <div className="sq-cap-label mono">
        CAPACITY {nodes.length}/{QUEUE_CAPACITY}
      </div>

      <div className="sq-queue-wrap">
        <span className="sq-side-label mono">IN &#8594;</span>
        <div className="sq-queue">
          {nodes.length === 0 ? (
            <div className="sq-empty mono">EMPTY QUEUE</div>
          ) : (
            nodes.map((node) => {
              const isFront = node.id === frontId;
              const isRear = node.id === rearId;
              const tag = isFront && isRear ? "FRONT/REAR" : isFront ? "FRONT" : isRear ? "REAR" : null;
              return <SlotBox key={node.id} node={node} step={step} tag={tag} tagClass={isFront ? "sq-tag--front" : "sq-tag--rear"} />;
            })
          )}
        </div>
        <span className="sq-side-label mono">&#8594; OUT</span>
      </div>

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && (
        <div className="not-found">{step.overflow ? "OVERFLOW" : step.underflow ? "UNDERFLOW" : "NOT FOUND"}</div>
      )}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

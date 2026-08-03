import ListNode from "./ListNode.jsx";
import { forwardChain, backwardChain } from "../dataStructures/linkedList";

function ListRow({ nodes, step, listType, label }) {
  const circular = listType === "circular";
  const doubly = listType === "doubly";
  const pointerMap = step.pointerMap || forwardChain(nodes, circular);
  const prevMap = doubly ? backwardChain(nodes, false) : null;
  const headId = step.headId !== undefined ? step.headId : nodes[0]?.id ?? null;
  const tailId = nodes.length ? nodes[nodes.length - 1].id : null;

  return (
    <>
      {label && <div className="ll-row-label mono">{label}</div>}
      <div className="ll-row">
        {nodes.length === 0 ? (
          <div className="ll-empty">
            <span className="ll-head-tag ll-head-tag--static">HEAD</span>
            <span className="ll-arrow">&#8594;</span>
            <span className="ll-null">NULL</span>
          </div>
        ) : (
          nodes.map((node, i) => (
            <ListNode
              key={node.id}
              node={node}
              index={i}
              allNodes={nodes}
              step={step}
              pointerMap={pointerMap}
              prevMap={prevMap}
              isHead={node.id === headId}
              isTail={node.id === tailId}
              headId={headId}
              circular={circular}
              doubly={doubly}
            />
          ))
        )}
      </div>
      {circular && nodes.length > 1 && (
        <div className="ll-circular-note mono">&#8635; tail links back to HEAD</div>
      )}
    </>
  );
}

export default function ListCanvas({
  step,
  listType = "singly",
  secondNodes = null,
  primaryLabel,
  secondaryLabel,
}) {
  const nodes = step.nodes || [];

  return (
    <div className="panel canvas ll-canvas">
      <ListRow nodes={nodes} step={step} listType={listType} label={primaryLabel} />

      {secondNodes && (
        <div style={{ marginTop: 18 }}>
          <ListRow nodes={secondNodes} step={{ nodes: secondNodes }} listType="singly" label={secondaryLabel} />
        </div>
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">NOT FOUND</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}
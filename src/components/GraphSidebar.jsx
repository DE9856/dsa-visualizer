import { useState } from "react";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { GRAPH_OPERATIONS, GRAPH_GROUPS, GRAPH_REPRESENTATIONS } from "../dataStructures/graph";

const BUILD_MODES = [
  {
    key: "edgeList",
    label: "EDGES",
    placeholder: "A-B, B-C, A-C\nweighted: A-B@5, B-C@2",
  },
  {
    key: "adjList",
    label: "LIST",
    placeholder: "A: B, C\nB: C\nC:\nweighted: A: B(5), C(2)",
  },
  {
    key: "matrix",
    label: "MATRIX",
    placeholder: "0 1 0\n1 0 1\n0 1 0",
  },
];

export default function GraphSidebar({
  nodes,
  representation,
  onRepresentationChange,
  directed,
  onDirectedChange,
  weighted,
  onWeightedChange,
  operation,
  onOperationChange,
  opMeta,
  vertexLabelInput,
  setVertexLabelInput,
  vertexInput,
  setVertexInput,
  fromVertexInput,
  setFromVertexInput,
  toVertexInput,
  setToVertexInput,
  weightInput,
  setWeightInput,
  onRun,
  customInput,
  setCustomInput,
  buildMode,
  setBuildMode,
  buildError,
  onApplyCustom,
  onShuffle,
}) {
  const activeGroup = GRAPH_OPERATIONS.find((op) => op.key === operation)?.group;
  const [openGroups, setOpenGroups] = useState(() => new Set([activeGroup]));

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectOperation = (op) => {
    onOperationChange(op.key);
    setOpenGroups((prev) => new Set(prev).add(op.group));
  };

  const noVertices = nodes.length === 0;
  const fewerThanTwo = nodes.length < 2;

  return (
    <div className="panel sidebar">
      <div className="label">REPRESENTATION</div>
      <div className="type-toggle">
        {GRAPH_REPRESENTATIONS.map((r) => (
          <button
            key={r.key}
            className={`btn ${representation === r.key ? "active" : ""}`}
            onClick={() => onRepresentationChange(r.key)}
          >
            {r.key === "list" ? "LIST" : "MATRIX"}
          </button>
        ))}
      </div>

      <div className="label" style={{ marginTop: 14 }}>DIRECTION</div>
      <div className="type-toggle">
        <button className={`btn ${!directed ? "active" : ""}`} onClick={() => onDirectedChange(false)}>
          UNDIRECTED
        </button>
        <button className={`btn ${directed ? "active" : ""}`} onClick={() => onDirectedChange(true)}>
          DIRECTED
        </button>
      </div>

      <div className="label" style={{ marginTop: 14 }}>WEIGHTS</div>
      <div className="type-toggle">
        <button className={`btn ${!weighted ? "active" : ""}`} onClick={() => onWeightedChange(false)}>
          UNWEIGHTED
        </button>
        <button className={`btn ${weighted ? "active" : ""}`} onClick={() => onWeightedChange(true)}>
          WEIGHTED
        </button>
      </div>

      <div className="sidebar__section">
        <div className="label">NEW / CUSTOM GRAPH</div>
        <button className="btn" style={{ width: "100%", marginBottom: 8 }} onClick={onShuffle}>
          <Shuffle size={13} /> RANDOM GRAPH
        </button>

        <div className="type-toggle" style={{ marginBottom: 8 }}>
          {BUILD_MODES.map((m) => (
            <button
              key={m.key}
              className={`btn ${buildMode === m.key ? "active" : ""}`}
              onClick={() => setBuildMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <textarea
          className="text-input textarea-input"
          placeholder={BUILD_MODES.find((m) => m.key === buildMode)?.placeholder}
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          rows={buildMode === "edgeList" ? 2 : 4}
        />
        {buildError && <div className="build-error mono">{buildError}</div>}
        <button className="btn" style={{ width: "100%", marginTop: 6 }} onClick={onApplyCustom}>
          APPLY
        </button>
      </div>

      <div className="label" style={{ marginTop: 16 }}>OPERATIONS</div>
      <div className="algo-list">
        {GRAPH_GROUPS.map((group) => {
          const ops = GRAPH_OPERATIONS.filter((op) => op.group === group.key);
          if (ops.length === 0) return null;
          const isOpen = openGroups.has(group.key);
          return (
            <div key={group.key} className="algo-group">
              <div className="algo-group__header" onClick={() => toggleGroup(group.key)}>
                <span className="algo-group__label">{group.label}</span>
                {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </div>
              {isOpen && (
                <div className="algo-group__body">
                  {ops.map((op) => (
                    <div
                      key={op.key}
                      className={`algo-row ${operation === op.key ? "active" : ""}`}
                      onClick={() => selectOperation(op)}
                    >
                      {op.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sidebar__section">
        {opMeta.fields.includes("vertexLabel") && (
          <>
            <div className="label">LABEL (optional)</div>
            <input
              type="text"
              className="text-input"
              placeholder="auto (A, B, C...)"
              value={vertexLabelInput}
              onChange={(e) => setVertexLabelInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </>
        )}

        {opMeta.fields.includes("vertex") && (
          <>
            <div className="label">VERTEX</div>
            <select
              className="text-input"
              value={vertexInput}
              onChange={(e) => setVertexInput(e.target.value)}
              disabled={noVertices}
              style={{ marginBottom: 10 }}
            >
              {noVertices && <option value="">no vertices</option>}
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </>
        )}

        {opMeta.fields.includes("fromVertex") && (
          <>
            <div className="label">FROM</div>
            <select
              className="text-input"
              value={fromVertexInput}
              onChange={(e) => setFromVertexInput(e.target.value)}
              disabled={fewerThanTwo}
              style={{ marginBottom: 10 }}
            >
              {fewerThanTwo && <option value="">need 2+ vertices</option>}
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </>
        )}

        {opMeta.fields.includes("toVertex") && (
          <>
            <div className="label">TO</div>
            <select
              className="text-input"
              value={toVertexInput}
              onChange={(e) => setToVertexInput(e.target.value)}
              disabled={fewerThanTwo}
              style={{ marginBottom: 10 }}
            >
              {fewerThanTwo && <option value="">need 2+ vertices</option>}
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </>
        )}

        {opMeta.fields.includes("weight") && weighted && (
          <>
            <div className="label">WEIGHT</div>
            <input
              type="number"
              className="text-input"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              style={{ marginBottom: 10 }}
            />
          </>
        )}

        <button className="btn active" style={{ width: "100%" }} onClick={onRun}>
          RUN {opMeta.label.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
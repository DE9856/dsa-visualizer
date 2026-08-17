import { useState } from "react";

export default function GraphRepresentationPanel({ representation, step, directed, weighted, onSetWeight }) {
  const nodes = step.nodes || [];
  const edges = step.edges || [];

  // Which cell is open for editing, as { from, to }. One at a time, so this is
  // a single slot rather than anything per-cell.
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");

  const openCell = (fromId, toId, current) => {
    setEditing({ from: fromId, to: toId });
    setDraft(String(current));
  };

  const commitCell = () => {
    if (!editing) return;
    const { from, to } = editing;
    setEditing(null);
    const value = Number(draft.trim());
    // An empty or unparseable cell is a slip, not an instruction to do
    // something — leave the graph as it was.
    if (draft.trim() === "" || !Number.isFinite(value)) return;
    onSetWeight?.(from, to, value);
  };

  const onCellKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Commit outright rather than by blurring: routing Enter through blur
      // would make it depend on the input still holding focus, and the commit
      // is idempotent anyway — the blur that follows finds nothing to do.
      commitCell();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(null);
    }
  };

  const isHighlighted = (id) => (step.visited && step.visited.includes(id)) || step.current === id || (step.active && step.active.includes(id));
  const isVisited = (id) => step.visited && step.visited.includes(id);

  if (nodes.length === 0) {
    return (
      <div className="panel graph-repr">
        <div className="label">{representation === "matrix" ? "ADJACENCY MATRIX" : "ADJACENCY LIST"}</div>
        <div className="ll-empty mono">EMPTY</div>
      </div>
    );
  }

  if (representation === "matrix") {
    const weightAt = (fromId, toId) => {
      const e = edges.find(
        (edge) => (edge.from === fromId && edge.to === toId) || (!directed && edge.from === toId && edge.to === fromId)
      );
      return e ? e.weight : 0;
    };

    return (
      <div className="panel graph-repr">
        <div className="label">ADJACENCY MATRIX</div>
        <div className="canvas__note">
          {onSetWeight
            ? weighted
              ? "CLICK A CELL TO SET THAT EDGE'S WEIGHT · 0 REMOVES IT · THE DIAGONAL IS A SELF-LOOP"
              : "CLICK A CELL TO CONNECT OR DISCONNECT · 1 OR 0 · THE DIAGONAL IS A SELF-LOOP"
            : null}
        </div>
        <div className="graph-matrix-wrap">
          <table className="graph-matrix mono">
            <thead>
              <tr>
                <th></th>
                {nodes.map((n) => (
                  <th key={n.id} className={isVisited(n.id) ? "gm-visited" : isHighlighted(n.id) ? "gm-active" : ""}>
                    {n.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((row) => (
                <tr key={row.id}>
                  <th className={isVisited(row.id) ? "gm-visited" : isHighlighted(row.id) ? "gm-active" : ""}>{row.label}</th>
                  {nodes.map((col) => {
                    const w = weightAt(row.id, col.id);
                    // An unweighted graph's matrix says connected or not, so
                    // it shows 1 rather than whatever weight the edge happens
                    // to be carrying unused underneath.
                    const shown = w ? (weighted ? w : 1) : 0;
                    const isEditing = editing && editing.from === row.id && editing.to === col.id;
                    // "from A to A" is a mouthful for the one cell that has a
                    // name of its own.
                    const cellName =
                      row.id === col.id ? `${row.label}'s self-loop` : `${row.label} to ${col.label}`;

                    return (
                      <td key={col.id} className={w ? "gm-edge" : ""}>
                        {isEditing ? (
                          <input
                            className="gm-input mono"
                            value={draft}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={onCellKeyDown}
                            onBlur={commitCell}
                            aria-label={`Weight of ${cellName}`}
                          />
                        ) : onSetWeight ? (
                          <button
                            type="button"
                            className="gm-cell"
                            onClick={() => openCell(row.id, col.id, shown)}
                            aria-label={`Edit weight of ${cellName}, currently ${shown}`}
                          >
                            {shown}
                          </button>
                        ) : (
                          shown
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="panel graph-repr">
      <div className="label">ADJACENCY LIST</div>
      <div className="graph-list mono">
        {nodes.map((n) => {
          const outgoing = edges.filter((e) => e.from === n.id || (!directed && e.to === n.id));
          const targets = outgoing.map((e) => {
            const otherId = e.from === n.id ? e.to : e.from;
            const other = nodes.find((x) => x.id === otherId);
            return other ? other.label : "?";
          });
          return (
            <div
              key={n.id}
              className={`graph-list__row ${isVisited(n.id) ? "gl-visited" : isHighlighted(n.id) ? "gl-active" : ""}`}
            >
              <span className="graph-list__head">{n.label}</span>
              <span className="graph-list__arrow">&rarr;</span>
              {targets.length === 0 ? (
                <span className="graph-list__empty">null</span>
              ) : (
                targets.map((t, i) => (
                  <span key={i} className="graph-list__node">
                    {t}
                    {i < targets.length - 1 ? " ," : ""}
                  </span>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

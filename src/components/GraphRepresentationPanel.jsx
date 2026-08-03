export default function GraphRepresentationPanel({ representation, step, directed }) {
  const nodes = step.nodes || [];
  const edges = step.edges || [];

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
                    return (
                      <td key={col.id} className={w ? "gm-edge" : ""}>
                        {row.id === col.id ? "\u00b7" : w || 0}
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

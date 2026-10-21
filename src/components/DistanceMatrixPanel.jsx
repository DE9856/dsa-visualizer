export default function DistanceMatrixPanel({ distanceMatrix }) {
  if (!distanceMatrix) return null;
  const { labels, matrix, highlight } = distanceMatrix;

  const isHighlighted = (i, j) => highlight && highlight[0] === i && highlight[1] === j;

  return (
    <div className="panel graph-repr">
      <div className="label">DISTANCE MATRIX</div>
      <div className="graph-matrix-wrap">
        <table className="graph-matrix mono">
          <thead>
            <tr>
              <th></th>
              {labels.map((l, i) => (
                <th key={i}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((rowLabel, i) => (
              <tr key={i}>
                <th>{rowLabel}</th>
                {labels.map((_, j) => (
                  <td key={j} className={isHighlighted(i, j) ? "gm-edge" : ""}>
                    {i === j ? "\u00b7" : matrix[i][j] === Infinity ? "\u221e" : matrix[i][j]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

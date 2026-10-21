import StatBoard from "./StatBoard.jsx";

const COLUMNS = [
  { key: "height", label: "H", title: "Height in edges — an empty tree is -1, a single node 0", color: "var(--primary)" },
  { key: "nodes", label: "KEYS", title: "Keys inserted so far", color: "var(--text-dim)" },
  { key: "comparisons", label: "CMP", title: "Key comparisons made on the insert descents", color: "var(--blue)" },
  { key: "restructures", label: "FIX", title: "Rotations (AVL) or node splits (2-3) performed", color: "var(--purple)" },
];

/**
 * Height is the headline, but comparisons are the honest cost: a 2-3 node
 * with two keys costs two comparisons to pass through, so it buys its shorter
 * height with wider nodes. Showing both is what stops "shortest" from being
 * read as "cheapest".
 */
export default function TreeCompareBoard({ lanes, shortest, size }) {
  const rows = lanes.map((lane) => ({
    key: lane.key,
    label: lane.label,
    leader: shortest.includes(lane.key),
    cells: {
      height: { value: lane.state.height, total: lane.stats.height },
      nodes: { value: lane.state.inserted, total: size },
      comparisons: { value: lane.state.comparisons, total: lane.stats.comparisons },
      restructures: { value: lane.state.restructures, total: lane.stats.restructures },
    },
    note: <BoundCell lane={lane} />,
  }));

  return (
    <StatBoard
      title="HEIGHTS"
      nameHeader="STRUCTURE"
      hint="height in edges, keys inserted, comparisons spent getting there, and rotations or splits performed"
      columns={COLUMNS}
      rows={rows}
      noteHeader="GUARANTEE"
    />
  );
}

/**
 * Whether the structure is currently inside the bound it promises. A BST
 * promises nothing, and saying so is the point of the column.
 */
function BoundCell({ lane }) {
  const n = Math.max(1, lane.state.inserted);
  if (lane.key === "bst") {
    return (
      <span className="scoreboard__stable" title="A BST's height depends entirely on the insertion order">
        none
      </span>
    );
  }
  const bound =
    lane.key === "avl"
      ? 1.4405 * Math.log2(n + 2) - 0.3277
      : Math.log2(n + 1);
  const within = lane.state.height <= bound + 1e-9;
  return (
    <span
      className={`scoreboard__stable ${within ? "scoreboard__stable--ok" : "scoreboard__stable--bad"}`}
      title={
        lane.key === "avl"
          ? "AVL trees are guaranteed a height below 1.44 log2(n+2) - 0.33"
          : "Every 2-3 tree of n keys has height at most log2(n+1)"
      }
    >
      {"\u2264"} {bound.toFixed(1)}
    </span>
  );
}

let vertexCounter = 0;
export function nextVertexId() {
  vertexCounter += 1;
  return `gv${vertexCounter}`;
}

let edgeCounter = 0;
export function nextEdgeId() {
  edgeCounter += 1;
  return `ge${edgeCounter}`;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Picks the next unused single-letter label (A, B, C... then A1, B1...)
// so freshly added vertices don't need to be named manually.
export function nextVertexLabel(nodes) {
  const used = new Set(nodes.map((n) => n.label));
  for (let i = 0; i < 260; i++) {
    const label = i < 26 ? ALPHABET[i] : ALPHABET[i % 26] + Math.floor(i / 26);
    if (!used.has(label)) return label;
  }
  return `V${nodes.length}`;
}

export function cloneGraph(graph) {
  return {
    nodes: graph.nodes.map((n) => ({ ...n })),
    edges: graph.edges.map((e) => ({ ...e })),
  };
}

export function findVertexByLabel(nodes, label) {
  return nodes.find((n) => n.label === label);
}

export function edgeExists(edges, fromId, toId, directed) {
  return edges.some(
    (e) => (e.from === fromId && e.to === toId) || (!directed && e.from === toId && e.to === fromId)
  );
}

// Neighbor ids in edge-insertion order, deduplicated. Respects direction:
// only outgoing edges count for a directed graph.
export function neighborsOf(nodes, edges, vertexId, directed) {
  const seen = new Set();
  const order = [];
  edges.forEach((e) => {
    if (e.from === vertexId && !seen.has(e.to)) {
      seen.add(e.to);
      order.push(e.to);
    }
    if (!directed && e.to === vertexId && !seen.has(e.from)) {
      seen.add(e.from);
      order.push(e.from);
    }
  });
  return order;
}

// Parses "A-B, B-C, A>C" style text into [fromLabel, toLabel] pairs.
// An optional "@weight" suffix sets that edge's weight, e.g. "A-B@5".
export function parseEdgeList(input) {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [pair, weightPart] = entry.split("@").map((s) => s.trim());
      const arr = pair.split(/-|>|:/).map((x) => x.trim());
      const weight = weightPart ? parseInt(weightPart, 10) || 1 : 1;
      return { from: arr[0], to: arr[1], weight };
    })
    .filter((e) => e.from && e.to)
    .slice(0, 40);
}

export function buildGraphFromEdgeList(pairs) {
  const nodes = [];
  const nodeMap = {};
  const edges = [];
  const getOrCreate = (label) => {
    if (nodeMap[label]) return nodeMap[label];
    const node = { id: nextVertexId(), label };
    nodeMap[label] = node;
    nodes.push(node);
    return node;
  };
  pairs.forEach(({ from, to, weight }) => {
    const na = getOrCreate(from);
    const nb = getOrCreate(to);
    edges.push({ id: nextEdgeId(), from: na.id, to: nb.id, weight: weight || 1 });
  });
  return { nodes, edges };
}

// Parses adjacency-list text, one vertex per line: "A: B, C(4)" where the
// optional "(weight)" after a neighbor sets that edge's weight (default 1).
// A line with no neighbors ("C:" or just "C") still registers vertex C.
export function parseAdjacencyList(input) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(":");
      const from = (colonIdx === -1 ? line : line.slice(0, colonIdx)).trim();
      const rest = colonIdx === -1 ? "" : line.slice(colonIdx + 1);
      const neighbors = rest
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((tok) => {
          const m = tok.match(/^([^\s(]+)\s*(?:\((-?\d+(?:\.\d+)?)\))?$/);
          if (!m) return null;
          return { to: m[1], weight: m[2] ? parseFloat(m[2]) : 1 };
        })
        .filter(Boolean);
      return { from, neighbors };
    })
    .filter((entry) => entry.from);
}

export function buildGraphFromAdjacencyList(entries, directed) {
  const nodes = [];
  const nodeMap = {};
  const edges = [];
  const getOrCreate = (label) => {
    if (nodeMap[label]) return nodeMap[label];
    const node = { id: nextVertexId(), label };
    nodeMap[label] = node;
    nodes.push(node);
    return node;
  };
  // First pass: register every vertex mentioned (as a source or as someone's
  // neighbor), in the order first seen, so isolated targets aren't dropped.
  entries.forEach(({ from, neighbors }) => {
    getOrCreate(from);
    neighbors.forEach((n) => getOrCreate(n.to));
  });
  entries.forEach(({ from, neighbors }) => {
    const fromNode = nodeMap[from];
    neighbors.forEach(({ to, weight }) => {
      const toNode = nodeMap[to];
      if (!toNode) return;
      if (!directed && edgeExists(edges, fromNode.id, toNode.id, false)) return;
      edges.push({ id: nextEdgeId(), from: fromNode.id, to: toNode.id, weight });
    });
  });
  return { nodes, edges };
}

// Rebuilds a graph from an explicit vertex order plus an explicit edge order.
// Unlike the text builders above, nothing is inferred: this is what a shared
// link uses, so a graph comes back with its vertices and edges in exactly the
// order it had. Edges naming an unknown vertex are skipped.
export function buildGraphFromLabelsAndEdges(labels, edgeSpecs) {
  const nodes = labels.map((label) => ({ id: nextVertexId(), label }));
  const idByLabel = Object.fromEntries(nodes.map((n) => [n.label, n.id]));
  const edges = [];
  edgeSpecs.forEach(({ from, to, weight }) => {
    const fromId = idByLabel[from];
    const toId = idByLabel[to];
    if (!fromId || !toId) return;
    edges.push({ id: nextEdgeId(), from: fromId, to: toId, weight: weight || 1 });
  });
  return { nodes, edges };
}

// Parses adjacency-matrix text: one row per line, values separated by
// whitespace or commas. Returns null if rows aren't a square numeric grid.
export function parseAdjacencyMatrix(input) {
  const rows = input
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => r.split(/[\s,]+/).filter(Boolean).map(Number));
  const size = rows.length;
  if (size === 0) return null;
  const isSquare = rows.every((r) => r.length === size && r.every((v) => !Number.isNaN(v)));
  return isSquare ? rows : null;
}

export function buildGraphFromAdjacencyMatrix(matrix, directed) {
  const n = matrix.length;
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: nextVertexId(),
    label: i < 26 ? ALPHABET[i] : `V${i}`,
  }));
  const edges = [];
  for (let i = 0; i < n; i++) {
    const jStart = directed ? 0 : i + 1;
    for (let j = jStart; j < n; j++) {
      if (i === j) continue;
      const w = matrix[i][j];
      if (w) edges.push({ id: nextEdgeId(), from: nodes[i].id, to: nodes[j].id, weight: w });
    }
  }
  return { nodes, edges };
}

export function randomGraph() {
  const size = 4 + Math.floor(Math.random() * 2);
  const nodes = Array.from({ length: size }, (_, i) => ({ id: nextVertexId(), label: ALPHABET[i] }));

  const possiblePairs = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) possiblePairs.push([i, j]);
  }
  for (let i = possiblePairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possiblePairs[i], possiblePairs[j]] = [possiblePairs[j], possiblePairs[i]];
  }

  const edgeCount = Math.min(possiblePairs.length, nodes.length + 1);
  const edges = possiblePairs.slice(0, edgeCount).map(([i, j]) => ({
    id: nextEdgeId(),
    from: nodes[i].id,
    to: nodes[j].id,
    weight: 1 + Math.floor(Math.random() * 9),
  }));

  return { nodes, edges };
}

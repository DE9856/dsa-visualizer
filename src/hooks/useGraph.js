import { useState, useEffect, useCallback } from "react";
import { GRAPH_OP_MAP } from "../dataStructures/graph";
import { useStepPlayer } from "./useStepPlayer.js";
import {
  parseEdgeList,
  buildGraphFromEdgeList,
  parseAdjacencyList,
  buildGraphFromAdjacencyList,
  parseAdjacencyMatrix,
  buildGraphFromAdjacencyMatrix,
  buildGraphFromLabelsAndEdges,
  randomGraph,
} from "../dataStructures/graph/helpers";

const EMPTY_STEP = { nodes: [], edges: [], message: "" };

// A shared link keys positions by vertex label, since ids are per-session
// counters that would mean nothing in the tab the link is opened in. Labels
// the graph doesn't have are dropped; their vertices just stay on the ring.
function positionsById(graph, byLabel) {
  if (!byLabel) return {};
  const out = {};
  graph.nodes.forEach((node) => {
    const p = byLabel[node.label];
    if (p) out[node.id] = p;
  });
  return out;
}

/**
 * `init` is the setup decoded from a shared link ({ vertices, edges, directed,
 * weighted, positions }) — an explicit vertex and edge order, so the graph
 * comes back laid out exactly as it was shared.
 */
export function useGraph(init) {
  const [graph, setGraph] = useState(() =>
    init?.vertices ? buildGraphFromLabelsAndEdges(init.vertices, init.edges) : randomGraph()
  );
  const [representation, setRepresentation] = useState("list");
  const [directed, setDirected] = useState(init?.directed ?? false);
  const [weighted, setWeighted] = useState(init?.weighted ?? false);

  // Where the user has dragged a vertex, as a fraction of the canvas (0..1)
  // keyed by vertex id. Fractions rather than pixels so a layout arranged on a
  // desktop survives the switch to the phone's taller, narrower viewBox.
  // Vertices absent from this map fall back to their slot on the default ring.
  // Entries for deleted vertices are left alone: ids are never reused, so a
  // stale one can't land on a new vertex, and pruning them the moment the
  // graph changes would yank a vertex back to the ring halfway through the
  // remove animation that is still playing.
  // `graph` above is already bound by the time this initialiser runs, so the
  // link's labels can be resolved against the vertices it just built.
  const [positions, setPositions] = useState(() => positionsById(graph, init?.positions));

  const [operation, setOperation] = useState("addVertex");
  const [vertexLabelInput, setVertexLabelInput] = useState("");
  const [vertexInput, setVertexInput] = useState("");
  const [fromVertexInput, setFromVertexInput] = useState("");
  const [toVertexInput, setToVertexInput] = useState("");
  const [weightInput, setWeightInput] = useState("1");
  const [customInput, setCustomInput] = useState("");
  const [buildMode, setBuildMode] = useState("edgeList"); // "edgeList" | "adjList" | "matrix"
  const [buildError, setBuildError] = useState("");

  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = GRAPH_OP_MAP[operation];

  useEffect(() => {
    setSteps([{ ...graph, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the vertex selects pointed at real vertices whenever the graph changes.
  useEffect(() => {
    const ids = graph.nodes.map((n) => n.id);
    setVertexInput((prev) => (ids.includes(prev) ? prev : ids[0] || ""));
    setFromVertexInput((prev) => (ids.includes(prev) ? prev : ids[0] || ""));
    setToVertexInput((prev) => (ids.includes(prev) ? prev : ids[1] || ids[0] || ""));
  }, [graph]);

  const runWith = useCallback(
    (opKey, params) => {
      const meta = GRAPH_OP_MAP[opKey];
      const { steps: newSteps, finalGraph } = meta.run(graph, {
        directed,
        weighted,
        ...params,
      });
      setSteps(newSteps);
      setStepIdx(0);
      setGraph(finalGraph);
      setPlaying(newSteps.length > 1);
    },
    [graph, directed, weighted]
  );

  const runOperation = useCallback(() => {
    const params = {
      vertexLabel: vertexLabelInput,
      vertex: vertexInput,
      fromVertex: fromVertexInput,
      toVertex: toVertexInput,
      weight: weighted ? parseInt(weightInput, 10) || 1 : 1,
    };
    runWith(operation, params);
    setVertexLabelInput("");
  }, [operation, vertexLabelInput, vertexInput, fromVertexInput, toVertexInput, weightInput, weighted, runWith]);

  // Called when the user drags from one node to another on the canvas.
  const createEdgeFromDrag = useCallback(
    (fromId, toId) => {
      runWith("addEdge", {
        fromVertex: fromId,
        toVertex: toId,
        weight: weighted ? parseInt(weightInput, 10) || 1 : 1,
      });
    },
    [runWith, weighted, weightInput]
  );

  // Committed once per drag, when the vertex is dropped — the live position
  // while a finger or cursor is moving is the canvas's own business.
  const moveVertex = useCallback((vertexId, nx, ny) => {
    setPositions((prev) => ({ ...prev, [vertexId]: { nx, ny } }));
  }, []);

  const resetLayout = useCallback(() => setPositions({}), []);

  // Only vertices actually on screen count, so the reset affordance doesn't
  // appear for a graph whose moved vertices have all since been deleted.
  const hasCustomLayout = graph.nodes.some((n) => positions[n.id]);

  const applyCustomGraph = useCallback(() => {
    let next = null;

    if (buildMode === "edgeList") {
      const pairs = parseEdgeList(customInput);
      if (pairs.length === 0) {
        setBuildError("Enter at least one edge, e.g. A-B, B-C");
        return;
      }
      next = buildGraphFromEdgeList(pairs);
    } else if (buildMode === "adjList") {
      const entries = parseAdjacencyList(customInput);
      if (entries.length === 0) {
        setBuildError("Enter at least one vertex line, e.g. A: B, C");
        return;
      }
      next = buildGraphFromAdjacencyList(entries, directed);
    } else if (buildMode === "matrix") {
      const matrix = parseAdjacencyMatrix(customInput);
      if (!matrix) {
        setBuildError("Rows must all be the same length and numeric");
        return;
      }
      next = buildGraphFromAdjacencyMatrix(matrix, directed);
    }

    if (!next) return;
    setBuildError("");
    setGraph(next);
    // A wholly new graph is the one moment nothing on screen can still be
    // holding an old vertex, so it's where stale positions get dropped.
    setPositions({});
    setSteps([{ ...next, message: "Custom graph loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput, buildMode, directed]);

  const shuffle = useCallback(() => {
    const next = randomGraph();
    setGraph(next);
    setPositions({});
    setSteps([{ ...next, message: "New random graph" }]);
    setStepIdx(0);
    setPlaying(false);
  }, []);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
    graph,
    representation,
    setRepresentation,
    directed,
    setDirected,
    weighted,
    setWeighted,
    operation,
    setOperation,
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
    customInput,
    setCustomInput,
    buildMode,
    setBuildMode: (mode) => {
      setBuildMode(mode);
      setBuildError("");
    },
    buildError,
    applyCustomGraph,
    shuffle,
    steps,
    step,
    runOperation,
    createEdgeFromDrag,
    positions,
    moveVertex,
    resetLayout,
    hasCustomLayout,
  };
}

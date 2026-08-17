import { useState, useEffect, useCallback, useRef } from "react";
import { GRAPH_OP_MAP } from "../dataStructures/graph";
import { duplicateVertex } from "../dataStructures/graph/duplicateVertex";
import { setEdgeWeight } from "../dataStructures/graph/setEdgeWeight";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";
import {
  parseEdgeList,
  buildGraphFromEdgeList,
  parseAdjacencyList,
  buildGraphFromAdjacencyList,
  parseAdjacencyMatrix,
  buildGraphFromAdjacencyMatrix,
  buildGraphFromLabelsAndEdges,
  graphToAdjacencyText,
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
  // An empty canvas rather than a random graph: the graph view is the one you
  // build yourself, and something already on screen is something to clear
  // before you can start. RANDOM GRAPH is one click away for a graph to play
  // with. A shared link still arrives with its own.
  const [graph, setGraph] = useState(() =>
    init?.vertices ? buildGraphFromLabelsAndEdges(init.vertices, init.edges) : { nodes: [], edges: [] }
  );
  // The matrix leads: it is the representation you can type into, and it shows
  // the pairs that *aren't* connected too, which is most of an empty graph.
  const [representation, setRepresentation] = useState("matrix");
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

  // Which vertex the cursor is over, and where it sits, so Ctrl+C can tell
  // "copy this vertex" from "copy the graph". A ref, not state: nothing on
  // screen depends on it, and hovering shouldn't re-render the view.
  const hoveredRef = useRef(null);
  const setHoveredVertex = useCallback((hovered) => {
    hoveredRef.current = hovered;
  }, []);

  // What the last Ctrl+C put on the clipboard. `text` is kept so a paste can
  // tell our own copy from something copied in another app since.
  const clipboardRef = useRef(null);

  const history = useHistory(
    () => ({ graph, positions, directed, weighted }),
    (doc, message) => {
      setGraph(doc.graph);
      setPositions(doc.positions);
      setDirected(doc.directed);
      setWeighted(doc.weighted);
      setSteps([{ ...doc.graph, message }]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

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

  const runMeta = useCallback(
    (meta, params) => {
      const { steps: newSteps, finalGraph } = meta.run(graph, {
        directed,
        weighted,
        ...params,
      });
      history.record();
      setSteps(newSteps);
      setStepIdx(0);
      setGraph(finalGraph);
      setPlaying(newSteps.length > 1);
      return finalGraph;
    },
    [graph, directed, weighted, history]
  );

  // Takes an operation by key, from the registry the sidebar is built from.
  const runWith = useCallback((opKey, params) => runMeta(GRAPH_OP_MAP[opKey], params), [runMeta]);

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

  // Triple-clicking a vertex on the canvas. The same operation the sidebar's
  // REMOVE VERTEX runs, so the edges go with it and the steps look the same.
  const deleteVertex = useCallback(
    (vertexId) => {
      runWith("removeVertex", { vertex: vertexId });
    },
    [runWith]
  );

  /**
   * Editing a cell of the adjacency matrix. An unweighted graph has no weights
   * to set, so a cell there is only ever 1 or 0 — presence, which is all its
   * matrix means.
   */
  const setWeightAt = useCallback(
    (fromId, toId, value) => {
      const weight = weighted ? value : value === 0 ? 0 : 1;
      runMeta(setEdgeWeight, { fromVertex: fromId, toVertex: toId, weight });
    },
    [runMeta, weighted]
  );

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
  const moveVertex = useCallback(
    (vertexId, nx, ny) => {
      history.record();
      setPositions((prev) => ({ ...prev, [vertexId]: { nx, ny } }));
    },
    [history]
  );

  // Called when the canvas is double-clicked, or held on a phone. The
  // operation names the vertex itself, so the one that wasn't there a moment
  // ago is the one to pin where the canvas was pressed.
  const addVertexAt = useCallback(
    (nx, ny) => {
      const known = new Set(graph.nodes.map((n) => n.id));
      const finalGraph = runWith("addVertex", { vertexLabel: "" });
      const created = finalGraph.nodes.find((n) => !known.has(n.id));
      if (created) setPositions((prev) => ({ ...prev, [created.id]: { nx, ny } }));
    },
    [graph, runWith]
  );

  const resetLayout = useCallback(() => {
    history.record();
    setPositions({});
  }, [history]);

  /**
   * Ctrl+C. What gets copied depends on where the cursor is: over a vertex it
   * is that vertex, over bare canvas it is the whole graph. Either way the
   * text placed on the system clipboard is adjacency-list text the sidebar
   * would accept, so a copy is useful outside the app too.
   */
  const copySelection = useCallback(() => {
    const hovered = hoveredRef.current;
    const node = hovered && graph.nodes.find((n) => n.id === hovered.id);
    if (node) {
      // One adjacency line, the vertex and what it connects to. Listing the
      // rest of the graph as empty lines would be true but say the opposite of
      // what copying a single vertex means.
      const labelById = Object.fromEntries(graph.nodes.map((n) => [n.id, n.label]));
      const neighbours = [];
      graph.edges.forEach((e) => {
        const outgoing = e.from === node.id;
        // An undirected edge counts whichever end the vertex is at.
        if (!outgoing && (directed || e.to !== node.id)) return;
        const other = labelById[outgoing ? e.to : e.from];
        if (!other) return;
        neighbours.push(weighted && e.weight !== 1 ? `${other}(${e.weight})` : other);
      });
      const text = `${node.label}: ${neighbours.join(", ")}`.trimEnd();
      clipboardRef.current = { kind: "vertex", id: node.id, at: hovered, text };
      return text;
    }
    const text = graphToAdjacencyText(graph, weighted);
    clipboardRef.current = { kind: "graph", text };
    return text;
  }, [graph, weighted, directed]);

  /**
   * Ctrl+V. Pasting straight back what we copied from a vertex duplicates that
   * vertex; anything else is treated as graph text and replaces the graph.
   * Comparing the text is what tells the two apart — copying something else in
   * another app in between has to win, or paste would silently ignore it.
   */
  const pasteClipboard = useCallback(
    (text) => {
      const held = clipboardRef.current;
      if (held?.kind === "vertex" && held.text === text) {
        const known = new Set(graph.nodes.map((n) => n.id));
        const finalGraph = runMeta(duplicateVertex, { vertexId: held.id });
        const created = finalGraph.nodes.find((n) => !known.has(n.id));
        // Offset from the original so the copy doesn't land underneath it.
        if (created && held.at) {
          setPositions((prev) => ({
            ...prev,
            [created.id]: {
              nx: Math.min(1, Math.max(0, held.at.nx + 0.07)),
              ny: Math.min(1, Math.max(0, held.at.ny + 0.1)),
            },
          }));
        }
        return true;
      }

      const trimmed = (text || "").trim();
      if (!trimmed) return false;
      // Either of the two text formats the sidebar takes; a colon means the
      // per-vertex adjacency form, which is what a copy from here produces.
      const next = trimmed.includes(":")
        ? buildGraphFromAdjacencyList(parseAdjacencyList(trimmed), directed)
        : buildGraphFromEdgeList(parseEdgeList(trimmed));
      if (!next || next.nodes.length === 0) return false;

      history.record();
      setGraph(next);
      setPositions({});
      setSteps([{ ...next, message: `Pasted a graph of ${next.nodes.length} vertices` }]);
      setStepIdx(0);
      setPlaying(false);
      return true;
    },
    [graph, directed, runMeta, history]
  );

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
    addVertexAt,
    deleteVertex,
    setWeightAt,
    resetLayout,
    hasCustomLayout,
    setHoveredVertex,
    copySelection,
    pasteClipboard,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}

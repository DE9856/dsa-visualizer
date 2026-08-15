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

/**
 * `init` is the setup decoded from a shared link ({ vertices, edges, directed,
 * weighted }) — an explicit vertex and edge order, so the graph comes back
 * laid out exactly as it was shared.
 */
export function useGraph(init) {
  const [graph, setGraph] = useState(() =>
    init?.vertices ? buildGraphFromLabelsAndEdges(init.vertices, init.edges) : randomGraph()
  );
  const [representation, setRepresentation] = useState("list");
  const [directed, setDirected] = useState(init?.directed ?? false);
  const [weighted, setWeighted] = useState(init?.weighted ?? false);

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
    setSteps([{ ...next, message: "Custom graph loaded" }]);
    setStepIdx(0);
    setPlaying(false);
    setCustomInput("");
  }, [customInput, buildMode, directed]);

  const shuffle = useCallback(() => {
    const next = randomGraph();
    setGraph(next);
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
  };
}

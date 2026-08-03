import { useState, useEffect, useRef, useCallback } from "react";
import { GRAPH_OP_MAP } from "../dataStructures/graph";
import {
  parseEdgeList,
  buildGraphFromEdgeList,
  parseAdjacencyList,
  buildGraphFromAdjacencyList,
  parseAdjacencyMatrix,
  buildGraphFromAdjacencyMatrix,
  randomGraph,
} from "../dataStructures/graph/helpers";

const EMPTY_STEP = { nodes: [], edges: [], message: "" };

export function useGraph() {
  const [graph, setGraph] = useState(() => randomGraph());
  const [representation, setRepresentation] = useState("list");
  const [directed, setDirected] = useState(false);
  const [weighted, setWeighted] = useState(false);

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
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);
  const intervalRef = useRef(null);

  const opMeta = GRAPH_OP_MAP[operation];

  useEffect(() => {
    setSteps([{ ...graph, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (playing) {
      const delay = 720 - speed * 6;
      intervalRef.current = setInterval(() => {
        setStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.max(40, delay));
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, steps]);

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

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      const atEnd = stepIdx >= steps.length - 1;
      if (atEnd) {
        setStepIdx(0);
        return true;
      }
      return !p;
    });
  }, [stepIdx, steps.length]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;
  const atEnd = stepIdx >= steps.length - 1;

  return {
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
    stepIdx,
    setStepIdx,
    playing,
    speed,
    setSpeed,
    atEnd,
    runOperation,
    togglePlay,
    createEdgeFromDrag,
  };
}

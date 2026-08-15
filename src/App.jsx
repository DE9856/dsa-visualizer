import { useState } from "react";
import BootScreen from "./components/BootScreen.jsx";
import CategoryLanding from "./components/CategoryLanding.jsx";
import TopBar from "./components/TopBar.jsx";
import Workspace from "./components/Workspace.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Canvas from "./components/Canvas.jsx";
import Controls from "./components/Controls.jsx";
import InfoPanel from "./components/InfoPanel.jsx";
import ListSidebar from "./components/ListSidebar.jsx";
import ListCanvas from "./components/ListCanvas.jsx";
import ListControls from "./components/ListControls.jsx";
import ListInfoPanel from "./components/ListInfoPanel.jsx";
import PolySidebar from "./components/PolySidebar.jsx";
import StackSidebar from "./components/StackSidebar.jsx";
import StackCanvas from "./components/StackCanvas.jsx";
import QueueSidebar from "./components/QueueSidebar.jsx";
import QueueCanvas from "./components/QueueCanvas.jsx";
import GraphSidebar from "./components/GraphSidebar.jsx";
import GraphCanvas from "./components/GraphCanvas.jsx";
import GraphRepresentationPanel from "./components/GraphRepresentationPanel.jsx";
import TreeSidebar from "./components/TreeSidebar.jsx";
import TreeCanvas from "./components/TreeCanvas.jsx";
import TwoThreeTreeSidebar from "./components/TwoThreeTreeSidebar.jsx";
import TwoThreeTreeCanvas from "./components/TwoThreeTreeCanvas.jsx";
import TopicPanel from "./components/TopicPanel.jsx";
import { TOPIC_OVERVIEWS } from "./data/topicOverviews.js";
import { useVisualizer } from "./hooks/useVisualizer.js";
import { useLinkedList } from "./hooks/useLinkedList.js";
import { usePolynomial } from "./hooks/usePolynomial.js";
import { useStack } from "./hooks/useStack.js";
import { useQueue } from "./hooks/useQueue.js";
import { useGraph } from "./hooks/useGraph.js";
import { useTree } from "./hooks/useTree.js";
import { useTwoThreeTree } from "./hooks/useTwoThreeTree.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import { delayForSpeed } from "./hooks/useStepPlayer.js";

export default function App() {
  const [stage, setStage] = useState("boot"); // "boot" | "select" | "app"
  const [view, setView] = useState("sorting");
  const [showHelp, setShowHelp] = useState(false);
  const v = useVisualizer();
  const ll = useLinkedList();
  const poly = usePolynomial();
  const st = useStack();
  const q = useQueue();
  const gr = useGraph();
  const tr = useTree();
  const tt = useTwoThreeTree();

  // The player driving whatever view is on screen — one source for the
  // transport bar, the timeline and the keyboard shortcuts.
  const players = {
    linkedlist: ll,
    polynomial: poly,
    stack: st,
    queue: q,
    graph: gr,
    tree: tr,
    twothree: tt,
  };
  const active = players[view] || v;

  const shuffleActive = () => {
    if (view === "polynomial") poly.randomPolynomial();
    else if (players[view]) players[view].shuffle();
    else v.handleShuffle();
  };

  // Transport props every Controls instance needs, wired to the active view.
  const transport = {
    stepIdx: active.stepIdx,
    steps: active.steps,
    playing: active.playing,
    speed: active.speed,
    setSpeed: active.setSpeed,
    onReset: active.reset,
    onStepBack: active.stepBack,
    onStepForward: active.stepForward,
    onTogglePlay: active.togglePlay,
    onSeek: active.seek,
    showHelp,
    onToggleHelp: () => setShowHelp((s) => !s),
  };

  // What the phone action bar needs — the same player, minus the read-outs
  // that only make sense in the full transport panel.
  const shell = {
    onShuffle: shuffleActive,
    playing: active.playing,
    onTogglePlay: active.togglePlay,
    canPlay: active.steps.length > 1,
    atEnd: active.stepIdx >= active.steps.length - 1,
  };

  useKeyboardShortcuts({
    enabled: stage === "app",
    onTogglePlay: active.togglePlay,
    onStepBack: active.stepBack,
    onStepForward: active.stepForward,
    onReset: active.reset,
    onFirst: () => active.seek(0),
    onLast: () => active.seek(active.steps.length - 1),
    onShuffle: shuffleActive,
    onToggleHelp: () => setShowHelp((s) => !s),
  });

  const handleViewChange = (next) => {
    setView(next);
    if (next === "sorting" || next === "searching") v.switchCategory(next);
    setStage("app");
  };

  if (stage === "boot") {
    return <BootScreen onDone={() => setStage("select")} />;
  }

  if (stage === "select") {
    return <CategoryLanding onSelect={handleViewChange} />;
  }

  // Keep step animations shorter than the gap between steps, otherwise a fast
  // run leaves every element mid-transition and the whole thing looks smeared.
  const stepAnim = Math.round(Math.min(240, delayForSpeed(active.speed) * 0.7));

  return (
    <div className="app" style={{ "--step-anim": `${stepAnim}ms` }}>
      <TopBar category={view} onCategoryChange={handleViewChange} onGoHome={() => setStage("select")} />

      {view === "linkedlist" ? (
        <Workspace
          {...shell}
          panelLabel="LIST OPS"
          sidebar={
            <ListSidebar
              listType={ll.listType}
              onListTypeChange={ll.setListType}
              operation={ll.operation}
              onOperationChange={ll.setOperation}
              opMeta={ll.opMeta}
              valueInput={ll.valueInput}
              setValueInput={ll.setValueInput}
              positionInput={ll.positionInput}
              setPositionInput={ll.setPositionInput}
              secondListInput={ll.secondListInput}
              setSecondListInput={ll.setSecondListInput}
              onRun={ll.runOperation}
              customInput={ll.customInput}
              setCustomInput={ll.setCustomInput}
              onApplyCustom={ll.applyCustomList}
              onShuffle={ll.shuffle}
              listLength={ll.list.length}
            />
          }
        >
          <ListCanvas step={ll.step} listType={ll.listType} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={ll.opMeta} />
          <TopicPanel topic={TOPIC_OVERVIEWS.linkedlist} />
        </Workspace>
      ) : view === "polynomial" ? (
        <Workspace
          {...shell}
          panelLabel="POLYNOMIAL OPS"
          sidebar={
            <PolySidebar
              operation={poly.operation}
              onOperationChange={poly.setOperation}
              opMeta={poly.opMeta}
              polyInput={poly.polyInput}
              setPolyInput={poly.setPolyInput}
              onApplyPolynomial={poly.applyPolynomial}
              onRandomPolynomial={poly.randomPolynomial}
              secondPolyInput={poly.secondPolyInput}
              setSecondPolyInput={poly.setSecondPolyInput}
              xValueInput={poly.xValueInput}
              setXValueInput={poly.setXValueInput}
              onRun={poly.runOperation}
            />
          }
        >
          <ListCanvas
            step={poly.step}
            listType="singly"
            primaryLabel="POLYNOMIAL A"
            secondaryLabel="POLYNOMIAL B"
            secondNodes={poly.showSecondPreview ? poly.secondPreviewNodes : null}
          />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={poly.opMeta} />
          <TopicPanel topic={TOPIC_OVERVIEWS.polynomial} />
        </Workspace>
      ) : view === "stack" ? (
        <Workspace
          {...shell}
          panelLabel="STACK OPS"
          sidebar={
            <StackSidebar
              operation={st.operation}
              onOperationChange={st.setOperation}
              opMeta={st.opMeta}
              valueInput={st.valueInput}
              setValueInput={st.setValueInput}
              onRun={st.runOperation}
              customInput={st.customInput}
              setCustomInput={st.setCustomInput}
              onApplyCustom={st.applyCustomStack}
              onShuffle={st.shuffle}
            />
          }
        >
          <StackCanvas step={st.step} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={st.opMeta} />
          <TopicPanel topic={TOPIC_OVERVIEWS.stack} />
        </Workspace>
      ) : view === "queue" ? (
        <Workspace
          {...shell}
          panelLabel="QUEUE OPS"
          sidebar={
            <QueueSidebar
              operation={q.operation}
              onOperationChange={q.setOperation}
              opMeta={q.opMeta}
              valueInput={q.valueInput}
              setValueInput={q.setValueInput}
              onRun={q.runOperation}
              customInput={q.customInput}
              setCustomInput={q.setCustomInput}
              onApplyCustom={q.applyCustomQueue}
              onShuffle={q.shuffle}
            />
          }
        >
          <QueueCanvas step={q.step} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={q.opMeta} />
          <TopicPanel topic={TOPIC_OVERVIEWS.queue} />
        </Workspace>
      ) : view === "graph" ? (
        <Workspace
          {...shell}
          panelLabel="GRAPH OPS"
          sidebar={
            <GraphSidebar
              nodes={gr.graph.nodes}
              representation={gr.representation}
              onRepresentationChange={gr.setRepresentation}
              directed={gr.directed}
              onDirectedChange={gr.setDirected}
              weighted={gr.weighted}
              onWeightedChange={gr.setWeighted}
              operation={gr.operation}
              onOperationChange={gr.setOperation}
              opMeta={gr.opMeta}
              vertexLabelInput={gr.vertexLabelInput}
              setVertexLabelInput={gr.setVertexLabelInput}
              vertexInput={gr.vertexInput}
              setVertexInput={gr.setVertexInput}
              fromVertexInput={gr.fromVertexInput}
              setFromVertexInput={gr.setFromVertexInput}
              toVertexInput={gr.toVertexInput}
              setToVertexInput={gr.setToVertexInput}
              weightInput={gr.weightInput}
              setWeightInput={gr.setWeightInput}
              onRun={gr.runOperation}
              customInput={gr.customInput}
              setCustomInput={gr.setCustomInput}
              buildMode={gr.buildMode}
              setBuildMode={gr.setBuildMode}
              buildError={gr.buildError}
              onApplyCustom={gr.applyCustomGraph}
              onShuffle={gr.shuffle}
            />
          }
        >
          <GraphCanvas step={gr.step} directed={gr.directed} weighted={gr.weighted} onCreateEdge={gr.createEdgeFromDrag} />
          <GraphRepresentationPanel representation={gr.representation} step={gr.step} directed={gr.directed} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={gr.opMeta} />
          <TopicPanel topic={TOPIC_OVERVIEWS.graph} />
        </Workspace>
      ) : view === "tree" ? (
        <Workspace
          {...shell}
          panelLabel="TREE OPS"
          sidebar={
            <TreeSidebar
              treeType={tr.treeType}
              onTreeTypeChange={tr.setTreeType}
              operation={tr.operation}
              onOperationChange={tr.setOperation}
              opMeta={tr.opMeta}
              valueInput={tr.valueInput}
              setValueInput={tr.setValueInput}
              onRun={tr.runOperation}
              customInput={tr.customInput}
              setCustomInput={tr.setCustomInput}
              onApplyCustom={tr.applyCustomTree}
              onShuffle={tr.shuffle}
            />
          }
        >
          <TreeCanvas step={tr.step} treeType={tr.treeType} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={tr.opMeta} />
          <TopicPanel topic={TOPIC_OVERVIEWS.tree} />
        </Workspace>
      ) : view === "twothree" ? (
        <Workspace
          {...shell}
          panelLabel="2-3 TREE OPS"
          sidebar={
            <TwoThreeTreeSidebar
              operation={tt.operation}
              onOperationChange={tt.setOperation}
              opMeta={tt.opMeta}
              valueInput={tt.valueInput}
              setValueInput={tt.setValueInput}
              onRun={tt.runOperation}
              customInput={tt.customInput}
              setCustomInput={tt.setCustomInput}
              onApplyCustom={tt.applyCustomTree}
              onShuffle={tt.shuffle}
            />
          }
        >
          <TwoThreeTreeCanvas step={tt.step} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={tt.opMeta} />
          <TopicPanel topic={TOPIC_OVERVIEWS.twothree} />
        </Workspace>
      ) : (
        <Workspace
          {...shell}
          panelLabel="ALGORITHMS"
          sidebar={
            <Sidebar
              category={v.category}
              algo={v.algo}
              onAlgoChange={v.switchAlgo}
              size={v.size}
              onSizeChange={v.handleSizeChange}
              onShuffle={v.handleShuffle}
              customInput={v.customInput}
              setCustomInput={v.setCustomInput}
              onApplyCustom={v.applyCustomArray}
              meta={v.meta}
              target={v.target}
              onRandomTarget={v.setRandomTarget}
            />
          }
        >
          <Canvas step={v.step} algo={v.algo} displayArr={v.displayArr} maxVal={v.maxVal} />
          <Controls {...transport} step={v.step} meta={v.meta} />
          <InfoPanel meta={v.meta} step={v.step} />
        </Workspace>
      )}
    </div>
  );
}

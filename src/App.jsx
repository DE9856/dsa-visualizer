import { useState } from "react";
import BootScreen from "./components/BootScreen.jsx";
import CategoryLanding from "./components/CategoryLanding.jsx";
import TopBar from "./components/TopBar.jsx";
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

export default function App() {
  const [stage, setStage] = useState("boot"); // "boot" | "select" | "app"
  const [view, setView] = useState("sorting");
  const v = useVisualizer();
  const ll = useLinkedList();
  const poly = usePolynomial();
  const st = useStack();
  const q = useQueue();
  const gr = useGraph();
  const tr = useTree();
  const tt = useTwoThreeTree();

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

  return (
    <div className="app">
      <TopBar category={view} onCategoryChange={handleViewChange} onGoHome={() => setStage("select")} />

      {view === "linkedlist" ? (
        <div className="layout">
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

<div className="main-col">
  <ListCanvas step={ll.step} listType={ll.listType} />

            <ListControls
              stepIdx={ll.stepIdx}
              steps={ll.steps}
              playing={ll.playing}
              speed={ll.speed}
              setSpeed={ll.setSpeed}
              onReset={() => ll.setStepIdx(0)}
              onStepBack={() => ll.setStepIdx((i) => Math.max(0, i - 1))}
              onStepForward={() => ll.setStepIdx((i) => Math.min(ll.steps.length - 1, i + 1))}
              onTogglePlay={ll.togglePlay}
            />

            <ListInfoPanel opMeta={ll.opMeta} />
            <TopicPanel topic={TOPIC_OVERVIEWS.linkedlist} />
          </div>
        </div>
      ) : view === "polynomial" ? (
        <div className="layout">
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

          <div className="main-col">
            <ListCanvas
  step={poly.step}
  listType="singly"
  primaryLabel="POLYNOMIAL A"
  secondaryLabel="POLYNOMIAL B"
  secondNodes={poly.showSecondPreview ? poly.secondPreviewNodes : null}
/>

            <ListControls
              stepIdx={poly.stepIdx}
              steps={poly.steps}
              playing={poly.playing}
              speed={poly.speed}
              setSpeed={poly.setSpeed}
              onReset={() => poly.setStepIdx(0)}
              onStepBack={() => poly.setStepIdx((i) => Math.max(0, i - 1))}
              onStepForward={() => poly.setStepIdx((i) => Math.min(poly.steps.length - 1, i + 1))}
              onTogglePlay={poly.togglePlay}
            />

            <ListInfoPanel opMeta={poly.opMeta} />
            <TopicPanel topic={TOPIC_OVERVIEWS.polynomial} />
          </div>
        </div>
      ) : view === "stack" ? (
        <div className="layout">
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

          <div className="main-col">
            <StackCanvas step={st.step} />

            <ListControls
              stepIdx={st.stepIdx}
              steps={st.steps}
              playing={st.playing}
              speed={st.speed}
              setSpeed={st.setSpeed}
              onReset={() => st.setStepIdx(0)}
              onStepBack={() => st.setStepIdx((i) => Math.max(0, i - 1))}
              onStepForward={() => st.setStepIdx((i) => Math.min(st.steps.length - 1, i + 1))}
              onTogglePlay={st.togglePlay}
            />

            <ListInfoPanel opMeta={st.opMeta} />
            <TopicPanel topic={TOPIC_OVERVIEWS.stack} />
          </div>
        </div>
      ) : view === "queue" ? (
        <div className="layout">
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

          <div className="main-col">
            <QueueCanvas step={q.step} />

            <ListControls
              stepIdx={q.stepIdx}
              steps={q.steps}
              playing={q.playing}
              speed={q.speed}
              setSpeed={q.setSpeed}
              onReset={() => q.setStepIdx(0)}
              onStepBack={() => q.setStepIdx((i) => Math.max(0, i - 1))}
              onStepForward={() => q.setStepIdx((i) => Math.min(q.steps.length - 1, i + 1))}
              onTogglePlay={q.togglePlay}
            />

            <ListInfoPanel opMeta={q.opMeta} />
            <TopicPanel topic={TOPIC_OVERVIEWS.queue} />
          </div>
        </div>
      ) : view === "graph" ? (
        <div className="layout">
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

          <div className="main-col">
            <GraphCanvas step={gr.step} directed={gr.directed} weighted={gr.weighted} onCreateEdge={gr.createEdgeFromDrag} />

            <GraphRepresentationPanel representation={gr.representation} step={gr.step} directed={gr.directed} />

            <ListControls
              stepIdx={gr.stepIdx}
              steps={gr.steps}
              playing={gr.playing}
              speed={gr.speed}
              setSpeed={gr.setSpeed}
              onReset={() => gr.setStepIdx(0)}
              onStepBack={() => gr.setStepIdx((i) => Math.max(0, i - 1))}
              onStepForward={() => gr.setStepIdx((i) => Math.min(gr.steps.length - 1, i + 1))}
              onTogglePlay={gr.togglePlay}
            />

            <ListInfoPanel opMeta={gr.opMeta} />
            <TopicPanel topic={TOPIC_OVERVIEWS.graph} />
          </div>
        </div>
      ) : view === "tree" ? (
        <div className="layout">
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

          <div className="main-col">
            <TreeCanvas step={tr.step} treeType={tr.treeType} />

            <ListControls
              stepIdx={tr.stepIdx}
              steps={tr.steps}
              playing={tr.playing}
              speed={tr.speed}
              setSpeed={tr.setSpeed}
              onReset={() => tr.setStepIdx(0)}
              onStepBack={() => tr.setStepIdx((i) => Math.max(0, i - 1))}
              onStepForward={() => tr.setStepIdx((i) => Math.min(tr.steps.length - 1, i + 1))}
              onTogglePlay={tr.togglePlay}
            />

            <ListInfoPanel opMeta={tr.opMeta} />
            <TopicPanel topic={TOPIC_OVERVIEWS.tree} />
          </div>
        </div>
      ) : view === "twothree" ? (
        <div className="layout">
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

          <div className="main-col">
            <TwoThreeTreeCanvas step={tt.step} />

            <ListControls
              stepIdx={tt.stepIdx}
              steps={tt.steps}
              playing={tt.playing}
              speed={tt.speed}
              setSpeed={tt.setSpeed}
              onReset={() => tt.setStepIdx(0)}
              onStepBack={() => tt.setStepIdx((i) => Math.max(0, i - 1))}
              onStepForward={() => tt.setStepIdx((i) => Math.min(tt.steps.length - 1, i + 1))}
              onTogglePlay={tt.togglePlay}
            />

            <ListInfoPanel opMeta={tt.opMeta} />
            <TopicPanel topic={TOPIC_OVERVIEWS.twothree} />
          </div>
        </div>
      ) : (
        <div className="layout">
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

          <div className="main-col">
            <Canvas step={v.step} algo={v.algo} displayArr={v.displayArr} maxVal={v.maxVal} />

            <Controls
              stepIdx={v.stepIdx}
              steps={v.steps}
              step={v.step}
              playing={v.playing}
              speed={v.speed}
              setSpeed={v.setSpeed}
              meta={v.meta}
              onReset={() => v.setStepIdx(0)}
              onStepBack={() => v.setStepIdx((i) => Math.max(0, i - 1))}
              onStepForward={() => v.setStepIdx((i) => Math.min(v.steps.length - 1, i + 1))}
              onTogglePlay={v.togglePlay}
            />

            <InfoPanel meta={v.meta} />
          </div>
        </div>
      )}
    </div>
  );
}
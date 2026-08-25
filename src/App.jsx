import { useEffect, useMemo, useState } from "react";
import CategoryLanding from "./components/CategoryLanding.jsx";
import TopBar from "./components/TopBar.jsx";
import Workspace from "./components/Workspace.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Canvas from "./components/Canvas.jsx";
import Controls from "./components/Controls.jsx";
import InfoPanel from "./components/InfoPanel.jsx";
import RaceSidebar from "./components/RaceSidebar.jsx";
import RaceCanvas from "./components/RaceCanvas.jsx";
import Scoreboard from "./components/Scoreboard.jsx";
import ComplexityPanel from "./components/ComplexityPanel.jsx";
import TreeCompareSidebar from "./components/TreeCompareSidebar.jsx";
import TreeCompareCanvas from "./components/TreeCompareCanvas.jsx";
import TreeCompareBoard from "./components/TreeCompareBoard.jsx";
import TreeHeightPanel from "./components/TreeHeightPanel.jsx";
import RecursionPanel from "./components/RecursionPanel.jsx";
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
import HashTableSidebar from "./components/HashTableSidebar.jsx";
import HashTableCanvas from "./components/HashTableCanvas.jsx";
import DynamicHashSidebar from "./components/DynamicHashSidebar.jsx";
import DynamicHashCanvas from "./components/DynamicHashCanvas.jsx";
import HeapSidebar from "./components/HeapSidebar.jsx";
import HeapCanvas from "./components/HeapCanvas.jsx";
import TrieSidebar from "./components/TrieSidebar.jsx";
import TrieCanvas from "./components/TrieCanvas.jsx";
import UnionFindSidebar from "./components/UnionFindSidebar.jsx";
import UnionFindCanvas from "./components/UnionFindCanvas.jsx";
import TopicPanel from "./components/TopicPanel.jsx";
import { useVisualizer } from "./hooks/useVisualizer.js";
import { useRace } from "./hooks/useRace.js";
import { useTreeCompare } from "./hooks/useTreeCompare.js";
import { useLinkedList } from "./hooks/useLinkedList.js";
import { usePolynomial } from "./hooks/usePolynomial.js";
import { useStack } from "./hooks/useStack.js";
import { useQueue } from "./hooks/useQueue.js";
import { useGraph } from "./hooks/useGraph.js";
import { useTree } from "./hooks/useTree.js";
import { useTwoThreeTree } from "./hooks/useTwoThreeTree.js";
import { useHashTable } from "./hooks/useHashTable.js";
import { useDynamicHash } from "./hooks/useDynamicHash.js";
import { useHeap } from "./hooks/useHeap.js";
import { useTrie } from "./hooks/useTrie.js";
import { useUnionFind } from "./hooks/useUnionFind.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import { delayForSpeed } from "./hooks/useStepPlayer.js";
import { readSharedState, shareHashFor, replaceHash, buildShareUrl } from "./utils/urlState.js";

export default function App() {
  // A shared link carries a topic and its data. Read once, on mount: it seeds
  // the hooks below, so it can't be re-read later without remounting.
  const shared = useMemo(() => readSharedState(), []);
  const initFor = (name) => (shared?.view === name ? shared : null);

  const [stage, setStage] = useState(shared ? "app" : "select");
  const [view, setView] = useState(shared?.view ?? "sorting");
  const [showHelp, setShowHelp] = useState(false);
  const v = useVisualizer(initFor("sorting") || initFor("searching"));
  const race = useRace(initFor("race"));
  const tcmp = useTreeCompare(initFor("treecompare"));
  const ll = useLinkedList(initFor("linkedlist"));
  const poly = usePolynomial(initFor("polynomial"));
  const st = useStack(initFor("stack"));
  const q = useQueue(initFor("queue"));
  const gr = useGraph(initFor("graph"));
  const tr = useTree(initFor("tree"));
  const tt = useTwoThreeTree(initFor("twothree"));
  const ht = useHashTable(initFor("hashtable"));
  const dh = useDynamicHash(initFor("dynamichash"));
  const hp = useHeap(initFor("heap"));
  const tri = useTrie(initFor("trie"));
  const uf = useUnionFind(initFor("unionfind"));

  // The player driving whatever view is on screen — one source for the
  // transport bar, the timeline and the keyboard shortcuts.
  const players = {
    race,
    treecompare: tcmp,
    linkedlist: ll,
    polynomial: poly,
    stack: st,
    queue: q,
    graph: gr,
    tree: tr,
    twothree: tt,
    hashtable: ht,
    dynamichash: dh,
    heap: hp,
    trie: tri,
    unionfind: uf,
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

  // The address bar tracks the data on screen, so the link is always ready to
  // copy. Only committed data is encoded — never half-typed sidebar text.
  const shareHash = shareHashFor(view, { v, race, tcmp, ll, poly, st, q, gr, tr, tt, ht, dh, hp, tri, uf });
  const shareUrl = buildShareUrl(shareHash);

  useEffect(() => {
    if (stage === "app") replaceHash(shareHash);
  }, [stage, shareHash]);

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
    // Undo follows whichever view is on screen; each keeps its own history.
    onUndo: active.undo,
    onRedo: active.redo,
    // Only the graph has anything to put on the clipboard so far.
    onCopy: view === "graph" ? gr.copySelection : undefined,
    onPaste: view === "graph" ? gr.pasteClipboard : undefined,
  });

  const handleViewChange = (next) => {
    setView(next);
    if (next === "sorting" || next === "searching") v.switchCategory(next);
    setStage("app");
  };

  if (stage === "select") {
    return <CategoryLanding onSelect={handleViewChange} />;
  }

  // Keep step animations shorter than the gap between steps, otherwise a fast
  // run leaves every element mid-transition and the whole thing looks smeared.
  const stepAnim = Math.round(Math.min(240, delayForSpeed(active.speed) * 0.7));

  return (
    <div className="app" style={{ "--step-anim": `${stepAnim}ms` }}>
      <TopBar
        category={view}
        onCategoryChange={handleViewChange}
        onGoHome={() => setStage("select")}
        shareUrl={shareUrl}
      />

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
          <TopicPanel topicKey="linkedlist" />
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
          <TopicPanel topicKey="polynomial" />
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
          <TopicPanel topicKey="stack" />
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
          <TopicPanel topicKey="queue" />
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
          <GraphCanvas
            step={gr.step}
            directed={gr.directed}
            weighted={gr.weighted}
            onCreateEdge={gr.createEdgeFromDrag}
            positions={gr.positions}
            onMoveVertex={gr.moveVertex}
            onAddVertexAt={gr.addVertexAt}
            onHoverVertex={gr.setHoveredVertex}
            onDeleteVertex={gr.deleteVertex}
          />
          <GraphRepresentationPanel
            representation={gr.representation}
            step={gr.step}
            directed={gr.directed}
            weighted={gr.weighted}
            onSetWeight={gr.setWeightAt}
          />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={gr.opMeta} />
          <TopicPanel topicKey="graph" />
        </Workspace>
      ) : view === "tree" ? (
        <Workspace
          {...shell}
          panelLabel="TREE OPS"
          sidebar={
            <TreeSidebar
              treeType={tr.treeType}
              onTreeTypeChange={tr.setTreeType}
              threadMode={tr.threadMode}
              onThreadModeChange={tr.setThreadMode}
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
          <TreeCanvas step={tr.step} treeType={tr.treeType} threadMode={tr.threadMode} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={tr.opMeta} />
          <TopicPanel topicKey="tree" />
        </Workspace>
      ) : view === "treecompare" ? (
        <Workspace
          {...shell}
          panelLabel="BALANCE & HEIGHT"
          sidebar={
            <TreeCompareSidebar
              order={tcmp.order}
              orderMeta={tcmp.orderMeta}
              onOrderChange={tcmp.setOrder}
              size={tcmp.size}
              onSizeChange={tcmp.handleSizeChange}
              seed={tcmp.seed}
              onShuffle={tcmp.shuffle}
              keys={tcmp.keys}
            />
          }
        >
          <TreeCompareCanvas
            lanes={tcmp.lanes}
            order={tcmp.orderMeta}
            keys={tcmp.keys}
            tick={tcmp.tick}
            shortest={tcmp.shortest}
          />
          <ListControls {...transport} />
          <TreeCompareBoard lanes={tcmp.lanes} shortest={tcmp.shortest} size={tcmp.size} />
          <TreeHeightPanel order={tcmp.order} seed={tcmp.seed} />
          <TopicPanel topicKey="treecompare" />
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
          <TopicPanel topicKey="twothree" />
        </Workspace>
      ) : view === "hashtable" ? (
        <Workspace
          {...shell}
          panelLabel="HASH TABLE OPS"
          sidebar={
            <HashTableSidebar
              strategy={ht.strategy}
              onStrategyChange={ht.setStrategy}
              hashFn={ht.hashFn}
              onHashFnChange={ht.setHashFn}
              operation={ht.operation}
              onOperationChange={ht.setOperation}
              opMeta={ht.opMeta}
              keyInput={ht.keyInput}
              setKeyInput={ht.setKeyInput}
              onRun={ht.runOperation}
              customInput={ht.customInput}
              setCustomInput={ht.setCustomInput}
              onApplyCustom={ht.applyCustomTable}
              onShuffle={ht.shuffle}
            />
          }
        >
          <HashTableCanvas step={ht.step} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={ht.opMeta} />
          <TopicPanel topicKey="hashtable" />
        </Workspace>
      ) : view === "dynamichash" ? (
        <Workspace
          {...shell}
          panelLabel="DYNAMIC HASHING OPS"
          sidebar={
            <DynamicHashSidebar
              kind={dh.kind}
              onKindChange={dh.setKind}
              operation={dh.operation}
              onOperationChange={dh.setOperation}
              opMeta={dh.opMeta}
              keyInput={dh.keyInput}
              setKeyInput={dh.setKeyInput}
              onRun={dh.runOperation}
              customInput={dh.customInput}
              setCustomInput={dh.setCustomInput}
              onApplyCustom={dh.applyCustomTable}
              onShuffle={dh.shuffle}
              onReset={dh.resetTable}
            />
          }
        >
          <DynamicHashCanvas step={dh.step} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={dh.opMeta} />
          <TopicPanel topicKey="dynamichash" />
        </Workspace>
      ) : view === "heap" ? (
        <Workspace
          {...shell}
          panelLabel="HEAP OPS"
          sidebar={
            <HeapSidebar
              kind={hp.kind}
              onKindChange={hp.setKind}
              operation={hp.operation}
              onOperationChange={hp.setOperation}
              opMeta={hp.opMeta}
              valueInput={hp.valueInput}
              setValueInput={hp.setValueInput}
              onRun={hp.runOperation}
              customInput={hp.customInput}
              setCustomInput={hp.setCustomInput}
              onApplyCustom={hp.applyCustomHeap}
              onShuffle={hp.shuffle}
            />
          }
        >
          <HeapCanvas step={hp.step} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={hp.opMeta} />
          <TopicPanel topicKey="heap" />
        </Workspace>
      ) : view === "trie" ? (
        <Workspace
          {...shell}
          panelLabel="TRIE OPS"
          sidebar={
            <TrieSidebar
              operation={tri.operation}
              onOperationChange={tri.setOperation}
              opMeta={tri.opMeta}
              wordInput={tri.wordInput}
              setWordInput={tri.setWordInput}
              onRun={tri.runOperation}
              customInput={tri.customInput}
              setCustomInput={tri.setCustomInput}
              onApplyCustom={tri.applyCustomTrie}
              onShuffle={tri.shuffle}
              wordCount={tri.words.length}
            />
          }
        >
          <TrieCanvas step={tri.step} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={tri.opMeta} />
          <TopicPanel topicKey="trie" />
        </Workspace>
      ) : view === "unionfind" ? (
        <Workspace
          {...shell}
          panelLabel="UNION-FIND OPS"
          sidebar={
            <UnionFindSidebar
              operation={uf.operation}
              onOperationChange={uf.setOperation}
              opMeta={uf.opMeta}
              elementA={uf.elementA}
              setElementA={uf.setElementA}
              elementB={uf.elementB}
              setElementB={uf.setElementB}
              onRun={uf.runOperation}
              customInput={uf.customInput}
              setCustomInput={uf.setCustomInput}
              onApplyCustom={uf.applyCustomUnionFind}
              onShuffle={uf.shuffle}
              elementCount={uf.uf.n}
            />
          }
        >
          <UnionFindCanvas step={uf.step} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={uf.opMeta} />
          <TopicPanel topicKey="unionfind" />
        </Workspace>
      ) : view === "race" ? (
        <Workspace
          {...shell}
          panelLabel="RACE"
          sidebar={
            <RaceSidebar
              raceable={race.raceable}
              algos={race.algos}
              onToggleAlgo={race.toggleAlgo}
              size={race.size}
              onSizeChange={race.handleSizeChange}
              distribution={race.distribution}
              onDistributionChange={race.setDistribution}
              distributionMeta={race.distributionMeta}
              onShuffle={race.shuffle}
              seed={race.seed}
              syncMode={race.syncMode}
              onSyncModeChange={race.setSyncMode}
              showTags={race.showTags}
              onToggleTags={race.toggleTags}
              variants={race.variants}
              onVariantChange={race.setVariant}
            />
          }
        >
          <RaceCanvas
            lanes={race.lanes}
            array={race.array}
            showTags={race.showTags}
            leader={race.leader}
            syncMode={race.syncMode}
            distributionMeta={race.distributionMeta}
          />
          <ListControls {...transport} />
          <Scoreboard lanes={race.lanes} leader={race.leader} />
          <ComplexityPanel
            algos={race.algos}
            variants={race.variants}
            distribution={race.distribution}
            seed={race.seed}
          />
          <TopicPanel topicKey="race" />
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
              distribution={v.distribution}
              distributionMeta={v.distributionMeta}
              onDistributionChange={v.setDistribution}
              variants={v.variants}
              onVariantChange={v.setVariant}
              showTags={v.showTags}
              onToggleTags={v.toggleTags}
            />
          }
        >
          <Canvas
            step={v.step}
            algo={v.algo}
            displayArr={v.displayArr}
            maxVal={v.maxVal}
            showTags={v.showTags}
            meta={v.meta}
          />
          <RecursionPanel step={v.step} size={v.displayArr.length} />
          <Controls {...transport} step={v.step} meta={v.meta} />
          <InfoPanel meta={v.meta} step={v.step} />
        </Workspace>
      )}
    </div>
  );
}

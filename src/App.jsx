import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CategoryLanding from "./components/CategoryLanding.jsx";
import NotFound from "./components/NotFound.jsx";
import TopBar from "./components/TopBar.jsx";
import ExportDialog from "./components/ExportDialog.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { useSonification } from "./hooks/useSonification.js";
import StepTable from "./components/StepTable.jsx";
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
import DistanceMatrixPanel from "./components/DistanceMatrixPanel.jsx";
import GraphCostPanel from "./components/GraphCostPanel.jsx";
import MstComparePanel from "./components/MstComparePanel.jsx";
import TreeSidebar from "./components/TreeSidebar.jsx";
import TreeCanvas from "./components/TreeCanvas.jsx";
import TwoThreeTreeSidebar from "./components/TwoThreeTreeSidebar.jsx";
import MultiwayTreeCanvas from "./components/MultiwayTreeCanvas.jsx";
import HashTableSidebar from "./components/HashTableSidebar.jsx";
import HashTableCanvas from "./components/HashTableCanvas.jsx";
import ProbePanel from "./components/ProbePanel.jsx";
import DynamicHashSidebar from "./components/DynamicHashSidebar.jsx";
import DynamicHashCanvas from "./components/DynamicHashCanvas.jsx";
import HeapSidebar from "./components/HeapSidebar.jsx";
import HeapCanvas from "./components/HeapCanvas.jsx";
import TrieSidebar from "./components/TrieSidebar.jsx";
import TrieCanvas from "./components/TrieCanvas.jsx";
import BTreeSidebar from "./components/BTreeSidebar.jsx";
import HuffmanSidebar from "./components/HuffmanSidebar.jsx";
import HuffmanCanvas from "./components/HuffmanCanvas.jsx";
import RangeQuerySidebar from "./components/RangeQuerySidebar.jsx";
import RangeQueryCanvas from "./components/RangeQueryCanvas.jsx";
import StringSidebar from "./components/StringSidebar.jsx";
import GridCanvas from "./components/GridCanvas.jsx";
import GreedySidebar from "./components/GreedySidebar.jsx";
import BacktrackSidebar from "./components/BacktrackSidebar.jsx";
import BacktrackCanvas from "./components/BacktrackCanvas.jsx";
import SearchTreePanel from "./components/SearchTreePanel.jsx";
import DpSidebar from "./components/DpSidebar.jsx";
import DpCanvas from "./components/DpCanvas.jsx";
import CodeInfoPanel from "./components/CodeInfoPanel.jsx";
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
import { useDp } from "./hooks/useDp.js";
import { useBacktracking } from "./hooks/useBacktracking.js";
import { useStrings } from "./hooks/useStrings.js";
import { useGreedy } from "./hooks/useGreedy.js";
import { useRangeQuery } from "./hooks/useRangeQuery.js";
import { useHuffman } from "./hooks/useHuffman.js";
import { useBTree } from "./hooks/useBTree.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import { delayForSpeed } from "./hooks/useStepPlayer.js";
import { buildStepTable } from "./utils/stepTable.js";
import { readSharedState, unopenableHash, clearHash, shareHashFor, replaceHash, buildShareUrl } from "./utils/urlState.js";

export default function App() {
  // A shared link carries a topic and its data. Read once, on mount: it seeds
  // the hooks below, so it can't be re-read later without remounting.
  const shared = useMemo(() => readSharedState(), []);
  const initFor = (name) => (shared?.view === name ? shared : null);

  // Read on mount for the same reason `shared` is: navigating rewrites the
  // hash, so the link that failed has to be captured before anything else runs.
  // Mutually exclusive with `shared` by construction — a hash either opens
  // something or it doesn't.
  const badHash = useMemo(() => unopenableHash(), []);

  const [stage, setStage] = useState(shared ? "app" : badHash ? "notfound" : "select");
  const [view, setView] = useState(shared?.view ?? "sorting");
  const [showHelp, setShowHelp] = useState(false);
  const appearance = useTheme();
  const sound = useSonification();
  const [exportOpen, setExportOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
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
  const dp = useDp(initFor("dp"));
  const bt = useBacktracking(initFor("bt"));
  const str = useStrings(initFor("str"));
  const rq = useRangeQuery(initFor("rangequery"));
  const hf = useHuffman(initFor("huffman"));
  const btr = useBTree(initFor("btree"));
  const grd = useGreedy(initFor("greedy"));

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
    dp,
    bt,
    str,
    rangequery: rq,
    huffman: hf,
    btree: btr,
    greedy: grd,
  };
  const active = players[view] || v;

  const shuffleActive = () => {
    if (view === "polynomial") poly.randomPolynomial();
    else if (players[view]) players[view].shuffle();
    else v.handleShuffle();
  };

  /**
   * Play, with a count-in. Starting a run from the top plays the array as it
   * stands first — the unsorted scatter — and only then lets the algorithm
   * go, so the sweep at the end has something to be compared against.
   *
   * The count-in only exists when sound is on, so nothing about the transport
   * changes for anyone who hasn't asked to hear it.
   */
  // Pitch is the value, and only the bar views lay values out on a scale for
  // that to mean anything.
  const soundable = view === "sorting" || view === "searching";

  const countIn = useRef(null);
  useEffect(() => () => clearTimeout(countIn.current), []);

  const togglePlayWithIntro = () => {
    // A second press during the count-in cancels it, rather than queueing a
    // second sweep on top of the first.
    if (countIn.current) {
      clearTimeout(countIn.current);
      countIn.current = null;
      return;
    }
    const wantsIntro =
      sound.enabled && soundable && !active.playing && active.stepIdx === 0 && v.steps.length > 1;
    if (!wantsIntro) {
      active.togglePlay();
      return;
    }
    const ms = sound.playSweep(v.step.array ?? v.displayArr, { scale: v.maxVal });
    countIn.current = setTimeout(() => {
      countIn.current = null;
      active.togglePlay();
    }, ms);
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
    onTogglePlay: togglePlayWithIntro,
    onSeek: active.seek,
    showHelp,
    onToggleHelp: () => setShowHelp((s) => !s),
  };

  // Sound is a property of the bars: pitch is the value, and only the sorting
  // and searching views have values laid out on a scale for it to mean
  // anything. The export seeks through every frame in turn, which would fire
  // hundreds of notes, so it stays quiet while the dialog is open.
  const sounded = useRef(-1);
  useEffect(() => {
    if (!sound.enabled || exportOpen || !soundable) return;
    if (sounded.current === v.stepIdx) return;
    sounded.current = v.stepIdx;

    const done = v.stepIdx > 0 && v.stepIdx === v.steps.length - 1;
    // A finished sort is an array that has become a scale, and playing it is
    // the whole argument the sound was making: the same data that went in as
    // a scatter comes out as a run up the keyboard. A search ends on an
    // answer instead, so it keeps its single note.
    if (done && v.meta.category === "sorting") {
      sound.playSweep(v.step.array, { scale: v.maxVal });
      return;
    }
    sound.playStep(v.step, {
      scale: v.maxVal,
      // Kept just inside the gap between steps so a fast run is a run of
      // notes rather than one continuous chord.
      duration: Math.min(0.12, (delayForSpeed(v.speed) / 1000) * 0.85),
      done,
    });
  }, [v.stepIdx, v.step, v.maxVal, v.speed, v.steps.length, v.meta.category, sound, exportOpen, soundable]);

  // The address bar tracks the data on screen, so the link is always ready to
  // copy. Only committed data is encoded — never half-typed sidebar text.
  const shareHash = shareHashFor(view, { v, race, tcmp, ll, poly, st, q, gr, tr, tt, ht, dh, hp, tri, uf, dp, bt, str, rq, hf, btr, grd });
  const shareUrl = buildShareUrl(shareHash);

  // What the phone action bar needs — the same player, minus the read-outs
  // that only make sense in the full transport panel.
  const shell = {
    shareUrl,
    onExport: () => setExportOpen(true),
    onShuffle: shuffleActive,
    playing: active.playing,
    onTogglePlay: togglePlayWithIntro,
    canPlay: active.steps.length > 1,
    atEnd: active.stepIdx >= active.steps.length - 1,
  };

  useEffect(() => {
    if (stage === "app") replaceHash(shareHash);
  }, [stage, shareHash]);

  // Every view exposes the thing it is currently explaining under one of two
  // names: an algorithm's `meta` or a structure operation's `opMeta`.
  const codeMeta = active.meta ?? active.opMeta ?? null;

  // A thousand rows is real work, so the table is only built once something
  // is actually going to read it.
  const exportTable = useMemo(() => {
    if (!exportOpen && !printing) return null;
    const time = codeMeta?.time;
    const complexity = !time
      ? ""
      : typeof time === "string"
        ? `Time ${time} · Space ${codeMeta.space}`
        : `Best ${time.best} · Avg ${time.avg} · Worst ${time.worst} · Space ${codeMeta.space}`;
    return buildStepTable({
      steps: active.steps,
      pseudocode: codeMeta?.pseudocode ?? [],
      title: codeMeta?.label ?? "Run",
      // The link that rebuilds this exact run is the most useful thing a
      // printout can carry: the paper stops being a dead end.
      subtitle: shareUrl,
      complexity,
    });
  }, [exportOpen, printing, active.steps, codeMeta, shareUrl]);

  // Printing needs the table in the document first, so print() is deferred
  // out of the render that mounts it. A timeout rather than a rAF: animation
  // frames never fire in a hidden or heavily throttled tab, and a print that
  // silently never opens is a worse failure than one that opens a frame
  // early. An effect already runs after the commit, so the table is in the
  // DOM by this point, which is all print() needs.
  useEffect(() => {
    if (!printing) return undefined;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    const id = setTimeout(() => window.print(), 0);
    return () => {
      window.removeEventListener("afterprint", done);
      clearTimeout(id);
    };
  }, [printing]);

  useKeyboardShortcuts({
    enabled: stage === "app",
    onTogglePlay: togglePlayWithIntro,
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

  // The DP and backtracking problems are listed individually on the landing
  // page and in the topic menu, as "dp:lcs" and "bt:queens", because the
  // family name on its own says nothing about what is in there. Each is one
  // view with several problems underneath, so the prefix is split off here and
  // the rest is handed to the hook.
  const problemSetters = { dp: dp.setProblem, bt: bt.setProblem, str: str.setAlgo, greedy: grd.setAlgo };

  const handleViewChange = (next) => {
    const [name, problem] = next.split(":");
    setView(name);
    if (problem && problemSetters[name]) problemSetters[name](problem);
    if (name === "sorting" || name === "searching") v.switchCategory(name);
    setStage("app");
  };

  if (stage === "notfound") {
    return (
      <NotFound
        requested={badHash}
        appearance={appearance}
        onHome={() => {
          // The dead link goes with it: left in the address bar, a reload or a
          // return to the tab would land straight back here.
          clearHash();
          setStage("select");
        }}
      />
    );
  }

  if (stage === "select") {
    return <CategoryLanding onSelect={handleViewChange} appearance={appearance} />;
  }

  // Keep step animations shorter than the gap between steps, otherwise a fast
  // run leaves every element mid-transition and the whole thing looks smeared.
  const stepAnim = Math.round(Math.min(240, delayForSpeed(active.speed) * 0.7));

  return (
    <div className="app" style={{ "--step-anim": `${stepAnim}ms` }}>
      <TopBar
        category={
          view === "dp"
            ? `dp:${dp.problem}`
            : view === "bt"
              ? `bt:${bt.problem}`
              : view === "str"
                ? `str:${str.algo}`
                : view === "greedy"
                  ? `greedy:${grd.algo}`
                  : view
        }
        onCategoryChange={handleViewChange}
        onGoHome={() => setStage("select")}
        shareUrl={shareUrl}
        onExport={() => setExportOpen(true)}
        appearance={appearance}
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
          {/* All-pairs distances, for the one operation that produces them.
              The panel renders nothing when a frame carries no matrix. */}
          <DistanceMatrixPanel distanceMatrix={gr.step.distanceMatrix} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={gr.opMeta} />
          <GraphCostPanel graph={gr.graph} directed={gr.directed} />
          <MstComparePanel graph={gr.graph} directed={gr.directed} startId={gr.vertexInput} />
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
          <MultiwayTreeCanvas step={tt.step} />
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
          <ProbePanel hashFn={ht.hashFn} />
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
      ) : view === "dp" ? (
        <Workspace
          {...shell}
          panelLabel="DP PROBLEMS"
          sidebar={
            <DpSidebar
              problem={dp.problem}
              onProblemChange={dp.setProblem}
              meta={dp.meta}
              inputs={dp.inputs}
              onInputChange={dp.setInput}
              onRun={dp.runOperation}
              onRandom={dp.shuffle}
              error={dp.error}
            />
          }
        >
          <DpCanvas step={dp.step} />
          <ListControls {...transport} />
          <CodeInfoPanel meta={dp.meta} step={dp.step} codeLabel="RECURRENCE" />
          <TopicPanel topicKey="dp" />
        </Workspace>
      ) : view === "btree" ? (
        <Workspace
          {...shell}
          panelLabel="B-TREE OPS"
          sidebar={
            <BTreeSidebar
              operation={btr.operation}
              onOperationChange={btr.setOperation}
              opMeta={btr.opMeta}
              order={btr.order}
              onOrderChange={btr.setOrder}
              variant={btr.variant}
              onVariantChange={btr.setVariant}
              valueInput={btr.valueInput}
              setValueInput={btr.setValueInput}
              onRun={btr.runOperation}
              customInput={btr.customInput}
              setCustomInput={btr.setCustomInput}
              onApplyCustom={btr.applyCustom}
              onShuffle={btr.shuffle}
            />
          }
        >
          <MultiwayTreeCanvas step={btr.step} />
          <ListControls {...transport} />
          <ListInfoPanel opMeta={btr.opMeta} />
          <TopicPanel topicKey="btree" />
        </Workspace>
      ) : view === "huffman" ? (
        <Workspace
          {...shell}
          panelLabel="HUFFMAN"
          sidebar={
            <HuffmanSidebar
              text={hf.text}
              onTextChange={hf.setText}
              onRun={hf.runOperation}
              onRandom={hf.shuffle}
              error={hf.error}
            />
          }
        >
          <HuffmanCanvas step={hf.step} />
          <ListControls {...transport} />
          <CodeInfoPanel meta={hf.meta} step={hf.step} codeLabel="THE ALGORITHM" />
          <TopicPanel topicKey="huffman" />
        </Workspace>
      ) : view === "rangequery" ? (
        <Workspace
          {...shell}
          panelLabel="RANGE QUERIES"
          sidebar={
            <RangeQuerySidebar
              kind={rq.kind}
              onKindChange={rq.setKind}
              combine={rq.combine}
              onCombineChange={rq.setCombine}
              operation={rq.operation}
              onOperationChange={rq.setOperation}
              opMeta={rq.opMeta}
              indexInput={rq.indexInput}
              setIndexInput={rq.setIndexInput}
              valueInput={rq.valueInput}
              setValueInput={rq.setValueInput}
              fromInput={rq.fromInput}
              setFromInput={rq.setFromInput}
              toInput={rq.toInput}
              setToInput={rq.setToInput}
              onRun={rq.runOperation}
              customInput={rq.customInput}
              setCustomInput={rq.setCustomInput}
              onApplyCustom={rq.applyCustom}
              onShuffle={rq.shuffle}
              n={rq.values.length}
            />
          }
        >
          <RangeQueryCanvas step={rq.step} />
          <ListControls {...transport} />
          <CodeInfoPanel
            meta={{ ...rq.opMeta, pseudocode: rq.opMeta.code[rq.kind] }}
            step={rq.step}
            codeLabel={rq.kind === "fenwick" ? "FENWICK" : "SEGMENT TREE"}
          />
          <TopicPanel topicKey="rangequery" />
        </Workspace>
      ) : view === "str" ? (
        <Workspace
          {...shell}
          panelLabel="STRING ALGORITHMS"
          sidebar={
            <StringSidebar
              algo={str.algo}
              onAlgoChange={str.setAlgo}
              meta={str.meta}
              inputs={str.inputs}
              onInputChange={str.setInput}
              onRun={str.runOperation}
              onRandom={str.shuffle}
              error={str.error}
            />
          }
        >
          <GridCanvas step={str.step} />
          <ListControls {...transport} />
          <CodeInfoPanel meta={str.meta} step={str.step} codeLabel="THE ALGORITHM" />
          <TopicPanel topicKey="strings" />
        </Workspace>
      ) : view === "greedy" ? (
        <Workspace
          {...shell}
          panelLabel="GREEDY & MATH"
          sidebar={
            <GreedySidebar
              algo={grd.algo}
              onAlgoChange={grd.setAlgo}
              meta={grd.meta}
              inputs={grd.inputs}
              onInputChange={grd.setInput}
              onRun={grd.runOperation}
              onRandom={grd.shuffle}
              error={grd.error}
            />
          }
        >
          <GridCanvas step={grd.step} />
          <ListControls {...transport} />
          <CodeInfoPanel meta={grd.meta} step={grd.step} codeLabel="THE ALGORITHM" />
          <TopicPanel topicKey="greedy" />
        </Workspace>
      ) : view === "bt" ? (
        <Workspace
          {...shell}
          panelLabel="BACKTRACKING"
          sidebar={
            <BacktrackSidebar
              problem={bt.problem}
              onProblemChange={bt.setProblem}
              meta={bt.meta}
              inputs={bt.inputs}
              onInputChange={bt.setInput}
              onRun={bt.runOperation}
              onRandom={bt.shuffle}
              error={bt.error}
            />
          }
        >
          <BacktrackCanvas step={bt.step} />
          <SearchTreePanel step={bt.step} />
          <ListControls {...transport} />
          <CodeInfoPanel meta={bt.meta} step={bt.step} codeLabel="THE SEARCH" />
          <TopicPanel topicKey="backtracking" />
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
            baseArray={v.baseArray}
            onEdit={v.editArray}
            onEditBegin={v.reset}
          />
          <RecursionPanel step={v.step} size={v.displayArr.length} />
          <Controls {...transport} step={v.step} meta={v.meta} sound={sound} />
          <InfoPanel meta={v.meta} step={v.step} />
        </Workspace>
      )}

      {exportOpen && exportTable && (
        <ExportDialog
          steps={active.steps}
          stepIdx={active.stepIdx}
          seek={active.seek}
          slug={`dsa-${view}-${codeMeta?.key ?? "run"}`}
          table={exportTable}
          onPrint={() => {
            setExportOpen(false);
            setPrinting(true);
          }}
          onClose={() => setExportOpen(false)}
        />
      )}

      {/* Portalled to <body> deliberately. Printing hides `.app` wholesale so
          that a cancelled print leaves the run exactly as it was, and a table
          rendered inside it would be hidden along with everything else — the
          page came out blank. */}
      {printing &&
        exportTable &&
        createPortal(<StepTable table={exportTable} />, document.body)}
    </div>
  );
}

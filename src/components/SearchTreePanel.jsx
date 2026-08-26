import { useEffect, useMemo, useRef } from "react";

/**
 * The state space tree.
 *
 * Every path from the root to a node is one partial solution, and the tree of
 * all of them is the space the search moves through. Backtracking is then
 * describable in one sentence: walk this tree depth-first, and whenever the
 * bounding function proves a node cannot lead to an answer, do not generate its
 * children at all. The nodes that are missing are the point — which is why the
 * tree has to be drawn with its edges, rather than as a list of nodes per
 * depth. Without edges you can see that eighteen nodes at depth 3 were
 * rejected; with them you can see that they were all the children of one
 * choice, and that rejecting it removed a whole subtree.
 *
 * `RecursionPanel` draws the divide-and-conquer sorts' recursion instead, where
 * a call owns a contiguous `[lo, hi]` slice and is drawn as a segment on the
 * bars' own horizontal scale. That works because containment there is an
 * interval relationship. Here a node owns no interval — its children are
 * enumerated choices — so the parent/child edges have to be drawn.
 *
 * Two things make this cheap enough to redraw on every frame:
 *
 *   The layout is computed once per run, from the whole finished tree, and
 *   memoized on the shared `calls` array. Nodes therefore never move as the
 *   search proceeds; they appear in place. Laying out only what exists so far
 *   would make the whole picture shuffle sideways on every step.
 *
 *   Nodes are batched into one <path> per state rather than one element each.
 *   A 7-queens search over every solution is 3,585 nodes, and 3,585 React
 *   elements per frame is not a thing worth doing when six path strings say
 *   the same thing.
 */

// Classical terminology, because that is what this diagram is called and the
// names carry the ideas. A live node has been generated but not finished; the
// E-node is the live node currently being expanded; a dead node will not be
// expanded again, either because the bounding function killed it or because
// all of its children have been tried.
const LEGEND = [
  { key: "enode", label: "E-node (expanding now)" },
  { key: "live", label: "live (on the path, unfinished)" },
  { key: "pruned", label: "killed by the bounding function" },
  { key: "dead", label: "dead end (every child failed)" },
  { key: "solution", label: "answer node" },
];

/**
 * Assigns every node an x position, in slot units.
 *
 * One slot per leaf, and an internal node sits over the middle of the slots
 * its subtree occupies — the standard tidy-tree layout, done in two linear
 * passes rather than recursively. Both passes rely on a parent always having a
 * smaller id than its children, which holds because a node is created when it
 * is first entered.
 */
function layoutTree(calls) {
  const n = calls.length;
  const kids = Array.from({ length: n }, () => []);
  let root = 0;
  calls.forEach((c) => {
    if (c.parent === null || c.parent === undefined) root = c.id;
    else kids[c.parent].push(c.id);
  });

  // Bottom-up: how many leaves each subtree ends in, which is how much
  // horizontal room it needs.
  const leaves = new Array(n).fill(1);
  for (let i = n - 1; i >= 0; i--) {
    if (kids[i].length) leaves[i] = kids[i].reduce((sum, c) => sum + leaves[c], 0);
  }

  // Top-down: hand each child its slice of the parent's range.
  const start = new Array(n).fill(0);
  const cx = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let at = start[i];
    for (const c of kids[i]) {
      start[c] = at;
      at += leaves[c];
    }
    cx[i] = start[i] + leaves[i] / 2;
  }

  const maxDepth = calls.reduce((m, c) => Math.max(m, c.depth), 0);
  return { cx, total: leaves[root] || 1, maxDepth, root };
}

export default function SearchTreePanel({ step }) {
  const scrollRef = useRef(null);
  const gutterRef = useRef(null);
  const calls = step?.calls;

  // Keyed on the array identity, which is shared by every frame of one run and
  // replaced when a new search starts.
  const layout = useMemo(() => (calls && calls.length ? layoutTree(calls) : null), [calls]);

  const geometry = useMemo(() => {
    if (!layout) return null;
    const { total, maxDepth } = layout;
    // A 4-leaf tree and a 764-leaf tree are both normal here, so the slot
    // width has to follow: labels while they fit, dots once they don't.
    const slot = total > 400 ? 6 : total > 150 ? 10 : total > 60 ? 18 : total > 24 ? 30 : 46;
    const row = maxDepth > 16 ? 20 : maxDepth > 10 ? 26 : 34;
    return {
      slot,
      row,
      width: total * slot,
      height: (maxDepth + 1) * row,
      box: Math.min(slot - 2, 24),
      boxH: Math.min(row - 10, 16),
      labels: slot >= 30,
    };
  }, [layout]);

  const seq = step?.seq ?? 0;
  const activeId = step?.callId;

  /**
   * The depth gutter sits over the scroll box rather than inside it, so that a
   * tree thousands of pixels wide scrolls under numbers that stay put. That
   * costs it the vertical scrolling it *should* follow — a sudoku is thirty
   * rows deep — so the two are synced by hand here. Programmatic scrolling
   * fires this too, which is what keeps the auto-scroll below in step.
   */
  const syncGutter = () => {
    const el = scrollRef.current;
    if (el && gutterRef.current) gutterRef.current.style.transform = `translateY(${-el.scrollTop}px)`;
  };

  // Scroll the E-node into view rather than the element — the tree is one SVG,
  // so there is no element to call scrollIntoView on.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !layout || !geometry || activeId === null || activeId === undefined) return;
    const x = layout.cx[activeId] * geometry.slot;
    const y = (calls[activeId]?.depth ?? 0) * geometry.row;
    const padX = el.clientWidth / 2;
    if (x < el.scrollLeft + 40 || x > el.scrollLeft + el.clientWidth - 40) {
      el.scrollLeft = Math.max(0, x - padX);
    }
    if (y < el.scrollTop || y > el.scrollTop + el.clientHeight - geometry.row) {
      el.scrollTop = Math.max(0, y - el.clientHeight / 2);
    }
    if (gutterRef.current) gutterRef.current.style.transform = `translateY(${-el.scrollTop}px)`;
  }, [activeId, seq, layout, geometry, calls]);

  if (!calls || !calls.length || !layout || !geometry) return null;

  const { cx } = layout;
  const { slot, row, width, height, box, boxH, labels } = geometry;
  const px = (id) => cx[id] * slot;
  const py = (depth) => depth * row + row / 2;

  // The live call stack: the E-node and every ancestor still waiting on it.
  // This chain *is* the partial solution, which is the whole idea of the
  // diagram — a node is not a step, it is a state.
  const stack = [];
  for (let node = calls[activeId]; node; node = node.parent === null ? null : calls[node.parent]) {
    stack.unshift(node);
  }
  const onStack = new Set(stack.map((c) => c.id));

  const stateOf = (call) => {
    if (call.closedAt !== null && call.closedAt <= seq) return call.result;
    if (call.id === activeId) return "enode";
    return onStack.has(call.id) ? "live" : "open";
  };

  // One path string per state instead of one element per node.
  const buckets = { open: "", live: "", pruned: "", dead: "", solution: "", enode: "" };
  let edges = "";
  let stackEdges = "";
  const texts = [];

  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    if (call.openedAt > seq) continue;

    const x = px(call.id);
    const y = py(call.depth);

    if (call.parent !== null && call.parent !== undefined) {
      const parent = calls[call.parent];
      const y1 = py(parent.depth) + boxH / 2;
      const y2 = y - boxH / 2;
      // Elbows, not straight lines. A node with a wide subtree sits far from
      // its children horizontally but only one row above them, so a direct
      // line comes out nearly horizontal and reads as a sibling link rather
      // than a parent one. Dropping first and turning once keeps the
      // hierarchy legible however wide the tree gets.
      const mid = (y1 + y2) / 2;
      const seg = `M${px(parent.id).toFixed(1)} ${y1.toFixed(1)}V${mid.toFixed(1)}H${x.toFixed(1)}V${y2.toFixed(
        1
      )}`;
      if (onStack.has(call.id) && onStack.has(parent.id)) stackEdges += seg;
      else edges += seg;
    }

    const state = stateOf(call);
    const w = state === "enode" ? box + 2 : box;
    const h = state === "enode" ? boxH + 2 : boxH;
    buckets[state] += `M${(x - w / 2).toFixed(1)} ${(y - h / 2).toFixed(1)}h${w.toFixed(1)}v${h.toFixed(1)}h${(
      -w
    ).toFixed(1)}z`;

    if (labels) texts.push({ id: call.id, x, y, label: call.label, state });
  }

  const stats = step.stats || {};

  return (
    <div className="panel recursion tree-panel">
      <div className="recursion__head">
        <span className="canvas__note">STATE SPACE TREE</span>
        <span className="lcd">
          DEPTH <strong>{step.depth ?? 0}</strong> · NODES <strong>{stats.nodes ?? 0}</strong> · PRUNED{" "}
          <strong>{stats.pruned ?? 0}</strong> · BACKTRACKS <strong>{stats.backtracks ?? 0}</strong> ·
          SOLUTIONS <strong>{stats.solutions ?? 0}</strong>
        </span>
      </div>

      <div className="tree-panel__body">
        {/* Fixed while the tree scrolls under it, so depth stays readable on a
            tree several thousand pixels wide. */}
        <div className="tree-panel__gutter" aria-hidden="true" ref={gutterRef}>
          {Array.from({ length: layout.maxDepth + 1 }, (_, d) => (
            <span key={d} className="tree-panel__depth mono" style={{ height: row, lineHeight: `${row}px` }}>
              {d}
            </span>
          ))}
        </div>

        <div className="tree-panel__scroll" ref={scrollRef} onScroll={syncGutter}>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`State space tree, ${stats.nodes ?? 0} nodes, depth ${layout.maxDepth}`}
          >
            <path d={edges} className="tree-edge" />
            <path d={stackEdges} className="tree-edge tree-edge--stack" />
            {Object.entries(buckets).map(([state, d]) =>
              d ? <path key={state} d={d} className={`tree-rect tree-rect--${state}`} /> : null
            )}
            {texts.map((t) => (
              <text key={t.id} x={t.x} y={t.y + 3} className={`tree-label tree-label--${t.state}`} textAnchor="middle">
                {t.label}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* The root-to-E-node path, spelled out: this is the partial solution the
          board above is showing. */}
      <div className="tree-panel__path">
        <span className="label label--tight">PATH FROM ROOT</span>
        <span className="mono tree-path">
          {stack.length
            ? stack.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && <span className="tree-path__arrow"> → </span>}
                  <span className={i === stack.length - 1 ? "tree-path__node is-enode" : "tree-path__node"}>
                    {c.label}
                  </span>
                </span>
              ))
            : "—"}
        </span>
      </div>

      <div className="tree-panel__key">
        {LEGEND.map((item) => (
          <span className="tree-key" key={item.key}>
            <i className={`tree-key__dot is-${item.key}`} /> {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

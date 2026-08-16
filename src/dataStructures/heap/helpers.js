import { nextId } from "../linkedList/nodeId";

/**
 * A binary heap, stored the way heaps are actually stored: one flat array, no
 * pointers. The tree on the canvas is drawn *from* that array — index i's
 * children live at 2i+1 and 2i+2 — which is the whole trick worth showing.
 *
 *   heap = { kind: "max" | "min", nodes: [{ id, value }, ...] }
 *
 * Entries keep a stable `id` across swaps so the canvas can animate a value
 * moving between positions instead of redrawing the level from scratch.
 */

export const HEAP_KINDS = [
  { key: "max", label: "Max Heap", short: "MAX HEAP", root: "largest", rule: "every parent ≥ its children" },
  { key: "min", label: "Min Heap", short: "MIN HEAP", root: "smallest", rule: "every parent ≤ its children" },
];

export const KIND_MAP = Object.fromEntries(HEAP_KINDS.map((k) => [k.key, k]));

// Five full levels. A heap has no real capacity — this is the point past
// which the tree stops being readable, and the operations say so rather than
// silently drawing off the edge of the canvas.
export const MAX_NODES = 31;

export const parentOf = (i) => (i - 1) >> 1;
export const leftOf = (i) => 2 * i + 1;
export const rightOf = (i) => 2 * i + 2;

/** Depth of index i (root = 0), by integer math rather than Math.log2. */
export const depthOf = (i) => 31 - Math.clz32(i + 1);

/** Height in edges: the depth of the last index. */
export const heightOf = (count) => (count === 0 ? -1 : depthOf(count - 1));

/** Does `a` belong above `b`? Max heaps want the larger value up top. */
export const precedes = (a, b, kind) => (kind === "max" ? a > b : a < b);

export const emptyHeap = (kind) => ({ kind, nodes: [] });

export const cloneHeap = (heap) => ({ ...heap, nodes: [...heap.nodes] });

export const heapValues = (heap) => heap.nodes.map((n) => n.value);

/** A step frame: the whole heap, plus whatever this step is highlighting. */
export const frame = (heap, extra) => ({ kind: heap.kind, nodes: [...heap.nodes], ...extra });

const swapAt = (heap, i, j) => {
  const tmp = heap.nodes[i];
  heap.nodes[i] = heap.nodes[j];
  heap.nodes[j] = tmp;
};

// ---------------------------------------------------------------------
// the two movements every heap operation is built from
// ---------------------------------------------------------------------

/**
 * Walks a value up toward the root until its parent outranks it — what an
 * insert does. Mutates `heap` and pushes a frame per comparison and per swap.
 * Returns where the value came to rest.
 */
export function siftUpWithSteps(heap, index, steps, base = {}) {
  let i = index;
  const path = [i];

  while (i > 0) {
    const p = parentOf(i);
    const child = heap.nodes[i].value;
    const parent = heap.nodes[p].value;
    path.push(p);

    steps.push(
      frame(heap, {
        ...base,
        compare: [i, p],
        path: [...path],
        message: `Compare ${child} with its parent ${parent}`,
      })
    );

    if (!precedes(child, parent, heap.kind)) {
      steps.push(
        frame(heap, {
          ...base,
          current: i,
          path: [...path],
          message: `${parent} ${heap.kind === "max" ? "≥" : "≤"} ${child} — the heap property holds, ${child} stays at index ${i}`,
        })
      );
      return i;
    }

    swapAt(heap, i, p);
    steps.push(
      frame(heap, {
        ...base,
        swap: [i, p],
        path: [...path],
        message: `${child} outranks ${parent} — swap, and ${child} moves up to index ${p}`,
      })
    );
    i = p;
  }

  steps.push(
    frame(heap, {
      ...base,
      current: 0,
      path: [...path],
      message: `${heap.nodes[0].value} reached the root — nothing above it to compare against`,
    })
  );
  return 0;
}

/**
 * Walks a value down until both children fall below it — what an extract does,
 * and what building a heap does at every internal node. `size` bounds the live
 * part of the array.
 */
export function siftDownWithSteps(heap, index, steps, base = {}, size = heap.nodes.length) {
  let i = index;
  const path = [i];

  for (;;) {
    const l = leftOf(i);
    const r = rightOf(i);
    let best = i;

    if (l >= size) {
      steps.push(
        frame(heap, {
          ...base,
          current: i,
          path: [...path],
          message: `Index ${i} is a leaf — nothing below it, so ${heap.nodes[i].value} is where it belongs`,
        })
      );
      return i;
    }

    steps.push(
      frame(heap, {
        ...base,
        compare: [best, l],
        path: [...path],
        message: `Compare ${heap.nodes[i].value} with its left child ${heap.nodes[l].value}`,
      })
    );
    if (precedes(heap.nodes[l].value, heap.nodes[best].value, heap.kind)) best = l;

    if (r < size) {
      steps.push(
        frame(heap, {
          ...base,
          compare: [best, r],
          path: [...path],
          message: `Compare ${heap.nodes[best].value} with the right child ${heap.nodes[r].value}`,
        })
      );
      if (precedes(heap.nodes[r].value, heap.nodes[best].value, heap.kind)) best = r;
    }

    if (best === i) {
      steps.push(
        frame(heap, {
          ...base,
          current: i,
          path: [...path],
          message: `${heap.nodes[i].value} already outranks both children — it stays at index ${i}`,
        })
      );
      return i;
    }

    const moving = heap.nodes[best].value;
    const sinking = heap.nodes[i].value;
    swapAt(heap, i, best);
    path.push(best);
    steps.push(
      frame(heap, {
        ...base,
        swap: [i, best],
        path: [...path],
        message: `${moving} outranks ${sinking} — swap, and ${sinking} sinks to index ${best}`,
      })
    );
    i = best;
  }
}

// ---------------------------------------------------------------------
// silent building — shared links, shuffles, switching max/min
// ---------------------------------------------------------------------

/** The values as they arrive, before any heapifying — what Build Heap takes. */
export function rawHeap(values, kind) {
  return { kind, nodes: values.slice(0, MAX_NODES).map((value) => ({ id: nextId(), value })) };
}

export function randomValues() {
  const count = 6 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10);
}

/** Bottom-up heapify with no frames. */
export function buildHeapSilent(values, kind) {
  const heap = rawHeap(values, kind);
  const n = heap.nodes.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    let j = i;
    for (;;) {
      const l = leftOf(j);
      const r = rightOf(j);
      let best = j;
      if (l < n && precedes(heap.nodes[l].value, heap.nodes[best].value, kind)) best = l;
      if (r < n && precedes(heap.nodes[r].value, heap.nodes[best].value, kind)) best = r;
      if (best === j) break;
      swapAt(heap, j, best);
      j = best;
    }
  }
  return heap;
}

export function randomHeap(kind) {
  return buildHeapSilent(randomValues(), kind);
}

/** Parses the custom-values box; duplicates are fine, heaps allow them. */
export function parseHeapValues(input, limit = MAX_NODES) {
  return input
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
    .slice(0, limit);
}

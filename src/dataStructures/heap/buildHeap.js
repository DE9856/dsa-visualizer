import { cloneHeap, frame, KIND_MAP, siftDownWithSteps } from "./helpers";

/**
 * Bottom-up heapify. Also what the hook runs when you load new values or flip
 * between max and min, so the array is always seen becoming a heap rather than
 * arriving as one.
 */
export const buildHeap = {
  key: "build",
  label: "Build Heap",
  group: "build",
  fields: [],
  desc: "Turns an arbitrary array into a heap by sifting down every internal node, starting from the last one and working back to the root. Going bottom-up matters: by the time a node is processed both of its subtrees are already heaps, so one sift down is enough. It also makes the whole build O(n) rather than O(n log n) — half the nodes are leaves that never move, a quarter can sink at most one level, and only the root can travel the full height. Inserting n values one at a time really does cost O(n log n).",
  time: "O(n)",
  space: "O(1)",
  run(heap) {
    const next = cloneHeap(heap);
    const n = next.nodes.length;
    const kind = KIND_MAP[next.kind];
    const steps = [];

    if (n === 0) {
      return { steps: [frame(next, { message: "Nothing to build — the heap is empty" })], finalHeap: next };
    }

    if (n === 1) {
      return {
        steps: [frame(next, { current: 0, message: "A single value is already a heap" })],
        finalHeap: next,
      };
    }

    const firstLeaf = Math.floor(n / 2);
    const heapified = [];
    for (let i = firstLeaf; i < n; i++) heapified.push(i);

    steps.push(
      frame(next, {
        heapified: [...heapified],
        message: `Indices ${firstLeaf}–${n - 1} are leaves — a single node is a heap on its own, so only the ${firstLeaf} internal node${firstLeaf === 1 ? "" : "s"} can be out of place`,
      })
    );

    const swapsBefore = steps.length;

    for (let i = firstLeaf - 1; i >= 0; i--) {
      steps.push(
        frame(next, {
          current: i,
          heapified: [...heapified],
          message: `Sift down index ${i} (${next.nodes[i].value}) — both subtrees below it are already heaps`,
        })
      );
      siftDownWithSteps(next, i, steps, { heapified: [...heapified] });
      heapified.push(i);
    }

    const swaps = steps.slice(swapsBefore).filter((s) => s.swap).length;
    const all = next.nodes.map((_, i) => i);

    steps.push(
      frame(next, {
        heapified: all,
        resultBadge: `HEAP BUILT — ${swaps} SWAP${swaps === 1 ? "" : "S"}`,
        message:
          swaps === 0
            ? `Already a heap — ${kind.rule} everywhere, so nothing moved`
            : `${kind.label} built from ${n} values in ${swaps} swap${swaps === 1 ? "" : "s"} — ${kind.rule}`,
      })
    );

    return { steps, finalHeap: next };
  },
};

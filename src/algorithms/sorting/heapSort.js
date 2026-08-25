import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing. Every
// comparison happens inside heapify, so the pseudocode spells that out; the
// heapify lines light up whichever phase called it.
const LINE = { EXTRACT: 2, HEAPIFY_COMPARE: 5, HEAPIFY_SWAP: 7, DONE: null };

const { run, count } = makeSort((ctx) => {
  const { n } = ctx;

  function heapify(size, i, depth) {
    ctx.m.atDepth(depth);
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < size) {
      const bigger = ctx.gt(l, largest);
      ctx.emit({ compare: [largest, l], line: LINE.HEAPIFY_COMPARE });
      if (bigger) largest = l;
    }
    if (r < size) {
      const bigger = ctx.gt(r, largest);
      ctx.emit({ compare: [largest, r], line: LINE.HEAPIFY_COMPARE });
      if (bigger) largest = r;
    }
    if (largest !== i) {
      ctx.swap(i, largest);
      ctx.emit({ swap: [i, largest], line: LINE.HEAPIFY_SWAP });
      heapify(size, largest, depth + 1);
    }
  }

  // Sift-down recursion is the only stack heap sort uses; the depth counter
  // reports it as log n, next to merge sort's identical-looking log n and
  // quick sort's very much not.
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i, 0);
  for (let size = n - 1; size > 0; size--) {
    ctx.swap(0, size);
    ctx.emit({ swap: [0, size], line: LINE.EXTRACT });
    ctx.markSorted(size);
    heapify(size, 0, 0);
  }
  ctx.markSorted(0);
  ctx.emit({ line: LINE.DONE });
});

export const heapSort = {
  key: "heap",
  label: "Heap Sort",
  category: "sorting",
  desc: "Builds a max-heap from the array, then repeatedly swaps the root (largest) to the end and re-heapifies what remains.",
  time: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)" },
  space: "O(1)",
  overview:
    "Heap sort uses a binary heap data structure to repeatedly extract the maximum element, guaranteeing O(n log n) time with only O(1) extra space.",
  howItWorks: [
    "Build a max-heap from the input array so the largest element sits at the root.",
    "Swap the root with the last element of the heap, moving the largest value to its final sorted position.",
    "Reduce the heap size by one and 're-heapify' the root to restore the max-heap property.",
    "Repeat the extraction and re-heapify steps until the heap is empty.",
  ],
  useCases: [
    "Systems with strict memory constraints, since it sorts in-place with O(1) extra space.",
    "Situations needing a guaranteed O(n log n) worst case, unlike quicksort.",
    "Implementing priority queues, which share the same heap structure.",
  ],
  advantages: [
    "Guaranteed O(n log n) time in all cases.",
    "In-place — only O(1) extra memory required.",
    "No worst-case degradation like quicksort's O(n\u00B2).",
  ],
  disadvantages: [
    "Not stable.",
    "Poor cache locality compared to quicksort or merge sort, making it slower in practice despite equal asymptotic complexity.",
    "More complex to implement correctly than simpler sorts.",
  ],
  pseudocode: [
    "buildMaxHeap(a)",
    "for size = n-1 downto 1:",
    "  swap(a[0], a[size])",
    "  heapify(a, 0, size)",
    "heapify(a, i, size):",
    "  largest = max(a[i], a[left], a[right])",
    "  if largest != i:",
    "    swap(a[i], a[largest]); heapify(a, largest, size)",
  ],
  // Whether equal elements keep their original relative order. The
  // stability view proves or disproves this on screen.
  stable: false,
  run,
  // Same body as run(), with frame recording switched off — what the
  // empirical-complexity sweep calls.
  count,
};

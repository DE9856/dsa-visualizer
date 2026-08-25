import { makeSort } from "../sortContext.js";

// Indices into `pseudocode` below — the line each frame is executing. Every
// frame comes out of merge(), so the pseudocode spells that helper out.
const LINE = { MERGE_LOOP: 6, TAKE_LEFT: 7, TAKE_RIGHT: 8, DRAIN: 9, DONE: null };

const { run, count } = makeSort((ctx) => {
  const { a, tags, n } = ctx;

  // Every mergeSort() call is recorded as it is entered, so the UI can draw
  // the recursion tree. One array, shared by reference across every frame;
  // `callCount` is how much of it exists at that point in the run.
  const calls = [];
  const enterCall = (lo, hi, depth, parent) => {
    calls.push({ id: calls.length, parent, range: [lo, hi], depth });
    return calls.length - 1;
  };

  // Frames name the subrange (inclusive) and depth of the call they came
  // from, which is what lets the bars outside it dim.
  const at = (fields, l, r, depth, callId) =>
    ctx.emit({ ...fields, range: [l, r], depth, callId, calls, callCount: calls.length });

  // r is exclusive here; the recorded range is inclusive.
  function mergeSort(l, r, depth, parent) {
    ctx.m.atDepth(depth);
    const id = enterCall(l, r - 1, depth, parent);
    if (r - l <= 1) return;
    const mid = Math.floor((l + r) / 2);
    mergeSort(l, mid, depth + 1, id);
    mergeSort(mid, r, depth + 1, id);
    merge(l, mid, r, depth, id);
  }

  function merge(l, mid, r, depth, callId) {
    // The two halves are copied out before merging, which is exactly the
    // O(n) auxiliary memory merge sort is charged for. The widest merge is
    // the top-level one, so the high-water mark lands at n.
    const leftV = a.slice(l, mid);
    const leftT = tags.slice(l, mid);
    const rightV = a.slice(mid, r);
    const rightT = tags.slice(mid, r);
    ctx.m.read(r - l);
    ctx.m.aux(r - l);

    let i = 0;
    let j = 0;
    let k = l;
    const frame = (fields) => at(fields, l, r - 1, depth, callId);

    while (i < leftV.length && j < rightV.length) {
      // `<=` rather than `<` is the whole of merge sort's stability: when the
      // two halves tie, the element from the left half — the one that started
      // earlier — is taken first.
      const takeLeft = ctx.lteValues(leftV[i], rightV[j]);
      frame({ compare: [l + i, mid + j], line: LINE.MERGE_LOOP });
      // Which branch wins is what the next frame shows, so the highlight
      // lands on the arm that actually ran.
      if (takeLeft) {
        ctx.put(k, leftV[i], leftT[i]);
        i++;
        frame({ swap: [k], line: LINE.TAKE_LEFT });
      } else {
        ctx.put(k, rightV[j], rightT[j]);
        j++;
        frame({ swap: [k], line: LINE.TAKE_RIGHT });
      }
      k++;
    }
    while (i < leftV.length) {
      ctx.put(k, leftV[i], leftT[i]);
      frame({ swap: [k], line: LINE.DRAIN });
      i++;
      k++;
    }
    while (j < rightV.length) {
      ctx.put(k, rightV[j], rightT[j]);
      frame({ swap: [k], line: LINE.DRAIN });
      j++;
      k++;
    }
  }

  mergeSort(0, n, 0, null);
  ctx.markAll();
  // The run is over: the whole array is the active range again, so nothing
  // is left dimmed.
  at({ line: LINE.DONE }, 0, n - 1, 0, 0);
});

export const mergeSort = {
  key: "merge",
  label: "Merge Sort",
  category: "sorting",
  desc: "Divides the array in half recursively, sorts each half, then merges the two sorted halves back together.",
  time: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)" },
  space: "O(n)",
  overview:
    "Merge sort is a classic divide-and-conquer algorithm that guarantees O(n log n) performance regardless of the input's initial order.",
  howItWorks: [
    "Divide the array into two halves.",
    "Recursively sort each half using the same process.",
    "Merge the two sorted halves back together by repeatedly taking the smaller of the two front elements.",
    "Continue merging up the recursion until the whole array is sorted.",
  ],
  useCases: [
    "Sorting linked lists, where merge sort's sequential access pattern is a strength.",
    "External sorting of datasets too large to fit in memory.",
    "Any situation where stable, predictable O(n log n) performance is required.",
  ],
  advantages: [
    "Guaranteed O(n log n) time in the best, average, and worst cases.",
    "Stable sort.",
    "Well suited to parallel and external sorting.",
  ],
  disadvantages: [
    "Requires O(n) additional memory for the merge step in typical array implementations.",
    "Slower in practice than quicksort on small, in-memory arrays due to overhead.",
  ],
  pseudocode: [
    "mergeSort(l, r):",
    "  if r-l <= 1: return",
    "  mid = (l+r)/2",
    "  mergeSort(l,mid); mergeSort(mid,r)",
    "  merge(l, mid, r)",
    "merge(l, mid, r):",
    "  while i<len(L) and j<len(R):",
    "    if L[i] <= R[j]: a[k++] = L[i]",
    "    else: a[k++] = R[j]",
    "  copy whatever remains",
  ],
  // Whether equal elements keep their original relative order. The
  // stability view proves or disproves this on screen.
  stable: true,
  run,
  // Same body as run(), with frame recording switched off — what the
  // empirical-complexity sweep calls.
  count,
};

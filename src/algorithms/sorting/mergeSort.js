// Indices into `pseudocode` below — the line each frame is executing. Every
// frame comes out of merge(), so the pseudocode spells that helper out.
const LINE = { MERGE_LOOP: 6, TAKE_LEFT: 7, TAKE_RIGHT: 8, DRAIN: 9, DONE: null };

function run(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];
  const sortedSet = new Set();

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
  const frame = (fields, l, r, depth, callId) => ({
    ...fields,
    array: [...arr],
    sorted: [...sortedSet],
    range: [l, r],
    depth,
    callId,
    calls,
    callCount: calls.length,
  });

  // r is exclusive here; the recorded range is inclusive.
  function mergeSort(l, r, depth, parent) {
    const id = enterCall(l, r - 1, depth, parent);
    if (r - l <= 1) return;
    const mid = Math.floor((l + r) / 2);
    mergeSort(l, mid, depth + 1, id);
    mergeSort(mid, r, depth + 1, id);
    merge(l, mid, r, depth, id);
  }

  function merge(l, mid, r, depth, callId) {
    const left = arr.slice(l, mid);
    const right = arr.slice(mid, r);
    let i = 0;
    let j = 0;
    let k = l;
    const at = (fields) => steps.push(frame(fields, l, r - 1, depth, callId));

    while (i < left.length && j < right.length) {
      at({ compare: [l + i, mid + j], swap: [], line: LINE.MERGE_LOOP });
      // Which branch wins is what the next frame shows, so the highlight
      // lands on the arm that actually ran.
      let taken;
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        i++;
        taken = LINE.TAKE_LEFT;
      } else {
        arr[k] = right[j];
        j++;
        taken = LINE.TAKE_RIGHT;
      }
      at({ compare: [], swap: [k], line: taken });
      k++;
    }
    while (i < left.length) {
      arr[k] = left[i];
      at({ compare: [], swap: [k], line: LINE.DRAIN });
      i++;
      k++;
    }
    while (j < right.length) {
      arr[k] = right[j];
      at({ compare: [], swap: [k], line: LINE.DRAIN });
      j++;
      k++;
    }
  }

  mergeSort(0, n, 0, null);
  for (let x = 0; x < n; x++) sortedSet.add(x);
  // The run is over: the whole array is the active range again, so nothing
  // is left dimmed.
  steps.push(frame({ compare: [], swap: [], line: LINE.DONE }, 0, n - 1, 0, 0));
  return steps;
}

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
  run,
};

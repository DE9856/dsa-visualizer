// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { COMPARE: 3, SWAP: 4, PLACE_PIVOT: 5, DONE: null };

function run(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];
  const sortedSet = new Set();

  // Every qs() call is recorded as it is entered, so the UI can draw the
  // recursion tree. One array, shared by reference across every frame;
  // `callCount` is how much of it exists at that point in the run. Unlike
  // merge sort's, this shape depends on where the pivots land.
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

  function qs(l, r, depth, parent) {
    // An empty side of a partition isn't a call worth drawing.
    if (l > r) return;
    const id = enterCall(l, r, depth, parent);
    if (l === r) {
      sortedSet.add(l);
      return;
    }
    const at = (fields) => steps.push(frame(fields, l, r, depth, id));

    const pivotVal = arr[r];
    let i = l - 1;
    for (let j = l; j < r; j++) {
      at({ compare: [j, r], swap: [], pivot: r, line: LINE.COMPARE });
      if (arr[j] < pivotVal) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        at({ compare: [], swap: [i, j], pivot: r, line: LINE.SWAP });
      }
    }
    [arr[i + 1], arr[r]] = [arr[r], arr[i + 1]];
    at({ compare: [], swap: [i + 1, r], line: LINE.PLACE_PIVOT });
    sortedSet.add(i + 1);
    qs(l, i, depth + 1, id);
    qs(i + 2, r, depth + 1, id);
  }

  qs(0, n - 1, 0, null);
  for (let x = 0; x < n; x++) sortedSet.add(x);
  // The run is over: the whole array is the active range again, so nothing
  // is left dimmed.
  steps.push(frame({ compare: [], swap: [], line: LINE.DONE }, 0, n - 1, 0, 0));
  return steps;
}

export const quickSort = {
  key: "quick",
  label: "Quick Sort",
  category: "sorting",
  desc: "Picks a pivot, partitions the array so smaller values sit left and larger sit right of it, then recurses on each side.",
  time: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n\u00B2)" },
  space: "O(log n)",
  overview:
    "Quicksort is another divide-and-conquer algorithm that, on average, is one of the fastest general-purpose sorting algorithms in practice, despite having a worst case of O(n\u00B2).",
  howItWorks: [
    "Choose a pivot element from the array.",
    "Partition the remaining elements into those less than the pivot and those greater than it.",
    "Recursively apply the same process to each partition.",
    "Combine the results — no explicit merge step is needed since partitioning happens in place.",
  ],
  useCases: [
    "General-purpose sorting in many standard libraries, often combined with insertion sort for small partitions.",
    "In-memory sorting where average-case speed matters more than worst-case guarantees.",
    "Situations where in-place sorting with low memory overhead is important.",
  ],
  advantages: [
    "Very fast in practice — O(n log n) average case with small constant factors.",
    "In-place, needing only O(log n) additional memory for recursion.",
    "Cache-friendly due to its access patterns.",
  ],
  disadvantages: [
    "Worst-case O(n\u00B2) time, e.g. on already-sorted data with a naive pivot choice.",
    "Not stable in its typical implementation.",
    "Performance is sensitive to the pivot selection strategy.",
  ],
  pseudocode: [
    "quickSort(l, r):",
    "  pivot = a[r]; i = l-1",
    "  for j in l..r:",
    "    if a[j] < pivot:",
    "      i++; swap(a[i], a[j])",
    "  swap(a[i+1], a[r])",
    "  quickSort(l, i); quickSort(i+2, r)",
  ],
  run,
};

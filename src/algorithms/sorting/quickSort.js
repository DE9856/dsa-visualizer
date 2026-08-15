// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { COMPARE: 3, SWAP: 4, PLACE_PIVOT: 5, DONE: null };

function run(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];
  const sortedSet = new Set();

  function qs(l, r) {
    if (l > r) return;
    if (l === r) {
      sortedSet.add(l);
      return;
    }
    const pivotVal = arr[r];
    let i = l - 1;
    for (let j = l; j < r; j++) {
      steps.push({ array: [...arr], compare: [j, r], swap: [], pivot: r, sorted: [...sortedSet], line: LINE.COMPARE });
      if (arr[j] < pivotVal) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        steps.push({ array: [...arr], compare: [], swap: [i, j], pivot: r, sorted: [...sortedSet], line: LINE.SWAP });
      }
    }
    [arr[i + 1], arr[r]] = [arr[r], arr[i + 1]];
    steps.push({ array: [...arr], compare: [], swap: [i + 1, r], sorted: [...sortedSet], line: LINE.PLACE_PIVOT });
    sortedSet.add(i + 1);
    qs(l, i);
    qs(i + 2, r);
  }

  qs(0, n - 1);
  for (let x = 0; x < n; x++) sortedSet.add(x);
  steps.push({ array: [...arr], compare: [], swap: [], sorted: [...sortedSet], line: LINE.DONE });
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

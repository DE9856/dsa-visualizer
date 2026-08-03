function run(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];
  const sortedSet = new Set();

  function mergeSort(l, r) {
    if (r - l <= 1) return;
    const mid = Math.floor((l + r) / 2);
    mergeSort(l, mid);
    mergeSort(mid, r);
    merge(l, mid, r);
  }

  function merge(l, mid, r) {
    const left = arr.slice(l, mid);
    const right = arr.slice(mid, r);
    let i = 0;
    let j = 0;
    let k = l;
    while (i < left.length && j < right.length) {
      steps.push({ array: [...arr], compare: [l + i, mid + j], swap: [], sorted: [...sortedSet] });
      if (left[i] <= right[j]) {
        arr[k] = left[i];
        i++;
      } else {
        arr[k] = right[j];
        j++;
      }
      steps.push({ array: [...arr], compare: [], swap: [k], sorted: [...sortedSet] });
      k++;
    }
    while (i < left.length) {
      arr[k] = left[i];
      steps.push({ array: [...arr], compare: [], swap: [k], sorted: [...sortedSet] });
      i++;
      k++;
    }
    while (j < right.length) {
      arr[k] = right[j];
      steps.push({ array: [...arr], compare: [], swap: [k], sorted: [...sortedSet] });
      j++;
      k++;
    }
  }

  mergeSort(0, n);
  for (let x = 0; x < n; x++) sortedSet.add(x);
  steps.push({ array: [...arr], compare: [], swap: [], sorted: [...sortedSet] });
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
  ],
  run,
};

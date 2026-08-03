function run(input, target) {
  // Exponential search requires a sorted array — sort a copy first.
  const arr = [...input].sort((a, b) => a - b);
  const n = arr.length;
  const steps = [];

  if (n === 0) {
    steps.push({ array: [], checking: -1, found: -2 });
    return steps;
  }

  steps.push({ array: [...arr], checking: 0, found: -1 });
  if (arr[0] === target) {
    steps.push({ array: [...arr], checking: -1, found: 0 });
    return steps;
  }

  // Double the bound until it overshoots the target or the array ends.
  let bound = 1;
  while (bound < n && arr[bound] <= target) {
    steps.push({ array: [...arr], checking: bound, found: -1 });
    bound *= 2;
  }

  // Binary search inside [bound/2, min(bound, n-1)].
  let lo = Math.floor(bound / 2);
  let hi = Math.min(bound, n - 1);
  steps.push({ array: [...arr], lo, hi, mid: -1, found: -1 });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ array: [...arr], lo, hi, mid, found: -1 });
    if (arr[mid] === target) {
      steps.push({ array: [...arr], lo, hi, mid, found: mid });
      return steps;
    } else if (arr[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  steps.push({ array: [...arr], lo, hi, mid: -1, found: -2 });
  return steps;
}

export const exponentialSearch = {
  key: "exponential",
  label: "Exponential Search",
  category: "searching",
  desc: "Doubles a bound outward to quickly locate a range containing the target, then binary searches within that range. Requires a sorted array; especially useful for unbounded or very large lists.",
  time: { best: "O(1)", avg: "O(log n)", worst: "O(log n)" },
  space: "O(1)",
  overview:
    "Exponential search finds a range likely to contain the target by repeatedly doubling an index, then applies binary search inside that range. It's particularly useful for unbounded searches or arrays where the target is expected to be near the start.",
  howItWorks: [
    "Check the first element as a quick shortcut.",
    "Starting from index 1, keep doubling the index while its value is still less than the target.",
    "Once the doubled index overshoots the target, the target must lie between the previous and current index.",
    "Run binary search within that narrowed range.",
    "Return the index if found, or report not found.",
  ],
  useCases: [
    "Unbounded or streamed sorted data where the total length isn't known in advance.",
    "Sorted arrays where the target is likely to be near the beginning, so the doubling phase ends quickly.",
    "As a building block inside more advanced search structures that need a fast initial range estimate.",
  ],
  advantages: [
    "O(log n) time, matching binary search once the range is found.",
    "Works even when the array's length is unknown, unlike binary search which needs bounds upfront.",
    "Finds nearby targets faster than binary search, since it starts small and grows.",
  ],
  disadvantages: [
    "Requires the array to be sorted beforehand.",
    "No real benefit over binary search when the array length is already known and the target isn't near the start.",
    "Slightly more bookkeeping than plain binary search.",
  ],
  pseudocode: [
    "if a[0]==target: return 0",
    "bound=1",
    "while bound<n and a[bound]<=target:",
    "  bound *= 2",
    "binary search in [bound/2, min(bound,n-1)]",
  ],
  run,
};
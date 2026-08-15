// Indices into `pseudocode` below. Every frame carries the line it is
// executing so the panel can follow along; DONE means the run has finished
// and no line is executing.
const LINE = { COMPARE: 2, SWAP: 3, DONE: null };

function run(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];
  const sortedSet = new Set();

  for (let i = 0; i < n - 1; i++) {
    let swappedAny = false;
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({ array: [...arr], compare: [j, j + 1], swap: [], sorted: [...sortedSet], line: LINE.COMPARE });
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        steps.push({ array: [...arr], compare: [], swap: [j, j + 1], sorted: [...sortedSet], line: LINE.SWAP });
        swappedAny = true;
      }
    }
    sortedSet.add(n - 1 - i);
    if (!swappedAny) {
      for (let k = 0; k <= n - 1 - i; k++) sortedSet.add(k);
      break;
    }
  }
  for (let k = 0; k < n; k++) sortedSet.add(k);
  steps.push({ array: [...arr], compare: [], swap: [], sorted: [...sortedSet], line: LINE.DONE });
  return steps;
}

export const bubbleSort = {
  key: "bubble",
  label: "Bubble Sort",
  category: "sorting",
  desc: "Repeatedly walks the array, swapping adjacent elements that are out of order. Each pass bubbles the largest remaining value to its final position.",
  time: { best: "O(n)", avg: "O(n\u00B2)", worst: "O(n\u00B2)" },
  space: "O(1)",
  overview:
    "Bubble sort is one of the simplest sorting algorithms to understand and implement, which makes it a common teaching tool even though it performs poorly on large datasets compared to more advanced algorithms.",
  howItWorks: [
    "Compare each pair of adjacent elements in the array, starting from the beginning.",
    "If the elements are out of order (left is bigger than right), swap them.",
    "After one full pass, the largest unsorted element has bubbled to its correct position at the end.",
    "Repeat the passes over the remaining unsorted portion until no swaps are needed.",
  ],
  useCases: [
    "Teaching the mechanics of comparisons and swaps to beginners.",
    "Sorting very small or nearly-sorted datasets where simplicity outweighs speed.",
    "Detecting whether a list is already sorted, since it can exit early once a pass makes no swaps.",
  ],
  advantages: [
    "Extremely simple to understand and implement.",
    "Stable sort — equal elements keep their relative order.",
    "In-place — needs only O(1) extra memory.",
    "Can detect an already-sorted array in O(n) time with the early-exit optimization.",
  ],
  disadvantages: [
    "O(n\u00B2) time complexity makes it impractical for large datasets.",
    "Far slower in practice than insertion sort for nearly-sorted data.",
    "Rarely used in production code; mostly of educational value.",
  ],
  pseudocode: [
    "for i in 0..n:",
    "  for j in 0..n-i-1:",
    "    if a[j] > a[j+1]:",
    "      swap(a[j], a[j+1])",
  ],
  run,
};

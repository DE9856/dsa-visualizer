function run(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];
  const sortedSet = new Set();
  steps.push({ array: [...arr], compare: [], swap: [], sorted: [] });

  let gap = Math.floor(n / 2);
  while (gap > 0) {
    for (let i = gap; i < n; i++) {
      let j = i;
      while (j >= gap && arr[j - gap] > arr[j]) {
        steps.push({ array: [...arr], compare: [j - gap, j], swap: [], sorted: [...sortedSet] });
        [arr[j - gap], arr[j]] = [arr[j], arr[j - gap]];
        steps.push({ array: [...arr], compare: [], swap: [j - gap, j], sorted: [...sortedSet] });
        j -= gap;
      }
    }
    gap = Math.floor(gap / 2);
  }

  for (let x = 0; x < n; x++) sortedSet.add(x);
  steps.push({ array: [...arr], compare: [], swap: [], sorted: [...sortedSet] });
  return steps;
}

export const shellSort = {
  key: "shell",
  label: "Shell Sort",
  category: "sorting",
  desc: "A generalization of insertion sort that first compares far-apart elements using a shrinking gap sequence, moving elements closer to their final position before finishing with a normal gap-1 insertion pass.",
  time: { best: "O(n log n)", avg: "O(n^1.3)", worst: "O(n\u00B2)" },
  space: "O(1)",
  overview:
    "Shell sort improves on insertion sort by comparing and moving elements that are far apart first, using a shrinking gap sequence, which lets out-of-place elements travel toward their final position in bigger jumps before the array is fine-tuned with a standard insertion sort at gap 1.",
  howItWorks: [
    "Start with a gap, typically n/2.",
    "Compare elements that are 'gap' positions apart and swap them if out of order, like a gapped insertion sort.",
    "Shrink the gap, usually by halving it, and repeat the gapped comparisons.",
    "Continue shrinking the gap until it reaches 1, performing a final ordinary insertion sort pass.",
    "The array is fully sorted once the gap-1 pass completes.",
  ],
  useCases: [
    "Medium-sized arrays where insertion sort's O(n\u00B2) behavior is too slow but the overhead of merge/quick sort isn't justified.",
    "Embedded or memory-constrained systems, since it sorts in place with O(1) extra space.",
    "As a simpler alternative to more complex O(n log n) sorts when average-case performance is good enough.",
  ],
  advantages: [
    "Noticeably faster than plain insertion sort in practice, especially on partially ordered data.",
    "In-place — needs no extra memory beyond the input array.",
    "Simple to implement, with no recursion required.",
  ],
  disadvantages: [
    "Worst-case time complexity depends heavily on the chosen gap sequence, and can be O(n\u00B2).",
    "Not stable — equal elements can be reordered relative to each other.",
    "More complex to analyze than basic O(n\u00B2) sorts.",
  ],
  pseudocode: [
    "gap = n/2",
    "while gap > 0:",
    "  for i in gap..n:",
    "    gapped-insertion-sort element i",
    "  gap = gap/2",
  ],
  run,
};
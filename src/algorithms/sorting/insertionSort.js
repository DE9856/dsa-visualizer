function run(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];
  const sortedSet = new Set([0]);
  steps.push({ array: [...arr], compare: [], swap: [], sorted: [...sortedSet] });

  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0 && arr[j - 1] > arr[j]) {
      steps.push({ array: [...arr], compare: [j - 1, j], swap: [], sorted: [...sortedSet] });
      [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
      steps.push({ array: [...arr], compare: [], swap: [j - 1, j], sorted: [...sortedSet] });
      j--;
    }
    for (let k = 0; k <= i; k++) sortedSet.add(k);
    steps.push({ array: [...arr], compare: [], swap: [], sorted: [...sortedSet] });
  }
  return steps;
}

export const insertionSort = {
  key: "insertion",
  label: "Insertion Sort",
  category: "sorting",
  desc: "Builds a sorted region one element at a time, shifting each new value backward until it lands in its correct spot.",
  time: { best: "O(n)", avg: "O(n\u00B2)", worst: "O(n\u00B2)" },
  space: "O(1)",
  overview:
    "Insertion sort builds the final sorted array one element at a time, in much the same way many people sort a hand of playing cards.",
  howItWorks: [
    "Start with the second element, treating the first as a sorted region of size one.",
    "Take the next unsorted element and compare it backward against the sorted region.",
    "Shift larger elements one position to the right to make room.",
    "Insert the element into its correct position within the sorted region.",
    "Repeat until every element has been inserted.",
  ],
  useCases: [
    "Sorting small arrays or arrays that are already nearly sorted.",
    "As the final pass in hybrid algorithms like Timsort and introsort, once sub-arrays become small.",
    "Online sorting, where data arrives one item at a time.",
  ],
  advantages: [
    "Very efficient on small or nearly-sorted inputs, close to O(n).",
    "Simple, in-place, and stable.",
    "Adaptive — running time shrinks as the input becomes more sorted.",
    "Works well as an online algorithm since it can sort data as it arrives.",
  ],
  disadvantages: [
    "O(n\u00B2) worst-case time makes it unsuitable for large, unsorted datasets.",
    "Shifting elements is costly for array-based implementations.",
  ],
  pseudocode: [
    "for i in 1..n:",
    "  j = i",
    "  while j>0 and a[j-1]>a[j]:",
    "    swap(a[j-1], a[j]); j--",
  ],
  run,
};

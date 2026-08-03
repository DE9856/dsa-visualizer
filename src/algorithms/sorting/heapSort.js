function run(input) {
  const arr = [...input];
  const n = arr.length;
  const steps = [];
  const sortedSet = new Set();

  function heapify(size, i) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < size) {
      steps.push({ array: [...arr], compare: [largest, l], swap: [], sorted: [...sortedSet] });
      if (arr[l] > arr[largest]) largest = l;
    }
    if (r < size) {
      steps.push({ array: [...arr], compare: [largest, r], swap: [], sorted: [...sortedSet] });
      if (arr[r] > arr[largest]) largest = r;
    }
    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      steps.push({ array: [...arr], compare: [], swap: [i, largest], sorted: [...sortedSet] });
      heapify(size, largest);
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
  for (let size = n - 1; size > 0; size--) {
    [arr[0], arr[size]] = [arr[size], arr[0]];
    steps.push({ array: [...arr], compare: [], swap: [0, size], sorted: [...sortedSet] });
    sortedSet.add(size);
    heapify(size, 0);
  }
  sortedSet.add(0);
  steps.push({ array: [...arr], compare: [], swap: [], sorted: [...sortedSet] });
  return steps;
}

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
  ],
  run,
};

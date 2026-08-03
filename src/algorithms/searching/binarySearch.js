function run(input, target) {
  // Binary search requires a sorted array — sort a copy first.
  const arr = [...input].sort((a, b) => a - b);
  const steps = [];
  let lo = 0;
  let hi = arr.length - 1;
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

export const binarySearch = {
  key: "binary",
  label: "Binary Search",
  category: "searching",
  desc: "Repeatedly halves the search range by comparing the target to the middle element. Requires the array to be sorted first.",
  time: { best: "O(1)", avg: "O(log n)", worst: "O(log n)" },
  space: "O(1)",
  overview:
    "Binary search exploits a sorted array's order to eliminate half of the remaining search space with every comparison, giving logarithmic time complexity.",
  howItWorks: [
    "Look at the middle element of the current search range.",
    "If it matches the target, the search is done.",
    "If the target is smaller, discard the right half and repeat on the left half.",
    "If the target is larger, discard the left half and repeat on the right half.",
    "Continue narrowing the range until the target is found or the range is empty.",
  ],
  useCases: [
    "Searching large, sorted datasets efficiently, such as sorted arrays or database indexes.",
    "Finding insertion points to keep an array sorted.",
    "Underlying many standard library search functions, such as bisect in Python.",
  ],
  advantages: [
    "O(log n) time — dramatically faster than linear search on large datasets.",
    "Predictable, easy-to-analyze performance.",
    "Low memory overhead.",
  ],
  disadvantages: [
    "Requires the array to be sorted beforehand.",
    "Not efficient on linked lists or other structures without random access.",
    "Insertions or deletions that break sort order require re-sorting or careful maintenance.",
  ],
  pseudocode: [
    "lo=0, hi=n-1",
    "while lo<=hi:",
    "  mid = (lo+hi)/2",
    "  if a[mid]==target: return mid",
    "  elif a[mid]<target: lo=mid+1",
    "  else: hi=mid-1",
  ],
  run,
};

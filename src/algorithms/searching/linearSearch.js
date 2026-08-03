function run(input, target) {
  const arr = [...input];
  const steps = [];
  for (let i = 0; i < arr.length; i++) {
    steps.push({ array: [...arr], checking: i, found: -1 });
    if (arr[i] === target) {
      steps.push({ array: [...arr], checking: -1, found: i });
      return steps;
    }
  }
  steps.push({ array: [...arr], checking: -1, found: -2 });
  return steps;
}

export const linearSearch = {
  key: "linear",
  label: "Linear Search",
  category: "searching",
  desc: "Checks each element in order until the target is found, or the array runs out. Works on any array, sorted or not.",
  time: { best: "O(1)", avg: "O(n)", worst: "O(n)" },
  space: "O(1)",
  overview:
    "Linear search is the most basic search algorithm: it checks each element in sequence until it finds the target or reaches the end of the array.",
  howItWorks: [
    "Start at the first element of the array.",
    "Compare it to the target value.",
    "If it matches, return that index; otherwise move to the next element.",
    "Repeat until the target is found or the array is exhausted.",
  ],
  useCases: [
    "Small or unsorted datasets where sorting first wouldn't be worth the cost.",
    "Linked lists and other structures without random access, where binary search isn't possible.",
    "One-off searches where the overhead of sorting exceeds the benefit.",
  ],
  advantages: [
    "Works on any array, sorted or unsorted.",
    "Simple to implement with no preconditions.",
    "No extra memory required.",
  ],
  disadvantages: [
    "O(n) time — slow on large datasets compared to binary search.",
    "Doesn't take advantage of any existing order in the data.",
  ],
  pseudocode: ["for i in 0..n:", "  if a[i] == target:", "    return i", "return not found"],
  run,
};

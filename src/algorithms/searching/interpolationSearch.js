// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { INIT: 0, PROBE: 2, FOUND: 3, MISS: 6 };

function run(input, target) {
  // Interpolation search requires a sorted array — sort a copy first.
  const arr = [...input].sort((a, b) => a - b);
  const steps = [];
  let lo = 0;
  let hi = arr.length - 1;

  steps.push({ array: [...arr], lo, hi, mid: -1, found: -1, line: LINE.INIT });

  while (lo <= hi && target >= arr[lo] && target <= arr[hi]) {
    if (arr[hi] === arr[lo]) {
      // All values in range are equal — check lo directly to avoid dividing by zero.
      steps.push({ array: [...arr], lo, hi, mid: lo, found: -1, line: LINE.PROBE });
      if (arr[lo] === target) {
        steps.push({ array: [...arr], lo, hi, mid: lo, found: lo, line: LINE.FOUND });
        return steps;
      }
      break;
    }

    const rawPos = lo + Math.floor(((target - arr[lo]) * (hi - lo)) / (arr[hi] - arr[lo]));
    const pos = Math.max(lo, Math.min(hi, rawPos));

    steps.push({ array: [...arr], lo, hi, mid: pos, found: -1, line: LINE.PROBE });

    if (arr[pos] === target) {
      steps.push({ array: [...arr], lo, hi, mid: pos, found: pos, line: LINE.FOUND });
      return steps;
    } else if (arr[pos] < target) {
      lo = pos + 1;
    } else {
      hi = pos - 1;
    }
  }

  steps.push({ array: [...arr], lo, hi, mid: -1, found: -2, line: LINE.MISS });
  return steps;
}

export const interpolationSearch = {
  key: "interpolation",
  label: "Interpolation Search",
  category: "searching",
  desc: "Estimates where the target should be using linear interpolation over the value range, instead of always checking the middle. Fastest on uniformly distributed sorted data.",
  time: { best: "O(1)", avg: "O(log log n)", worst: "O(n)" },
  space: "O(1)",
  overview:
    "Interpolation search improves on binary search for uniformly distributed sorted data by estimating the target's likely position using a formula, similar to how a person would flip to an estimated page in a phone book rather than always opening to the middle.",
  howItWorks: [
    "Look at the values at both ends of the current search range.",
    "Use linear interpolation to estimate the target's position based on its value.",
    "Check that estimated position instead of the plain midpoint.",
    "Narrow the range to one side or the other, just like binary search.",
    "Repeat until found, or the range becomes invalid.",
  ],
  useCases: [
    "Large sorted arrays with roughly uniformly distributed numeric values, such as sorted sensor readings.",
    "Phone-book-style or indexed lookups where values correlate strongly with position.",
    "Any binary-search use case where the data's distribution is known and roughly even.",
  ],
  advantages: [
    "O(log log n) average time on uniform data — faster than binary search's O(log n).",
    "Adapts its guesses to the actual value distribution rather than blindly halving.",
    "Still only needs O(1) extra space.",
  ],
  disadvantages: [
    "Degrades to O(n) worst case on skewed or non-uniform data.",
    "Requires the array to be sorted beforehand.",
    "Slightly more arithmetic per step than binary search's simple midpoint.",
  ],
  pseudocode: [
    "lo=0, hi=n-1",
    "while target in [a[lo], a[hi]]:",
    "  pos = lo + (target-a[lo])*(hi-lo) / (a[hi]-a[lo])",
    "  if a[pos]==target: return pos",
    "  elif a[pos]<target: lo=pos+1",
    "  else: hi=pos-1",
    "return not found",
  ],
  run,
};
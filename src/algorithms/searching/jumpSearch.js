// Indices into `pseudocode` below — the line each frame is executing.
const LINE = { BLOCK_SIZE: 0, PROBE_BLOCK: 1, JUMP: 2, SCAN: 3, RETURN: 4 };

function run(input, target) {
  // Jump search requires a sorted array — sort a copy first.
  const arr = [...input].sort((a, b) => a - b);
  const n = arr.length;
  const steps = [];
  const blockSize = Math.max(1, Math.floor(Math.sqrt(n)));

  let blockStart = 0;
  let blockEnd = Math.min(blockSize, n) - 1;

  steps.push({ array: [...arr], lo: blockStart, hi: blockEnd, checking: -1, found: -1, line: LINE.BLOCK_SIZE });

  // Jump forward block by block until we find one whose last element
  // is not smaller than the target (or we run out of blocks).
  while (blockEnd < n && arr[blockEnd] < target) {
    steps.push({ array: [...arr], lo: blockStart, hi: blockEnd, checking: blockEnd, found: -1, line: LINE.PROBE_BLOCK });
    blockStart = blockEnd + 1;
    if (blockStart >= n) break;
    blockEnd = Math.min(blockEnd + blockSize, n - 1);
    steps.push({ array: [...arr], lo: blockStart, hi: blockEnd, checking: -1, found: -1, line: LINE.JUMP });
  }

  // Linear scan inside the located block.
  for (let i = blockStart; i <= Math.min(blockEnd, n - 1); i++) {
    steps.push({ array: [...arr], lo: blockStart, hi: blockEnd, checking: i, found: -1, line: LINE.SCAN });
    if (arr[i] === target) {
      steps.push({ array: [...arr], lo: blockStart, hi: blockEnd, checking: -1, found: i, line: LINE.RETURN });
      return steps;
    }
    if (arr[i] > target) break;
  }

  steps.push({ array: [...arr], lo: blockStart, hi: blockEnd, checking: -1, found: -2, line: LINE.RETURN });
  return steps;
}

export const jumpSearch = {
  key: "jump",
  label: "Jump Search",
  category: "searching",
  desc: "Jumps ahead in fixed-size blocks of √n to find the block that could contain the target, then scans that block linearly. Requires a sorted array.",
  time: { best: "O(1)", avg: "O(√n)", worst: "O(√n)" },
  space: "O(1)",
  overview:
    "Jump search sits between linear and binary search: instead of checking every element or halving the range, it skips ahead in fixed-size blocks, then falls back to a linear scan once it has narrowed down the right block.",
  howItWorks: [
    "Pick a block size, typically √n.",
    "Jump forward block by block, checking the last element of each block.",
    "Stop jumping once a block's last element is not smaller than the target.",
    "Linearly scan that block from its start to find the target.",
    "Report not found if the scan reaches the end of the block without a match.",
  ],
  useCases: [
    "Sorted arrays stored on media where backward jumps are costly, since jump search only moves forward.",
    "Situations where binary search's random access pattern is more expensive than sequential access.",
    "A middle-ground option when array size makes linear search too slow but binary search's jumps are undesirable.",
  ],
  advantages: [
    "Only O(√n) time — much faster than linear search on large sorted arrays.",
    "Only moves forward, which suits certain storage/access patterns better than binary search.",
    "Simple to implement, no recursion needed.",
  ],
  disadvantages: [
    "Requires the array to be sorted beforehand.",
    "Slower than binary search's O(log n) in the general case.",
    "Choosing a good block size matters — too large or too small hurts performance.",
  ],
  pseudocode: [
    "step = sqrt(n)",
    "while a[min(step,n)-1] < target:",
    "  jump to next block",
    "linearly scan the found block",
    "return index or not found",
  ],
  run,
};
import { nQueens } from "./nQueens";
import { sudoku } from "./sudoku";
import { subsetSum } from "./subsetSum";
import { permutations } from "./permutations";

/**
 * The four backtracking problems, grouped by what a partial answer looks like:
 * a grid with pieces on it, or a list being built left to right.
 *
 * They are deliberately in this order. Permutations has no constraint at all,
 * so its tree is the whole answer and nothing is pruned; the other three each
 * add a rule that kills branches before they are entered. Reading the node
 * counts across the four is the argument for why backtracking is not just
 * brute force with extra steps.
 */
export const BT_PROBLEMS = [nQueens, sudoku, subsetSum, permutations];

export const BT_PROBLEM_MAP = Object.fromEntries(BT_PROBLEMS.map((p) => [p.key, p]));

export const BT_KEYS = BT_PROBLEMS.map((p) => p.key);

export const BT_GROUPS = [
  { key: "grids", label: "On a Grid" },
  { key: "lists", label: "Building a List" },
];

/** Every raw input field any problem can ask for, as the text its box holds. */
export const BT_DEFAULT_INPUTS = BT_PROBLEMS.reduce(
  (inputs, problem) => ({ ...inputs, ...toStrings(problem.defaults) }),
  {}
);

export function toStrings(defaults) {
  return Object.fromEntries(Object.entries(defaults || {}).map(([key, value]) => [key, String(value)]));
}

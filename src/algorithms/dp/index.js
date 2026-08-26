import { lcs } from "./lcs";
import { editDistance } from "./editDistance";
import { knapsack } from "./knapsack";
import { coinChange } from "./coinChange";
import { lis } from "./lis";
import { matrixChain } from "./matrixChain";

/**
 * The six problems the DP view knows, grouped by what the table is indexed by
 * rather than by what the problem is about — two strings, a set of choices, or
 * one sequence. Problems in a group share a table shape and very nearly a
 * recurrence, which is the point: LCS and edit distance are the same grid read
 * two ways, and coin change is the knapsack with one index changed.
 */
export const DP_PROBLEMS = [lcs, editDistance, knapsack, coinChange, lis, matrixChain];

export const DP_PROBLEM_MAP = Object.fromEntries(DP_PROBLEMS.map((p) => [p.key, p]));

export const DP_KEYS = DP_PROBLEMS.map((p) => p.key);

export const DP_GROUPS = [
  { key: "strings", label: "Two Strings" },
  { key: "choices", label: "Choosing Items" },
  { key: "sequences", label: "One Sequence" },
];

/** Every raw input field any problem can ask for, and what it defaults to. */
export const DP_DEFAULT_INPUTS = DP_PROBLEMS.reduce(
  (inputs, problem) => ({ ...inputs, ...toStrings(problem.defaults) }),
  {}
);

/** The sidebar edits raw text, so defaults are stored as text too. */
export function toStrings(defaults) {
  return Object.fromEntries(Object.entries(defaults || {}).map(([key, value]) => [key, String(value)]));
}

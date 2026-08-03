import { sortingAlgorithms } from "./sorting";
import { searchingAlgorithms } from "./searching";
import { annotateSteps } from "./stepUtils";

export const ALGORITHMS = [...sortingAlgorithms, ...searchingAlgorithms];

export const ALGO_MAP = Object.fromEntries(ALGORITHMS.map((a) => [a.key, a]));

export const SORT_KEYS = sortingAlgorithms.map((a) => a.key);
export const SEARCH_KEYS = searchingAlgorithms.map((a) => a.key);

// Runs the algorithm and attaches cumulative comparison/write counts.
export function getSteps(key, array, target) {
  const algo = ALGO_MAP[key];
  const rawSteps = algo.category === "searching" ? algo.run(array, target) : algo.run(array);
  return annotateSteps(rawSteps);
}

import { activitySelection } from "./activitySelection";
import { fractionalKnapsack } from "./fractionalKnapsack";
import { sieve } from "./sieve";
import { fastPower } from "./fastPower";
import { gcd } from "./gcd";

/**
 * Five algorithms that get the right answer by looking at as little as
 * possible, split by what "as little as possible" means.
 *
 * The first two are greedy in the technical sense: a rule that picks the
 * locally best option and is provably globally optimal, which is a much
 * stronger claim than it sounds and is false for most problems. Both are worth
 * having beside their dynamic-programming neighbours — fractional knapsack is
 * greedy and 0/1 knapsack is not, and the only difference is whether an item
 * can be cut in half.
 *
 * The last three are the arithmetic underneath everything else: the sieve is
 * how you get primes, fast exponentiation is why public-key cryptography runs
 * in milliseconds, and Euclid is the oldest algorithm still in daily use.
 */
export const GREEDY_ALGOS = [activitySelection, fractionalKnapsack, sieve, fastPower, gcd];

export const GREEDY_ALGO_MAP = Object.fromEntries(GREEDY_ALGOS.map((a) => [a.key, a]));

export const GREEDY_KEYS = GREEDY_ALGOS.map((a) => a.key);

export const GREEDY_GROUPS = [
  { key: "greedy", label: "Greedy Choices" },
  { key: "number", label: "Number Theory" },
];

/** Every raw input field any algorithm can ask for, as the text its box holds. */
export const GREEDY_DEFAULT_INPUTS = GREEDY_ALGOS.reduce(
  (inputs, algo) => ({ ...inputs, ...toStrings(algo.defaults) }),
  {}
);

export function toStrings(defaults) {
  return Object.fromEntries(Object.entries(defaults || {}).map(([key, value]) => [key, String(value)]));
}

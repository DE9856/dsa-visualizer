import {
  MAX_SIEVE,
  SIEVE_COLUMNS,
  auxOf,
  cell,
  chip,
  parseInteger,
  snap,
  widthFor,
} from "./helpers";

const PSEUDOCODE = [
  "mark every number from 2 to n as prime",
  "for p = 2; p*p <= n; p++:",
  "    if p is still marked prime:",
  "        for m = p*p; m <= n; m += p:",
  "            mark m as composite",
  "everything still marked is prime",
];

const LINE = { INIT: 0, LOOP: 1, TEST: 2, INNER: 3, CROSS: 4, DONE: 5 };

export const sieve = {
  key: "sieve",
  label: "Sieve of Eratosthenes",
  short: "SIEVE",
  group: "number",
  fields: ["limit"],
  defaults: { limit: "60" },
  desc:
    "To find every prime below n, do not test each number for primality — cross out every multiple of every prime instead, and whatever survives is prime. Two details make it fast. Crossing off multiples of p can start at p·p rather than 2p, because any smaller multiple of p has a factor below p and was already struck out when that smaller prime was processed. And the outer loop can stop once p·p exceeds n, because a composite number must have a factor no larger than its own square root, so anything still standing by then has no factor left to find. Together they bring the cost down to O(n log log n) — near enough to linear that the sum of 1/p over the primes below n is the whole story.",
  time: "O(n log log n) — the sum of n/p over primes p below n",
  space: "O(n) for the flags",
  pseudocode: PSEUDOCODE,

  random: () => ({ limit: String(30 + Math.floor(Math.random() * 7) * 10) }),

  parse(raw) {
    const limit = parseInteger(raw.limit);
    if (limit === null) return { error: "Enter a whole number." };
    if (limit < 2) return { error: "The sieve needs a limit of at least 2." };
    if (limit > MAX_SIEVE) return { error: `At most ${MAX_SIEVE}, so the grid still fits.` };
    return { limit };
  },

  run({ limit }) {
    const steps = [];
    // null = still standing, true = struck out, and 0 and 1 are neither prime
    // nor composite so they are dimmed from the start rather than crossed.
    const composite = new Array(limit + 1).fill(false);
    const rows = Math.ceil((limit + 1) / SIEVE_COLUMNS);

    const frame = (extra, { current = -1, striking = -1 } = {}) => {
      const grid = [];
      for (let r = 0; r < rows; r++) {
        const cells = [];
        for (let c = 0; c < SIEVE_COLUMNS; c++) {
          const value = r * SIEVE_COLUMNS + c;
          if (value > limit) {
            cells.push(cell("", null));
            continue;
          }
          let tone;
          if (value < 2) tone = "dim";
          else if (value === striking) tone = "mismatch";
          else if (value === current) tone = "active";
          else if (composite[value]) tone = "dim";
          else tone = "found";
          cells.push(cell(value, tone));
        }
        grid.push({ label: String(r * SIEVE_COLUMNS), offset: 0, cells });
      }

      const primes = [];
      for (let i = 2; i <= limit; i++) if (!composite[i]) primes.push(i);

      steps.push(
        snap({
          width: SIEVE_COLUMNS,
          cellWidth: widthFor(String(limit).length),
          rows: grid,
          aux: auxOf(`${primes.length} STILL STANDING`, [
            chip(primes.slice(0, 24).join(" ") + (primes.length > 24 ? " …" : ""), "take"),
          ]),
          ...extra,
        })
      );
    };

    frame({ line: LINE.INIT, message: `Everything from 2 to ${limit} starts out assumed prime.` });

    for (let p = 2; p * p <= limit; p++) {
      if (composite[p]) {
        frame(
          { line: LINE.TEST, message: `${p} was already struck out, so its multiples were too — skip it.` },
          { current: p }
        );
        continue;
      }

      frame(
        {
          line: LINE.TEST,
          message: `${p} survived, so it is prime. Its multiples start at ${p}² = ${p * p} — anything smaller already has a smaller prime factor and is gone.`,
        },
        { current: p }
      );

      for (let m = p * p; m <= limit; m += p) {
        const already = composite[m];
        composite[m] = true;
        frame(
          {
            line: LINE.CROSS,
            message: already
              ? `${m} was already struck out — it has more than one prime factor below ${p}.`
              : `${m} = ${p} × ${m / p}, so it is composite.`,
          },
          { current: p, striking: m }
        );
      }
    }

    const primes = [];
    for (let i = 2; i <= limit; i++) if (!composite[i]) primes.push(i);

    frame({
      line: LINE.DONE,
      message: `Past ${Math.floor(Math.sqrt(limit))} every remaining number is prime: a composite below ${limit} must have a factor no bigger than its square root, and all of those have had their turn.`,
      resultBadge: `${primes.length} PRIMES UP TO ${limit}`,
    });

    return { steps };
  },
};

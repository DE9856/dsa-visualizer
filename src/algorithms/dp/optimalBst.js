import { MAX_OBST_KEYS, VOID, cell, emptyTable, head, parseNumbers, randomInts, snap } from "./helpers";

const PSEUDOCODE = [
  "for i = 1..n:  c[i][i] = f[i];  r[i][i] = i",
  "for len = 2..n:",
  "    for i = 1..n-len+1:  j = i+len-1",
  "        w = f[i] + … + f[j]        (weight of the whole run)",
  "        c[i][j] = ∞",
  "        for k = i..j:              (try every key as the root)",
  "            t = c[i][k-1] + c[k+1][j]",
  "            if t < c[i][j]:  c[i][j] = t;  r[i][j] = k",
  "        c[i][j] = c[i][j] + w      (every key sinks one level)",
  "walk r[][] from r[1][n] to build the tree",
];

const LINE = { base: 0, len: 1, cell: 2, weight: 3, root: 5, better: 7, add: 8, build: 9 };

export const optimalBst = {
  key: "obst",
  label: "Optimal Binary Search Tree",
  short: "OPTIMAL BST",
  group: "sequences",
  fields: ["keys", "freqs"],
  defaults: { keys: "do, if, int, while", freqs: "5, 10, 3, 7" },
  desc: "A balanced tree makes every key cost about log n. That is the best you can do when you know nothing about the keys — but if you know how *often* each one is looked up, balance is the wrong target: a key asked for a thousand times a second belongs near the root even if putting it there makes the tree lopsided. c[i][j] is the cheapest total cost of a subtree holding the run of keys i..j, and the trick is in the last line: whichever key becomes the root, every other key in the run drops one level, so the whole run's frequency is added exactly once. That single term is why a run's cost does not depend on which subproblem you came from, and so why the table works at all. The keys are read in the order given — that order is the in-order walk of every tree considered, which is what keeps this a search tree.",
  time: "O(n³)",
  space: "O(n²)",
  pseudocode: PSEUDOCODE,

  random: () => {
    const n = 4 + Math.floor(Math.random() * 2);
    return {
      keys: WORDS.slice(0, n).join(", "),
      freqs: randomInts(n, 1, 20).join(", "),
    };
  },

  parse(raw) {
    const keys = parseKeys(raw.keys);
    const freqs = parseNumbers(raw.freqs, MAX_OBST_KEYS).filter((f) => f >= 0);
    if (keys.length < 2) return { error: "Give at least two keys, separated by commas." };
    if (freqs.length !== keys.length) {
      return { error: `${keys.length} keys but ${freqs.length} frequencies — give one frequency per key.` };
    }
    if (freqs.every((f) => f === 0)) return { error: "At least one key has to be looked up sometimes." };
    return { keys, freqs };
  },

  run({ keys, freqs }) {
    const n = keys.length;
    const ctx = {
      rows: keys.map((key, i) => head(key, `f=${freqs[i]}`)),
      cols: keys.map((key) => head(key)),
      rowAxis: "FROM KEY i",
      colAxis: "TO KEY j",
      table: emptyTable(n, n),
    };
    const steps = [];
    const root = Array.from({ length: n }, () => new Array(n).fill(-1));

    // A run from i to j only exists for j >= i: the lower triangle is not
    // "not filled yet", it is not part of the table.
    for (let r = 0; r < n; r++) for (let c = 0; c < r; c++) ctx.table[r][c] = VOID();

    const total = freqs.reduce((sum, f) => sum + f, 0);
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.len,
        message: `${n} keys, looked up ${total} times between them: ${keys
          .map((key, i) => `${key} ${freqs[i]}×`)
          .join(", ")}. c[i][j] is the cheapest subtree holding the run i..j.`,
      })
    );

    for (let i = 0; i < n; i++) {
      ctx.table[i][i] = cell(freqs[i], keys[i]);
      root[i][i] = i;
    }
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.base,
        deps: Array.from({ length: n }, (_, i) => ({ r: i, c: i, kind: "read" })),
        message:
          "The diagonal is a subtree of one key, which can only be its own root — and a root is reached in one comparison, so it costs its frequency once.",
      })
    );

    // Prefix sums, so a run's weight is one subtraction rather than a loop.
    const prefix = [0];
    for (let i = 0; i < n; i++) prefix.push(prefix[i] + freqs[i]);
    const weightOf = (i, j) => prefix[j + 1] - prefix[i];

    for (let len = 2; len <= n; len++) {
      for (let i = 0; i + len - 1 < n; i++) {
        const j = i + len - 1;
        const w = weightOf(i, j);
        let best = Infinity;
        let bestK = -1;

        for (let k = i; k <= j; k++) {
          const left = k > i ? ctx.table[i][k - 1].value : 0;
          const right = k < j ? ctx.table[k + 1][j].value : 0;
          const subtotal = left + right;
          const better = subtotal < best;
          if (better) {
            best = subtotal;
            bestK = k;
          }
          // Written provisionally on every candidate root, so the cell
          // visibly settles rather than appearing finished from a blank.
          ctx.table[i][j] = cell(best + w, keys[bestK]);

          const deps = [];
          if (k > i) deps.push({ r: i, c: k - 1, kind: better ? "chosen" : "read" });
          if (k < j) deps.push({ r: k + 1, c: j, kind: better ? "chosen" : "read" });

          steps.push(
            snap(ctx, {
              cur: { r: i, c: j },
              deps,
              line: better ? LINE.better : LINE.root,
              message: `${keys[i]}..${keys[j]} with ${keys[k]} as the root: left ${left} + right ${right} = ${subtotal}${
                better ? ` — best so far, so the run costs ${subtotal} + ${w} = ${best + w}` : ` — worse than ${best}, keep ${keys[bestK]}`
              }`,
            })
          );
        }

        steps.push(
          snap(ctx, {
            cur: { r: i, c: j },
            line: LINE.add,
            message: `${keys[i]}..${keys[j]}: root ${keys[bestK]}, subtrees ${best}, plus the run's own weight ${w} — every one of these ${
              j - i + 1
            } keys is one level deeper than it was inside its subtree, so all ${w} lookups pay one extra comparison. Total ${best + w}.`,
          })
        );

        root[i][j] = bestK;
      }
    }

    const answer = ctx.table[0][n - 1].value;
    steps.push(
      snap(ctx, {
        phase: "done",
        cur: { r: 0, c: n - 1 },
        line: LINE.build,
        message: `c[1][${n}] = ${answer} comparisons in total across all ${total} lookups — the top-right cell, the only one that answers the original question.`,
      })
    );

    // ---- building the tree: the root table is the tree, read in pre-order ----
    const path = [];
    const order = [];
    const depth = new Array(n).fill(0);

    const bracket = (i, j) => {
      if (i > j) return "·";
      const k = root[i][j];
      if (i === j) return keys[k];
      return `(${bracket(i, k - 1)} ${keys[k]} ${bracket(k + 1, j)})`;
    };

    const walk = (i, j, level, side) => {
      if (i > j) return;
      const k = root[i][j];
      depth[k] = level;
      path.push({ r: i, c: j });
      order.push({ text: `${"·".repeat(level)}${keys[k]} @ level ${level}`, tone: level === 0 ? "take" : "plain" });
      steps.push(
        snap(ctx, {
          phase: "backtrack",
          cur: { r: i, c: j },
          deps: [
            ...(k > i ? [{ r: i, c: k - 1, kind: "chosen" }] : []),
            ...(k < j ? [{ r: k + 1, c: j, kind: "chosen" }] : []),
          ],
          path: [...path],
          line: LINE.build,
          aux: { label: "TREE, IN PRE-ORDER", items: [...order] },
          message: `${keys[i]}..${keys[j]} is rooted at ${keys[k]}${side ? ` — the ${side} child` : " — the root of the whole tree"}. Everything before it goes left, everything after goes right.`,
        })
      );
      walk(i, k - 1, level + 1, "left");
      walk(k + 1, j, level + 1, "right");
    };

    walk(0, n - 1, 0, null);

    const balanced = balancedCost(freqs);
    steps.push(
      snap(ctx, {
        phase: "done",
        path: [...path],
        line: null,
        aux: { label: "TREE, IN PRE-ORDER", items: [...order] },
        resultBadge: `${bracket(0, n - 1)} — ${answer} COMPARISONS, ${(answer / total).toFixed(2)} PER LOOKUP`,
        message: `A perfectly balanced tree over the same keys costs ${balanced} instead of ${answer}${
          balanced === answer
            ? " — with these frequencies balance happens to be optimal too."
            : `, because it spends its short paths on keys nobody asks for. Depths here: ${keys
                .map((key, i) => `${key} at ${depth[i]}`)
                .join(", ")}.`
        }`,
      })
    );

    return { steps };
  },
};

/** The comma-separated key box; identifiers, not numbers. */
function parseKeys(text) {
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, 8))
    .slice(0, MAX_OBST_KEYS);
}

/**
 * What the same keys cost in a perfectly balanced tree — the median is the
 * root, recursively. The competitor worth naming: it is what you build when
 * you have the keys but not the frequencies.
 */
function balancedCost(freqs) {
  let cost = 0;
  const split = (i, j, level) => {
    if (i > j) return;
    const mid = (i + j) >> 1;
    cost += freqs[mid] * (level + 1);
    split(i, mid - 1, level + 1);
    split(mid + 1, j, level + 1);
  };
  split(0, freqs.length - 1, 0);
  return cost;
}

// Keywords, because the classic worked example of this is a compiler's
// reserved-word table: fixed keys, and lookup counts you can actually measure.
const WORDS = ["do", "if", "int", "for", "new", "while", "float"];

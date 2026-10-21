import {
  EMPTY,
  MAX_CAPACITY,
  MAX_ITEMS,
  cell,
  countHeads,
  emptyTable,
  head,
  parseBounded,
  parseItems,
  randomInts,
  snap,
} from "./helpers";

const PSEUDOCODE = [
  "for w = 0..W:  K[0][w] = 0        (no items, no value)",
  "for i = 1..n, for w = 0..W:",
  "    skip = K[i-1][w]",
  "    if weight[i] <= w:",
  "        take = K[i-1][w - weight[i]] + value[i]",
  "    K[i][w] = max(skip, take)",
  "backtrack: item i was taken iff K[i][w] != K[i-1][w]",
];

const LINE = { base: 0, loop: 1, skip: 2, take: 4, choose: 5, backtrack: 6 };

const TAKE = "✓";
const SKIP = "·";

export const knapsack = {
  key: "knapsack",
  label: "0/1 Knapsack",
  short: "KNAPSACK",
  group: "choices",
  fields: ["items", "capacity"],
  defaults: { items: "2:3, 3:4, 4:5, 5:6", capacity: 8 },
  desc: "Given items with a weight and a value, and a bag that can carry so much, take the most valuable set that fits. Each item is taken whole or not at all — that is the 0/1 — which is exactly what makes the greedy answer wrong: the best value-per-kilo item can crowd out a pair that would have fitted better. K[i][w] is the best value using only the first i items in a bag of capacity w, and every cell is one binary decision: skip item i and inherit the row above, or take it, pay its weight and add its value to whatever the row above managed with the space that's left. The table gives the value; only the backtrack says which items.",
  time: "O(n·W)",
  space: "O(n·W)",
  pseudocode: PSEUDOCODE,

  random: () => {
    const count = 3 + Math.floor(Math.random() * 3);
    const weights = randomInts(count, 1, 7);
    const values = randomInts(count, 2, 12);
    return {
      items: weights.map((w, i) => `${w}:${values[i]}`).join(", "),
      capacity: String(6 + Math.floor(Math.random() * 7)),
    };
  },

  parse(raw) {
    const items = parseItems(raw.items, MAX_ITEMS);
    if (!items.length) return { error: 'Items look like "weight:value", e.g. 2:3, 3:4.' };
    const capacity = parseBounded(raw.capacity, 1, MAX_CAPACITY, 8);
    return { items, capacity };
  },

  run({ items, capacity }) {
    const n = items.length;
    const ctx = {
      rows: [head(EMPTY, "0"), ...items.map((it, i) => head(`#${i + 1}`, `${it.weight}kg/${it.value}`))],
      cols: countHeads(capacity),
      rowAxis: "ITEMS CONSIDERED",
      colAxis: "CAPACITY w",
      table: emptyTable(n + 1, capacity + 1),
    };
    const steps = [];

    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.loop,
        message: `K[i][w] is the best value from the first i items in a bag that holds w — ${n} items, capacity ${capacity}`,
      })
    );

    for (let w = 0; w <= capacity; w++) ctx.table[0][w] = cell(0);
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.base,
        deps: Array.from({ length: capacity + 1 }, (_, w) => ({ r: 0, c: w, kind: "read" })),
        message: "Row 0: no items to choose from, so every bag size is worth nothing",
      })
    );

    for (let i = 1; i <= n; i++) {
      const item = items[i - 1];
      for (let w = 0; w <= capacity; w++) {
        const skip = ctx.table[i - 1][w].value;
        const fits = item.weight <= w;
        const take = fits ? ctx.table[i - 1][w - item.weight].value + item.value : -1;
        // Ties go to skipping, and the backtrack asks the same question
        // ("did the value change?"), so the two agree by construction.
        const taking = fits && take > skip;
        ctx.table[i][w] = cell(taking ? take : skip, taking ? TAKE : SKIP);

        const deps = [{ r: i - 1, c: w, kind: taking ? "read" : "chosen" }];
        if (fits) deps.push({ r: i - 1, c: w - item.weight, kind: taking ? "chosen" : "read" });

        steps.push(
          snap(ctx, {
            cur: { r: i, c: w },
            deps,
            line: taking ? LINE.take : fits ? LINE.choose : LINE.skip,
            message: !fits
              ? `Item #${i} weighs ${item.weight} and the bag holds ${w} — it cannot go in, so copy the row above: ${skip}`
              : `Item #${i} (${item.weight}kg, ${item.value}) — skip and keep ${skip}, or take it and get ${
                  ctx.table[i - 1][w - item.weight].value
                } + ${item.value} = ${take} from the ${w - item.weight} left over. ${
                  taking ? `Take it: ${take}` : `Skipping wins: ${skip}`
                }`,
          })
        );
      }
    }

    const best = ctx.table[n][capacity].value;
    steps.push(
      snap(ctx, {
        phase: "done",
        cur: { r: n, c: capacity },
        line: LINE.backtrack,
        message: `K[${n}][${capacity}] = ${best}. The best value is known — which items made it up is not written anywhere yet.`,
      })
    );

    // ---- backtracking: the value changing between rows is the receipt ----
    const path = [];
    const chosen = [];
    let w = capacity;

    const auxOf = () => ({
      label: "ITEMS TAKEN",
      items: chosen.map((idx) => ({
        text: `#${idx + 1} (${items[idx].weight}kg, ${items[idx].value})`,
        tone: "take",
      })),
    });

    for (let i = n; i > 0; i--) {
      path.push({ r: i, c: w });
      const here = ctx.table[i][w].value;
      const above = ctx.table[i - 1][w].value;
      const item = items[i - 1];

      if (here !== above) {
        chosen.unshift(i - 1);
        const next = w - item.weight;
        steps.push(
          snap(ctx, {
            phase: "backtrack",
            cur: { r: i, c: w },
            deps: [
              { r: i - 1, c: w, kind: "read" },
              { r: i - 1, c: next, kind: "chosen" },
            ],
            path: [...path],
            line: LINE.backtrack,
            aux: auxOf(),
            message: `K[${i}][${w}] = ${here} but K[${i - 1}][${w}] = ${above} — item #${i} changed the answer, so it is in the bag. ${item.weight}kg used, ${next} left.`,
          })
        );
        w = next;
      } else {
        steps.push(
          snap(ctx, {
            phase: "backtrack",
            cur: { r: i, c: w },
            deps: [{ r: i - 1, c: w, kind: "chosen" }],
            path: [...path],
            line: LINE.backtrack,
            aux: auxOf(),
            message: `K[${i}][${w}] = K[${i - 1}][${w}] = ${here} — item #${i} made no difference, so it was left out. Step straight up.`,
          })
        );
      }
    }

    const weightUsed = chosen.reduce((sum, idx) => sum + items[idx].weight, 0);
    steps.push(
      snap(ctx, {
        phase: "done",
        path: [...path],
        line: null,
        aux: auxOf(),
        resultBadge: `VALUE ${best} — ${weightUsed}/${capacity} USED`,
        message: chosen.length
          ? `${chosen.length} item${chosen.length === 1 ? "" : "s"} worth ${best}, weighing ${weightUsed} of the ${capacity} available.`
          : "Nothing fits in a bag this small",
      })
    );

    return { steps };
  },
};

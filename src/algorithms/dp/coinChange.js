import {
  EMPTY,
  INF,
  MAX_AMOUNT,
  MAX_COINS,
  cell,
  countHeads,
  emptyTable,
  head,
  parseBounded,
  parseNumbers,
  snap,
} from "./helpers";

const PSEUDOCODE = [
  "C[0][0] = 0;  C[0][a>0] = ∞      (no coins, no change)",
  "for i = 1..n, for a = 0..A:",
  "    without = C[i-1][a]",
  "    if coin[i] <= a:",
  "        with = C[i][a - coin[i]] + 1     (same row: reuse allowed)",
  "    C[i][a] = min(without, with)",
  "backtrack: coin i was used iff C[i][a] != C[i-1][a]",
];

const LINE = { base: 0, loop: 1, without: 2, withCoin: 4, choose: 5, backtrack: 6 };

const USED = "✓";
const UNUSED = "·";

export const coinChange = {
  key: "coins",
  label: "Coin Change",
  short: "COIN CHANGE",
  group: "choices",
  fields: ["coins", "amount"],
  defaults: { coins: "1, 3, 4", amount: 6 },
  desc: "The fewest coins that add up to an amount, from a set of denominations you may reuse freely. Greedy — always take the largest coin that fits — is what people reach for and it is wrong on most coin systems: with 1, 3 and 4, greedy makes 6 as 4+1+1, three coins, when 3+3 does it in two. C[i][a] is the fewest coins making amount a using only the first i denominations. The recurrence looks almost exactly like the knapsack's, with one telling difference: taking a coin reads from the same row rather than the one above, because using a coin does not use it up.",
  time: "O(n·A)",
  space: "O(n·A)",
  pseudocode: PSEUDOCODE,

  random: () => {
    const pool = [1, 2, 3, 4, 5, 6, 7];
    const coins = new Set([1 + Math.floor(Math.random() * 2)]);
    while (coins.size < 3) coins.add(pool[Math.floor(Math.random() * pool.length)]);
    return {
      coins: [...coins].sort((a, b) => a - b).join(", "),
      amount: String(6 + Math.floor(Math.random() * 8)),
    };
  },

  parse(raw) {
    const coins = [...new Set(parseNumbers(raw.coins, MAX_COINS).filter((c) => c > 0))].sort(
      (a, b) => a - b
    );
    if (!coins.length) return { error: "Give at least one positive coin value." };
    const amount = parseBounded(raw.amount, 0, MAX_AMOUNT, 6);
    return { coins, amount };
  },

  run({ coins, amount }) {
    const n = coins.length;
    const ctx = {
      rows: [head(EMPTY, "0"), ...coins.map((c, i) => head(`${c}`, `coin ${i + 1}`))],
      cols: countHeads(amount),
      rowAxis: "COINS AVAILABLE",
      colAxis: "AMOUNT a",
      table: emptyTable(n + 1, amount + 1),
    };
    const steps = [];

    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.loop,
        message: `C[i][a] is the fewest coins making ${amount === 0 ? "0" : "each amount"} from {${coins.join(
          ", "
        )}} — and a coin can be used as often as you like`,
      })
    );

    // ∞ is a real value here rather than a blank: "cannot be made" has to
    // survive being read by the cells below it, and min(∞, x) = x is what
    // makes an unreachable amount stop spreading.
    ctx.table[0][0] = cell(0);
    for (let a = 1; a <= amount; a++) ctx.table[0][a] = cell(INF);
    steps.push(
      snap(ctx, {
        phase: "base",
        line: LINE.base,
        deps: Array.from({ length: amount + 1 }, (_, a) => ({ r: 0, c: a, kind: "read" })),
        message: "Row 0: with no coins, zero is free and every other amount is impossible — ∞, not 0",
      })
    );

    const numeric = (v) => (v === INF ? Infinity : v);

    for (let i = 1; i <= n; i++) {
      const coin = coins[i - 1];
      for (let a = 0; a <= amount; a++) {
        const without = numeric(ctx.table[i - 1][a].value);
        const fits = coin <= a;
        // The same row, not the row above: this is the one line that separates
        // unbounded coin change from the 0/1 knapsack.
        const withCoin = fits ? numeric(ctx.table[i][a - coin].value) + 1 : Infinity;
        const using = withCoin < without;
        const best = Math.min(without, withCoin);
        ctx.table[i][a] = cell(best === Infinity ? INF : best, using ? USED : UNUSED);

        const deps = [{ r: i - 1, c: a, kind: using ? "read" : "chosen" }];
        if (fits) deps.push({ r: i, c: a - coin, kind: using ? "chosen" : "read" });

        steps.push(
          snap(ctx, {
            cur: { r: i, c: a },
            deps,
            line: !fits ? LINE.without : using ? LINE.withCoin : LINE.choose,
            message: !fits
              ? `Coin ${coin} is bigger than ${a} — nothing to do but inherit ${
                  without === Infinity ? "∞" : without
                } from the row above`
              : `Amount ${a}: without coin ${coin} it takes ${
                  without === Infinity ? "∞" : without
                }; with it, one coin on top of C[${i}][${a - coin}] = ${
                  numeric(ctx.table[i][a - coin].value) === Infinity ? "∞" : numeric(ctx.table[i][a - coin].value)
                } → ${withCoin === Infinity ? "∞" : withCoin}. ${
                  using ? `Use it: ${best}` : `Keep ${best === Infinity ? "∞" : best}`
                }`,
          })
        );
      }
    }

    const answer = ctx.table[n][amount].value;
    const reachable = answer !== INF;
    steps.push(
      snap(ctx, {
        phase: "done",
        cur: { r: n, c: amount },
        line: LINE.backtrack,
        message: reachable
          ? `C[${n}][${amount}] = ${answer}. That is how many coins — not which ones.`
          : `C[${n}][${amount}] = ∞ — ${amount} cannot be made from these coins at all`,
      })
    );

    if (!reachable) {
      steps.push(
        snap(ctx, {
          phase: "done",
          line: null,
          resultBadge: `${amount} IS UNREACHABLE`,
          message: `Every combination of {${coins.join(", ")}} misses ${amount}. With a 1 in the set this can never happen, which is why most real coin systems have one.`,
        })
      );
      return { steps };
    }

    // ---- backtracking: a row that changed the answer is a coin that was spent ----
    const path = [];
    const used = [];
    let a = amount;
    let i = n;

    const auxOf = () => ({
      label: "COINS USED",
      items: used.map((c) => ({ text: String(c), tone: "take" })),
    });

    while (a > 0 && i > 0) {
      path.push({ r: i, c: a });
      const here = ctx.table[i][a].value;
      const above = ctx.table[i - 1][a].value;
      const coin = coins[i - 1];

      if (here !== above) {
        used.unshift(coin);
        const next = a - coin;
        steps.push(
          snap(ctx, {
            phase: "backtrack",
            cur: { r: i, c: a },
            deps: [{ r: i, c: next, kind: "chosen" }],
            path: [...path],
            line: LINE.backtrack,
            aux: auxOf(),
            message: `C[${i}][${a}] = ${here} beats C[${i - 1}][${a}] = ${
              above === INF ? "∞" : above
            }, so a ${coin} was spent here. ${next} left to make — and stay on this row, since the coin can be spent again.`,
          })
        );
        a = next;
      } else {
        steps.push(
          snap(ctx, {
            phase: "backtrack",
            cur: { r: i, c: a },
            deps: [{ r: i - 1, c: a, kind: "chosen" }],
            path: [...path],
            line: LINE.backtrack,
            aux: auxOf(),
            message: `C[${i}][${a}] = C[${i - 1}][${a}] = ${here} — coin ${coin} was never needed for ${a}. Step up.`,
          })
        );
        i -= 1;
      }
    }
    if (a === 0) path.push({ r: i, c: 0 });

    const greedy = greedyCount(coins, amount);
    steps.push(
      snap(ctx, {
        phase: "done",
        path: [...path],
        line: null,
        aux: auxOf(),
        resultBadge: `${answer} COIN${answer === 1 ? "" : "S"} — ${used.join(" + ")} = ${amount}`,
        message:
          greedy !== null && greedy > answer
            ? `${used.join(" + ")} = ${amount} in ${answer} coins. Greedy — largest coin first — would have used ${greedy}, which is the whole reason this needs a table.`
            : `${used.join(" + ")} = ${amount} in ${answer} coins. Greedy happens to find this one too; change the denominations and it stops doing so.`,
      })
    );

    return { steps };
  },
};

/** What always-take-the-largest would spend, or null if it gets stuck. */
function greedyCount(coins, amount) {
  let left = amount;
  let count = 0;
  for (let i = coins.length - 1; i >= 0; i--) {
    while (coins[i] <= left) {
      left -= coins[i];
      count += 1;
    }
  }
  return left === 0 ? count : null;
}

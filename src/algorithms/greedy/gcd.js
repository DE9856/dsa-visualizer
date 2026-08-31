import { MAX_GCD, auxOf, cell, chip, parseInteger, snap, widthFor } from "./helpers";

const PSEUDOCODE = [
  "while b != 0:",
  "    q = a / b        (integer division)",
  "    r = a - q*b      (the remainder)",
  "    a = b;  b = r",
  "return a",
];

const LINE = { LOOP: 0, QUOTIENT: 1, REMAINDER: 2, SHIFT: 3, DONE: 4 };

const COLUMNS = ["a", "b", "a ÷ b", "a mod b"];

export const gcd = {
  key: "gcd",
  label: "Euclid's GCD",
  short: "GCD",
  group: "number",
  fields: ["a", "b"],
  defaults: { a: "1071", b: "462" },
  desc:
    "The oldest algorithm still in use, and it rests on one observation: any number that divides both a and b also divides their remainder, so gcd(a, b) and gcd(b, a mod b) are the same. Replacing the pair with the smaller one loses nothing and shrinks the problem, and since the remainder is always smaller than b the descent has to end — at which point the last non-zero value is the answer. The quotient column is worth reading: the original version of this subtracted b from a repeatedly, and the quotient is exactly how many subtractions the modulo replaced in one step. That shortcut is what takes it from O(a) to O(log min(a, b)), and the worst case is consecutive Fibonacci numbers, where every quotient is 1 and no step ever gets to skip ahead.",
  time: "O(log min(a, b)) — the worst case is consecutive Fibonacci numbers",
  space: "O(1)",
  pseudocode: PSEUDOCODE,

  random: () => {
    const g = 2 + Math.floor(Math.random() * 30);
    return {
      a: String(g * (10 + Math.floor(Math.random() * 90))),
      b: String(g * (3 + Math.floor(Math.random() * 40))),
    };
  },

  parse(raw) {
    const a = parseInteger(raw.a);
    const b = parseInteger(raw.b);
    if (a === null || b === null) return { error: "Both values must be whole numbers." };
    if (a === 0 && b === 0) return { error: "gcd(0, 0) is undefined." };
    if (a > MAX_GCD || b > MAX_GCD) return { error: `Keep both at ${MAX_GCD} or below.` };
    return { a, b };
  },

  run({ a: a0, b: b0 }) {
    const steps = [];
    // Rows accumulate rather than being replaced, so the finished frame is the
    // whole descent at once — which is the thing worth looking at.
    const history = [];
    let subtractions = 0;

    const frame = (extra, live = null) => {
      const rows = [
        { label: "", offset: 0, cells: COLUMNS.map((c) => cell(c, "head")) },
        ...history.map((h, i) => ({
          label: `${i + 1}`,
          offset: 0,
          cells: [
            cell(h.a, "plain"),
            // On the closing row the answer is `b`, not `a`: the descent ends
            // when the remainder hits 0, and the last non-zero value in the
            // sequence is the divisor that produced it.
            cell(h.b, h.done ? "found" : "plain"),
            cell(h.q === null ? "" : h.q, h.q === null ? "dim" : "window"),
            cell(h.r === null ? "" : h.r, h.r === null ? "dim" : h.r === 0 ? "dim" : "active"),
          ],
        })),
      ];
      steps.push(
        snap({
          width: COLUMNS.length,
          cellWidth: widthFor(Math.max(7, String(Math.max(a0, b0)).length)),
          rows,
          aux: auxOf("CURRENT PAIR", [
            chip(live ? `gcd(${live.a}, ${live.b})` : `gcd(${a0}, ${b0})`, "take"),
            chip(`${subtractions} subtraction${subtractions === 1 ? "" : "s"} skipped`, "plain"),
          ]),
          ...extra,
        })
      );
    };

    let a = Math.max(a0, b0);
    let b = Math.min(a0, b0);

    if (a0 < b0) {
      history.push({ a, b, q: null, r: null });
      frame(
        {
          line: LINE.LOOP,
          message: `Swapped so the larger comes first — the first step would have done it anyway, since ${a0} mod ${b0} is just ${a0}.`,
        },
        { a, b }
      );
      history.pop();
    }

    while (b !== 0) {
      const q = Math.floor(a / b);
      const r = a - q * b;
      subtractions += q;

      history.push({ a, b, q: null, r: null });
      frame({ line: LINE.LOOP, message: `b is ${b}, which is not 0, so there is still work to do.` }, { a, b });

      history[history.length - 1].q = q;
      frame(
        {
          line: LINE.QUOTIENT,
          message: `${b} goes into ${a} ${q} time${q === 1 ? "" : "s"} — that is ${q} subtraction${q === 1 ? "" : "s"} done in one step.`,
        },
        { a, b }
      );

      history[history.length - 1].r = r;
      frame(
        {
          line: LINE.REMAINDER,
          message:
            r === 0
              ? `${a} = ${q} × ${b} exactly, so ${b} divides ${a} — the descent ends here.`
              : `${a} = ${q} × ${b} + ${r}. Anything dividing ${a} and ${b} divides ${r} too, so gcd(${a}, ${b}) = gcd(${b}, ${r}).`,
        },
        { a, b }
      );

      a = b;
      b = r;
      if (b !== 0) {
        frame({ line: LINE.SHIFT, message: `Carry on with the smaller pair: gcd(${a}, ${b}).` }, { a, b });
      }
    }

    if (history.length) history[history.length - 1].done = true;
    frame({
      line: LINE.DONE,
      message: `b reached 0, so the last non-zero value is the answer. Modulo did the work of ${subtractions} subtractions in ${history.length} step${history.length === 1 ? "" : "s"}.`,
      resultBadge: `gcd(${a0}, ${b0}) = ${a}`,
    });

    return { steps };
  },
};

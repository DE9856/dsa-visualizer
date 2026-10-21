import {
  MAX_BASE,
  MAX_EXPONENT,
  MAX_PLAIN_DIGITS,
  auxOf,
  cell,
  chip,
  parseInteger,
  pointer,
  snap,
  widthFor,
} from "./helpers";

const PSEUDOCODE = [
  "result = 1;  b = base;  e = exponent",
  "while e > 0:",
  "    if e is odd:",
  "        result = result * b",
  "    b = b * b",
  "    e = e >> 1        (halve it, dropping the bit)",
  "return result",
];

const LINE = { INIT: 0, LOOP: 1, TEST: 2, MULTIPLY: 3, SQUARE: 4, HALVE: 5, DONE: 6 };

/** Big enough to be exact — 2^64 does not fit in a double, and silently rounding is worse than being slow. */
const big = (n) => BigInt(n);

export const fastPower = {
  key: "fastpow",
  label: "Fast Exponentiation",
  short: "FAST POWER",
  group: "number",
  fields: ["base", "exponent", "modulus"],
  defaults: { base: "3", exponent: "13", modulus: "0" },
  desc:
    "Computing bⁿ by multiplying b by itself n times costs n multiplications. Binary exponentiation costs about log₂n, by reading the exponent in binary: b¹³ is b⁸·b⁴·b¹, because 13 is 1101 in binary, and each of those powers is the square of the one before it. So the algorithm keeps squaring the base and halving the exponent, folding the current square into the answer whenever the bit that just fell off was a 1. Thirteen becomes six multiplications instead of twelve; a 2048-bit exponent becomes about three thousand instead of a number with six hundred digits. This is what makes RSA and Diffie–Hellman computable at all, which is why the modulus is here — carried through every step, the intermediate values stay small no matter how large the exponent gets.",
  time: "O(log n) multiplications",
  space: "O(1) — three running values",
  pseudocode: PSEUDOCODE,

  // A random example has to be one `parse` will accept: with no modulus the
  // exponent is capped by the same digit limit parse enforces, so the shuffle
  // button can never land on an input its own validator refuses.
  random: () => {
    const base = 2 + Math.floor(Math.random() * 8);
    const withMod = Math.random() < 0.5;
    if (withMod) {
      return {
        base: String(base),
        exponent: String(8 + Math.floor(Math.random() * 40)),
        modulus: String(2 + Math.floor(Math.random() * 998)),
      };
    }
    const ceiling = Math.floor((MAX_PLAIN_DIGITS - 1) / Math.log10(base));
    return {
      base: String(base),
      exponent: String(Math.max(2, Math.min(ceiling, 4 + Math.floor(Math.random() * (ceiling - 3))))),
      modulus: "0",
    };
  },

  parse(raw) {
    const base = parseInteger(raw.base);
    const exponent = parseInteger(raw.exponent);
    const modulus = parseInteger(raw.modulus);
    if (base === null || exponent === null || modulus === null) {
      return { error: "Base, exponent and modulus must be whole numbers." };
    }
    if (base > MAX_BASE) return { error: `Keep the base at ${MAX_BASE} or below.` };
    if (exponent > MAX_EXPONENT) return { error: `Keep the exponent at ${MAX_EXPONENT} or below.` };
    if (modulus === 1) return { error: "A modulus of 1 makes everything 0. Use 0 for no modulus." };

    // With no modulus the values are exact BigInts, and they grow fast enough
    // to stop being readable long before they stop being computable.
    if (modulus === 0 && base > 1 && exponent > 0) {
      const digits = Math.log10(base) * exponent + 1;
      if (digits > MAX_PLAIN_DIGITS) {
        return {
          error: `${base}^${exponent} has about ${Math.round(digits)} digits, too wide to read. Set a modulus.`,
        };
      }
    }
    return { base, exponent, modulus };
  },

  run({ base, exponent, modulus }) {
    const steps = [];
    const mod = big(modulus);
    const useMod = modulus > 0;
    const reduce = (x) => (useMod ? x % mod : x);

    // The bits, least significant first — the order the loop consumes them.
    const bits = [];
    for (let e = exponent; e > 0; e = Math.floor(e / 2)) bits.push(e % 2);
    if (bits.length === 0) bits.push(0);
    const width = bits.length;

    let result = reduce(1n);
    let b = reduce(big(base));
    // Widest value the run will produce, worked out up front so the columns do
    // not resize underneath the animation.
    let widest = 1;
    {
      let probe = reduce(big(base));
      for (let i = 0; i < width; i++) {
        widest = Math.max(widest, probe.toString().length);
        probe = reduce(probe * probe);
      }
      let acc = reduce(1n);
      let sq = reduce(big(base));
      for (let i = 0; i < width; i++) {
        if (bits[i]) acc = reduce(acc * sq);
        widest = Math.max(widest, acc.toString().length);
        sq = reduce(sq * sq);
      }
    }
    let multiplications = 0;

    // What each column holds: the bit, the square standing at that position,
    // and the running answer after that bit was dealt with.
    const squares = new Array(width).fill(null);
    const running = new Array(width).fill(null);

    const frame = (extra, at = -1) => {
      const tones = bits.map((bit, i) => {
        if (i > at) return "dim";
        return bit ? "found" : "mismatch";
      });
      steps.push(
        snap({
          width,
          // The squares are the widest thing here, and without a modulus they
          // grow every step, so the column is sized to the largest one the run
          // will ever hold rather than to whatever is on screen now.
          cellWidth: widthFor(widest),
          rows: [
            {
              label: "BIT",
              offset: 0,
              cells: bits.map((bit, i) => cell(bit, i === at ? "active" : tones[i], `2^${i}`)),
            },
            {
              label: "b^(2^i)",
              offset: 0,
              cells: squares.map((v, i) => cell(v === null ? "" : v.toString(), v === null ? "dim" : tones[i])),
            },
            {
              label: "RESULT",
              offset: 0,
              cells: running.map((v, i) => cell(v === null ? "" : v.toString(), v === null ? "dim" : tones[i])),
            },
          ],
          pointers: at >= 0 ? [pointer(`bit ${at}`, at, "active")] : [],
          aux: auxOf("RUNNING", [
            chip(`result ${result.toString()}`, "take"),
            chip(`${multiplications} multiplication${multiplications === 1 ? "" : "s"}`, "plain"),
            chip(useMod ? `mod ${modulus}` : "exact", useMod ? "skip" : "plain"),
          ]),
          ...extra,
        })
      );
    };

    frame({
      line: LINE.INIT,
      message: `${exponent} in binary is ${bits.slice().reverse().join("") || "0"}, read here least-significant bit first. result = 1, b = ${base}.`,
    });

    for (let i = 0; i < width; i++) {
      squares[i] = b;
      frame(
        {
          line: LINE.TEST,
          message: `Bit ${i} of the exponent is ${bits[i]}, and b squared ${i} time${i === 1 ? "" : "s"} is ${b.toString()}.`,
        },
        i
      );

      if (bits[i]) {
        result = reduce(result * b);
        multiplications++;
        frame(
          {
            line: LINE.MULTIPLY,
            message: `The bit is 1, so ${base}^${2 ** i} is part of the answer: fold it in to get ${result.toString()}.`,
          },
          i
        );
      } else {
        frame(
          { line: LINE.TEST, message: `The bit is 0, so this square is not part of the answer — skip it.` },
          i
        );
      }
      running[i] = result;

      // Squaring past the last bit would be work nobody needs; the loop
      // condition in the pseudocode is what stops it.
      if (i < width - 1) {
        b = reduce(b * b);
        multiplications++;
        frame(
          {
            line: LINE.SQUARE,
            message: `Square b to reach ${base}^${2 ** (i + 1)} = ${b.toString()}, and halve the exponent.`,
          },
          i
        );
      }
    }

    const naive = exponent > 0 ? exponent - 1 : 0;
    // Every bit has been decided by now, so the closing frame names the last
    // column as active — otherwise the finished table renders entirely dimmed.
    frame(
      {
        line: LINE.DONE,
        message: `${multiplications} multiplications instead of ${naive}. The saving is the difference between n and log₂n, and it is what makes modular exponentiation on cryptographic key sizes possible at all.`,
        resultBadge: `${base}^${exponent}${useMod ? ` mod ${modulus}` : ""} = ${result.toString()}`,
      },
      width - 1
    );

    return { steps };
  },
};

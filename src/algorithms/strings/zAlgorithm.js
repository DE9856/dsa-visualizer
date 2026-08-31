import {
  MAX_PATTERN,
  MAX_TEXT,
  SEPARATOR,
  charRow,
  indexRow,
  numberRow,
  parseText,
  pointer,
  randomTextWith,
  snap,
} from "./helpers";

const PSEUDOCODE = [
  "s = P + '$' + T          (the separator matches nothing)",
  "z[0] = |s|;  l = r = 0",
  "for i = 1..|s|-1:",
  "    if i < r:  z[i] = min(r - i, z[i - l])    ← copied from the mirror",
  "    while i + z[i] < |s| and s[z[i]] == s[i + z[i]]:  z[i] += 1",
  "    if i + z[i] > r:  l = i;  r = i + z[i]    ← a window reaching further",
  "    if z[i] == |P|:  the pattern occurs here",
];

const LINE = { setup: 0, base: 1, loop: 2, mirror: 3, extend: 4, window: 5, hit: 6 };

export const zAlgorithm = {
  key: "z",
  label: "Z-Algorithm",
  short: "Z-ALGO",
  group: "matching",
  fields: ["text", "pattern"],
  defaults: { text: "ABABDABACDABABCABAB", pattern: "ABAB" },
  desc: "Z[i] is the length of the longest substring starting at i that is also a prefix of the string. Computed naively that is O(n²); the trick is that once you have matched a stretch [l, r] against the prefix, everything inside it is already known — position i inside that window has a mirror at i−l near the front of the string, and its Z value can be copied rather than recomputed. Only the part that reaches past r ever needs real character comparisons, and r only moves forward, which is what makes the whole thing linear. For matching, run it on P + '$' + T: the separator can match nothing, so any position where Z equals the pattern's length is an occurrence.",
  time: "O(n + m)",
  space: "O(n + m) for the Z array",
  pseudocode: PSEUDOCODE,

  random: () => {
    const pattern = "ABAB".slice(0, 3 + Math.floor(Math.random() * 2));
    return { pattern, text: randomTextWith(pattern, 18, "AB") };
  },

  parse(raw) {
    const text = parseText(raw.text, MAX_TEXT);
    const pattern = parseText(raw.pattern, MAX_PATTERN);
    if (!text || !pattern) return { error: "Both a text and a pattern are needed." };
    if (text.includes(SEPARATOR) || pattern.includes(SEPARATOR)) {
      return { error: `${SEPARATOR} is used as the separator, so it cannot appear in either string.` };
    }
    return { text, pattern };
  },

  run({ text, pattern }) {
    const m = pattern.length;
    const s = pattern + SEPARATOR + text;
    const n = s.length;
    const z = new Array(n).fill(null);
    const steps = [];
    const matches = [];

    const sepAt = m;

    const rows = (charTones = {}) => [
      indexRow(n),
      charRow("P $ T", s, { [sepAt]: "sep", ...charTones }),
      numberRow("Z", z),
    ];

    const auxNow = () => ({
      label: "MATCHES IN THE TEXT",
      items: matches.length
        ? matches.map((at) => ({ text: `at ${at}`, tone: "take" }))
        : [{ text: "none yet", tone: "plain" }],
    });

    steps.push(
      snap({
        width: n,
        rows: rows(),
        line: LINE.setup,
        aux: auxNow(),
        message: `The pattern, a separator, then the text — ${n} characters. Any position whose Z value reaches ${m} is an occurrence of the pattern, because that is exactly "the next ${m} characters equal the prefix".`,
      })
    );

    z[0] = n;
    let l = 0;
    let r = 0;

    steps.push(
      snap({
        width: n,
        rows: rows({ 0: "active" }),
        pointers: [pointer("i", 0, "active")],
        line: LINE.base,
        aux: auxNow(),
        message: `Z[0] is the whole string by definition — the prefix trivially matches itself. The window [l, r) starts empty.`,
      })
    );

    for (let i = 1; i < n; i++) {
      let copied = null;
      z[i] = 0;

      if (i < r) {
        copied = Math.min(r - i, z[i - l]);
        z[i] = copied;
        const tones = {};
        for (let x = l; x < r; x++) tones[x] = "window";
        for (let x = i - l; x < i - l + copied; x++) tones[x] = "border";
        tones[i] = "active";
        steps.push(
          snap({
            width: n,
            rows: rows(tones),
            pointers: [pointer("l", l, "window"), pointer("i", i, "active"), pointer("r", Math.max(0, r - 1), "window")],
            line: LINE.mirror,
            aux: auxNow(),
            message: `${i} is inside the window [${l}, ${r}), which already matches the prefix. Its mirror is ${
              i - l
            }, where Z = ${z[i - l]} — so Z[${i}] starts at min(${r - i}, ${z[i - l]}) = ${copied} without a single comparison.`,
          })
        );
      }

      const before = z[i];
      while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i] += 1;

      const grew = z[i] - before;
      const tones = {};
      for (let x = 0; x < z[i]; x++) tones[x] = "border";
      for (let x = i; x < i + z[i]; x++) tones[x] = "match";
      tones[i] = z[i] > 0 ? "match" : "mismatch";
      steps.push(
        snap({
          width: n,
          rows: rows(tones),
          pointers: [pointer("i", i, "active")],
          line: LINE.extend,
          aux: auxNow(),
          message:
            z[i] === 0
              ? `s[${i}] = ${s[i]} does not match the prefix's first character — Z[${i}] = 0.`
              : `Z[${i}] = ${z[i]}: "${s.slice(i, i + z[i])}" matches the prefix. ${
                  copied === null
                    ? `Compared from scratch, ${grew} character${grew === 1 ? "" : "s"} deep.`
                    : grew === 0
                      ? `All ${copied} of it came from the mirror — no comparisons at all.`
                      : `${copied} came free from the mirror; only ${grew} needed comparing.`
                }`,
        })
      );

      if (i + z[i] > r) {
        l = i;
        r = i + z[i];
        if (z[i] > 0) {
          const wt = {};
          for (let x = l; x < r; x++) wt[x] = "window";
          steps.push(
            snap({
              width: n,
              rows: rows(wt),
              pointers: [pointer("l", l, "window"), pointer("r", r - 1, "window")],
              line: LINE.window,
              aux: auxNow(),
              message: `This match reaches further right than the old window, so it becomes the new one: [${l}, ${r}). r only ever moves forward, and that is why the whole scan is linear.`,
            })
          );
        }
      }

      if (z[i] === m) {
        const at = i - m - 1;
        matches.push(at);
        const mt = {};
        for (let x = i; x < i + m; x++) mt[x] = "found";
        for (let x = 0; x < m; x++) mt[x] = "found";
        steps.push(
          snap({
            width: n,
            rows: rows(mt),
            pointers: [pointer("i", i, "active")],
            phase: "match",
            line: LINE.hit,
            aux: auxNow(),
            message: `Z[${i}] = ${m}, the pattern's whole length — an occurrence at text index ${at}. It cannot run past the separator, which is the only reason a plain Z value can be read as a match.`,
          })
        );
      }
    }

    steps.push(
      snap({
        width: n,
        rows: rows(),
        phase: "done",
        line: null,
        aux: auxNow(),
        resultBadge: matches.length
          ? `${matches.length} MATCH${matches.length === 1 ? "" : "ES"} — AT ${matches.join(", ")}`
          : "NO MATCH",
        message: matches.length
          ? `Found at ${matches.join(", ")}. Every Z value came either from a mirror inside an existing window or from comparisons that pushed r further right — and r moves forward at most ${n} times in total.`
          : `The pattern does not occur: no Z value ever reached ${m}.`,
      })
    );

    return { steps };
  },
};

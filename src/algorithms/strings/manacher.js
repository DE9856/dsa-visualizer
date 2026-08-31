import { charRow, indexRow, numberRow, parseText, pointer, randomString, snap } from "./helpers";

const PSEUDOCODE = [
  "t = '#' between every character of s, and at both ends",
  "for i = 0..|t|-1:",
  "    if i < R:  p[i] = min(R - i, p[2C - i])   ← copied from the mirror",
  "    while t[i - p[i] - 1] == t[i + p[i] + 1]:  p[i] += 1",
  "    if i + p[i] > R:  C = i;  R = i + p[i]    ← a palindrome reaching further",
  "answer: the largest p[i] — its value is the length in s",
];

const LINE = { transform: 0, loop: 1, mirror: 2, expand: 3, window: 4, answer: 5 };

// A 20-character text becomes 41 positions, which is about eighty frames.
const MAX_MANACHER = 20;

export const manacher = {
  key: "manacher",
  label: "Manacher",
  short: "MANACHER",
  group: "palindromes",
  fields: ["text"],
  defaults: { text: "ABACABABA" },
  desc: "The longest palindromic substring, in linear time. Checking every centre and expanding outwards is O(n²), and it repeats work: if you already know a long palindrome centred at C, then everything inside it is mirrored, so the radius at a position on the right half is at least the radius at its mirror on the left half. Manacher's uses that as a free lower bound and only ever compares characters that push the known palindrome further right — and since the right edge only moves forward, the total comparing is linear. The '#' separators are the other half of the trick: interleaving them makes every palindrome odd-length, so even-length ones need no special case at all.",
  time: "O(n)",
  space: "O(n) for the radius array",
  pseudocode: PSEUDOCODE,

  random: () => {
    const half = randomString(3, 4, "ABC");
    const mid = Math.random() < 0.5 ? "" : randomString(1, 1, "ABC");
    return { text: half + mid + [...half].reverse().join("") };
  },

  parse(raw) {
    const text = parseText(raw.text, MAX_MANACHER);
    if (text.length < 2) return { error: "Give at least two characters." };
    return { text };
  },

  run({ text }) {
    // Interleaved with separators so every palindrome is odd-length. A radius
    // in t is exactly the palindrome's length in s, which is the small miracle
    // that makes the bookkeeping disappear.
    const t = `#${[...text].join("#")}#`;
    const n = t.length;
    const p = new Array(n).fill(null);
    const steps = [];

    const sepTones = () => {
      const tones = {};
      for (let i = 0; i < n; i += 2) tones[i] = "sep";
      return tones;
    };

    const rows = (extra = {}) => [
      indexRow(n),
      charRow("# TEXT #", t, { ...sepTones(), ...extra }),
      numberRow("RADIUS", p),
    ];

    steps.push(
      snap({
        width: n,
        rows: rows(),
        line: LINE.transform,
        message: `"${text}" becomes "${t}". Every palindrome in here is odd-length and centred on a real character or on a separator, so even-length palindromes need no separate case — and a radius in this string is the palindrome's length back in the original.`,
      })
    );

    let center = 0;
    let right = 0;
    let best = 0;
    let bestAt = 0;

    for (let i = 0; i < n; i++) {
      let copied = null;
      p[i] = 0;

      if (i < right) {
        const mirror = 2 * center - i;
        copied = Math.min(right - i, p[mirror]);
        p[i] = copied;
        const tones = {};
        for (let x = Math.max(0, 2 * center - right); x <= right && x < n; x++) tones[x] = "window";
        for (let x = mirror - copied; x <= mirror + copied; x++) if (x >= 0 && x < n) tones[x] = "border";
        tones[i] = "active";
        tones[mirror] = "border";
        steps.push(
          snap({
            width: n,
            rows: rows(tones),
            pointers: [
              pointer("C", center, "window"),
              pointer("mirror", mirror, "border"),
              pointer("i", i, "active"),
              pointer("R", Math.min(right, n - 1), "window"),
            ],
            line: LINE.mirror,
            message: `${i} sits inside the palindrome centred at ${center} that reaches to ${right}. Its mirror is ${mirror}, whose radius is ${p[mirror]} — so radius ${i} starts at min(${
              right - i
            }, ${p[mirror]}) = ${copied} for free.`,
          })
        );
      }

      const before = p[i];
      while (i - p[i] - 1 >= 0 && i + p[i] + 1 < n && t[i - p[i] - 1] === t[i + p[i] + 1]) p[i] += 1;
      const grew = p[i] - before;

      const tones = {};
      for (let x = i - p[i]; x <= i + p[i]; x++) if (x >= 0 && x < n) tones[x] = "match";
      tones[i] = "active";
      const span = t.slice(i - p[i], i + p[i] + 1).replace(/#/g, "");

      steps.push(
        snap({
          width: n,
          rows: rows({ ...sepTones(), ...tones }),
          pointers: [pointer("i", i, "active")],
          line: LINE.expand,
          message:
            p[i] === 0
              ? `Nothing extends from ${i} — radius 0.`
              : `Radius ${p[i]} at ${i}: "${span}" is a palindrome. ${
                  copied === null
                    ? `Expanded from scratch, ${grew} step${grew === 1 ? "" : "s"}.`
                    : grew === 0
                      ? `Entirely inherited from the mirror — no comparisons at all.`
                      : `${copied} came free from the mirror; only ${grew} needed comparing.`
                }`,
        })
      );

      if (i + p[i] > right) {
        center = i;
        right = i + p[i];
        if (p[i] > 0) {
          const wt = {};
          for (let x = i - p[i]; x <= i + p[i]; x++) if (x >= 0 && x < n) wt[x] = "window";
          steps.push(
            snap({
              width: n,
              rows: rows({ ...sepTones(), ...wt }),
              pointers: [pointer("C", center, "window"), pointer("R", Math.min(right, n - 1), "window")],
              line: LINE.window,
              message: `This palindrome reaches further right than the last, so it becomes the reference: C = ${center}, R = ${right}. R never moves left, which is what bounds the total work.`,
            })
          );
        }
      }

      if (p[i] > best) {
        best = p[i];
        bestAt = i;
      }
    }

    const start = (bestAt - best) / 2;
    const answer = text.slice(start, start + best);
    const finalTones = {};
    for (let x = bestAt - best; x <= bestAt + best; x++) if (x >= 0 && x < n) finalTones[x] = "found";

    steps.push(
      snap({
        width: n,
        rows: rows({ ...sepTones(), ...finalTones }),
        pointers: [pointer("i", bestAt, "found")],
        phase: "done",
        line: LINE.answer,
        aux: {
          label: "LONGEST PALINDROME",
          items: [
            { text: answer, tone: "take" },
            { text: `length ${best}`, tone: "plain" },
            { text: `at index ${start}`, tone: "plain" },
          ],
        },
        resultBadge: `"${answer}" — LENGTH ${best} AT ${start}`,
        message: `The largest radius is ${best}, at position ${bestAt} of the padded string, which is "${answer}" starting at index ${start} of "${text}". Expanding around every centre would have been O(n²); the mirror made most of these radii free.`,
      })
    );

    return { steps };
  },
};

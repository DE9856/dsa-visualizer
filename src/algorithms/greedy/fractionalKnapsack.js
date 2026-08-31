import {
  MAX_ITEMS,
  auxOf,
  cell,
  chip,
  parseInteger,
  parsePairs,
  pointer,
  randomItems,
  widthFor,
  snap,
} from "./helpers";

const PSEUDOCODE = [
  "sort the items by value/weight, highest first",
  "room = capacity;  total = 0",
  "for each item in that order:",
  "    if item.weight <= room:",
  "        take all of it;  room -= weight;  total += value",
  "    else:",
  "        take room/weight of it;  total += value * room/weight",
  "        room = 0;  stop — the sack is full",
];

const LINE = { SORT: 0, INIT: 1, LOOP: 2, TEST: 3, WHOLE: 4, ELSE: 5, PART: 6, STOP: 7 };

const round2 = (x) => Math.round(x * 100) / 100;

export const fractionalKnapsack = {
  key: "fracknap",
  label: "Fractional Knapsack",
  short: "FRACTIONAL KNAPSACK",
  group: "greedy",
  fields: ["items", "capacity"],
  defaults: { items: "60/10, 100/20, 120/30", capacity: "50" },
  desc:
    "Items have a value and a weight, the sack has a capacity, and — crucially — items can be cut. Sort by value per unit of weight and pour them in best-first, cutting whichever item happens to straddle the limit. That is optimal, and the proof is short: if any part of the sack held something with a lower ratio while a higher-ratio item was still available outside, swapping an equal weight of the two would raise the total, so no optimal packing can be arranged any other way. The whole result rests on items being divisible. Take that away and the greedy rule is simply wrong — 0/1 knapsack can be forced into a case where the best ratio item must be left behind entirely, which is why that version needs dynamic programming and this one does not.",
  time: "O(n log n) — the sort; the pour is O(n)",
  space: "O(n) for the sorted order",
  pseudocode: PSEUDOCODE,

  random: () => ({ items: randomItems(5), capacity: String(40 + Math.floor(Math.random() * 40)) }),

  parse(raw) {
    const parsed = parsePairs(raw.items, MAX_ITEMS);
    if (parsed.error) return { error: parsed.error };
    const capacity = parseInteger(raw.capacity);
    if (capacity === null || capacity <= 0) return { error: "Capacity must be a positive whole number." };

    const items = [];
    for (const [value, weight] of parsed.pairs) {
      if (weight <= 0) return { error: "An item needs a positive weight." };
      if (value <= 0) return { error: "An item needs a positive value." };
      items.push({ value, weight });
    }
    return { items, capacity };
  },

  run({ items, capacity }) {
    const steps = [];
    const sorted = items
      .map((it, i) => ({ ...it, original: i, ratio: it.value / it.weight }))
      .sort((a, b) => b.ratio - a.ratio);

    const width = sorted.length;
    // How much of each item ended up in the sack: 1, a fraction, or 0.
    const taken = new Array(width).fill(null);
    let room = capacity;
    let total = 0;

    const toneFor = (i, active) => {
      if (taken[i] === null) return active === i ? "active" : "dim";
      if (taken[i] === 0) return "mismatch";
      if (taken[i] === 1) return "found";
      return "window";
    };

    const frame = (extra, active = -1) => {
      const tones = sorted.map((_, i) => toneFor(i, active));
      steps.push(
        snap({
          width,
          cellWidth: widthFor(
            Math.max(4, ...sorted.map((it) => String(it.value).length), ...sorted.map((it) => String(round2(it.ratio)).length))
          ),
          rows: [
            { label: "", offset: 0, cells: sorted.map((it) => cell(`A${it.original + 1}`, "head")) },
            { label: "VALUE", offset: 0, cells: sorted.map((it, i) => cell(it.value, tones[i])) },
            { label: "WEIGHT", offset: 0, cells: sorted.map((it, i) => cell(it.weight, tones[i])) },
            {
              label: "V/W",
              offset: 0,
              cells: sorted.map((it, i) => cell(round2(it.ratio), tones[i])),
            },
            {
              label: "TAKEN",
              offset: 0,
              cells: sorted.map((it, i) =>
                cell(
                  taken[i] === null ? "" : taken[i] === 1 ? "all" : taken[i] === 0 ? "—" : round2(taken[i]),
                  tones[i],
                  taken[i] !== null && taken[i] > 0 && taken[i] < 1 ? `${round2(taken[i] * it.weight)}kg` : undefined
                )
              ),
            },
          ],
          aux: auxOf("SACK", [
            chip(`room left ${round2(room)} of ${capacity}`, room > 0 ? "plain" : "skip"),
            chip(`value ${round2(total)}`, "take"),
          ]),
          ...extra,
        })
      );
    };

    frame({
      line: LINE.SORT,
      message: `Sorted by value per unit weight: ${sorted.map((it) => `A${it.original + 1} (${round2(it.ratio)})`).join(", ")}. Nothing else about the items matters from here.`,
    });
    frame({ line: LINE.INIT, message: `The sack holds ${capacity} and is empty.` });

    for (let i = 0; i < sorted.length; i++) {
      const it = sorted[i];
      const pointers = [pointer(`A${it.original + 1}`, i, "active")];

      if (room <= 0) {
        taken[i] = 0;
        frame({ line: LINE.STOP, pointers, message: `The sack is full, so A${it.original + 1} is left behind entirely.` }, i);
        continue;
      }

      frame(
        { line: LINE.TEST, pointers, message: `A${it.original + 1} weighs ${it.weight} and there is ${round2(room)} of room. Does all of it fit?` },
        i
      );

      if (it.weight <= room) {
        taken[i] = 1;
        room -= it.weight;
        total += it.value;
        frame({
          line: LINE.WHOLE,
          pointers,
          message: `Yes — take all of it. ${round2(room)} of room left, ${round2(total)} of value.`,
        });
      } else {
        // The one cut in the whole algorithm, and the only reason the greedy
        // rule is exactly optimal rather than approximately so.
        const fraction = room / it.weight;
        taken[i] = fraction;
        total += it.value * fraction;
        room = 0;
        frame({
          line: LINE.PART,
          pointers,
          message: `No — so cut it. ${round2(fraction * 100)}% of A${it.original + 1} fills the last ${round2(fraction * it.weight)} exactly, adding ${round2(it.value * fraction)}.`,
        });
      }
    }

    frame({
      line: null,
      message:
        room > 0
          ? `Every item fitted, with ${round2(room)} of room to spare — total value ${round2(total)}.`
          : `The sack is full at exactly ${capacity}, and no other packing of these items beats ${round2(total)}.`,
      resultBadge: `MAXIMUM VALUE ${round2(total)}`,
    });

    return { steps };
  },
};

import { LAYOUT_MAP, frame, showIndex, slotCount, slotOf, storageOrder } from "./helpers";

/**
 * The two traversal orders, built from one maker.
 *
 * They are deliberately not two files. The whole point is that they are the
 * *same* walk with the index order swapped, and that whether either one is
 * fast depends entirely on the layout underneath — so the code they share is
 * the claim being made, and splitting it in two would hide it.
 */
function walker({ key, label, fastest, describe }) {
  return {
    key,
    label,
    group: "locality",
    layouts: "dense",
    fields: [],
    desc: describe,
    time: "O(cells)",
    space: "O(1)",

    run(dims, { layout }) {
      const slots = slotCount(layout, dims);
      const memory = new Array(slots).fill(null);
      storageOrder(layout, dims).forEach((idx, at) => {
        memory[at] = idx;
      });

      const ctx = { layout, dims, slots, memory, visited: new Set() };
      const steps = [];
      // The order this traversal visits cells in — which is the storage order
      // of one layout or the other, whatever the array is actually stored as.
      const order = LAYOUT_MAP[fastest].order(dims);
      const matches = fastest === layout;

      steps.push(
        frame(ctx, {
          message: `Read every element ${label.toLowerCase()} — the ${
            matches ? "same" : "opposite"
          } order this array is stored in. Watch the slot numbers.`,
        })
      );

      let previous = null;
      let jumps = 0;
      let span = 0;

      order.forEach((index) => {
        const { slot } = slotOf(layout, dims, index);
        const jump = previous === null ? null : slot - previous;
        if (jump !== null && jump !== 1) jumps++;
        if (jump !== null) span += Math.abs(jump);
        ctx.visited.add(index.join(","));
        steps.push(
          frame(ctx, {
            cursor: index,
            slot,
            jump,
            message:
              jump === null
                ? `A${showIndex(index)} is slot ${slot}.`
                : jump === 1
                  ? `A${showIndex(index)} is slot ${slot} — the very next one. Already in the cache line the last read pulled in.`
                  : `A${showIndex(index)} is slot ${slot}, a jump of ${jump > 0 ? "+" : ""}${jump}. Nothing about the last read helped.`,
          })
        );
        previous = slot;
      });

      const stride = order.length > 1 ? span / (order.length - 1) : 0;
      steps.push(
        frame(ctx, {
          resultBadge: matches ? `${jumps} JUMPS — WITH THE GRAIN` : `${jumps} JUMPS — AGAINST THE GRAIN`,
          message: matches
            ? `Every step but the first landed on the next slot: ${jumps} jumps in ${
                order.length - 1
              } steps. This traversal matches the layout, so the hardware's prefetcher is right every time — and this is the only difference between the fast version of a matrix loop and the slow one.`
            : `${jumps} jumps out of ${order.length - 1} steps, averaging ${stride.toFixed(
                1
              )} slots each. Same elements, same count, same arithmetic — and on a real machine several times slower, because almost every read misses. Swapping the two loops is the entire fix.`,
        })
      );

      return { steps, finalDims: dims };
    },
  };
}

export const walkByRows = walker({
  key: "walkRows",
  label: "By Rows",
  fastest: "rowmajor",
  describe:
    "Traverse the whole array with the last index in the inner loop — for a 2-D array, along each row in turn. On a row-major array every step lands on the next slot and the processor's prefetcher is right every single time. On a column-major array the identical loop jumps a row's width on every step, misses the cache on nearly every read, and runs several times slower for exactly the same arithmetic. This is the most valuable thing to know about array layout, and the reason BLAS routines come in two flavours.",
});

export const walkByColumns = walker({
  key: "walkCols",
  label: "By Columns",
  fastest: "colmajor",
  describe:
    "The same traversal with the loops swapped: the first index in the inner loop, so for a 2-D array it goes down each column. Now it is the column-major array that is read contiguously and the row-major one that thrashes. Neither order is right in itself — 'sequential' is a property of the pair, the layout and the loop, and that is the whole lesson. Run this and 'By Rows' against both dense layouts and compare the jump counts.",
});

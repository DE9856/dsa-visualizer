import { LAYOUT_MAP, frame, logicalCount, showIndex, slotCount, storageOrder } from "./helpers";

export const layoutWalk = {
  key: "layout",
  label: "Lay It Out in Memory",
  group: "address",
  layouts: "all",
  fields: [],
  desc: "The array, emptied into the one dimension it actually has. Slot 0, then slot 1, and so on — and the interesting part is which logical cell each slot turns out to hold. Row-major fills a row before moving on; column-major fills a column; the packed layouts skip the cells the shape guarantees are zero, so the strip is shorter than the grid. Watching the order is worth more than reading the formula, because it is the order that decides performance: two cells adjacent in the strip arrive in the same cache line, and two cells adjacent in the grid may be a whole row apart.",
  time: "O(cells)",
  space: "O(cells)",

  run(dims, { layout }) {
    const meta = LAYOUT_MAP[layout];
    const slots = slotCount(layout, dims);
    const order = storageOrder(layout, dims);
    const logical = logicalCount(dims);

    const ctx = { layout, dims, slots, memory: new Array(slots).fill(null), visited: new Set() };
    const steps = [];

    steps.push(
      frame(ctx, {
        message: `${logical} logical cells, ${slots} slots of memory. Offset = ${meta.formula}.`,
      })
    );

    order.forEach((index, at) => {
      ctx.memory[at] = index;
      ctx.visited.add(index.join(","));
      steps.push(
        frame(ctx, {
          cursor: index,
          slot: at,
          message: `Slot ${at} holds A${showIndex(index)}.`,
        })
      );
    });

    const skipped = logical - slots;
    steps.push(
      frame(ctx, {
        resultBadge: `${slots} SLOTS FOR ${logical} CELLS`,
        message:
          skipped > 0
            ? `${slots} slots for a ${dims.join(" × ")} array — ${skipped} cells are zero by the shape of the matrix and are never stored, a saving of ${(
                (skipped / logical) *
                100
              ).toFixed(0)}%. The price is that every access now runs a formula with a branch in it.`
            : `${slots} slots, one per cell, and the last index moves ${
                layout === "rowmajor" ? "fastest" : "slowest"
              }. Two cells next to each other in the strip share a cache line; two cells next to each other in the *other* direction do not.`,
      })
    );

    return { steps, finalDims: dims };
  },
};

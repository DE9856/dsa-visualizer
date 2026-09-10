import { LAYOUT_MAP, everyIndex, frame, logicalCount, showIndex, slotCount, slotOf, storageOrder } from "./helpers";

export const savings = {
  key: "savings",
  label: "What the Shape Saves",
  group: "locality",
  layouts: "special",
  fields: [],
  desc: "Every cell of the logical matrix in turn, sorted into three kinds: stored, structurally zero, or the same number under a second name. The totals are the argument for a packed layout — a triangular n×n holds n(n+1)/2 elements instead of n², so it saves just under half, and a tridiagonal holds 3n−2, which for any interesting n is almost all of it. The counter-argument is in the walk itself: every access now needs a comparison before the arithmetic, the mapping is no longer a single formula, and a cell you cannot address is a cell you cannot write to.",
  time: "O(n²)",
  space: "O(1)",

  run(dims, { layout }) {
    const meta = LAYOUT_MAP[layout];
    const slots = slotCount(layout, dims);
    const memory = new Array(slots).fill(null);
    storageOrder(layout, dims).forEach((idx, at) => {
      memory[at] = idx;
    });

    const ctx = { layout, dims, slots, memory, visited: new Set() };
    const steps = [];
    const logical = logicalCount(dims);
    let stored = 0;
    let zero = 0;
    let shared = 0;

    steps.push(
      frame(ctx, {
        message: `A ${dims.join(" × ")} matrix has ${logical} cells and this layout keeps ${slots} of them. Offset = ${meta.formula}.`,
      })
    );

    for (const index of everyIndex(dims)) {
      const { slot, stored: isStored, redirect } = slotOf(layout, dims, index);
      if (!isStored) zero++;
      else if (redirect) shared++;
      else {
        stored++;
        ctx.visited.add(index.join(","));
      }
      steps.push(
        frame(ctx, {
          cursor: index,
          redirect,
          slot,
          tally: { stored, shared, zero },
          message: !isStored
            ? `A${showIndex(index)} is zero by the shape — no slot, nothing to read, nothing to write.`
            : redirect
              ? `A${showIndex(index)} shares slot ${slot} with A${showIndex(redirect)} — one number, two names.`
              : `A${showIndex(index)} is stored, at slot ${slot}.`,
        })
      );
    }

    steps.push(
      frame(ctx, {
        tally: { stored, shared, zero },
        resultBadge: `${slots} OF ${logical} STORED — ${(((logical - slots) / logical) * 100).toFixed(0)}% SAVED`,
        message: `${stored} cells stored${shared ? `, ${shared} sharing a slot with their mirror` : ""}${
          zero ? `, ${zero} zero by construction` : ""
        }. ${slots} slots against ${logical} — but the mapping now needs a comparison before it can do the arithmetic, and for the ${
          shared ? "shared" : "missing"
        } cells there is no independent place to write to at all.`,
      })
    );

    return { steps, finalDims: dims };
  },
};

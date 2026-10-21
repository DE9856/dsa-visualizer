import { addressSteps, frame, showIndex, slotCount, slotOf, storageOrder } from "./helpers";

export const address = {
  key: "address",
  label: "Address One Element",
  group: "address",
  layouts: "all",
  fields: ["indices"],
  desc: "There is no such thing as a two-dimensional array in memory. What there is, is a formula — and this walks through it one term at a time for the element you name. For the dense layouts it is Horner's rule: multiply the running offset by the next dimension, add the next index, repeat. Note what the formula does *not* contain: the first dimension. A row-major address never needs to know how many rows there are, which is exactly why C lets you pass an array as int a[][4] with the outer size left off, and why the inner size cannot be. For the packed layouts the formula counts how many elements the earlier rows contributed, and some cells have no address at all.",
  time: "O(rank)",
  space: "O(1)",

  run(dims, { layout, index }) {
    const slots = slotCount(layout, dims);
    const order = storageOrder(layout, dims);
    // Pre-filled: the point of this operation is *where* the element lands,
    // and an empty strip would show only that it landed somewhere.
    const memory = new Array(slots).fill(null);
    order.forEach((idx, at) => {
      memory[at] = idx;
    });

    const ctx = { layout, dims, slots, memory, visited: new Set() };
    const steps = [];
    const { slot, stored, redirect } = slotOf(layout, dims, index);
    const lines = addressSteps(layout, dims, index);

    steps.push(
      frame(ctx, {
        cursor: index,
        message: `Where does A${showIndex(index)} live? The array is ${dims.join(
          " × "
        )}; memory is a run of ${slots} slots and nothing else.`,
      })
    );

    lines.forEach((line, i) => {
      steps.push(
        frame(ctx, {
          cursor: index,
          redirect: line.tone === "redirect" ? redirect : null,
          formula: lines.slice(0, i + 1),
          message: line.text,
        })
      );
    });

    steps.push(
      frame(ctx, {
        cursor: index,
        redirect,
        slot,
        formula: lines,
        found: stored,
        notFound: !stored,
        resultBadge: stored ? `A${showIndex(index)} → SLOT ${slot}` : `A${showIndex(index)} = 0, NOT STORED`,
        message: stored
          ? redirect
            ? `A${showIndex(index)} is read from slot ${slot}, which holds A${showIndex(
                redirect
              )} — one number, two names. Writing through either changes both, which is the part that bites.`
            : `A${showIndex(index)} is slot ${slot}. One multiply-add per dimension, no lookup, no indirection — that is what makes an array an array.`
          : `A${showIndex(index)} has no slot. It is zero by the shape of the matrix, so storing it would be storing a fact already known.`,
      })
    );

    return { steps, finalDims: dims };
  },
};

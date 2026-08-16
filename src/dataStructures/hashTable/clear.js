import { cloneTable, emptyTable, INITIAL_CAPACITY } from "./helpers";

export const clearTable = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Drops every key and shrinks the table back to its starting capacity. A real implementation usually keeps the array it already grew into, since the buckets cost nothing while empty and re-growing them does.",
  time: "O(m)",
  space: "O(1)",
  run(table) {
    const before = cloneTable(table);
    const fresh = emptyTable(before.strategy, INITIAL_CAPACITY);

    if (before.order.length === 0 && before.capacity === INITIAL_CAPACITY) {
      return { steps: [{ ...before, message: "Table is already empty" }], finalTable: table };
    }

    const steps = [
      {
        ...before,
        active: before.buckets.flatMap((bucket) => bucket.map((entry) => entry.id)),
        message: "Dropping every key and tombstone",
      },
      { ...fresh, message: `Table cleared — back to ${INITIAL_CAPACITY} empty buckets` },
    ];
    return { steps, finalTable: fresh };
  },
};

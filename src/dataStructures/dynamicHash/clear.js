import { cloneTable, emptyTable, isExtendible } from "./helpers";

export const clearTable = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Drops every key and takes the structure back to its starting size — one directory of two entries, or the four buckets linear hashing starts from. The splits are undone with it, which no real implementation would bother doing: the buckets it grew into cost nothing while empty and re-splitting into them does.",
  time: "O(b)",
  space: "O(1)",
  run(table) {
    const before = cloneTable(table);
    const fresh = emptyTable(before.kind);

    if (before.order.length === 0 && before.buckets.length === fresh.buckets.length) {
      return { steps: [{ ...before, message: "Table is already empty" }], finalTable: table };
    }

    const steps = [
      { ...before, message: "Dropping every key" },
      {
        ...fresh,
        message: isExtendible(fresh)
          ? `Cleared — back to a ${fresh.directory.length}-entry directory at global depth ${fresh.globalDepth}`
          : `Cleared — back to ${fresh.buckets.length} buckets at level 0, split pointer on bucket 0`,
      },
    ];
    return { steps, finalTable: fresh };
  },
};

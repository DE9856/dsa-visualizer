import { bucketKeys, cloneTable, isExtendible } from "./helpers";

export const keys = {
  key: "keys",
  label: "List Keys",
  group: "traverse",
  fields: [],
  desc: "Walks the buckets in order and collects every key. Under extendible hashing the buckets are walked directly rather than through the directory — several directory entries can name the same bucket, and listing it once per pointer would report the same keys two, four or eight times over.",
  time: "O(n + b)",
  space: "O(n)",
  run(table) {
    const before = cloneTable(table);
    const steps = [];
    const collected = [];

    if (before.order.length === 0) {
      steps.push({ ...before, notFound: true, message: "Table is empty — no keys to list" });
      return { steps, finalTable: table };
    }

    before.buckets.forEach((bucket, index) => {
      const label = isExtendible(before) ? `B${index}` : `Bucket ${index}`;
      const held = bucketKeys(bucket);
      if (held.length === 0) {
        steps.push({ ...before, bucketIndex: index, message: `${label} is empty — skip` });
        return;
      }
      collected.push(...held);
      steps.push({
        ...before,
        bucketIndex: index,
        message: `${label}: ${held.join(", ")}${
          bucket.overflow?.length ? ` (${bucket.overflow.length} in overflow)` : ""
        } — collected so far: ${collected.join(", ")}`,
      });
    });

    steps.push({
      ...before,
      resultBadge: `${collected.length} KEYS`,
      message: `Bucket order: ${collected.join(", ")} — inserted in the order ${before.order.join(", ")}`,
    });

    return { steps, finalTable: table };
  },
};

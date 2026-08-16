import { cloneTable } from "./helpers";

export const keys = {
  key: "keys",
  label: "List Keys",
  group: "traverse",
  fields: [],
  desc: "Walks the buckets in index order and collects every key. This is the only way to enumerate a hash table, and it exposes the structure's one real weakness: the order that comes out is hash order, not insertion order and not sorted order. Nothing about the table remembers when a key arrived or how it compares to its neighbours, which is why a tree beats a hash table whenever you need ranges or sorted output.",
  time: "O(n + m)",
  space: "O(n)",
  run(table) {
    const before = cloneTable(table);
    const steps = [];
    const collected = [];

    if (before.order.length === 0) {
      steps.push({ ...before, notFound: true, message: "Table is empty — no keys to list" });
      return { steps, finalTable: table };
    }

    for (let i = 0; i < before.capacity; i++) {
      const live = before.buckets[i].filter((entry) => !entry.deleted);
      if (live.length === 0) {
        steps.push({ ...before, probe: i, message: `Bucket ${i} is empty — skip` });
        continue;
      }
      collected.push(...live.map((entry) => entry.value));
      steps.push({
        ...before,
        probe: i,
        active: live.map((entry) => entry.id),
        message: `Bucket ${i}: ${live.map((e) => e.value).join(", ")} — collected so far: ${collected.join(", ")}`,
      });
    }

    steps.push({
      ...before,
      resultBadge: `${collected.length} KEYS`,
      message: `Hash order: ${collected.join(", ")} — inserted in the order ${before.order.join(", ")}`,
    });

    return { steps, finalTable: table };
  },
};

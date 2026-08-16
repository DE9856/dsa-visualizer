import { cloneTable, isOpenAddressed, keyCount, loadFactor, loadLimitFor, tombstoneCount } from "./helpers";

export const load = {
  key: "load",
  label: "Load Factor",
  group: "status",
  fields: [],
  desc: "The load factor α = n/m (keys ÷ buckets) is the one number that decides whether a hash table is still fast. Under separate chaining it is the average chain length, so a successful search costs about 1 + α/2 comparisons. Under open addressing the cost climbs far more sharply — roughly 1/(1-α) probes — which is why α is capped near 0.5 there and 0.75 under chaining. Crossing the cap triggers a resize.",
  time: "O(m)",
  space: "O(1)",
  run(table) {
    const before = cloneTable(table);
    const steps = [];
    const n = keyCount(before);
    const m = before.capacity;
    const alpha = loadFactor(before);
    const limit = loadLimitFor(before.strategy);
    const open = isOpenAddressed(before.strategy);

    const used = before.buckets.filter((bucket) => bucket.some((e) => !e.deleted)).length;
    const empty = m - before.buckets.filter((bucket) => bucket.length > 0).length;
    const longest = before.buckets.reduce((max, bucket) => Math.max(max, bucket.filter((e) => !e.deleted).length), 0);

    steps.push({
      ...before,
      active: before.buckets.flatMap((bucket) => bucket.filter((e) => !e.deleted).map((e) => e.id)),
      message: `${n} key${n === 1 ? "" : "s"} spread over ${m} buckets — ${used} hold keys, ${empty} are still empty`,
    });

    const spread = open
      ? `longest run of occupied buckets is what probing has to walk`
      : `longest chain is ${longest} node${longest === 1 ? "" : "s"}`;
    steps.push({ ...before, message: `Distribution: ${spread}` });

    const tombs = tombstoneCount(before);
    if (tombs > 0) {
      steps.push({
        ...before,
        message: `${tombs} tombstone${tombs === 1 ? "" : "s"} still occupy slots — they don't count toward α, but they do lengthen probes until a resize clears them`,
      });
    }

    const verdict =
      alpha > limit
        ? `over the ${limit.toFixed(2)} limit — the next insert will resize`
        : `under the ${limit.toFixed(2)} limit — lookups stay near O(1)`;

    steps.push({
      ...before,
      resultBadge: `α = ${alpha.toFixed(2)}`,
      message: `α = n/m = ${n}/${m} = ${alpha.toFixed(2)} — ${verdict}`,
    });

    return { steps, finalTable: table };
  },
};

import {
  cloneTable,
  HASH_FN_MAP,
  isCuckoo,
  isOpenAddressed,
  keyCount,
  loadFactor,
  loadLimitFor,
  slotCount,
  tombstoneCount,
} from "./helpers";

export const load = {
  key: "load",
  label: "Load Factor",
  group: "status",
  fields: [],
  desc: "The load factor α = n/m (keys ÷ slots) is the one number that decides whether a hash table is still fast. Under separate chaining it is the average chain length, so a successful search costs about 1 + α/2 comparisons. Under open addressing the cost climbs far more sharply — roughly 1/(1-α) probes — which is why α is capped near 0.5 there and 0.75 under chaining. Robin Hood tolerates a fuller table because it caps how unlucky any one key can be, and cuckoo counts against both of its tables at once. Crossing the cap triggers a resize.",
  time: "O(m)",
  space: "O(1)",
  run(table) {
    const before = cloneTable(table);
    const steps = [];
    const n = keyCount(before);
    const slots = slotCount(before);
    const alpha = loadFactor(before);
    const limit = loadLimitFor(before.strategy);
    const open = isOpenAddressed(before.strategy);
    const cuckoo = isCuckoo(before.strategy);
    const allBuckets = cuckoo ? [...before.buckets, ...before.buckets2] : before.buckets;

    const live = (bucket) => bucket.filter((e) => !e.deleted);
    const used = allBuckets.filter((bucket) => live(bucket).length > 0).length;
    const empty = allBuckets.filter((bucket) => bucket.length === 0).length;
    const longest = allBuckets.reduce((max, bucket) => Math.max(max, live(bucket).length), 0);

    steps.push({
      ...before,
      active: allBuckets.flatMap((bucket) => live(bucket).map((e) => e.id)),
      message: `${n} key${n === 1 ? "" : "s"} spread over ${slots} slot${slots === 1 ? "" : "s"}${
        cuckoo ? ` (${before.capacity} in each of the two tables)` : ""
      } — ${used} hold keys, ${empty} are still empty`,
    });

    const spread = cuckoo
      ? `no bucket ever holds more than one key, and no key is more than one hop from either of its two slots`
      : open
        ? `longest run of occupied buckets is what probing has to walk`
        : `longest chain is ${longest} node${longest === 1 ? "" : "s"}`;
    steps.push({ ...before, message: `Distribution: ${spread}` });

    steps.push({
      ...before,
      message: `Every one of those indexes came from ${HASH_FN_MAP[before.hashFn]?.formula ?? "h(k) = k mod m"} — a different hash function deals the same keys into different buckets`,
    });

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
      message: `α = n/m = ${n}/${slots} = ${alpha.toFixed(2)} — ${verdict}`,
    });

    return { steps, finalTable: table };
  },
};

import {
  cloneTable,
  emptyTable,
  hashExpr,
  hashOf,
  isCuckoo,
  keyCount,
  loadFactor,
  loadLimitFor,
  nextCapacity,
  placeInto,
  rehashInto,
  slotCount,
} from "./helpers";

/** Where a key ended up, whichever table and bucket that turned out to be. */
export function findKey(table, key) {
  const inFirst = table.buckets.findIndex((bucket) => bucket.some((e) => e.value === key && !e.deleted));
  if (inFirst >= 0) return { index: inFirst, table: 1 };
  if (table.buckets2) {
    const inSecond = table.buckets2.findIndex((bucket) => bucket.some((e) => e.value === key && !e.deleted));
    if (inSecond >= 0) return { index: inSecond, table: 2 };
  }
  return { index: -1, table: 1 };
}

/**
 * Grows the table and replays every key into it, one animated frame per key.
 *
 * Shared with insert(), which calls this the moment an insertion pushes the
 * load factor past its limit — the resize is part of the same run rather than
 * a separate operation you have to know to ask for.
 *
 * Rehashing is not a copy: the hash is taken mod the *new* capacity, so keys
 * land in different buckets than before and collisions get redealt. That is
 * the whole point of the frame-by-frame replay.
 */
export function rehashWithSteps(table, steps, reason) {
  // Settle on the capacity first. It is normally just the next prime, but a
  // cuckoo table can meet a fresh eviction cycle at that size and need one
  // more step up; doing it silently means the replay below never dead-ends.
  const capacity = rehashInto(table, nextCapacity(table.capacity)).capacity;
  const resizing = { from: table.capacity, to: capacity };

  steps.push({ ...cloneTable(table), resizing, message: reason });

  let grown = emptyTable(table.strategy, capacity, table.hashFn);
  steps.push({
    ...grown,
    resizing,
    message: `Allocate ${capacity} buckets — every key must be rehashed, since h(k) is taken mod the new capacity`,
  });

  for (const key of table.order) {
    const placed = cloneTable(grown);
    const home = hashOf(key, capacity, placed.hashFn);
    placeInto(placed, key);
    const landed = findKey(placed, key);
    const entry = (landed.table === 2 ? placed.buckets2 : placed.buckets)[landed.index]?.find((e) => e.value === key);

    let moved = "";
    if (isCuckoo(placed.strategy)) moved = landed.table === 2 ? " — evicted into T2" : "";
    else if (landed.index !== home) moved = ` — occupied, probed to ${landed.index}`;

    steps.push({
      ...placed,
      resizing,
      hash: hashExpr(key, capacity, placed.hashFn),
      home,
      probe: landed.table === 1 ? landed.index : undefined,
      probe2: landed.table === 2 ? landed.index : undefined,
      pending: entry?.id,
      message: `Rehash ${key}: ${hashExpr(key, capacity, placed.hashFn)}${moved}`,
    });

    grown = placed;
  }

  const alpha = loadFactor(grown).toFixed(2);
  steps.push({
    ...grown,
    message: `Resize complete — ${keyCount(grown)} keys rehashed into ${slotCount(grown)} slots, load factor now ${alpha}`,
  });

  return grown;
}

export const resize = {
  key: "resize",
  label: "Resize",
  group: "utility",
  fields: [],
  desc: "Grows the table to the next prime capacity and rehashes every key into it. A hash table normally does this for you the moment the load factor (keys ÷ slots) crosses its limit, because the O(1) promise only holds while the table stays sparse — as it fills, chains lengthen, probe sequences cluster, and cuckoo's eviction chains start closing into cycles. Rehashing is not a copy: h(k) is taken mod the new capacity, so keys scatter to new buckets. The cost is O(n) for one insert, but it is paid rarely enough that inserts stay O(1) amortized.",
  time: "O(n) for the resize itself, amortized O(1) per insert",
  space: "O(n)",
  run(table) {
    const steps = [];
    const alpha = loadFactor(table).toFixed(2);
    const limit = loadLimitFor(table.strategy).toFixed(2);
    const grown = rehashWithSteps(
      table,
      steps,
      `Resizing by hand — load factor ${keyCount(table)}/${slotCount(table)} = ${alpha} (limit ${limit})`
    );
    return { steps, finalTable: grown };
  },
};

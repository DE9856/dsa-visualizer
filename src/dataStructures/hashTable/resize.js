import { nextId } from "../linkedList/nodeId";
import {
  cloneTable,
  emptyTable,
  hashExpr,
  isOpenAddressed,
  keyCount,
  loadFactor,
  loadLimitFor,
  locate,
  nextCapacity,
} from "./helpers";

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
  const capacity = nextCapacity(table.capacity);
  const resizing = { from: table.capacity, to: capacity };

  steps.push({ ...cloneTable(table), resizing, message: reason });

  let grown = emptyTable(table.strategy, capacity);
  steps.push({
    ...grown,
    resizing,
    message: `Allocate ${capacity} buckets — every key must be rehashed, since h(k) is taken mod the new capacity`,
  });

  for (const key of table.order) {
    const spot = locate(grown, key);
    const entry = { id: nextId(), value: key };
    const placed = cloneTable(grown);

    if (isOpenAddressed(placed.strategy)) placed.buckets[spot.insertIndex] = [entry];
    else placed.buckets[spot.insertIndex].push(entry);
    placed.order.push(key);

    const probed = spot.insertIndex !== spot.home ? ` — occupied, probed to ${spot.insertIndex}` : "";
    steps.push({
      ...placed,
      resizing,
      hash: hashExpr(key, capacity),
      home: spot.home,
      probe: spot.insertIndex,
      pending: entry.id,
      message: `Rehash ${key}: ${hashExpr(key, capacity)}${probed}`,
    });

    grown = placed;
  }

  const alpha = loadFactor(grown).toFixed(2);
  steps.push({
    ...grown,
    message: `Resize complete — ${keyCount(grown)} keys rehashed into ${capacity} buckets, load factor now ${alpha}`,
  });

  return grown;
}

export const resize = {
  key: "resize",
  label: "Resize",
  group: "utility",
  fields: [],
  desc: "Grows the table to the next prime capacity and rehashes every key into it. A hash table normally does this for you the moment the load factor (keys ÷ buckets) crosses its limit, because the O(1) promise only holds while the table stays sparse — as it fills, chains lengthen and probe sequences cluster, and lookups drift toward O(n). Rehashing is not a copy: h(k) is taken mod the new capacity, so keys scatter to new buckets. The cost is O(n) for one insert, but it is paid rarely enough that inserts stay O(1) amortized.",
  time: "O(n) for the resize itself, amortized O(1) per insert",
  space: "O(n)",
  run(table) {
    const steps = [];
    const alpha = loadFactor(table).toFixed(2);
    const limit = loadLimitFor(table.strategy).toFixed(2);
    const grown = rehashWithSteps(
      table,
      steps,
      `Resizing by hand — load factor ${keyCount(table)}/${table.capacity} = ${alpha} (limit ${limit})`
    );
    return { steps, finalTable: grown };
  },
};

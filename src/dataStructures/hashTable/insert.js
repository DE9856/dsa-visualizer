import { nextId } from "../linkedList/nodeId";
import { rehashWithSteps } from "./resize";
import {
  cloneTable,
  cuckooPlace,
  hash2Expr,
  hash2Of,
  hashExpr,
  hashOf,
  isCuckoo,
  isOpenAddressed,
  isRobinHood,
  keyCount,
  loadFactor,
  loadLimitFor,
  locate,
  needsResize,
  probeWhere,
  robinHoodPlace,
  slotCount,
  STRATEGY_MAP,
} from "./helpers";

/**
 * Robin Hood insert: the same forward walk as linear probing, except the key
 * carried along swaps places with any sitting key that is closer to its own
 * home. The displaced key then continues the walk, so no key ends up far from
 * home while a luckier one sits right on top of its bucket.
 */
function insertRobinHood(before, key, base, steps) {
  const events = robinHoodPlace(cloneTable(before), key);

  if (!events) {
    steps.push({ ...before, ...base, notFound: true, overflow: true, message: `Table is full — no free bucket for ${key}` });
    return null;
  }

  // Each event overwrites one slot, so replaying them onto a running clone
  // gives the animation a frame per swap instead of jumping to the result.
  let working = cloneTable(before);
  working.order.push(key);
  const probed = [];

  events.forEach((event, i) => {
    probed.push(event.index);
    const carried = i === 0 ? key : events[i - 1].displaced.value;
    const snapshot = cloneTable(working);
    snapshot.buckets[event.index] = [{ ...event.placed }];

    if (!event.displaced) {
      steps.push({
        ...snapshot,
        ...base,
        probe: event.index,
        probed: [...probed],
        pending: event.placed.id,
        message: `Bucket ${event.index} is free — ${carried} settles there, ${event.distance} slot${event.distance === 1 ? "" : "s"} from home`,
      });
    } else {
      steps.push({
        ...snapshot,
        ...base,
        probe: event.index,
        probed: [...probed],
        collision: true,
        pending: event.placed.id,
        active: [event.displaced.id],
        message: `Bucket ${event.index} holds ${event.displaced.value}, only ${event.sittingDistance} from home, while ${carried} has come ${event.distance} — the key that has travelled further keeps the slot, and ${event.displaced.value} moves on`,
      });
    }
    working = snapshot;
  });

  const swaps = events.filter((e) => e.displaced).length;
  steps.push({
    ...working,
    ...base,
    probe: events[events.length - 1].index,
    active: [events[0].placed.id],
    message: swaps
      ? `${key} inserted — ${swaps} key${swaps === 1 ? "" : "s"} shifted along so no key ends up far from home while a luckier one sits on top of its bucket`
      : `${key} inserted with no displacement — load factor ${keyCount(working)}/${slotCount(working)} = ${loadFactor(working).toFixed(2)}`,
  });
  return working;
}

/**
 * Cuckoo insert: the key takes its T1 slot outright, and whoever was sitting
 * there is evicted to their slot in T2 — which may evict someone else back
 * into T1, and so on. Every key is therefore always in one of exactly two
 * places, which is what makes the lookup two probes, worst case.
 */
function insertCuckoo(before, key, base, steps) {
  const events = cuckooPlace(cloneTable(before), key);

  if (!events) {
    steps.push({
      ...before,
      ...base,
      notFound: true,
      overflow: true,
      message: `The eviction chain keeps going — these keys' slots form a cycle, and only a bigger table can break it`,
    });
    return null;
  }

  let working = cloneTable(before);
  working.order.push(key);

  events.forEach((event, i) => {
    const which = event.table === 1 ? "T1" : "T2";
    const snapshot = cloneTable(working);
    const slots = event.table === 1 ? snapshot.buckets : snapshot.buckets2;
    slots[event.index] = [{ ...event.placed }];
    const at = {
      probe: event.table === 1 ? event.index : undefined,
      probe2: event.table === 2 ? event.index : undefined,
    };

    steps.push({
      ...snapshot,
      ...base,
      ...at,
      collision: Boolean(event.displaced),
      pending: event.placed.id,
      active: event.displaced ? [event.displaced.id] : undefined,
      message: !event.displaced
        ? `${which}[${event.index}] is free — ${event.placed.value} lands there and the chain ends`
        : i === 0
          ? `${which}[${event.index}] is taken by ${event.displaced.value} — ${key} moves in anyway, and ${event.displaced.value} is evicted to its slot in the other table`
          : `${which}[${event.index}] is taken by ${event.displaced.value} — ${event.placed.value} takes it, and ${event.displaced.value} hops on`,
    });
    working = snapshot;
  });

  const kicks = events.filter((e) => e.displaced).length;
  steps.push({
    ...working,
    ...base,
    active: [events[0].placed.id],
    message: `${key} inserted after ${kicks} eviction${kicks === 1 ? "" : "s"} — every key is still in one of its own two slots, so no lookup ever costs more than two probes`,
  });
  return working;
}

export const insert = {
  key: "insert",
  label: "Insert",
  group: "core",
  fields: ["key"],
  desc: "Hashes the key to a home bucket, then resolves whatever it finds there. Separate chaining appends the key to that bucket's chain. Open addressing has only one slot per bucket, so it probes for another: linear probing walks forward one slot at a time, quadratic probing jumps 1, 4, 9, 16... slots ahead, and double hashing steps by h₂(k), a stride the key computes for itself, so two keys that collide once don't then collide all the way along. Robin Hood probes forward too, but swaps the key it is carrying with any sitting key that is closer to home, which evens out the distances. Cuckoo hashing doesn't probe at all: the key takes its slot in T1 and evicts whoever was there into T2. Once the insert pushes the load factor past its limit, the table grows to the next prime capacity and every key is rehashed.",
  time: "O(1) average, O(n) worst case (and for the resize itself)",
  space: "O(1)",
  run(table, { key }) {
    const before = cloneTable(table);
    const steps = [];
    const open = isOpenAddressed(before.strategy);
    const expr = hashExpr(key, before.capacity, before.hashFn);
    const home = hashOf(key, before.capacity, before.hashFn);
    const base = { hash: expr, home };
    if (isCuckoo(before.strategy)) base.home2 = hash2Of(key, before.capacity);

    steps.push({
      ...before,
      ...base,
      probe: home,
      message: isCuckoo(before.strategy)
        ? `${expr}, ${hash2Expr(key, before.capacity)} — ${key} may only live in T1[${home}] or T2[${base.home2}]`
        : `${expr} — bucket ${home} is where ${key} belongs`,
    });

    // A duplicate is a duplicate whatever the strategy, so the lookup runs
    // before any of them get to place anything.
    const spot = locate(before, key);

    if (spot.outcome === "found") {
      const bucket = spot.table === 2 ? before.buckets2[spot.index] : before.buckets[spot.index];
      const existing = open ? bucket[0] : bucket[spot.chainPos];
      steps.push({
        ...before,
        ...base,
        probe: spot.table === 2 ? undefined : spot.index,
        probe2: spot.table === 2 ? spot.index : undefined,
        found: existing.id,
        resultBadge: "DUPLICATE KEY",
        message: `${key} is already in the table — keys are unique, so there is nothing to insert`,
      });
      return { steps, finalTable: table };
    }

    let after;
    if (isRobinHood(before.strategy)) after = insertRobinHood(before, key, base, steps);
    else if (isCuckoo(before.strategy)) after = insertCuckoo(before, key, base, steps);
    else after = insertProbing(before, key, base, steps, spot);

    if (!after) {
      // Cuckoo's cycle is the one failure a resize actually fixes: a bigger
      // table redeals every key's two slots, which breaks the loop.
      if (!isCuckoo(before.strategy)) return { steps, finalTable: table };
      const grown = rehashWithSteps(before, steps, `Growing the table to break the cycle, then trying ${key} again`);
      const retried = insertCuckoo(grown, key, base, steps);
      return { steps, finalTable: retried || grown };
    }

    if (!needsResize(after)) return { steps, finalTable: after };

    const alpha = loadFactor(after);
    const limit = loadLimitFor(after.strategy);
    const grown = rehashWithSteps(
      after,
      steps,
      `Load factor ${alpha.toFixed(2)} is past the ${limit.toFixed(2)} limit for ${STRATEGY_MAP[after.strategy].label} — time to grow`
    );
    return { steps, finalTable: grown };
  },
};

/** Chaining and the three probing strategies: walk the trace, then store. */
function insertProbing(before, key, base, steps, spot) {
  const open = isOpenAddressed(before.strategy);
  const probed = [];

  for (const visit of spot.trace) {
    probed.push(visit.index);
    const where = probeWhere(before.strategy, visit, key, before.capacity);
    let message;
    if (visit.kind === "empty") message = `${where} is free`;
    else if (visit.kind === "tombstone")
      message = `${where} is a tombstone — remember it, but keep probing in case ${key} is stored further along`;
    else if (visit.kind === "match") message = `${where} already holds ${key}`;
    else if (open) message = `${where} is taken by ${visit.entry.value} — collision`;
    else message = `${where}: the chain already holds ${visit.entry.value}, walk to the next node`;

    steps.push({
      ...before,
      ...base,
      probe: visit.index,
      probed: [...probed],
      collision: visit.kind === "occupied",
      active: visit.entry ? [visit.entry.id] : undefined,
      message,
    });
  }

  if (spot.outcome === "full") {
    // Only reachable by resizing the table down by hand, or with quadratic
    // probing: its jumps revisit the same slots and can miss free ones once
    // the table is more than half full, which is exactly why the load limit
    // sits at 0.5.
    steps.push({
      ...before,
      ...base,
      probed,
      notFound: true,
      overflow: true,
      message:
        before.strategy === "quadratic"
          ? `Probe sequence exhausted — quadratic probing only reaches every bucket while the table is under half full`
          : `Table is full — no free bucket for ${key}`,
    });
    return null;
  }

  const after = cloneTable(before);
  const reusedTombstone = open && before.buckets[spot.insertIndex][0]?.deleted;
  const entry = { id: nextId(), value: key };

  if (open) after.buckets[spot.insertIndex] = [entry];
  else after.buckets[spot.insertIndex].push(entry);
  after.order.push(key);

  steps.push({
    ...after,
    ...base,
    probe: spot.insertIndex,
    probed,
    pending: entry.id,
    message: `Store ${key} in bucket ${spot.insertIndex}${reusedTombstone ? " — reusing the tombstone left by a delete" : ""}`,
  });

  const alpha = loadFactor(after);
  const placement = open
    ? `${key} inserted after ${spot.trace.length} probe${spot.trace.length === 1 ? "" : "s"}`
    : `${key} appended to bucket ${spot.insertIndex} (chain length ${after.buckets[spot.insertIndex].length})`;

  steps.push({
    ...after,
    ...base,
    probe: spot.insertIndex,
    active: [entry.id],
    message: `${placement} — load factor ${keyCount(after)}/${slotCount(after)} = ${alpha.toFixed(2)}`,
  });

  return after;
}

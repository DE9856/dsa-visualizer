import {
  cloneTable,
  hash2Expr,
  hash2Of,
  hashExpr,
  hashOf,
  isCuckoo,
  isRobinHood,
  locate,
  probeDistance,
  probeWhere,
  usesTombstones,
} from "./helpers";

/**
 * Robin Hood's answer to the hole a delete leaves: instead of a tombstone,
 * shift the following run back one slot each. Every key that moves gets one
 * step closer to its home, and the invariant searches rely on — nobody is
 * further from home than the keys after them in the run — survives intact.
 */
function shiftBack(after, from, steps, base) {
  let hole = from;
  let moved = 0;

  for (let guard = 0; guard < after.capacity; guard += 1) {
    const next = (hole + 1) % after.capacity;
    const entry = after.buckets[next][0];
    if (!entry) {
      steps.push({
        ...cloneTable(after),
        ...base,
        probe: next,
        message: `Bucket ${next} is empty — the run ends, so nothing else has to move`,
      });
      break;
    }
    const distance = probeDistance(after, next, entry);
    if (distance === 0) {
      steps.push({
        ...cloneTable(after),
        ...base,
        probe: next,
        message: `${entry.value} is already in its home bucket — moving it back would put it before its own hash, so the shifting stops`,
      });
      break;
    }

    after.buckets[hole] = [entry];
    after.buckets[next] = [];
    moved += 1;
    steps.push({
      ...cloneTable(after),
      ...base,
      probe: hole,
      active: [entry.id],
      message: `Shift ${entry.value} back into bucket ${hole} — it is now ${distance - 1} from home instead of ${distance}`,
    });
    hole = next;
  }

  return moved;
}

export const del = {
  key: "delete",
  label: "Delete",
  group: "core",
  fields: ["key"],
  desc: "Finds the key the same way a search does, then removes it — but the strategies part ways here. Chaining unlinks the node and the chain closes up, exactly like deleting from a linked list. Probing cannot simply blank the slot: any key whose probe sequence passes through it would suddenly look absent, because the search would stop at the hole. It leaves a tombstone instead — a marker that says 'something was here, keep probing' which searches skip over and later inserts are free to reuse. Robin Hood needs no tombstone: it shifts the following run back one slot each, which closes the hole and moves every key it touches nearer its home. Neither does cuckoo hashing, where a key's two slots are known without probing through anything.",
  time: "O(1) average, O(n) worst case",
  space: "O(1)",
  run(table, { key }) {
    const before = cloneTable(table);
    const steps = [];
    const cuckoo = isCuckoo(before.strategy);
    const expr = hashExpr(key, before.capacity, before.hashFn);
    const home = hashOf(key, before.capacity, before.hashFn);
    const base = { hash: expr, home };
    if (cuckoo) base.home2 = hash2Of(key, before.capacity);

    steps.push({
      ...before,
      ...base,
      probe: home,
      message: cuckoo
        ? `${expr}, ${hash2Expr(key, before.capacity)} — ${key} can only be in one of those two slots`
        : `${expr} — look for ${key} starting at bucket ${home}`,
    });

    const spot = locate(before, key);
    const probed = [];

    for (const visit of spot.trace) {
      if (visit.table !== 2) probed.push(visit.index);
      const where = cuckoo ? `T${visit.table}[${visit.index}]` : probeWhere(before.strategy, visit, key, before.capacity);
      let message;
      if (visit.kind === "match") message = `${where} holds ${key} — this is the one to remove`;
      else if (visit.kind === "empty") message = `${where} is empty`;
      else if (visit.kind === "tombstone") message = `${where} is an existing tombstone — skip it and keep probing`;
      else if (visit.kind === "richer")
        message = `${where} holds ${visit.entry.value}, closer to home than ${key} has travelled — ${key} cannot be further along`;
      else message = `${where} holds ${visit.entry.value}, not ${key} — keep looking`;

      steps.push({
        ...before,
        ...base,
        probe: visit.table === 2 ? undefined : visit.index,
        probe2: visit.table === 2 ? visit.index : undefined,
        probed: [...probed],
        active: visit.entry && visit.kind !== "match" ? [visit.entry.id] : undefined,
        removing: visit.kind === "match" ? visit.entry.id : undefined,
        message,
      });
    }

    if (spot.outcome !== "found") {
      steps.push({
        ...before,
        ...base,
        probed,
        notFound: true,
        message: `${key} is not in the table — nothing to delete`,
      });
      return { steps, finalTable: table };
    }

    const sourceBucket = spot.table === 2 ? before.buckets2[spot.index] : before.buckets[spot.index];
    const entry = spot.chainPos !== undefined ? sourceBucket[spot.chainPos] : sourceBucket[0];
    const after = cloneTable(before);
    after.order = after.order.filter((k) => k !== key);
    const at = {
      probe: spot.table === 2 ? undefined : spot.index,
      probe2: spot.table === 2 ? spot.index : undefined,
    };

    if (usesTombstones(after.strategy)) {
      after.buckets[spot.index] = [{ id: entry.id, value: entry.value, deleted: true }];
      steps.push({
        ...after,
        ...base,
        ...at,
        probed,
        tombstoned: entry.id,
        message: `Bucket ${spot.index} becomes a tombstone — blanking it would strand every key that probes through it`,
      });
    } else if (cuckoo) {
      (spot.table === 2 ? after.buckets2 : after.buckets)[spot.index] = [];
      steps.push({
        ...after,
        ...base,
        ...at,
        probed,
        message: `T${spot.table}[${spot.index}] is emptied outright — no tombstone is needed when a lookup only ever checks two slots`,
      });
    } else if (isRobinHood(after.strategy)) {
      after.buckets[spot.index] = [];
      steps.push({
        ...after,
        ...base,
        ...at,
        probed,
        message: `Bucket ${spot.index} is emptied — now close the hole by shifting the run behind it back`,
      });
      shiftBack(after, spot.index, steps, base);
    } else {
      after.buckets[spot.index] = after.buckets[spot.index].filter((e) => e.id !== entry.id);
      steps.push({
        ...after,
        ...base,
        ...at,
        probed,
        message: `Unlinked ${key} — the chain at bucket ${spot.index} closes up (length ${after.buckets[spot.index].length})`,
      });
    }

    steps.push({
      ...after,
      ...base,
      resultBadge: `DELETED ${key}`,
      message: `${key} removed — ${after.order.length} key${after.order.length === 1 ? "" : "s"} left`,
    });

    return { steps, finalTable: after };
  },
};

import { cloneTable, hashExpr, hashOf, isOpenAddressed, locate, probeWhere } from "./helpers";

export const del = {
  key: "delete",
  label: "Delete",
  group: "core",
  fields: ["key"],
  desc: "Finds the key the same way a search does, then removes it — but the two strategies part ways here. Chaining unlinks the node and the chain closes up, exactly like deleting from a linked list. Open addressing cannot simply blank the slot: any key whose probe sequence passes through it would suddenly look absent, because the search would stop at the hole. It leaves a tombstone instead — a marker that says 'something was here, keep probing' which searches skip over and later inserts are free to reuse.",
  time: "O(1) average, O(n) worst case",
  space: "O(1)",
  run(table, { key }) {
    const before = cloneTable(table);
    const steps = [];
    const open = isOpenAddressed(before.strategy);
    const expr = hashExpr(key, before.capacity);
    const home = hashOf(key, before.capacity);
    const base = { hash: expr, home };

    steps.push({ ...before, ...base, probe: home, message: `${expr} — look for ${key} starting at bucket ${home}` });

    const spot = locate(before, key);
    const probed = [];

    for (const visit of spot.trace) {
      probed.push(visit.index);
      const where = probeWhere(before.strategy, visit);
      let message;
      if (visit.kind === "match") message = `${where} holds ${key} — this is the one to remove`;
      else if (visit.kind === "empty") message = `${where} is empty`;
      else if (visit.kind === "tombstone") message = `${where} is an existing tombstone — skip it and keep probing`;
      else message = `${where} holds ${visit.entry.value}, not ${key} — keep looking`;

      steps.push({
        ...before,
        ...base,
        probe: visit.index,
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

    const entry = open ? before.buckets[spot.index][0] : before.buckets[spot.index][spot.chainPos];
    const after = cloneTable(before);
    after.order = after.order.filter((k) => k !== key);

    if (open) {
      after.buckets[spot.index] = [{ id: entry.id, value: entry.value, deleted: true }];
      steps.push({
        ...after,
        ...base,
        probe: spot.index,
        probed,
        tombstoned: entry.id,
        message: `Bucket ${spot.index} becomes a tombstone — blanking it would strand every key that probes through it`,
      });
    } else {
      after.buckets[spot.index] = after.buckets[spot.index].filter((e) => e.id !== entry.id);
      steps.push({
        ...after,
        ...base,
        probe: spot.index,
        probed,
        message: `Unlinked ${key} — the chain at bucket ${spot.index} closes up (length ${after.buckets[spot.index].length})`,
      });
    }

    steps.push({
      ...after,
      ...base,
      probe: spot.index,
      resultBadge: `DELETED ${key}`,
      message: `${key} removed — ${after.order.length} key${after.order.length === 1 ? "" : "s"} left in ${after.capacity} buckets`,
    });

    return { steps, finalTable: after };
  },
};

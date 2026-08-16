import { nextId } from "../linkedList/nodeId";
import { rehashWithSteps } from "./resize";
import {
  cloneTable,
  hashExpr,
  hashOf,
  isOpenAddressed,
  keyCount,
  loadFactor,
  loadLimitFor,
  locate,
  needsResize,
  probeWhere,
  STRATEGY_MAP,
} from "./helpers";

export const insert = {
  key: "insert",
  label: "Insert",
  group: "core",
  fields: ["key"],
  desc: "Hashes the key to a home bucket with h(k) = k mod m, then resolves whatever it finds there. Separate chaining appends the key to that bucket's chain. Open addressing has only one slot per bucket, so it probes for another: linear probing walks forward one slot at a time, quadratic probing jumps 1, 4, 9, 16... slots ahead to avoid the clusters linear probing builds. Once the insert pushes the load factor past its limit, the table grows to the next prime capacity and every key is rehashed.",
  time: "O(1) average, O(n) worst case (and for the resize itself)",
  space: "O(1)",
  run(table, { key }) {
    const before = cloneTable(table);
    const steps = [];
    const open = isOpenAddressed(before.strategy);
    const expr = hashExpr(key, before.capacity);
    const home = hashOf(key, before.capacity);
    const base = { hash: expr, home };

    steps.push({ ...before, ...base, probe: home, message: `${expr} — bucket ${home} is where ${key} belongs` });

    const spot = locate(before, key);
    const probed = [];

    for (const visit of spot.trace) {
      probed.push(visit.index);
      const where = probeWhere(before.strategy, visit);
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

    if (spot.outcome === "found") {
      const existing = open ? before.buckets[spot.index][0] : before.buckets[spot.index][spot.chainPos];
      steps.push({
        ...before,
        ...base,
        probe: spot.index,
        probed,
        found: existing.id,
        resultBadge: "DUPLICATE KEY",
        message: `${key} is already in the table — keys are unique, so there is nothing to insert`,
      });
      return { steps, finalTable: table };
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
      return { steps, finalTable: table };
    }

    const entry = { id: nextId(), value: key };
    const after = cloneTable(before);
    const reusedTombstone = open && before.buckets[spot.insertIndex][0]?.deleted;

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
    const limit = loadLimitFor(after.strategy);
    const placement = open
      ? `${key} inserted after ${spot.trace.length} probe${spot.trace.length === 1 ? "" : "s"}`
      : `${key} appended to bucket ${spot.insertIndex} (chain length ${after.buckets[spot.insertIndex].length})`;

    steps.push({
      ...after,
      ...base,
      probe: spot.insertIndex,
      active: [entry.id],
      message: `${placement} — load factor ${keyCount(after)}/${after.capacity} = ${alpha.toFixed(2)}`,
    });

    if (!needsResize(after)) return { steps, finalTable: after };

    const grown = rehashWithSteps(
      after,
      steps,
      `Load factor ${alpha.toFixed(2)} is past the ${limit.toFixed(2)} limit for ${STRATEGY_MAP[after.strategy].label} — time to grow`
    );
    return { steps, finalTable: grown };
  },
};

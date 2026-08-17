import {
  cloneTable,
  hash2Expr,
  hash2Of,
  hashExpr,
  hashOf,
  isCuckoo,
  isOpenAddressed,
  locate,
  probeWhere,
} from "./helpers";

export const search = {
  key: "search",
  label: "Search",
  group: "search",
  fields: ["key"],
  desc: "Hashes the key to its home bucket and follows exactly the path an insert would have taken — down the chain, or along the probe sequence. That symmetry is what makes lookup O(1) on average: the hash jumps straight to the one bucket the key could be in, and only the collisions stacked on that bucket cost extra steps. The search stops the moment it hits a free slot, because an insert would have stopped there too. Robin Hood can stop even earlier, at the first key closer to home than the search has travelled; cuckoo hashing skips the walk entirely, since a key can only ever be in two slots.",
  time: "O(1) average, O(n) worst case — O(1) worst case for cuckoo",
  space: "O(1)",
  run(table, { key }) {
    const before = cloneTable(table);
    const steps = [];
    const open = isOpenAddressed(before.strategy);
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
        ? `${expr}, ${hash2Expr(key, before.capacity)} — if ${key} is stored it is in T1[${home}] or T2[${base.home2}], nowhere else`
        : `${expr} — if ${key} is stored, the search starts at bucket ${home}`,
    });

    const spot = locate(before, key);
    const probed = [];

    for (const visit of spot.trace) {
      if (visit.table !== 2) probed.push(visit.index);
      const where = cuckoo ? `T${visit.table}[${visit.index}]` : probeWhere(before.strategy, visit, key, before.capacity);
      let message;
      if (visit.kind === "match") message = `${where} holds ${key}`;
      else if (visit.kind === "empty") message = `${where} is empty`;
      else if (visit.kind === "tombstone")
        message = `${where} is a tombstone — a key was deleted here, so keep going rather than stopping`;
      else if (visit.kind === "richer")
        message = `${where} holds ${visit.entry.value}, which is closer to its home than ${key} has travelled — Robin Hood would have made ${key} take this slot, so ${key} was never inserted`;
      else if (open) message = `${where} holds ${visit.entry.value}, not ${key}${cuckoo ? "" : " — keep probing"}`;
      else message = `${where}: compare with ${visit.entry.value} — no match, walk to the next node`;

      steps.push({
        ...before,
        ...base,
        probe: visit.table === 2 ? undefined : visit.index,
        probe2: visit.table === 2 ? visit.index : undefined,
        probed: [...probed],
        active: visit.entry && visit.kind !== "match" ? [visit.entry.id] : undefined,
        found: visit.kind === "match" ? visit.entry.id : undefined,
        message,
      });
    }

    const probes = spot.trace.length;

    if (spot.outcome === "found") {
      const bucket = spot.table === 2 ? before.buckets2[spot.index] : before.buckets[spot.index];
      const entry = open ? bucket[0] : bucket[spot.chainPos];
      steps.push({
        ...before,
        ...base,
        probe: spot.table === 2 ? undefined : spot.index,
        probe2: spot.table === 2 ? spot.index : undefined,
        probed,
        found: entry.id,
        resultBadge: `FOUND — ${probes} probe${probes === 1 ? "" : "s"}`,
        message: cuckoo
          ? `Found ${key} in T${spot.table}[${spot.index}] — two slots was the most it could ever have taken`
          : `Found ${key} in bucket ${spot.index} after examining ${probes} bucket${probes === 1 ? "" : "s"}`,
      });
      return { steps, finalTable: table };
    }

    // Stopping early isn't a shortcut — it is the guarantee. An insert would
    // have taken this same path and stored the key at the first free slot, so
    // reaching one proves the key was never inserted.
    const stoppedRich = spot.trace[spot.trace.length - 1]?.kind === "richer";
    const why = cuckoo
      ? `neither of its two slots holds it, and there is nowhere else to look`
      : stoppedRich
        ? `the run's distances say it would have displaced a key here`
        : open
          ? `an insert would have stopped at the first free bucket, so ${key} was never stored`
          : `the chain at bucket ${home} ends without ${key}`;

    steps.push({
      ...before,
      ...base,
      probed,
      notFound: true,
      message: `${key} is not in the table — ${why}`,
    });
    return { steps, finalTable: table };
  },
};

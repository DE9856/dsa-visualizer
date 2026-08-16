import { cloneTable, hashExpr, hashOf, isOpenAddressed, locate, probeWhere } from "./helpers";

export const search = {
  key: "search",
  label: "Search",
  group: "search",
  fields: ["key"],
  desc: "Hashes the key to its home bucket and follows exactly the path an insert would have taken — down the chain, or along the probe sequence. That symmetry is what makes lookup O(1) on average: the hash jumps straight to the one bucket the key could be in, and only the collisions stacked on that bucket cost extra steps. The search stops the moment it hits a free slot, because an insert would have stopped there too.",
  time: "O(1) average, O(n) worst case",
  space: "O(1)",
  run(table, { key }) {
    const before = cloneTable(table);
    const steps = [];
    const open = isOpenAddressed(before.strategy);
    const expr = hashExpr(key, before.capacity);
    const home = hashOf(key, before.capacity);
    const base = { hash: expr, home };

    steps.push({ ...before, ...base, probe: home, message: `${expr} — if ${key} is stored, the search starts at bucket ${home}` });

    const spot = locate(before, key);
    const probed = [];

    for (const visit of spot.trace) {
      probed.push(visit.index);
      const where = probeWhere(before.strategy, visit);
      let message;
      if (visit.kind === "match") message = `${where} holds ${key}`;
      else if (visit.kind === "empty") message = `${where} is empty`;
      else if (visit.kind === "tombstone")
        message = `${where} is a tombstone — a key was deleted here, so keep going rather than stopping`;
      else if (open) message = `${where} holds ${visit.entry.value}, not ${key} — keep probing`;
      else message = `${where}: compare with ${visit.entry.value} — no match, walk to the next node`;

      steps.push({
        ...before,
        ...base,
        probe: visit.index,
        probed: [...probed],
        active: visit.entry && visit.kind !== "match" ? [visit.entry.id] : undefined,
        found: visit.kind === "match" ? visit.entry.id : undefined,
        message,
      });
    }

    const probes = spot.trace.length;

    if (spot.outcome === "found") {
      const entry = open ? before.buckets[spot.index][0] : before.buckets[spot.index][spot.chainPos];
      steps.push({
        ...before,
        ...base,
        probe: spot.index,
        probed,
        found: entry.id,
        resultBadge: `FOUND — ${probes} probe${probes === 1 ? "" : "s"}`,
        message: `Found ${key} in bucket ${spot.index} after examining ${probes} bucket${probes === 1 ? "" : "s"}`,
      });
      return { steps, finalTable: table };
    }

    // Stopping early isn't a shortcut — it is the guarantee. An insert would
    // have taken this same path and stored the key at the first free slot, so
    // reaching one proves the key was never inserted.
    const why = open
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

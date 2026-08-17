import { bucketKeys, cloneTable, hashExprFor, isExtendible, keyCount, locate } from "./helpers";

export const del = {
  key: "delete",
  label: "Delete",
  group: "core",
  fields: ["key"],
  desc: "Finds the key exactly as a search does and drops it from the bucket. No tombstone is needed: a lookup only ever examines the one bucket the hash names, so a hole in it strands nothing. Shrinking is the part real implementations usually leave out — extendible hashing could merge a bucket with its buddy when the two fit together and halve the directory when every local depth drops below the global one, and linear hashing could walk the split pointer backwards — but a table that has grown once will usually grow again, so both schemes normally keep the space.",
  time: "O(1)",
  space: "O(1)",
  run(table, { key }) {
    const before = cloneTable(table);
    const steps = [];
    const spot = locate(before, key);
    const label = isExtendible(before) ? `B${spot.bucketIndex}` : `bucket ${spot.bucketIndex}`;
    const base = { hash: hashExprFor(before, key), dirIndex: spot.dirIndex, bucketIndex: spot.bucketIndex };

    steps.push({
      ...before,
      ...base,
      message: `${base.hash} — ${key} would be in ${label}: ${bucketKeys(spot.bucket).join(", ") || "empty"}`,
    });

    if (!spot.found) {
      steps.push({ ...before, ...base, notFound: true, message: `${key} is not in the table — nothing to delete` });
      return { steps, finalTable: table };
    }

    steps.push({ ...before, ...base, activeKey: key, message: `Found ${key} in ${label}` });

    const after = cloneTable(before);
    const bucket = after.buckets[spot.bucketIndex];
    const fromOverflow = (bucket.overflow || []).includes(key);
    let promoted = null;
    if (fromOverflow) bucket.overflow = bucket.overflow.filter((k) => k !== key);
    else {
      bucket.keys = bucket.keys.filter((k) => k !== key);
      // A key waiting in overflow moves up into the space that just opened,
      // so the chain never holds keys the bucket itself has room for.
      if (bucket.overflow?.length) {
        promoted = bucket.overflow[0];
        bucket.keys.push(promoted);
        bucket.overflow = bucket.overflow.slice(1);
      }
    }
    after.order = after.order.filter((k) => k !== key);

    steps.push({
      ...after,
      ...base,
      activeKey: promoted ?? undefined,
      message: fromOverflow
        ? `${key} removed from the overflow block`
        : `${key} removed from ${label}${promoted !== null ? ` — ${promoted} moves up out of the overflow block into the space` : ""}`,
    });

    steps.push({
      ...after,
      ...base,
      resultBadge: `DELETED ${key}`,
      message: `${keyCount(after)} key${keyCount(after) === 1 ? "" : "s"} left. The buckets stay as they are — neither scheme shrinks on delete here`,
    });

    return { steps, finalTable: after };
  },
};

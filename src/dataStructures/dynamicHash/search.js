import { binary, bucketKeys, cloneTable, hashExprFor, isExtendible, locate } from "./helpers";

export const search = {
  key: "search",
  label: "Search",
  group: "search",
  fields: ["key"],
  desc: "One hash, one bucket, one scan — neither scheme ever searches more than that. Extendible hashing pays one extra indirection for it: the hash indexes the directory, and the directory names the bucket, so a lookup is two memory accesses (and the directory is usually small enough to stay in memory). Linear hashing computes the bucket address outright, but may then have to walk an overflow chain, which is the price it pays for having no directory.",
  time: "O(1)",
  space: "O(1)",
  run(table, { key }) {
    const before = cloneTable(table);
    const steps = [];
    const spot = locate(before, key);
    const expr = hashExprFor(before, key);
    const base = { hash: expr, dirIndex: spot.dirIndex, bucketIndex: spot.bucketIndex };

    if (isExtendible(before)) {
      steps.push({
        ...before,
        ...base,
        message: `${expr} — read directory entry ${binary(spot.dirIndex, before.globalDepth)}`,
      });
      steps.push({
        ...before,
        ...base,
        message: `Entry ${binary(spot.dirIndex, before.globalDepth)} points at B${spot.bucketIndex} — the only bucket ${key} could be in`,
      });
    } else {
      steps.push({
        ...before,
        ...base,
        message: `${expr}${
          spot.address.level !== before.level ? ` — this bucket is behind the split pointer, so the next level's hash applies` : ""
        }`,
      });
    }

    const inBucket = spot.bucket.keys.includes(key);
    const inOverflow = (spot.bucket.overflow || []).includes(key);

    steps.push({
      ...before,
      ...base,
      activeKey: spot.found ? key : undefined,
      message: `Scan ${isExtendible(before) ? `B${spot.bucketIndex}` : `bucket ${spot.bucketIndex}`}: ${
        bucketKeys(spot.bucket).join(", ") || "empty"
      }`,
    });

    if (inOverflow) {
      steps.push({
        ...before,
        ...base,
        activeKey: key,
        message: `Not in the bucket itself — walk its overflow block, which is where a key waits until the split pointer comes round`,
      });
    }

    if (spot.found) {
      steps.push({
        ...before,
        ...base,
        activeKey: key,
        resultBadge: inOverflow ? `FOUND — IN OVERFLOW` : `FOUND`,
        message: `${key} is in ${isExtendible(before) ? `B${spot.bucketIndex}` : `bucket ${spot.bucketIndex}`}${
          inBucket ? "" : "'s overflow block"
        }`,
      });
      return { steps, finalTable: table };
    }

    steps.push({
      ...before,
      ...base,
      notFound: true,
      message: `${key} is not in the table — an insert would have put it in this bucket, so there is nowhere else to look`,
    });
    return { steps, finalTable: table };
  },
};

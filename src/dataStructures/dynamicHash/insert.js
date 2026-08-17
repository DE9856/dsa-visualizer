import {
  binary,
  bucketKeys,
  cloneTable,
  doubleDirectory,
  hashExprFor,
  isExtendible,
  keyCount,
  loadFactor,
  locate,
  slotCount,
  splitBucket,
  splitNext,
  SPLIT_LIMIT,
} from "./helpers";

const bucketLabel = (table, index) => (isExtendible(table) ? `B${index}` : `bucket ${index}`);

const listOf = (keys) => (keys.length ? keys.join(", ") : "empty");

/**
 * Extendible insert. The directory entry names a bucket; if that bucket is
 * full it splits, and only when the bucket was as deep as the directory does
 * the directory itself have to double first. A split can leave every key on
 * the same side, so the whole thing repeats until the key fits.
 */
function insertExtendible(table, key, steps) {
  let working = cloneTable(table);

  for (let guard = 0; guard < 12; guard += 1) {
    const spot = locate(working, key);
    const expr = hashExprFor(working, key);
    const base = { hash: expr, dirIndex: spot.dirIndex, bucketIndex: spot.bucketIndex };

    steps.push({
      ...working,
      ...base,
      message: `${expr} — directory entry ${binary(spot.dirIndex, working.globalDepth)} points at B${spot.bucketIndex} (local depth ${spot.bucket.localDepth})`,
    });

    if (spot.bucket.keys.length < working.bucketSize) {
      const after = cloneTable(working);
      after.buckets[spot.bucketIndex].keys.push(key);
      after.order.push(key);
      steps.push({
        ...after,
        ...base,
        activeKey: key,
        message: `B${spot.bucketIndex} holds ${spot.bucket.keys.length} of ${working.bucketSize} keys — ${key} goes straight in`,
      });
      return after;
    }

    steps.push({
      ...working,
      ...base,
      full: true,
      message: `B${spot.bucketIndex} is full (${listOf(spot.bucket.keys)}) — it has to split`,
    });

    const depth = spot.bucket.localDepth;
    if (depth === working.globalDepth) {
      const doubled = cloneTable(working);
      doubleDirectory(doubled);
      steps.push({
        ...doubled,
        hash: expr,
        dirIndex: locate(doubled, key).dirIndex,
        bucketIndex: spot.bucketIndex,
        message: `Local depth ${depth} equals the global depth, so there is no spare bit to tell the halves apart — the directory doubles to ${doubled.directory.length} entries (global depth ${doubled.globalDepth})`,
      });
      working = doubled;
    } else {
      steps.push({
        ...working,
        ...base,
        message: `Local depth ${depth} is below the global depth ${working.globalDepth}, so the directory already has entries to spare — only the bucket splits`,
      });
    }

    const split = cloneTable(working);
    const bucketIndex = locate(split, key).bucketIndex;
    const before = [...split.buckets[bucketIndex].keys];
    const imageIndex = splitBucket(split, bucketIndex);
    steps.push({
      ...split,
      hash: expr,
      splitting: { from: bucketIndex, to: imageIndex },
      bucketIndex,
      message: `Split B${bucketIndex} on bit ${2 ** (split.buckets[imageIndex].localDepth - 1)} — of [${before.join(", ")}]: [${split.buckets[
        bucketIndex
      ].keys.join(", ")}] stay in B${bucketIndex}, [${split.buckets[imageIndex].keys.join(
        ", "
      )}] move to B${imageIndex}. Both are now at local depth ${split.buckets[imageIndex].localDepth}`,
    });
    working = split;
  }

  return working;
}

/**
 * Linear insert. The overflowing bucket is not the one that splits: `next`
 * walks the buckets in order, one split per load-factor breach, so a key can
 * sit in an overflow block for a while before its own bucket's turn arrives.
 */
function insertLinear(table, key, steps) {
  const spot = locate(table, key);
  const expr = hashExprFor(table, key);
  const base = { hash: expr, bucketIndex: spot.bucketIndex };

  steps.push({
    ...table,
    ...base,
    message: `${expr}${
      spot.address.level !== table.level
        ? ` — bucket ${spot.bucketIndex} is behind the split pointer, so it answers to the next level's hash`
        : ""
    }`,
  });

  const after = cloneTable(table);
  const bucket = after.buckets[spot.bucketIndex];
  const overflowed = bucket.keys.length >= after.bucketSize;
  if (overflowed) bucket.overflow.push(key);
  else bucket.keys.push(key);
  after.order.push(key);

  steps.push({
    ...after,
    ...base,
    activeKey: key,
    message: overflowed
      ? `Bucket ${spot.bucketIndex} is full — ${key} goes into its overflow block and waits there until the split pointer reaches this bucket`
      : `Bucket ${spot.bucketIndex} has room — ${key} goes in`,
  });

  let working = after;
  let guard = 0;
  while (loadFactor(working) > SPLIT_LIMIT && guard < 8) {
    guard += 1;
    const alpha = loadFactor(working);
    steps.push({
      ...working,
      ...base,
      splitting: { from: working.next, to: working.buckets.length },
      message: `α = ${keyCount(working)}/${slotCount(working)} = ${alpha.toFixed(2)} is past ${SPLIT_LIMIT} — split the bucket the pointer is on, which is bucket ${working.next}${
        working.next === spot.bucketIndex ? "" : ", not the one that just filled up"
      }`,
    });

    const split = cloneTable(working);
    const moved = [...bucketKeys(split.buckets[split.next])];
    const result = splitNext(split);
    steps.push({
      ...split,
      hash: expr,
      splitting: { from: result.from, to: result.imageIndex },
      message: `Bucket ${result.from} splits into ${result.from} and ${result.imageIndex} — rehash [${moved.join(", ")}] with mod ${
        result.size * 2
      }: [${result.staying.join(", ")}] stay, [${result.moving.join(", ")}] move to bucket ${result.imageIndex}`,
    });

    if (result.levelled) {
      steps.push({
        ...split,
        splitting: { from: 0, to: split.buckets.length - 1 },
        message: `The pointer has been all the way round — every bucket now answers to mod ${
          result.size * 2
        }, so the level goes up and the pointer restarts at bucket 0`,
      });
    }
    working = split;
  }

  return working;
}

export const insert = {
  key: "insert",
  label: "Insert",
  group: "core",
  fields: ["key"],
  desc: "Both schemes grow one bucket at a time instead of rehashing the whole table at once, which is what makes them 'dynamic' — there is never an O(n) pause. Extendible hashing sends the key through the directory to a bucket; when that bucket is full it splits in two, and the directory only doubles when the bucket was as deep as the directory itself. Linear hashing has no directory to consult: the key goes to h_L(k), or to the next level's hash if the split pointer has already passed that bucket. If the bucket is full the key waits in an overflow block — and the bucket that splits is the one the pointer is on, which is usually a different one entirely.",
  time: "O(1) amortized — a split touches one bucket, never the whole table",
  space: "O(1) per insert; the directory is O(2^d)",
  run(table, { key }) {
    const steps = [];
    const before = cloneTable(table);
    const spot = locate(before, key);

    if (spot.found) {
      steps.push({
        ...before,
        hash: hashExprFor(before, key),
        dirIndex: spot.dirIndex,
        bucketIndex: spot.bucketIndex,
        activeKey: key,
        resultBadge: "DUPLICATE KEY",
        message: `${key} is already in ${bucketLabel(before, spot.bucketIndex)} — keys are unique, so there is nothing to insert`,
      });
      return { steps, finalTable: table };
    }

    const after = isExtendible(before) ? insertExtendible(before, key, steps) : insertLinear(before, key, steps);

    steps.push({
      ...after,
      activeKey: key,
      message: isExtendible(after)
        ? `${key} inserted — ${keyCount(after)} keys in ${after.buckets.length} buckets, directory ${after.directory.length} entries (global depth ${after.globalDepth})`
        : `${key} inserted — ${keyCount(after)} keys in ${after.buckets.length} buckets, level ${after.level}, split pointer on bucket ${after.next}`,
    });

    return { steps, finalTable: after };
  },
};

import {
  cloneTable,
  isExtendible,
  keyCount,
  levelSize,
  loadFactor,
  overflowCount,
  slotCount,
  SPLIT_LIMIT,
} from "./helpers";

export const stats = {
  key: "stats",
  label: "Depths & Pointers",
  group: "status",
  fields: [],
  desc: "Reads out the numbers that decide what happens on the next insert. For extendible hashing those are the global depth (how many bits the directory indexes on) and each bucket's local depth (how many bits that bucket has actually been split on) — the gap between them is exactly what says whether a split can be absorbed by the directory as it stands. For linear hashing they are the level and the split pointer, which between them say which hash function each bucket answers to.",
  time: "O(b)",
  space: "O(1)",
  run(table) {
    const before = cloneTable(table);
    const steps = [];
    const alpha = loadFactor(before);

    if (isExtendible(before)) {
      steps.push({
        ...before,
        message: `Global depth ${before.globalDepth} — the directory has 2^${before.globalDepth} = ${before.directory.length} entries, indexed by the last ${before.globalDepth} bits of a key`,
      });

      const shared = before.buckets.map((bucket, index) => ({
        index,
        depth: bucket.localDepth,
        pointers: before.directory.filter((target) => target === index).length,
      }));

      shared.forEach((bucket) => {
        steps.push({
          ...before,
          bucketIndex: bucket.index,
          message: `B${bucket.index} has local depth ${bucket.depth}, so ${bucket.pointers} directory entr${
            bucket.pointers === 1 ? "y points" : "ies point"
          } at it — 2^(${before.globalDepth} − ${bucket.depth})`,
        });
      });

      const atDepth = shared.filter((b) => b.depth === before.globalDepth).length;
      steps.push({
        ...before,
        resultBadge: `GLOBAL DEPTH ${before.globalDepth}`,
        message: `${atDepth} of ${before.buckets.length} buckets are already as deep as the directory — those are the ones whose next overflow doubles it`,
      });
      return { steps, finalTable: table };
    }

    const size = levelSize(before);
    steps.push({
      ...before,
      message: `Level ${before.level} — the base hash is h${before.level}(k) = k mod ${size}`,
    });
    steps.push({
      ...before,
      bucketIndex: before.next,
      splitting: { from: before.next, to: before.next },
      message:
        before.next === 0
          ? `The split pointer is back at bucket 0 — every bucket answers to mod ${size}, and the next split starts the round again`
          : `The split pointer is on bucket ${before.next}: buckets 0–${before.next - 1} have been rehashed with mod ${
              size * 2
            }, the rest still answer to mod ${size}`,
    });

    const overflow = overflowCount(before);
    steps.push({
      ...before,
      message: `${before.buckets.length} buckets × ${before.bucketSize} slots = ${slotCount(before)} slots, ${keyCount(
        before
      )} keys, ${overflow} of them waiting in overflow blocks`,
    });

    steps.push({
      ...before,
      resultBadge: `α = ${alpha.toFixed(2)}`,
      message: `α = ${keyCount(before)}/${slotCount(before)} = ${alpha.toFixed(2)} — a split happens the moment it passes ${SPLIT_LIMIT}, and it is always bucket ${
        before.next
      } that splits, whatever overflowed`,
    });
    return { steps, finalTable: table };
  },
};

/**
 * Dynamic hashing — the two schemes that grow a hash table one bucket at a
 * time instead of rehashing all of it at once.
 *
 *   extendible  a directory of 2^globalDepth pointers into buckets that each
 *               carry a local depth. Overflow splits one bucket, and only when
 *               that bucket was as deep as the directory does the directory
 *               itself double.
 *   linear      no directory at all. Buckets are appended in order, and the
 *               one that splits is whichever `next` points at — not the one
 *               that overflowed, which chains into an overflow block until its
 *               own turn comes round.
 *
 * Both are stored as one object so a single canvas and one set of operations
 * can serve either:
 *
 *   { kind, bucketSize, buckets: [{ id, keys, localDepth?, overflow? }],
 *     globalDepth?, directory?, level?, next?, order }
 *
 * `order` is the insertion order of the live keys, which is what lets a shared
 * link rebuild the exact same shape — in both schemes where a key lands
 * depends on how many splits had happened when it arrived.
 */

let bucketCounter = 0;
const nextBucketId = () => `db${(bucketCounter += 1)}`;

/** Keys per bucket. Small, so a split is never more than a few steps away. */
export const BUCKET_SIZE = 2;

/** Linear hashing's starting bucket count. A power of two, so h_L is the low bits. */
export const INITIAL_BUCKETS = 4;

/** Linear hashing splits on load factor rather than on overflow. */
export const SPLIT_LIMIT = 0.75;

export const MAX_KEYS = 20;

export const DYNAMIC_KINDS = [
  {
    key: "extendible",
    label: "Extendible Hashing",
    short: "EXTENDIBLE",
    tag: "DIRECTORY",
    summary: "A directory of 2^d pointers. Splitting one bucket only doubles the directory when that bucket was already as deep as it is.",
  },
  {
    key: "linear",
    label: "Linear Hashing",
    short: "LINEAR",
    tag: "DIRECTORYLESS",
    summary: "No directory: buckets are appended in order, and the split pointer decides which one splits next — usually not the one that overflowed.",
  },
];

export const KIND_MAP = Object.fromEntries(DYNAMIC_KINDS.map((k) => [k.key, k]));

export const isExtendible = (table) => table.kind === "extendible";

// ---------------------------------------------------------------------
// hashing
// ---------------------------------------------------------------------

/** The low `bits` bits of a key — the whole of extendible hashing's address. */
export function lowBits(key, bits) {
  const size = 2 ** bits;
  return ((key % size) + size) % size;
}

/** The same index written out, which is how a directory is usually drawn. */
export const binary = (value, bits) => value.toString(2).padStart(Math.max(bits, 1), "0");

export const dirIndexOf = (table, key) => lowBits(key, table.globalDepth);

/** Buckets in a linear-hashed table at the current level, before any splits. */
export const levelSize = (table) => INITIAL_BUCKETS * 2 ** table.level;

/**
 * Linear hashing's address: h_L(k) = k mod N·2^L, except for the buckets the
 * split pointer has already passed, which have been rehashed to the next
 * level and so answer to h_L+1 instead.
 */
export function linearAddress(table, key) {
  const size = levelSize(table);
  const index = ((key % size) + size) % size;
  if (index >= table.next) return { index, level: table.level, size };
  const doubled = size * 2;
  return { index: ((key % doubled) + doubled) % doubled, level: table.level + 1, size: doubled };
}

export function hashExprFor(table, key) {
  if (isExtendible(table)) {
    const index = dirIndexOf(table, key);
    return `h(${key}) = last ${table.globalDepth} bit${table.globalDepth === 1 ? "" : "s"} of ${key} = ${binary(index, table.globalDepth)} = ${index}`;
  }
  const address = linearAddress(table, key);
  return `h${address.level}(${key}) = ${key} mod ${address.size} = ${address.index}`;
}

// ---------------------------------------------------------------------
// building and cloning
// ---------------------------------------------------------------------

const newBucket = (extra) => ({ id: nextBucketId(), keys: [], ...extra });

export function emptyTable(kind) {
  if (kind === "extendible") {
    const a = newBucket({ localDepth: 1 });
    const b = newBucket({ localDepth: 1 });
    return { kind, bucketSize: BUCKET_SIZE, globalDepth: 1, directory: [0, 1], buckets: [a, b], order: [] };
  }
  return {
    kind: "linear",
    bucketSize: BUCKET_SIZE,
    level: 0,
    next: 0,
    buckets: Array.from({ length: INITIAL_BUCKETS }, () => newBucket({ overflow: [] })),
    order: [],
  };
}

export function cloneTable(table) {
  return {
    ...table,
    directory: table.directory ? [...table.directory] : undefined,
    buckets: table.buckets.map((bucket) => ({
      ...bucket,
      keys: [...bucket.keys],
      overflow: bucket.overflow ? [...bucket.overflow] : undefined,
    })),
    order: [...table.order],
  };
}

/** Every key a bucket holds, its overflow chain included. */
export const bucketKeys = (bucket) => [...bucket.keys, ...(bucket.overflow || [])];

export const keyCount = (table) => table.order.length;

/** Slots in the primary buckets — overflow is what happens when they run out. */
export const slotCount = (table) => table.buckets.length * table.bucketSize;

export const loadFactor = (table) => keyCount(table) / slotCount(table);

export const overflowCount = (table) =>
  table.buckets.reduce((total, bucket) => total + (bucket.overflow?.length || 0), 0);

/** The bucket a key belongs in, with how it was addressed. */
export function locate(table, key) {
  if (isExtendible(table)) {
    const dirIndex = dirIndexOf(table, key);
    const bucketIndex = table.directory[dirIndex];
    const bucket = table.buckets[bucketIndex];
    return { dirIndex, bucketIndex, bucket, found: bucket.keys.includes(key) };
  }
  const address = linearAddress(table, key);
  const bucket = table.buckets[address.index];
  return {
    bucketIndex: address.index,
    bucket,
    address,
    found: bucketKeys(bucket).includes(key),
    inOverflow: (bucket.overflow || []).includes(key),
  };
}

// ---------------------------------------------------------------------
// extendible: splitting
// ---------------------------------------------------------------------

/** Doubles the directory, mutating `table`. Every new entry starts out pointing where its lower half did. */
export function doubleDirectory(table) {
  table.directory = [...table.directory, ...table.directory];
  table.globalDepth += 1;
}

/**
 * Splits `bucketIndex` in two and redeals its keys by the next bit down.
 * The directory entries that pointed at it are re-aimed at whichever of the
 * two buckets their own bit selects. Mutates `table`, returns the new bucket's
 * index.
 */
export function splitBucket(table, bucketIndex) {
  const bucket = table.buckets[bucketIndex];
  const depth = bucket.localDepth;
  const image = newBucket({ localDepth: depth + 1 });
  bucket.localDepth = depth + 1;
  table.buckets.push(image);
  const imageIndex = table.buckets.length - 1;

  // The bit that now tells the two apart is the one just past the old depth.
  const bit = 2 ** depth;
  const staying = bucket.keys.filter((k) => (k & bit) === 0);
  const moving = bucket.keys.filter((k) => (k & bit) !== 0);
  bucket.keys = staying;
  image.keys = moving;

  table.directory = table.directory.map((target, index) =>
    target === bucketIndex && (index & bit) !== 0 ? imageIndex : target
  );

  return imageIndex;
}

// ---------------------------------------------------------------------
// linear: splitting
// ---------------------------------------------------------------------

/**
 * Splits the bucket the `next` pointer is on — which is rarely the bucket that
 * just overflowed, and that is the trick: growth is spread evenly instead of
 * chasing whichever bucket happens to be busy. Mutates `table` and returns
 * what moved where.
 */
export function splitNext(table) {
  const from = table.next;
  const size = levelSize(table);
  const image = newBucket({ overflow: [] });
  table.buckets.push(image);
  const imageIndex = table.buckets.length - 1;

  const all = bucketKeys(table.buckets[from]);
  const doubled = size * 2;
  const staying = all.filter((k) => ((k % doubled) + doubled) % doubled === from);
  const moving = all.filter((k) => ((k % doubled) + doubled) % doubled !== from);

  table.buckets[from] = { ...table.buckets[from], keys: staying.slice(0, table.bucketSize), overflow: staying.slice(table.bucketSize) };
  image.keys = moving.slice(0, table.bucketSize);
  image.overflow = moving.slice(table.bucketSize);

  table.next += 1;
  let levelled = false;
  if (table.next >= size) {
    table.next = 0;
    table.level += 1;
    levelled = true;
  }

  return { from, imageIndex, staying, moving, levelled, size };
}

// ---------------------------------------------------------------------
// silent building — shared links, shuffles, kind switches
// ---------------------------------------------------------------------

/** Places a key with no animation, splitting exactly as the animated insert would. */
export function insertKeySilent(table, key) {
  const next = cloneTable(table);
  if (locate(next, key).found) return next;

  if (isExtendible(next)) {
    for (let guard = 0; guard < 12; guard += 1) {
      const spot = locate(next, key);
      if (spot.bucket.keys.length < next.bucketSize) {
        spot.bucket.keys.push(key);
        next.order.push(key);
        return next;
      }
      if (spot.bucket.localDepth === next.globalDepth) doubleDirectory(next);
      splitBucket(next, spot.bucketIndex);
    }
    return next;
  }

  const spot = locate(next, key);
  if (spot.bucket.keys.length < next.bucketSize) spot.bucket.keys.push(key);
  else spot.bucket.overflow.push(key);
  next.order.push(key);

  while (loadFactor(next) > SPLIT_LIMIT) splitNext(next);
  return next;
}

export function buildTableFromKeys(keys, kind) {
  return keys.reduce((table, key) => insertKeySilent(table, key), emptyTable(kind));
}

export function randomTable(kind) {
  const count = 6 + Math.floor(Math.random() * 3);
  const keys = new Set();
  while (keys.size < count) keys.add(Math.floor(Math.random() * 60) + 1);
  return buildTableFromKeys([...keys], kind);
}

/** Parses the custom-keys box: "12, 5, 30" -> [12, 5, 30], duplicates dropped. */
export function parseKeyList(input, limit = MAX_KEYS) {
  const seen = new Set();
  return input
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 0)
    .filter((n) => (seen.has(n) ? false : seen.add(n)))
    .slice(0, limit);
}

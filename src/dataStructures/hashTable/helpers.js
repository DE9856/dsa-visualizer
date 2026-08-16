import { nextId } from "../linkedList/nodeId";

/**
 * A hash table stored as an array of buckets. Both collision strategies share
 * the same shape so one canvas can draw either:
 *
 *   chaining        buckets[i] = [entry, entry, ...]   a chain of any length
 *   open addressing buckets[i] = [] | [entry]          one slot, or a tombstone
 *
 * `order` is the insertion order of the live keys. Rebuilding a table means
 * re-inserting in that order, which is what lets a shared link reproduce the
 * exact layout on screen — with probing, the order keys arrive in decides
 * where they land.
 */

// Table sizes are always prime. (key mod m) spreads unevenly when m shares
// factors with the keys, and quadratic probing's guarantee — an insert always
// finds a slot while the table is under half full — only holds for prime m.
export const INITIAL_CAPACITY = 7;

// Enough keys to force a couple of resizes without turning the canvas into a
// wall of boxes.
export const MAX_KEYS = 24;

export const HASH_STRATEGIES = [
  {
    key: "chaining",
    label: "Separate Chaining",
    short: "CHAINING",
    // Chains absorb collisions, so a chaining table can run past full before
    // it hurts; 0.75 keeps the average chain around one node.
    loadLimit: 0.75,
    resolution: "each bucket holds a linked chain",
  },
  {
    key: "linear",
    label: "Linear Probing",
    short: "LINEAR",
    // Open addressing has nowhere to overflow to, and clustering makes probes
    // blow up long before the table is actually full.
    loadLimit: 0.5,
    resolution: "walk forward one slot at a time",
  },
  {
    key: "quadratic",
    label: "Quadratic Probing",
    short: "QUADRATIC",
    loadLimit: 0.5,
    resolution: "jump 1, 4, 9, 16... slots ahead",
  },
];

export const STRATEGY_MAP = Object.fromEntries(HASH_STRATEGIES.map((s) => [s.key, s]));

export const isOpenAddressed = (strategy) => strategy !== "chaining";

export const loadLimitFor = (strategy) => STRATEGY_MAP[strategy]?.loadLimit ?? 0.75;

// ---------------------------------------------------------------------
// hashing and probing
// ---------------------------------------------------------------------

/** The division-method hash. The double mod keeps negative keys in range. */
export function hashOf(key, capacity) {
  return ((key % capacity) + capacity) % capacity;
}

/** Human-readable form of the hash, shown above the table as it runs. */
export function hashExpr(key, capacity) {
  return `h(${key}) = ${key} mod ${capacity} = ${hashOf(key, capacity)}`;
}

/**
 * The index examined on probe `attempt` (0 = the home bucket itself).
 * Linear walks forward one slot at a time; quadratic jumps by attempt².
 */
export function probeIndex(home, attempt, capacity, strategy) {
  const offset = strategy === "quadratic" ? attempt * attempt : attempt;
  return (home + offset) % capacity;
}

/** The offset half of the probe formula, for step messages. */
export function probeOffsetLabel(strategy, attempt) {
  if (attempt === 0) return "home";
  return strategy === "quadratic" ? `+${attempt}² = +${attempt * attempt}` : `+${attempt}`;
}

/**
 * How a step names the bucket it is looking at — "Bucket 3" for the home
 * bucket, "Probe +4 → bucket 3" once the walk has moved on. Insert, search and
 * delete each word their own outcome, but they all point at buckets the same
 * way.
 */
export function probeWhere(strategy, visit) {
  if (visit.attempt === 0) return `Bucket ${visit.index}`;
  return `Probe ${probeOffsetLabel(strategy, visit.attempt)} → bucket ${visit.index}`;
}

// ---------------------------------------------------------------------
// building and cloning
// ---------------------------------------------------------------------

export function emptyTable(strategy, capacity = INITIAL_CAPACITY) {
  return {
    strategy,
    capacity,
    buckets: Array.from({ length: capacity }, () => []),
    order: [],
  };
}

export function cloneTable(table) {
  return {
    ...table,
    buckets: table.buckets.map((bucket) => bucket.map((entry) => ({ ...entry }))),
    order: [...table.order],
  };
}

export const keyCount = (table) => table.order.length;

export const loadFactor = (table) => table.order.length / table.capacity;

/** Live keys, in the order they were inserted. */
export const tableKeys = (table) => [...table.order];

/** How many slots a probing table has spent on tombstones. */
export function tombstoneCount(table) {
  if (!isOpenAddressed(table.strategy)) return 0;
  return table.buckets.filter((bucket) => bucket[0]?.deleted).length;
}

function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** The next table size: the first prime at least twice as large. */
export function nextCapacity(capacity) {
  let n = capacity * 2 + 1;
  while (!isPrime(n)) n++;
  return n;
}

/**
 * True for a capacity the table could actually have grown into (7, 17, 37...).
 * A hand-edited shared link can name a capacity; this is what keeps it to one
 * the app itself could have produced.
 */
export function isReachableCapacity(capacity) {
  let n = INITIAL_CAPACITY;
  while (n < capacity) n = nextCapacity(n);
  return n === capacity;
}

/** True once the table has crossed the load factor its strategy allows. */
export function needsResize(table) {
  return loadFactor(table) > loadLimitFor(table.strategy);
}

// ---------------------------------------------------------------------
// the probe walk
// ---------------------------------------------------------------------

/**
 * Walks the lookup path for `key` and reports every bucket examined along the
 * way. Insert, search and delete all start here, and so does the silent
 * rebuild used by shared links — one walk, so the animation and the rebuilt
 * table can never disagree about where a key belongs.
 *
 * Each visit is `{ index, attempt, entry, kind }`, where kind is:
 *   occupied  — a live entry that isn't the key we want
 *   match     — the key is already here
 *   tombstone — a deleted slot: skip it, but remember it for insert
 *   empty     — a free slot: the key isn't in the table, and this is where an
 *               insert would put it
 *
 * The outcome is `found` (with `index`, plus `chainPos` when chaining),
 * `absent` (with `insertIndex`), or `full` — a probe sequence that ran out of
 * attempts without reaching a free slot.
 */
export function locate(table, key) {
  const home = hashOf(key, table.capacity);
  const trace = [];

  if (!isOpenAddressed(table.strategy)) {
    const chain = table.buckets[home];
    for (let i = 0; i < chain.length; i++) {
      const entry = chain[i];
      const kind = entry.value === key ? "match" : "occupied";
      trace.push({ index: home, attempt: 0, chainPos: i, entry, kind });
      if (kind === "match") return { home, trace, outcome: "found", index: home, chainPos: i };
    }
    // A new key is appended at the tail of the chain, so the chain reads in
    // insertion order rather than reversing every time you look at it.
    return { home, trace, outcome: "absent", index: home, insertIndex: home, chainPos: chain.length };
  }

  let firstTombstone = -1;

  for (let attempt = 0; attempt < table.capacity; attempt++) {
    const index = probeIndex(home, attempt, table.capacity, table.strategy);
    const entry = table.buckets[index][0] || null;
    const kind = !entry ? "empty" : entry.deleted ? "tombstone" : entry.value === key ? "match" : "occupied";
    trace.push({ index, attempt, entry, kind });

    if (kind === "match") return { home, trace, outcome: "found", index };
    // Reusing the first tombstone keeps probe sequences short, but only after
    // the whole run confirms the key isn't stored further along.
    if (kind === "tombstone" && firstTombstone < 0) firstTombstone = index;
    if (kind === "empty") {
      return { home, trace, outcome: "absent", index, insertIndex: firstTombstone >= 0 ? firstTombstone : index };
    }
  }

  if (firstTombstone >= 0) {
    return { home, trace, outcome: "absent", index: firstTombstone, insertIndex: firstTombstone };
  }
  return { home, trace, outcome: "full", index: home };
}

// ---------------------------------------------------------------------
// silent building (no steps) — shared links, shuffles, strategy switches
// ---------------------------------------------------------------------

/** Places a key in a cloned table, resizing if that pushes it over the limit. */
export function insertKeySilent(table, key) {
  const next = cloneTable(table);
  const found = locate(next, key);
  if (found.outcome === "found" || found.outcome === "full") return next;

  const entry = { id: nextId(), value: key };
  if (isOpenAddressed(next.strategy)) next.buckets[found.insertIndex] = [entry];
  else next.buckets[found.insertIndex].push(entry);
  next.order.push(key);

  return needsResize(next) ? rehashInto(next, nextCapacity(next.capacity)) : next;
}

/** Rebuilds the table at a new capacity, re-inserting keys in arrival order. */
export function rehashInto(table, capacity) {
  const grown = emptyTable(table.strategy, capacity);
  for (const key of table.order) {
    const spot = locate(grown, key);
    if (spot.outcome !== "absent") continue;
    const entry = { id: nextId(), value: key };
    if (isOpenAddressed(grown.strategy)) grown.buckets[spot.insertIndex] = [entry];
    else grown.buckets[spot.insertIndex].push(entry);
    grown.order.push(key);
  }
  return grown;
}

/**
 * Replays `keys` into a fresh table, growing it as the load factor demands.
 *
 * `capacity` starts it larger than the default, which is how a shared link
 * restores a table that grew and then had keys deleted — capacity is a
 * function of how big the table ever got, not of how many keys are in it now.
 */
export function buildTableFromKeys(keys, strategy, capacity = INITIAL_CAPACITY) {
  const start = isReachableCapacity(capacity) ? capacity : INITIAL_CAPACITY;
  return keys.reduce((table, key) => insertKeySilent(table, key), emptyTable(strategy, start));
}

export function randomTable(strategy) {
  const count = 4 + Math.floor(Math.random() * 3);
  const keys = new Set();
  while (keys.size < count) keys.add(Math.floor(Math.random() * 90) + 10);
  return buildTableFromKeys([...keys], strategy);
}

/** Parses the custom-keys box: "42, 13, 7" -> [42, 13, 7], duplicates dropped. */
export function parseKeyList(input, limit = MAX_KEYS) {
  const seen = new Set();
  return input
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
    .filter((n) => (seen.has(n) ? false : seen.add(n)))
    .slice(0, limit);
}

import { nextId } from "../linkedList/nodeId";

/**
 * A hash table stored as an array of buckets. Every strategy shares the same
 * shape so one canvas can draw any of them:
 *
 *   chaining        buckets[i] = [entry, entry, ...]   a chain of any length
 *   open addressing buckets[i] = [] | [entry]          one slot, or a tombstone
 *   cuckoo          the same, twice — `buckets` is T1 and `buckets2` is T2
 *
 * `order` is the insertion order of the live keys. Rebuilding a table means
 * re-inserting in that order, which is what lets a shared link reproduce the
 * exact layout on screen — with probing, the order keys arrive in decides
 * where they land.
 *
 * `hashFn` picks how a key becomes an index; it is a separate axis from the
 * strategy, which only decides what happens once two keys want the same one.
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
  {
    key: "double",
    label: "Double Hashing",
    short: "DOUBLE HASH",
    loadLimit: 0.5,
    resolution: "step by h₂(k) = 1 + k mod (m−2), a stride of the key's own",
  },
  {
    key: "robinhood",
    label: "Robin Hood",
    short: "ROBIN HOOD",
    // Robin Hood probes linearly but evens the distances out, so the long
    // tail that forces the 0.5 cap on plain linear probing never forms.
    loadLimit: 0.75,
    resolution: "probe forward, and the key that has travelled further takes the slot",
  },
  {
    key: "cuckoo",
    label: "Cuckoo Hashing",
    short: "CUCKOO",
    // Two tables, so the limit is against 2m slots. Past ~0.5 the eviction
    // chains start closing into cycles.
    loadLimit: 0.5,
    resolution: "evict the sitting key, which rehomes in the other table",
  },
];

export const STRATEGY_MAP = Object.fromEntries(HASH_STRATEGIES.map((s) => [s.key, s]));

/** One slot per bucket — everything except chaining. */
export const isOpenAddressed = (strategy) => strategy !== "chaining";

export const isCuckoo = (strategy) => strategy === "cuckoo";

export const isRobinHood = (strategy) => strategy === "robinhood";

/**
 * Only the probing strategies leave tombstones. Robin Hood shifts the
 * following keys back instead, and cuckoo knows a key's two possible slots
 * without probing through anything, so neither needs the marker.
 */
export const usesTombstones = (strategy) =>
  strategy === "linear" || strategy === "quadratic" || strategy === "double";

export const loadLimitFor = (strategy) => STRATEGY_MAP[strategy]?.loadLimit ?? 0.75;

// ---------------------------------------------------------------------
// hash functions
// ---------------------------------------------------------------------

// Knuth's suggested multiplier, the fractional part of the golden ratio. Its
// irrationality is the point: successive keys land far apart in [0, 1).
const KNUTH_A = 0.6180339887;

export const HASH_FUNCTIONS = [
  {
    key: "division",
    label: "Division",
    short: "DIVISION",
    formula: "h(k) = k mod m",
    note: "The remainder, straight up. Fast, and with a prime m it spreads well — but keys sharing a factor with m pile onto the same few buckets.",
  },
  {
    key: "multiplication",
    label: "Multiplication",
    short: "MULTIPLICATION",
    formula: "h(k) = ⌊m × frac(k × 0.6180)⌋",
    note: "Multiply by an irrational constant, keep the fractional part, scale to the table. The value of m stops mattering, so it survives a table size that isn't prime.",
  },
  {
    key: "midsquare",
    label: "Mid-Square",
    short: "MID-SQUARE",
    formula: "h(k) = mid digits of k², mod m",
    note: "Square the key and take the middle digits: every digit of the key feeds into them, so two keys differing anywhere land apart.",
  },
  {
    key: "folding",
    label: "Digit Folding",
    short: "DIGIT FOLD",
    formula: "h(k) = (sum of k's digits) mod m",
    note: "Add the key's digits and take the remainder. The general form folds fixed-width groups instead, which is what makes it useful for long keys like account numbers — on short keys the sum is small, and the table's high buckets go unused.",
  },
];

export const HASH_FN_MAP = Object.fromEntries(HASH_FUNCTIONS.map((f) => [f.key, f]));

export const DEFAULT_HASH_FN = "division";

const digitsOf = (key) => String(Math.abs(key)).split("").map(Number);

/** The middle digits of k², as a number — mid-square's raw value before mod m. */
function midSquareValue(key) {
  const squared = String(Math.abs(key) * Math.abs(key));
  // Two middle digits when there are enough of them, so the result stays a
  // sensible size next to a table of a few dozen buckets.
  const width = Math.min(2, squared.length);
  const start = Math.floor((squared.length - width) / 2);
  return Number(squared.slice(start, start + width));
}

const digitSum = (key) => digitsOf(key).reduce((sum, d) => sum + d, 0);

/** Turns a key into a bucket index. The double mod keeps negative keys in range. */
export function hashOf(key, capacity, fn = DEFAULT_HASH_FN) {
  if (!capacity) return 0;
  const mod = (n) => ((n % capacity) + capacity) % capacity;
  switch (fn) {
    case "multiplication": {
      const product = Math.abs(key) * KNUTH_A;
      return Math.min(capacity - 1, Math.floor(capacity * (product - Math.floor(product))));
    }
    case "midsquare":
      return mod(midSquareValue(key));
    case "folding":
      return mod(digitSum(key));
    default:
      return mod(key);
  }
}

/** Human-readable form of the hash, shown above the table as it runs. */
export function hashExpr(key, capacity, fn = DEFAULT_HASH_FN) {
  const index = hashOf(key, capacity, fn);
  switch (fn) {
    case "multiplication": {
      const product = Math.abs(key) * KNUTH_A;
      const frac = product - Math.floor(product);
      return `h(${key}) = ⌊${capacity} × frac(${key} × 0.6180)⌋ = ⌊${capacity} × ${frac.toFixed(4)}⌋ = ${index}`;
    }
    case "midsquare": {
      const squared = Math.abs(key) * Math.abs(key);
      return `h(${key}) = mid(${key}² = ${squared}) = ${midSquareValue(key)} mod ${capacity} = ${index}`;
    }
    case "folding":
      return `h(${key}) = (${digitsOf(key).join(" + ")}) mod ${capacity} = ${digitSum(key)} mod ${capacity} = ${index}`;
    default:
      return `h(${key}) = ${key} mod ${capacity} = ${index}`;
  }
}

/**
 * Cuckoo hashing's second function, which has to be independent of the first
 * or a key's two candidate slots would be the same one. Dividing by m before
 * taking the remainder uses the high end of the key, which h(k) = k mod m
 * throws away.
 */
export function hash2Of(key, capacity) {
  if (!capacity) return 0;
  return Math.floor(Math.abs(key) / capacity) % capacity;
}

export function hash2Expr(key, capacity) {
  return `h₂(${key}) = ⌊${key}/${capacity}⌋ mod ${capacity} = ${hash2Of(key, capacity)}`;
}

/**
 * Double hashing's stride. Never zero — a step of 0 would probe the home
 * bucket forever — and less than m, which being prime means the walk reaches
 * every bucket before it repeats.
 */
export function doubleStep(key, capacity) {
  return 1 + (Math.abs(key) % Math.max(1, capacity - 2));
}

export function doubleStepExpr(key, capacity) {
  return `h₂(${key}) = 1 + ${key} mod ${capacity - 2} = ${doubleStep(key, capacity)}`;
}

// ---------------------------------------------------------------------
// probing
// ---------------------------------------------------------------------

/**
 * The index examined on probe `attempt` (0 = the home bucket itself). Linear
 * and Robin Hood walk forward one slot at a time, quadratic jumps by attempt²,
 * and double hashing steps by a stride the key computes for itself.
 */
export function probeIndex(home, attempt, capacity, strategy, key = 0) {
  let offset = attempt;
  if (strategy === "quadratic") offset = attempt * attempt;
  else if (strategy === "double") offset = attempt * doubleStep(key, capacity);
  return (home + offset) % capacity;
}

/** The offset half of the probe formula, for step messages. */
export function probeOffsetLabel(strategy, attempt, key = 0, capacity = 1) {
  if (attempt === 0) return "home";
  if (strategy === "quadratic") return `+${attempt}² = +${attempt * attempt}`;
  if (strategy === "double") {
    const step = doubleStep(key, capacity);
    return `+${attempt}×${step} = +${attempt * step}`;
  }
  return `+${attempt}`;
}

/**
 * How a step names the bucket it is looking at — "Bucket 3" for the home
 * bucket, "Probe +4 → bucket 3" once the walk has moved on. Insert, search and
 * delete each word their own outcome, but they all point at buckets the same
 * way.
 */
export function probeWhere(strategy, visit, key = 0, capacity = 1) {
  if (visit.attempt === 0) return `Bucket ${visit.index}`;
  return `Probe ${probeOffsetLabel(strategy, visit.attempt, key, capacity)} → bucket ${visit.index}`;
}

/**
 * How far the entry sitting at `index` had to probe from its own home bucket.
 * Robin Hood's whole invariant is a comparison between two of these.
 */
export function probeDistance(table, index, entry) {
  const sitting = entry || table.buckets[index][0];
  if (!sitting) return 0;
  const home = hashOf(sitting.value, table.capacity, table.hashFn);
  return (index - home + table.capacity) % table.capacity;
}

// ---------------------------------------------------------------------
// building and cloning
// ---------------------------------------------------------------------

export function emptyTable(strategy, capacity = INITIAL_CAPACITY, hashFn = DEFAULT_HASH_FN) {
  const table = {
    strategy,
    hashFn,
    capacity,
    buckets: Array.from({ length: capacity }, () => []),
    order: [],
  };
  if (isCuckoo(strategy)) table.buckets2 = Array.from({ length: capacity }, () => []);
  return table;
}

const cloneBuckets = (buckets) => buckets.map((bucket) => bucket.map((entry) => ({ ...entry })));

export function cloneTable(table) {
  const copy = {
    ...table,
    buckets: cloneBuckets(table.buckets),
    order: [...table.order],
  };
  if (table.buckets2) copy.buckets2 = cloneBuckets(table.buckets2);
  return copy;
}

export const keyCount = (table) => table.order.length;

/** Slots a key could occupy — cuckoo has two tables, so twice the capacity. */
export const slotCount = (table) => (isCuckoo(table.strategy) ? table.capacity * 2 : table.capacity);

export const loadFactor = (table) => table.order.length / slotCount(table);

/** Live keys, in the order they were inserted. */
export const tableKeys = (table) => [...table.order];

/** How many slots a probing table has spent on tombstones. */
export function tombstoneCount(table) {
  if (!usesTombstones(table.strategy)) return 0;
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
 * Each visit is `{ index, attempt, entry, kind }` — plus `table: 2` for a
 * cuckoo visit to the second table, and `chainPos` when chaining. `kind` is:
 *   occupied  — a live entry that isn't the key we want
 *   match     — the key is already here
 *   tombstone — a deleted slot: skip it, but remember it for insert
 *   empty     — a free slot: the key isn't in the table, and this is where an
 *               insert would put it
 *   richer    — Robin Hood only: this entry is closer to its home than we are
 *               to ours, which proves our key was never inserted here
 *
 * The outcome is `found` (with `index`, plus `chainPos` when chaining and
 * `table` under cuckoo), `absent` (with `insertIndex`), or `full` — a probe
 * sequence that ran out of attempts without reaching a free slot.
 */
export function locate(table, key) {
  const home = hashOf(key, table.capacity, table.hashFn);
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

  // Cuckoo doesn't probe: a key lives in one of exactly two slots, so the
  // lookup is those two slots and nothing else.
  if (isCuckoo(table.strategy)) {
    const alt = hash2Of(key, table.capacity);
    const first = table.buckets[home][0] || null;
    const kind1 = !first ? "empty" : first.value === key ? "match" : "occupied";
    trace.push({ index: home, attempt: 0, table: 1, entry: first, kind: kind1 });
    if (kind1 === "match") return { home, alt, trace, outcome: "found", index: home, table: 1 };

    const second = table.buckets2[alt][0] || null;
    const kind2 = !second ? "empty" : second.value === key ? "match" : "occupied";
    trace.push({ index: alt, attempt: 1, table: 2, entry: second, kind: kind2 });
    if (kind2 === "match") return { home, alt, trace, outcome: "found", index: alt, table: 2 };

    // An insert always starts at T1 and evicts whoever is there, so that is
    // where a missing key is headed regardless of what the two slots hold.
    return { home, alt, trace, outcome: "absent", index: home, insertIndex: home, table: 1 };
  }

  let firstTombstone = -1;

  for (let attempt = 0; attempt < table.capacity; attempt++) {
    const index = probeIndex(home, attempt, table.capacity, table.strategy, key);
    const entry = table.buckets[index][0] || null;
    let kind = !entry ? "empty" : entry.deleted ? "tombstone" : entry.value === key ? "match" : "occupied";

    // Robin Hood's invariant does the work a tombstone would: every key is at
    // least as far from home as the ones before it in the run, so meeting a
    // closer-to-home entry ends the search then and there.
    if (kind === "occupied" && isRobinHood(table.strategy) && probeDistance(table, index, entry) < attempt) {
      kind = "richer";
    }

    trace.push({ index, attempt, entry, kind });

    if (kind === "match") return { home, trace, outcome: "found", index };
    // Reusing the first tombstone keeps probe sequences short, but only after
    // the whole run confirms the key isn't stored further along.
    if (kind === "tombstone" && firstTombstone < 0) firstTombstone = index;
    if (kind === "empty" || kind === "richer") {
      return { home, trace, outcome: "absent", index, insertIndex: firstTombstone >= 0 ? firstTombstone : index };
    }
  }

  if (firstTombstone >= 0) {
    return { home, trace, outcome: "absent", index: firstTombstone, insertIndex: firstTombstone };
  }
  return { home, trace, outcome: "full", index: home };
}

// ---------------------------------------------------------------------
// silent placement (no steps) — shared links, shuffles, strategy switches
// ---------------------------------------------------------------------

/** How many evictions a cuckoo insert tries before calling it a cycle. */
export const MAX_KICKS = 16;

const newEntry = (key) => ({ id: nextId(), value: key });

/**
 * Robin Hood placement: walk forward carrying an entry, and whenever the slot
 * holds one that started closer to home, drop ours there and pick that one up
 * instead. The rich give up their slots to the poor, which is what keeps any
 * single key from ending up with a very long probe.
 *
 * Returns the sequence of `{ index, placed, displaced }` events so the
 * animated insert and the silent one place keys identically.
 */
export function robinHoodPlace(table, key) {
  const events = [];
  let carrying = newEntry(key);
  let distance = 0;
  let index = hashOf(key, table.capacity, table.hashFn);

  for (let step = 0; step < table.capacity; step++) {
    const sitting = table.buckets[index][0];
    if (!sitting || sitting.deleted) {
      table.buckets[index] = [carrying];
      events.push({ index, placed: carrying, displaced: null, distance });
      return events;
    }
    const sittingDistance = probeDistance(table, index, sitting);
    if (sittingDistance < distance) {
      table.buckets[index] = [carrying];
      events.push({ index, placed: carrying, displaced: sitting, distance, sittingDistance });
      carrying = sitting;
      distance = sittingDistance;
    }
    index = (index + 1) % table.capacity;
    distance += 1;
  }
  return null;
}

/**
 * Cuckoo placement: put the key in its T1 slot, and whoever was there hops to
 * their slot in the other table, and so on. A chain that keeps going has run
 * into a cycle, which only a bigger table can break.
 *
 * Returns the eviction chain as `{ table, index, placed, displaced }` events,
 * or null if it cycled.
 */
export function cuckooPlace(table, key) {
  const events = [];
  let carrying = newEntry(key);
  let which = 1;
  let index = hashOf(carrying.value, table.capacity, table.hashFn);

  for (let kick = 0; kick <= MAX_KICKS; kick++) {
    const slots = which === 1 ? table.buckets : table.buckets2;
    const sitting = slots[index][0] || null;
    slots[index] = [carrying];
    events.push({ table: which, index, placed: carrying, displaced: sitting });
    if (!sitting) return events;

    carrying = sitting;
    which = which === 1 ? 2 : 1;
    index =
      which === 1
        ? hashOf(carrying.value, table.capacity, table.hashFn)
        : hash2Of(carrying.value, table.capacity);
  }
  return null;
}

/**
 * Places `key` into `table`, mutating it, by whichever rule the strategy uses.
 * Returns false only when the table cannot take the key at all — a full probe
 * sequence, or a cuckoo eviction chain that closed into a cycle.
 */
export function placeInto(table, key) {
  if (isCuckoo(table.strategy)) {
    // The eviction chain rearranges slots as it goes, so a failed attempt has
    // to be rolled back rather than left half-applied.
    const snapshot = cloneTable(table);
    const events = cuckooPlace(table, key);
    if (!events) {
      table.buckets = snapshot.buckets;
      table.buckets2 = snapshot.buckets2;
      return false;
    }
    table.order.push(key);
    return true;
  }

  if (isRobinHood(table.strategy)) {
    const events = robinHoodPlace(table, key);
    if (!events) return false;
    table.order.push(key);
    return true;
  }

  const spot = locate(table, key);
  if (spot.outcome !== "absent") return spot.outcome === "found";
  const entry = newEntry(key);
  if (isOpenAddressed(table.strategy)) table.buckets[spot.insertIndex] = [entry];
  else table.buckets[spot.insertIndex].push(entry);
  table.order.push(key);
  return true;
}

/** Places a key in a cloned table, resizing if that pushes it over the limit. */
export function insertKeySilent(table, key) {
  let next = cloneTable(table);
  if (locate(next, key).outcome === "found") return next;

  // A cuckoo cycle is the one placement that can fail outright; growing the
  // table redeals every key's two slots, which breaks it.
  for (let tries = 0; tries < 4 && !placeInto(next, key); tries += 1) {
    next = rehashInto(next, nextCapacity(next.capacity));
  }

  return needsResize(next) ? rehashInto(next, nextCapacity(next.capacity)) : next;
}

/** Rebuilds the table at a new capacity, re-inserting keys in arrival order. */
export function rehashInto(table, capacity) {
  let cap = capacity;
  for (let tries = 0; tries < 4; tries += 1) {
    const grown = emptyTable(table.strategy, cap, table.hashFn);
    if (table.order.every((key) => placeInto(grown, key))) return grown;
    cap = nextCapacity(cap);
  }
  return emptyTable(table.strategy, cap, table.hashFn);
}

/**
 * Replays `keys` into a fresh table, growing it as the load factor demands.
 *
 * `capacity` starts it larger than the default, which is how a shared link
 * restores a table that grew and then had keys deleted — capacity is a
 * function of how big the table ever got, not of how many keys are in it now.
 */
export function buildTableFromKeys(keys, strategy, capacity = INITIAL_CAPACITY, hashFn = DEFAULT_HASH_FN) {
  const start = isReachableCapacity(capacity) ? capacity : INITIAL_CAPACITY;
  return keys.reduce((table, key) => insertKeySilent(table, key), emptyTable(strategy, start, hashFn));
}

export function randomTable(strategy, hashFn = DEFAULT_HASH_FN) {
  const count = 4 + Math.floor(Math.random() * 3);
  const keys = new Set();
  while (keys.size < count) keys.add(Math.floor(Math.random() * 90) + 10);
  return buildTableFromKeys([...keys], strategy, INITIAL_CAPACITY, hashFn);
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

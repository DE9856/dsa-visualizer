import { entry, hiIndex, loIndex, parentOf, swapAt } from "./helpers";

/**
 * The interval heap: the same array, read two elements at a time.
 *
 * Node k holds items[2k] and items[2k+1] as a closed interval [lo, hi]. Two
 * heaps are laid over the one tree — the lo values are a min heap and the hi
 * values are a max heap — and the two are tied together by one extra rule:
 * a node's interval contains both of its children's. So the root's interval
 * is the range of the whole collection, and *both* answers are sitting in it
 * side by side, with no comparison needed to tell which is which.
 *
 * Only the last node may be half full, holding a single element that acts as
 * both ends of its own interval. Every operation has to allow for that, and
 * it is where most of the fiddliness lives.
 */

const nodeCount = (items) => Math.ceil(items.length / 2);

const hasHi = (items, k) => hiIndex(k) < items.length;

/** The index holding node k's upper end — its hi, or its lone element. */
const topOf = (items, k) => (hasHi(items, k) ? hiIndex(k) : loIndex(k));

const showNode = (items, k) =>
  hasHi(items, k) ? `[${items[loIndex(k)].value}, ${items[hiIndex(k)].value}]` : `[${items[loIndex(k)].value}]`;

/**
 * Restores lo ≤ hi inside one node, and reports whether it had to.
 *
 * Needed because both sifts move a single endpoint at a time: a lo that
 * travels down can overshoot its own node's hi, and a hi that travels down
 * can drop below its own lo. Every mover therefore calls this on the node it
 * just wrote into.
 */
function fixNode(items, k, push, why) {
  if (!hasHi(items, k)) return false;
  const lo = loIndex(k);
  const hi = hiIndex(k);
  if (items[lo].value <= items[hi].value) return false;
  swapAt(items, lo, hi);
  push({
    swap: [lo, hi],
    message: `${why} left node ${k} holding ${items[hi].value} as its lower end and ${items[lo].value} as its upper — the two ends of one interval, the wrong way round. Swap them within the node.`,
  });
  return true;
}

export function insertInterval(items, value, push) {
  const fresh = entry(value);
  items.push(fresh);
  const at = items.length - 1;
  let k = at >> 1;

  push({
    pending: at,
    active: [fresh.id],
    message: hasHi(items, k)
      ? `${value} goes into node ${k}, which had one element and now holds a real interval.`
      : `${value} starts a new node ${k}, alone — for now it is both ends of its own interval.`,
  });

  if (at % 2 === 1 && items[loIndex(k)].value > items[hiIndex(k)].value) {
    swapAt(items, loIndex(k), hiIndex(k));
    push({
      swap: [loIndex(k), hiIndex(k)],
      message: `${value} is the smaller of the two, so it is the node's lower end — swap them so the pair reads [lo, hi].`,
    });
  }

  if (k === 0) {
    push({ current: 0, message: `Node 0 is the root — nothing above it, so ${showNode(items, 0)} is already correct.` });
    return;
  }

  // Which of the two heaps the new element rises through is decided by one
  // comparison in each direction; at most one of them can be true.
  const p = parentOf(k);
  push({
    compare: [loIndex(k), loIndex(p), topOf(items, k), hiIndex(p)],
    message: `Node ${k} is ${showNode(items, k)}, its parent ${p} is ${showNode(
      items,
      p
    )}. The parent's interval has to contain this one, so check both ends.`,
  });

  siftUpLo(items, k, push);
  siftUpHi(items, k, push);
}

/** Up the min heap, on lo endpoints only. */
function siftUpLo(items, node, push) {
  let k = node;
  while (k > 0) {
    const p = parentOf(k);
    const lo = loIndex(k);
    const plo = loIndex(p);
    if (items[lo].value >= items[plo].value) {
      if (k === node) {
        push({ compare: [lo, plo], message: `${items[lo].value} ≥ the parent's lower end ${items[plo].value} — the min heap is already in order here.` });
      }
      return;
    }
    push({ compare: [lo, plo], message: `${items[lo].value} is below the parent's lower end ${items[plo].value} — the min heap is violated.` });
    swapAt(items, lo, plo);
    push({
      swap: [lo, plo],
      message: `Swap the two lower ends. Only the lo values move; the hi values are a separate heap and are not touched.`,
    });
    fixNode(items, k, push, "Moving a lower end down");
    k = p;
  }
}

/** Up the max heap, on hi endpoints only — or a lone element standing in. */
function siftUpHi(items, node, push) {
  let k = node;
  while (k > 0) {
    const p = parentOf(k);
    const top = topOf(items, k);
    const phi = hiIndex(p);
    if (items[top].value <= items[phi].value) {
      if (k === node) {
        push({ compare: [top, phi], message: `${items[top].value} ≤ the parent's upper end ${items[phi].value} — the max heap is in order too, so the insert is done.` });
      }
      return;
    }
    push({ compare: [top, phi], message: `${items[top].value} is above the parent's upper end ${items[phi].value} — the max heap is violated.` });
    swapAt(items, top, phi);
    push({
      swap: [top, phi],
      message: `Swap the two upper ends. The lo values stay exactly where they are.`,
    });
    fixNode(items, k, push, "Moving an upper end down");
    k = p;
  }
}

export function deleteMinInterval(items, push) {
  const gone = items[0];
  push({
    removing: 0,
    message: `The root's lower end is the smallest element in the whole heap: ${gone.value}. No comparison, no search — it is simply the left half of node 0.`,
  });

  const last = items.pop();
  if (items.length === 0) {
    push({ message: `${gone.value} was the only element — the heap is empty.` });
    return gone;
  }
  if (last === gone) {
    push({ message: `That was also the last element in the array, so there is nothing to move.` });
    return gone;
  }

  items[0] = last;
  push({
    pending: 0,
    active: [last.id],
    message: `Move the last element, ${last.value}, into the hole. Now sift it down the *min* heap — only lo endpoints are involved.`,
  });
  fixNode(items, 0, push, "Filling the hole");

  let k = 0;
  for (;;) {
    const kids = [2 * k + 1, 2 * k + 2].filter((c) => loIndex(c) < items.length);
    if (kids.length === 0) {
      push({ current: loIndex(k), message: `Node ${k} has no children — ${items[loIndex(k)].value} is where it belongs.` });
      break;
    }
    let best = kids[0];
    for (const c of kids) if (items[loIndex(c)].value < items[loIndex(best)].value) best = c;

    push({
      compare: [loIndex(k), ...kids.map(loIndex)],
      current: loIndex(best),
      message: `Children of node ${k}: ${kids.map((c) => showNode(items, c)).join(" and ")}. The smaller lower end is ${
        items[loIndex(best)].value
      }, in node ${best}.`,
    });

    if (items[loIndex(best)].value >= items[loIndex(k)].value) {
      push({ current: loIndex(k), message: `${items[loIndex(k)].value} is already the smallest of the three — the min heap is restored.` });
      break;
    }

    swapAt(items, loIndex(k), loIndex(best));
    push({ swap: [loIndex(k), loIndex(best)], message: `Swap the lower ends — ${items[loIndex(k)].value} rises into node ${k}.` });
    fixNode(items, best, push, "Sinking a lower end");
    k = best;
  }

  return gone;
}

export function deleteMaxInterval(items, push) {
  const n = items.length;

  if (n === 1) {
    const gone = items.pop();
    push({ message: `One element, so it is both ends at once.` });
    return gone;
  }

  const gone = items[1];
  push({
    removing: 1,
    message: `The root's upper end is the largest element: ${gone.value}. It sits next to the smallest, in the same node — that is the whole point of the representation.`,
  });

  const last = items.pop();
  if (items.length === 1) {
    push({ message: `That was also the last element — node 0 is down to a single element, ${items[0].value}.` });
    return gone;
  }

  items[1] = last;
  push({
    pending: 1,
    active: [last.id],
    message: `Move the last element, ${last.value}, into the hole. Now sift it down the *max* heap — only hi endpoints, and a half-full node's lone element stands in for its hi.`,
  });
  fixNode(items, 0, push, "Filling the hole");

  let k = 0;
  for (;;) {
    const kids = [2 * k + 1, 2 * k + 2].filter((c) => loIndex(c) < items.length);
    if (kids.length === 0) {
      push({ current: topOf(items, k), message: `Node ${k} has no children — ${items[topOf(items, k)].value} is where it belongs.` });
      break;
    }
    let best = kids[0];
    for (const c of kids) if (items[topOf(items, c)].value > items[topOf(items, best)].value) best = c;

    const here = topOf(items, k);
    const there = topOf(items, best);
    push({
      compare: [here, ...kids.map((c) => topOf(items, c))],
      current: there,
      message: `Children of node ${k}: ${kids.map((c) => showNode(items, c)).join(" and ")}. The larger upper end is ${
        items[there].value
      }, in node ${best}.`,
    });

    if (items[there].value <= items[here].value) {
      push({ current: here, message: `${items[here].value} is already the largest of the three — the max heap is restored.` });
      break;
    }

    swapAt(items, here, there);
    push({ swap: [here, there], message: `Swap the upper ends — ${items[here].value} rises into node ${k}.` });
    fixNode(items, best, push, "Sinking an upper end");
    k = best;
  }

  return gone;
}

export { nodeCount, hasHi, showNode, topOf };

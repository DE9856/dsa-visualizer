import { entry, leavesOf, parentOf, swapAt } from "./helpers";

/**
 * The ordinary min heap, for contrast.
 *
 * Insert and delete-min are the familiar sift up and sift down. Delete-max is
 * the interesting one: a min heap has no idea where its largest element is.
 * It must be a leaf — no leaf can be an ancestor of anything larger — so the
 * search can skip the internal nodes, but that still leaves ⌈n/2⌉ of them to
 * look at. O(n), against O(log n) for either of the double-ended structures.
 * That gap is the whole reason those exist.
 */

export function insertSingle(items, value, push) {
  const fresh = entry(value);
  items.push(fresh);
  let i = items.length - 1;
  const path = [i];

  push({ pending: i, active: [fresh.id], message: `Place ${value} at index ${i}, the next free slot — the array has to stay complete.` });

  while (i > 0) {
    const p = parentOf(i);
    path.push(p);
    push({
      compare: [i, p],
      path: [...path],
      message: `Compare ${items[i].value} with its parent ${items[p].value}.`,
    });
    if (items[p].value <= items[i].value) {
      push({ current: i, path: [...path], message: `${items[p].value} ≤ ${items[i].value} — the heap property holds, so ${items[i].value} stays at index ${i}.` });
      return i;
    }
    swapAt(items, i, p);
    push({ swap: [i, p], path: [...path], message: `${items[p].value} is smaller than ${items[i].value} — swap, and it moves up to index ${p}.` });
    i = p;
  }

  push({ current: 0, path: [...path], message: `${items[0].value} reached the root — there is nothing above it to compare against.` });
  return 0;
}

export function deleteMinSingle(items, push) {
  const gone = items[0];
  push({ removing: 0, message: `${gone.value} is the root, so it is the minimum — finding it cost nothing.` });

  const last = items.pop();
  if (items.length === 0) {
    push({ message: `${gone.value} was the only element — the heap is empty.` });
    return gone;
  }

  items[0] = last;
  push({ pending: 0, active: [last.id], message: `Move the last element, ${last.value}, into the hole at the root — that is the only move that keeps the array complete. Now sift it down.` });

  siftDownSingle(items, 0, push);
  return gone;
}

/**
 * Delete-max on a min heap: the honest version.
 *
 * The maximum is somewhere among the leaves and there is no shortcut to it,
 * so every leaf is examined. Once it is found, removing it is cheap — the
 * element that fills the hole came from the end of the array and a leaf has
 * no children, so it can only ever need to move *up*.
 */
export function deleteMaxSingle(items, push) {
  const n = items.length;
  if (n === 1) {
    const gone = items.pop();
    push({ message: `${gone.value} was the only element — trivially also the maximum.` });
    return gone;
  }

  const leaves = leavesOf(n);
  push({
    scan: leaves,
    message: `A min heap does not know where its maximum is. It has to be a leaf — indices ${leaves[0]} to ${
      leaves[leaves.length - 1]
    }, ${leaves.length} of them — so all of those must be examined. This is the O(n) a double-ended structure removes.`,
  });

  let best = leaves[0];
  for (const i of leaves) {
    const better = items[i].value > items[best].value;
    if (better) best = i;
    push({
      scan: leaves,
      compare: [i],
      current: best,
      message: `Leaf ${i} holds ${items[i].value}. ${
        better ? `Largest so far.` : `Not larger than ${items[best].value} at index ${best}.`
      }`,
    });
  }

  const gone = items[best];
  push({ removing: best, scan: leaves, message: `${gone.value} at index ${best} is the maximum, after ${leaves.length} comparisons.` });

  const last = items.pop();
  if (best < items.length) {
    items[best] = last;
    push({ pending: best, active: [last.id], message: `The last element, ${last.value}, fills the hole. A leaf has no children, so it can only need to move up.` });
    siftUpSingle(items, best, push);
  }
  return gone;
}

export function siftUpSingle(items, index, push) {
  let i = index;
  const path = [i];
  while (i > 0) {
    const p = parentOf(i);
    path.push(p);
    push({ compare: [i, p], path: [...path], message: `Compare ${items[i].value} with its parent ${items[p].value}.` });
    if (items[p].value <= items[i].value) {
      push({ current: i, path: [...path], message: `Already in order — nothing to do.` });
      return i;
    }
    swapAt(items, i, p);
    push({ swap: [i, p], path: [...path], message: `Swap — ${items[p].value} moves up to index ${p}.` });
    i = p;
  }
  return 0;
}

export function siftDownSingle(items, index, push) {
  let i = index;
  const n = items.length;
  const path = [i];

  for (;;) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l >= n) {
      push({ current: i, path: [...path], message: `Index ${i} is a leaf — ${items[i].value} is where it belongs.` });
      return i;
    }
    let best = i;
    push({ compare: [best, l], path: [...path], message: `Compare ${items[i].value} with its left child ${items[l].value}.` });
    if (items[l].value < items[best].value) best = l;
    if (r < n) {
      push({ compare: [best, r], path: [...path], message: `Compare ${items[best].value} with the right child ${items[r].value}.` });
      if (items[r].value < items[best].value) best = r;
    }
    if (best === i) {
      push({ current: i, path: [...path], message: `${items[i].value} is already smaller than both children — it stays at index ${i}.` });
      return i;
    }
    const moving = items[best].value;
    const sinking = items[i].value;
    swapAt(items, i, best);
    path.push(best);
    push({ swap: [i, best], path: [...path], message: `${moving} is smaller than ${sinking} — swap, and ${sinking} sinks to index ${best}.` });
    i = best;
  }
}

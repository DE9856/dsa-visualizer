import { descendantsOf, entry, grandparentOf, isMinLevel, leftOf, parentOf, rightOf, swapAt } from "./helpers";

/**
 * The min-max heap: one complete array, with the levels alternating.
 *
 * Even levels (0, 2, 4, …) are min levels: a node there is ≤ every one of its
 * descendants. Odd levels are max levels: a node there is ≥ all of its.
 * So the root is the global minimum and the global maximum is one of its two
 * children — both ends, from one array, in constant time to *find*.
 *
 * The cost is that comparisons no longer happen against the parent. A min
 * node's parent is a max node and says nothing about it; the nearest node of
 * the same kind is the **grandparent**, two levels up. Every sift therefore
 * moves in steps of two, and every trickle-down has to consider six
 * candidates — two children and four grandchildren — instead of two.
 */

const kindOf = (i) => (isMinLevel(i) ? "min" : "max");

const beats = (a, b, kind) => (kind === "min" ? a < b : a > b);

export function insertMinMax(items, value, push) {
  const fresh = entry(value);
  items.push(fresh);
  const i = items.length - 1;

  push({
    pending: i,
    active: [fresh.id],
    message: `Place ${value} at index ${i}, on a ${kindOf(i)} level (depth ${
      isMinLevel(i) ? "even" : "odd"
    }). The array stays complete, exactly as in an ordinary heap.`,
  });

  if (i === 0) {
    push({ current: 0, message: `${value} is the first element — it is the root, and so both the minimum and the maximum.` });
    return;
  }

  const p = parentOf(i);
  const own = kindOf(i);
  push({
    compare: [i, p],
    message: `First, one comparison with the parent at index ${p} — a ${kindOf(
      p
    )} node — to find out which of the two orders ${value} actually belongs in.`,
  });

  // The one comparison against the parent decides which chain the new value
  // rises through. It can only be wrong for its own level in one direction,
  // and if it is, it belongs on the parent's level instead.
  if (beats(items[p].value, items[i].value, own)) {
    swapAt(items, i, p);
    push({
      swap: [i, p],
      message: `${items[p].value} does not belong on a ${own} level below ${items[i].value} — swap them, and ${
        items[p].value
      } now rises through the ${kindOf(p)} levels instead.`,
    });
    siftUp(items, p, kindOf(p), push);
  } else {
    push({ current: i, message: `${value} sits correctly relative to its parent, so it rises through the ${own} levels.` });
    siftUp(items, i, own, push);
  }
}

/** Up the chain of same-kind nodes: i, its grandparent, its grandparent… */
function siftUp(items, index, kind, push) {
  let i = index;
  const path = [i];

  for (;;) {
    const gp = grandparentOf(i);
    if (gp < 0) {
      push({
        current: i,
        path: [...path],
        message: `Index ${i} has no grandparent, so there is no ${kind} node above it — ${items[i].value} has arrived.`,
      });
      return i;
    }
    path.push(gp);
    push({
      compare: [i, gp],
      path: [...path],
      message: `Compare ${items[i].value} with its grandparent ${items[gp].value} at index ${gp} — two levels up, the nearest ${kind} node.`,
    });
    if (!beats(items[i].value, items[gp].value, kind)) {
      push({
        current: i,
        path: [...path],
        message: `${items[gp].value} already ${kind === "min" ? "≤" : "≥"} ${items[i].value} — the ${kind} chain is in order.`,
      });
      return i;
    }
    swapAt(items, i, gp);
    push({
      swap: [i, gp],
      path: [...path],
      message: `${items[gp].value} belongs above ${items[i].value} on the ${kind} levels — swap, two levels at a time.`,
    });
    i = gp;
  }
}

export function deleteMinMax(items, which, push) {
  const n = items.length;

  if (n === 1) {
    const gone = items.pop();
    push({ message: `${gone.value} was the only element.` });
    return gone;
  }

  const kind = which === "min" ? "min" : "max";
  const at = which === "min" ? 0 : items[2] !== undefined && items[2].value > items[1].value ? 2 : 1;

  push({
    removing: at,
    compare: which === "max" ? [1, items[2] !== undefined ? 2 : 1] : [0],
    message:
      which === "min"
        ? `The root is a min node with no min node above it, so ${items[0].value} is the global minimum — index 0, no search.`
        : `The maximum is on the first max level, so it is one of the root's two children: ${items[1].value}${
            items[2] !== undefined ? ` and ${items[2].value}` : ""
          }. One comparison, and it is index ${at}.`,
  });

  const gone = items[at];
  const lastIndex = items.length - 1;

  if (at === lastIndex) {
    items.pop();
    push({ message: `${gone.value} was the last element in the array — removing it needs no repair at all.` });
    return gone;
  }

  swapAt(items, at, lastIndex);
  const moved = items[at];
  items.pop();
  push({
    pending: at,
    active: [moved.id],
    message: `Move the last element, ${moved.value}, into the hole at index ${at}. It may belong nowhere near here, so trickle it down through the ${kind} levels.`,
  });

  trickleDown(items, at, kind, push);
  return gone;
}

/**
 * Down the same-kind chain, two levels at a time.
 *
 * Six candidates at each step, not two: the two children (the other kind, one
 * level down) and the four grandchildren (the same kind, two levels down).
 * When the winner is a grandchild there is an extra check afterwards — the
 * value that just sank past a node of the *other* kind may now be on the
 * wrong side of it, and that one comparison fixes it.
 */
function trickleDown(items, index, kind, push) {
  let i = index;
  const path = [i];

  for (;;) {
    const n = items.length;
    const candidates = descendantsOf(i, n);
    if (candidates.length === 0) {
      push({ current: i, path: [...path], message: `Index ${i} has no descendants — ${items[i].value} is where it belongs.` });
      return i;
    }

    let best = candidates[0];
    for (const k of candidates) if (beats(items[k].value, items[best].value, kind)) best = k;

    push({
      compare: [i, ...candidates],
      current: best,
      path: [...path],
      message: `Children and grandchildren of ${i}: ${candidates
        .map((k) => items[k].value)
        .join(", ")}. The ${kind === "min" ? "smallest" : "largest"} is ${items[best].value} at index ${best}${
        best > rightOf(i) ? " — a grandchild" : " — a child"
      }.`,
    });

    if (!beats(items[best].value, items[i].value, kind)) {
      push({
        current: i,
        path: [...path],
        message: `${items[i].value} already ${kind === "min" ? "≤" : "≥"} everything below it — done.`,
      });
      return i;
    }

    const isGrandchild = best > rightOf(i);
    swapAt(items, i, best);
    path.push(best);
    push({
      swap: [i, best],
      path: [...path],
      message: `${items[i].value} belongs above ${items[best].value} — swap.`,
    });

    if (!isGrandchild) {
      push({ current: best, path: [...path], message: `The winner was a child, one level down and of the other kind, so there is nothing further to sink past. Done.` });
      return best;
    }

    const p = parentOf(best);
    push({
      compare: [best, p],
      path: [...path],
      message: `${items[best].value} has just dropped two levels, past the ${kindOf(p)} node ${items[p].value} at index ${p}. Check it is on the right side of it.`,
    });
    if (beats(items[best].value, items[p].value, kindOf(p))) {
      swapAt(items, best, p);
      push({
        swap: [best, p],
        path: [...path],
        message: `It is not — ${items[p].value} belongs on that ${kindOf(p)} level. Swap the two; this is the correction the two-level step needs and a plain heap never does.`,
      });
    } else {
      push({ current: best, path: [...path], message: `It is — nothing to correct. Carry on down the ${kind} chain.` });
    }

    i = best;
  }
}

/** Which indices the two answers live at — used by the peek operation. */
export const minMaxEnds = (items) => ({
  min: 0,
  max: items.length === 1 ? 0 : items[2] !== undefined && items[2].value > items[1].value ? 2 : 1,
});

export { kindOf, leftOf };

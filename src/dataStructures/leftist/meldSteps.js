import { KIND_MAP, frame, link, precedes, rightSpine, sOf } from "./helpers";

/**
 * The meld, with frames — the one routine every operation here is built from.
 *
 * Insert is a meld with a one-node tree. Delete-min is a meld of the root's
 * two children. Build is a sequence of melds. There is no separate sift-up
 * and no sift-down anywhere in a leftist tree, which is the point: one
 * operation, and everything else is a call to it.
 *
 * Written in the two-pass iterative form rather than recursively, because the
 * two passes are the two things worth seeing and a recursion hides the second
 * one inside the unwinding:
 *
 *   1. merge the two right spines into one key-ordered chain, each node
 *      keeping its left subtree untouched
 *   2. walk the chain back up from the bottom, hanging each node's successor
 *      on its right, then swapping children if the leftist property demands
 *      it and setting s
 *
 * Only the right pointers are ever rewritten, so the work is the sum of the
 * two spine lengths — O(log n) — no matter how large the trees are.
 */
export function meldWithSteps(a, b, kind, steps, { aLabel = "TREE", bLabel = "B" } = {}) {
  if (!a || !b) {
    const only = a || b;
    steps.push(
      frame({ kind, root: only }, {
        label: aLabel,
        message: only
          ? "One side is empty, so the meld is the other side unchanged — nothing to compare and nothing to rebuild."
          : "Both sides are empty.",
      })
    );
    return only;
  }

  const spineA = rightSpine(a);
  const spineB = rightSpine(b);
  const idsA = spineA.map((n) => n.id);
  const idsB = spineB.map((n) => n.id);

  steps.push(
    frame({ kind, root: a }, {
      label: aLabel,
      onSpine: idsA,
      second: { label: bLabel, root: b, onSpine: idsB },
      message: `Only the right spines take part: ${spineA.length} node${spineA.length === 1 ? "" : "s"} on one side, ${
        spineB.length
      } on the other. Every left subtree stays exactly where it is.`,
    })
  );

  // ---- pass one: merge the two spines by key ----
  const chain = [];
  let i = 0;
  let j = 0;

  const spineView = () => chain.map(({ node, from }) => ({ id: node.id, value: node.value, from }));

  while (i < spineA.length && j < spineB.length) {
    const x = spineA[i];
    const y = spineB[j];
    const takeA = precedes(x.value, y.value, kind);
    steps.push(
      frame({ kind, root: a }, {
        label: aLabel,
        onSpine: idsA,
        compare: [x.id, y.id],
        second: { label: bLabel, root: b, onSpine: idsB, compare: [y.id] },
        spine: spineView(),
        message: `${x.value} against ${y.value} — ${takeA ? x.value : y.value} comes next in the merged spine.`,
      })
    );
    chain.push(takeA ? { node: spineA[i++], from: "a" } : { node: spineB[j++], from: "b" });
  }

  while (i < spineA.length) chain.push({ node: spineA[i++], from: "a" });
  while (j < spineB.length) chain.push({ node: spineB[j++], from: "b" });

  steps.push(
    frame({ kind, root: a }, {
      label: aLabel,
      onSpine: idsA,
      second: { label: bLabel, root: b, onSpine: idsB },
      spine: spineView(),
      message: `Merged spine: ${chain
        .map(({ node }) => node.value)
        .join(" → ")}. In key order, so hanging each one on the next by its right pointer already satisfies heap order.`,
    })
  );

  // ---- pass two: link the chain back up, correcting as it goes ----
  let result = null;
  for (let k = chain.length - 1; k >= 0; k--) {
    const node = chain[k].node;
    const kept = node.left;
    const swapped = sOf(kept) < sOf(result);
    result = link(node, kept, result);

    steps.push(
      frame({ kind, root: result }, {
        label: aLabel,
        spine: spineView(),
        spinePlaced: k,
        active: [node.id],
        swap: swapped ? [node.id] : [],
        message: swapped
          ? `${node.value}: its new right subtree has the longer null path (s = ${sOf(result.left)} against ${sOf(
              result.right
            )}), so the children swap — that swap *is* the leftist property being maintained. s(${node.value}) = ${
              sOf(result.right)
            } + 1 = ${result.s}.`
          : `${node.value}: hang the rest of the chain on its right. s(left) = ${sOf(result.left)} ≥ s(right) = ${sOf(
              result.right
            )} already, so nothing to swap. s(${node.value}) = ${result.s}.`,
      })
    );
  }

  steps.push(
    frame({ kind, root: result }, {
      label: aLabel,
      onSpine: rightSpine(result).map((n) => n.id),
      message: `Melded. ${KIND_MAP[kind].rule}, and s(left) ≥ s(right) at every node — so the new right spine is ${
        rightSpine(result).length
      } long, which is the only path any future operation will walk.`,
    })
  );

  return result;
}

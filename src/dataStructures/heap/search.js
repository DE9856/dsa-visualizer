import { cloneHeap, frame, KIND_MAP, leftOf, precedes, rightOf } from "./helpers";

export const search = {
  key: "search",
  label: "Search",
  group: "search",
  fields: ["value"],
  desc: "A heap is not a search structure, and this is where that shows. It orders parents against children only — nothing relates the two subtrees under a node — so there is no side to pick and no way to halve the work like a BST does. One thing does help: since every descendant is outranked by its ancestor, a subtree whose root is already worse than the target cannot contain it and gets skipped whole. That prunes a lot in practice but changes nothing asymptotically: the worst case is still O(n).",
  time: "O(n)",
  space: "O(h)",
  run(heap, { value }) {
    const next = cloneHeap(heap);
    const n = next.nodes.length;
    const kind = KIND_MAP[next.kind];
    const steps = [];

    if (n === 0) {
      return { steps: [frame(next, { notFound: true, message: "Heap is empty" })], finalHeap: heap };
    }

    const visited = [];
    const pruned = [];
    const stack = [0];

    while (stack.length) {
      const i = stack.pop();
      const nodeValue = next.nodes[i].value;

      // Every descendant of i is outranked by i, so a target that outranks i
      // cannot be anywhere below it.
      if (precedes(value, nodeValue, next.kind)) {
        pruned.push(i);
        steps.push(
          frame(next, {
            current: i,
            visited: [...visited],
            pruned: [...pruned],
            message: `${value} ${kind.key === "max" ? ">" : "<"} ${nodeValue} — everything under index ${i} is ${kind.key === "max" ? "≤" : "≥"} ${nodeValue}, so skip the whole subtree`,
          })
        );
        continue;
      }

      visited.push(i);
      steps.push(
        frame(next, {
          current: i,
          visited: [...visited],
          pruned: [...pruned],
          compare: [i],
          message: `Check index ${i} (${nodeValue}) against ${value}`,
        })
      );

      if (nodeValue === value) {
        steps.push(
          frame(next, {
            found: i,
            visited,
            pruned,
            resultBadge: `FOUND AT INDEX ${i}`,
            message: `Found ${value} at index ${i}, after checking ${visited.length} node${visited.length === 1 ? "" : "s"} — its position says nothing about the rest of the heap`,
          })
        );
        return { steps, finalHeap: heap };
      }

      const r = rightOf(i);
      const l = leftOf(i);
      if (r < n) stack.push(r);
      if (l < n) stack.push(l);
    }

    steps.push(
      frame(next, {
        visited,
        pruned,
        notFound: true,
        message: `${value} is not in the heap — ${visited.length} node${visited.length === 1 ? "" : "s"} checked, ${pruned.length} subtree${pruned.length === 1 ? "" : "s"} skipped`,
      })
    );

    return { steps, finalHeap: heap };
  },
};

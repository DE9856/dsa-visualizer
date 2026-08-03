import { nextId } from "./nodeId";
import { cloneNodes } from "./helpers";

export const merge = {
  key: "merge",
  label: "Merge Sorted Lists",
  group: "combine",
  fields: ["secondList"],
  desc: "Assumes both lists are sorted. Walks both at once, repeatedly picking the smaller of the two front values and appending it to the merged result.",
  time: "O(n + m)",
  space: "O(n + m)",
  run(list, { secondList = [] }) {
    const a = cloneNodes(list);
    const b = secondList.map((value) => ({ id: nextId(), value }));
    const steps = [];

    if (a.length === 0 && b.length === 0) {
      steps.push({ nodes: [], message: "Both lists are empty" });
      return { steps, finalList: [] };
    }

    let i = 0;
    let j = 0;
    const merged = [];

    while (i < a.length && j < b.length) {
      steps.push({
        nodes: [...merged, ...a.slice(i), ...b.slice(j)],
        mergedIds: merged.map((n) => n.id),
        active: [a[i].id, b[j].id],
        headId: merged[0]?.id ?? a[i].id,
        message: `Comparing ${a[i].value} (List A) and ${b[j].value} (List B)`,
      });
      if (a[i].value <= b[j].value) {
        merged.push(a[i]);
        i += 1;
      } else {
        merged.push(b[j]);
        j += 1;
      }
      steps.push({
        nodes: [...merged, ...a.slice(i), ...b.slice(j)],
        mergedIds: merged.map((n) => n.id),
        pending: merged[merged.length - 1].id,
        headId: merged[0]?.id ?? null,
        message: `Appended ${merged[merged.length - 1].value} to the merged list`,
      });
    }

    while (i < a.length) {
      merged.push(a[i]);
      i += 1;
    }
    while (j < b.length) {
      merged.push(b[j]);
      j += 1;
    }

    steps.push({ nodes: merged, mergedIds: merged.map((n) => n.id), headId: merged[0]?.id ?? null, message: "Remaining nodes appended — merge complete" });

    return { steps, finalList: merged };
  },
};
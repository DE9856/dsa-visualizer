export const traverse = {
  key: "traverse",
  label: "Traverse",
  group: "build",
  fields: [],
  desc: "Walks the list from the head, visiting every node in turn and reading its value, until the chain runs out — which is the only way to reach anything in a linked list, and the reason every operation on one costs what it does. A doubly linked list is then walked back the other way along its prev pointers.",
  time: "O(n)",
  space: "O(1)",
  run(list, { listType } = {}) {
    const headId = list[0]?.id ?? null;
    const steps = [];

    if (list.length === 0) {
      steps.push({ nodes: list, headId, resultBadge: "EMPTY", message: "The list is empty — the head pointer is null, so there is nothing to walk." });
      return { steps, finalList: list };
    }

    const circular = listType === "circular";
    const doubly = listType === "doubly";
    const values = list.map((n) => n.value);

    list.forEach((node, i) => {
      const last = i === list.length - 1;
      steps.push({
        nodes: list,
        active: [node.id],
        headId,
        message: `Index ${i}: read ${node.value}, then follow its next pointer${
          last
            ? circular
              ? " — which points back at the head."
              : ", which is null. That is the end."
            : ` to index ${i + 1}.`
        }`,
      });
    });

    // A circular list has no null to stop at, so the walk needs a mark of its
    // own: it ends when it arrives back where it started, which is worth a
    // frame of its own because it is the whole difference from a plain list.
    if (circular) {
      steps.push({
        nodes: list,
        active: [headId],
        headId,
        message: `Back at the head. A circular list never reaches a null pointer, so a traversal has to remember where it began or it will go round forever.`,
      });
    }

    // The forward result then rides along on every frame of the backward pass
    // rather than being cleared and replaced at the end. The two orders are
    // the same nodes read the two ways the pointers allow, and the comparison
    // is the point — a reader who has to remember the first line while the
    // second is being built is being asked to do the one thing the badge is
    // there to save them.
    const forwardBadge = `${doubly ? "FORWARD:  " : ""}${values.join(" → ")}`;

    steps.push({
      nodes: list,
      headId,
      resultBadge: forwardBadge,
      message: `${list.length} node${list.length === 1 ? "" : "s"} visited in order. Reaching the last one meant walking through every node before it — there is no way to jump to an index the way an array does.`,
    });

    if (!doubly) return { steps, finalList: list };

    // The second pass is the entire reason a doubly linked list pays for an
    // extra pointer per node. A singly linked list cannot do this at all:
    // standing on a node, it has no way back, so reaching the previous one
    // means starting again from the head — which is what turns a backwards
    // walk from O(n) into O(n²).
    steps.push({
      nodes: list,
      active: [list[list.length - 1].id],
      headId,
      resultBadge: forwardBadge,
      message: `Now back the other way. In a singly linked list this is where the walk would have to stop and start again from the head, because a node knows nothing about what points at it.`,
    });

    for (let i = list.length - 1; i >= 0; i--) {
      const node = list[i];
      const first = i === 0;
      steps.push({
        nodes: list,
        active: [node.id],
        headId,
        resultBadge: forwardBadge,
        message: `Index ${i}: read ${node.value}, then follow its prev pointer${
          first ? ", which is null. Back at the head." : ` to index ${i - 1}.`
        }`,
      });
    }

    steps.push({
      nodes: list,
      headId,
      resultBadge: `${forwardBadge}
BACKWARD: ${[...values].reverse().join(" → ")}`,
      message: `The same ${list.length} node${
        list.length === 1 ? "" : "s"
      } in reverse, for the same O(n) as the forward walk — one extra pointer per node buys a second direction outright.`,
    });

    return { steps, finalList: list };
  },
};

// Builds the default forward pointer map (each node -> the next node in
// screen order). For a normal (non-circular) list the last node points to
// null. For a circular list the last node points back to the head instead.
// Used whenever a step doesn't provide its own explicit pointerMap (e.g.
// reverse() overrides this while the pointer-flip animation is running).
export function forwardChain(nodes, circular = false) {
  const map = {};
  nodes.forEach((node, i) => {
    if (i < nodes.length - 1) {
      map[node.id] = nodes[i + 1].id;
    } else {
      map[node.id] = circular && nodes.length > 0 ? nodes[0].id : null;
    }
  });
  return map;
}

// Builds the default backward ("prev") pointer map used by doubly linked
// lists. Each node -> the previous node in screen order. The head's prev is
// null unless the list is circular, in which case it wraps to the tail.
export function backwardChain(nodes, circular = false) {
  const map = {};
  nodes.forEach((node, i) => {
    if (i > 0) {
      map[node.id] = nodes[i - 1].id;
    } else {
      map[node.id] = circular && nodes.length > 0 ? nodes[nodes.length - 1].id : null;
    }
  });
  return map;
}

export function cloneNodes(nodes) {
  return nodes.map((n) => ({ ...n }));
}

// Parses a comma-separated string of numbers into an array of ints,
// dropping anything that isn't a valid number. Shared by the "custom list"
// and "second list" (concatenate/merge) inputs.
export function parseValueList(input, limit = 15) {
  return input
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
    .slice(0, limit);
}
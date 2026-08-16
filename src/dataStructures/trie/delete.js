import { childList, cloneTrie, collectWords, frame, hasChildren, walkWord } from "./helpers";

export const del = {
  key: "delete",
  label: "Delete",
  group: "core",
  fields: ["word"],
  desc: "Clearing the end-of-word flag is the easy half. The rest is deciding how much of the path to tear down, and the answer is: only the tail that nothing else needs. Walking back from the last character, a node can go if it has no children and is not itself a word — the moment either is true the pruning stops, because those nodes are still spelling out somebody else's word. Deleting 'card' from a trie holding 'car' removes exactly one node; deleting 'car' from that same trie removes none at all, only the flag.",
  time: "O(L)",
  space: "O(L) for the walk back up",
  run(trie, { word }) {
    const next = cloneTrie(trie);
    const steps = [];

    if (!word) {
      return { steps: [frame(next, { message: "Type a word made of letters to delete" })], finalTrie: trie };
    }

    const { path, complete, node } = walkWord(next, word);

    steps.push(
      frame(next, {
        current: next.root.id,
        path: [next.root.id],
        prefix: "",
        message: `Find "${word}" before removing anything`,
      })
    );

    if (!complete || !node.isWord) {
      steps.push(
        frame(next, {
          path: path.map((n) => n.id),
          notFound: true,
          prefix: word.slice(0, path.length - 1),
          message: complete
            ? `"${word}" is only a prefix here, not a stored word — nothing to delete`
            : `"${word}" is not in the trie — the walk ran out at "${word.slice(0, path.length - 1)}"`,
        })
      );
      return { steps, finalTrie: trie };
    }

    const ids = path.map((n) => n.id);
    steps.push(
      frame(next, { found: node.id, path: ids, prefix: word, message: `Found "${word}" — clear its end-of-word flag first` })
    );

    node.isWord = false;
    const below = collectWords(node, word);

    steps.push(
      frame(next, {
        current: node.id,
        path: ids,
        prefix: word,
        message: below.length
          ? `Flag cleared — the node stays, it still spells the way to ${below.map((w) => `"${w}"`).join(", ")}`
          : `Flag cleared — now walk back up and remove whatever nothing else needs`,
      })
    );

    // Walk back from the last character. A node survives if anything still
    // depends on it: its own end-of-word flag, or a child.
    let removed = 0;
    for (let i = path.length - 1; i > 0; i--) {
      const current = path[i];
      const parent = path[i - 1];
      const prefix = word.slice(0, i);

      if (hasChildren(current)) {
        const kids = childList(current).map((c) => `"${prefix + current.char + c.char}…"`);
        steps.push(
          frame(next, {
            current: current.id,
            path: ids.slice(0, i + 1),
            prefix: prefix + current.char,
            message: `'${current.char}' still has ${kids.length} child${kids.length === 1 ? "" : "ren"} (${kids.join(", ")}) — stop, removing it would delete those words too`,
          })
        );
        break;
      }

      if (current.isWord) {
        steps.push(
          frame(next, {
            found: current.id,
            path: ids.slice(0, i + 1),
            prefix: prefix + current.char,
            message: `"${prefix + current.char}" is itself a stored word — stop here, the node stays`,
          })
        );
        break;
      }

      steps.push(
        frame(next, {
          removing: current.id,
          path: ids.slice(0, i + 1),
          prefix: prefix + current.char,
          message: `'${current.char}' has no children and is not a word — nothing needs "${prefix + current.char}", so remove it`,
        })
      );

      delete parent.children[current.char];
      removed += 1;
    }

    steps.push(
      frame(next, {
        prefix: "",
        resultBadge: `DELETED — ${removed} NODE${removed === 1 ? "" : "S"} REMOVED`,
        message:
          removed === 0
            ? `"${word}" deleted without removing a single node — every character was shared with another word`
            : `"${word}" deleted, ${removed} node${removed === 1 ? "" : "s"} pruned`,
      })
    );

    return { steps, finalTrie: next };
  },
};

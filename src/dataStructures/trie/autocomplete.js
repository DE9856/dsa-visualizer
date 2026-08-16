import { childList, cloneTrie, frame } from "./helpers";

export const autocomplete = {
  key: "prefix",
  label: "Autocomplete",
  group: "search",
  fields: ["word"],
  desc: "Walks to the prefix node, then reads off every word in the subtree beneath it. This is the operation a trie exists for and the one no hash table can do at all: hashing scatters 'car' and 'card' to unrelated buckets, while a trie has already grouped every completion of a prefix under one node. The walk costs O(L) no matter how large the dictionary is, and the enumeration costs only what the answers themselves cost.",
  time: "O(L + k) for k matching words",
  space: "O(k)",
  run(trie, { word }) {
    const next = cloneTrie(trie);
    const prefix = word;
    const steps = [];

    if (!prefix) {
      return { steps: [frame(next, { message: "Type a prefix to autocomplete" })], finalTrie: trie };
    }

    const path = [next.root.id];
    let node = next.root;

    steps.push(
      frame(next, { current: next.root.id, path: [...path], prefix: "", message: `Walk to the prefix "${prefix}"` })
    );

    for (let i = 0; i < prefix.length; i++) {
      const char = prefix[i];
      const child = node.children[char];
      if (!child) {
        steps.push(
          frame(next, {
            current: node.id,
            path: [...path],
            notFound: true,
            prefix: prefix.slice(0, i),
            message: `No '${char}' under "${prefix.slice(0, i)}" — no word in the trie starts with "${prefix}"`,
          })
        );
        return { steps, finalTrie: trie };
      }
      node = child;
      path.push(node.id);
      steps.push(
        frame(next, { current: node.id, path: [...path], prefix: prefix.slice(0, i + 1), message: `'${char}' — now at "${prefix.slice(0, i + 1)}"` })
      );
    }

    const prefixPath = [...path];
    steps.push(
      frame(next, {
        current: node.id,
        path: prefixPath,
        subtree: true,
        prefix,
        message: `Reached "${prefix}" — every word starting with it is somewhere in the subtree below this node, and nowhere else`,
      })
    );

    // Depth-first from the prefix node. Children are visited alphabetically,
    // so the completions come out sorted with no sorting step.
    const collected = [];
    const walk = (current, spelled, branch) => {
      if (current.isWord) {
        collected.push(spelled);
        steps.push(
          frame(next, {
            found: current.id,
            path: [...prefixPath, ...branch],
            collected: [...collected],
            prefix: spelled,
            message: `"${spelled}" — end-of-word node, match ${collected.length}`,
          })
        );
      }
      for (const child of childList(current)) walk(child, spelled + child.char, [...branch, child.id]);
    };
    walk(node, prefix, []);

    steps.push(
      frame(next, {
        path: prefixPath,
        collected,
        prefix,
        notFound: collected.length === 0,
        resultBadge: collected.length ? `${collected.length}: ${collected.join(", ")}` : undefined,
        message: collected.length
          ? `${collected.length} completion${collected.length === 1 ? "" : "s"} for "${prefix}" — in alphabetical order, because the children were visited in alphabetical order`
          : `"${prefix}" is a prefix of nothing stored — the node exists but no end-of-word marker sits below it`,
      })
    );

    return { steps, finalTrie: trie };
  },
};

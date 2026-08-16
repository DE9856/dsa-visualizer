import { childList, cloneTrie, frame } from "./helpers";

export const listWords = {
  key: "list",
  label: "List Words",
  group: "traverse",
  fields: [],
  desc: "A depth-first walk that reports a word at every end-of-word node. Because the children of each node are visited in alphabetical order, the words come out sorted without a sorting step anywhere — the ordering is a property of the structure, not of the traversal. That is the exact thing a hash table cannot give you: it stores the same words for less memory, but can only hand them back in hash order.",
  time: "O(n) in the number of nodes",
  space: "O(L) for the walk",
  run(trie) {
    const next = cloneTrie(trie);
    const steps = [];
    const collected = [];

    const walk = (node, spelled, path) => {
      if (node.isWord) {
        collected.push(spelled);
        steps.push(
          frame(next, {
            found: node.id,
            path: [...path],
            collected: [...collected],
            prefix: spelled,
            message: `"${spelled}" — word ${collected.length}`,
          })
        );
      }
      for (const child of childList(node)) walk(child, spelled + child.char, [...path, child.id]);
    };

    walk(next.root, "", [next.root.id]);

    if (collected.length === 0) {
      return { steps: [frame(next, { notFound: true, message: "Trie is empty — no words stored" })], finalTrie: trie };
    }

    steps.push(
      frame(next, {
        collected,
        resultBadge: `${collected.length} WORDS`,
        message: `${collected.join(", ")} — alphabetical for free, since every node's children were visited in order`,
      })
    );

    return { steps, finalTrie: trie };
  },
};

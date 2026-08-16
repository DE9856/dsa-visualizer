import { cloneTrie, countNodes, frame, totalCharacters, trieWords } from "./helpers";

export const size = {
  key: "size",
  label: "Size",
  group: "status",
  fields: [],
  desc: "Counts the words stored and the nodes it took to store them. The gap between the two is the whole argument for a trie: every character shared between words is a node that did not have to exist. It also shows the cost — each node carries a child pointer per possible character, so a trie over a large alphabet can use far more memory than the strings themselves, which is what compressed variants (radix trees) exist to fix.",
  time: "O(n)",
  space: "O(1)",
  run(trie) {
    const next = cloneTrie(trie);
    const words = trieWords(next);
    const nodes = countNodes(next.root) - 1; // the root spells nothing
    const chars = totalCharacters(next);

    if (words.length === 0) {
      return { steps: [frame(next, { resultBadge: "0 WORDS", message: "Trie is empty" })], finalTrie: trie };
    }

    const saved = chars - nodes;

    return {
      steps: [
        frame(next, {
          collected: words,
          message: `${words.length} word${words.length === 1 ? "" : "s"} stored, spelling ${chars} characters in total`,
        }),
        frame(next, {
          resultBadge: `${words.length} WORDS / ${nodes} NODES`,
          message:
            saved > 0
              ? `${nodes} nodes hold ${chars} characters — ${saved} character${saved === 1 ? "" : "s"} are shared prefixes that only had to be stored once`
              : `${nodes} nodes for ${chars} characters — these words share no prefixes, so a trie buys nothing here`,
        }),
      ],
      finalTrie: trie,
    };
  },
};

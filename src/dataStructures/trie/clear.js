import { cloneTrie, emptyTrie, frame, trieWords } from "./helpers";

export const clearTrie = {
  key: "clear",
  label: "Clear",
  group: "utility",
  fields: [],
  desc: "Drops every word by discarding the root's children — the entire tree goes with them.",
  time: "O(1)",
  space: "O(1)",
  run(trie) {
    const next = cloneTrie(trie);

    if (trieWords(next).length === 0) {
      return { steps: [frame(next, { message: "Trie is already empty" })], finalTrie: trie };
    }

    const fresh = emptyTrie();
    return {
      steps: [
        frame(next, { current: next.root.id, message: "Detach the root's children" }),
        frame(fresh, { message: "Trie cleared" }),
      ],
      finalTrie: fresh,
    };
  },
};

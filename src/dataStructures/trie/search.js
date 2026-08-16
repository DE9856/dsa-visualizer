import { cloneTrie, collectWords, frame } from "./helpers";

export const search = {
  key: "search",
  label: "Search",
  group: "search",
  fields: ["word"],
  desc: "Walks the word character by character and then checks the end-of-word flag. Both halves matter: running out of edges means no stored word even starts this way, but arriving at the final node is not enough either — 'car' spells out perfectly inside a trie holding only 'card', and is still not stored. Cost is O(L) in the length of the word, with no dependence on how many words the trie holds, which is the property a hash of the whole word cannot beat but also cannot extend to prefixes.",
  time: "O(L)",
  space: "O(1)",
  run(trie, { word }) {
    const next = cloneTrie(trie);
    const steps = [];

    if (!word) {
      return { steps: [frame(next, { message: "Type a word made of letters to search for" })], finalTrie: trie };
    }

    const path = [next.root.id];
    let node = next.root;

    steps.push(
      frame(next, { current: next.root.id, path: [...path], prefix: "", message: `Look for "${word}", starting at the root` })
    );

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const child = node.children[char];
      const prefix = word.slice(0, i + 1);

      if (!child) {
        steps.push(
          frame(next, {
            current: node.id,
            path: [...path],
            notFound: true,
            prefix: word.slice(0, i),
            message: `No '${char}' edge under "${word.slice(0, i)}" — the walk stops here, so nothing in the trie even starts with "${prefix}"`,
          })
        );
        return { steps, finalTrie: trie };
      }

      node = child;
      path.push(node.id);
      steps.push(
        frame(next, {
          current: node.id,
          path: [...path],
          prefix,
          message: `'${char}' found — now at "${prefix}"`,
        })
      );
    }

    if (!node.isWord) {
      const below = collectWords(node, word);
      steps.push(
        frame(next, {
          current: node.id,
          path,
          notFound: true,
          prefix: word,
          resultBadge: "PREFIX ONLY",
          message: `"${word}" is spelled out, but the node is not marked end-of-word — it exists only on the way to ${below.slice(0, 3).map((w) => `"${w}"`).join(", ")}`,
        })
      );
      return { steps, finalTrie: trie };
    }

    steps.push(
      frame(next, {
        found: node.id,
        path,
        prefix: word,
        resultBadge: `FOUND — ${word.length} STEP${word.length === 1 ? "" : "S"}`,
        message: `"${word}" found: the path exists and the last node is marked end-of-word, after ${word.length} character comparison${word.length === 1 ? "" : "s"}`,
      })
    );

    return { steps, finalTrie: trie };
  },
};

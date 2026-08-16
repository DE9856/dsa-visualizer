import { cloneTrie, frame, makeNode, MAX_WORDS, trieWords } from "./helpers";

export const insert = {
  key: "insert",
  label: "Insert",
  group: "core",
  fields: ["word"],
  desc: "Spells the word out from the root, one character per edge, creating a node only where the path runs out. Inserting 'card' into a trie that already holds 'car' costs exactly one new node — the shared prefix is shared storage, not a copy. The last node is then marked end-of-word, and that flag is doing real work: without it there would be no way to tell a stored word from a prefix that merely leads somewhere else.",
  time: "O(L) for a word of length L — independent of how many words are stored",
  space: "O(L) worst case, less when the prefix already exists",
  run(trie, { word }) {
    const next = cloneTrie(trie);
    const steps = [];

    if (!word) {
      return { steps: [frame(next, { message: "Type a word made of letters to insert" })], finalTrie: trie };
    }

    if (!trieWords(next).includes(word) && trieWords(next).length >= MAX_WORDS) {
      return {
        steps: [
          frame(next, {
            notFound: true,
            overflow: true,
            message: `This visualizer holds ${MAX_WORDS} words so the tree stays readable — delete one first`,
          }),
        ],
        finalTrie: trie,
      };
    }

    const path = [next.root.id];
    let node = next.root;
    let created = [];
    let reused = 0;

    steps.push(
      frame(next, {
        current: next.root.id,
        path: [...path],
        prefix: "",
        message: `Start at the root and spell out "${word}" one character at a time`,
      })
    );

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const prefix = word.slice(0, i + 1);
      const existing = node.children[char];

      if (existing) {
        node = existing;
        reused += 1;
        path.push(node.id);
        steps.push(
          frame(next, {
            current: node.id,
            path: [...path],
            created: [...created],
            prefix,
            message: `'${char}' already branches off "${word.slice(0, i)}" — walk into it, no new node needed`,
          })
        );
      } else {
        const fresh = makeNode(char);
        node.children[char] = fresh;
        node = fresh;
        created.push(node.id);
        path.push(node.id);
        steps.push(
          frame(next, {
            current: node.id,
            path: [...path],
            created: [...created],
            pending: node.id,
            prefix,
            message: `No '${char}' under "${word.slice(0, i)}" — create the node for "${prefix}"`,
          })
        );
      }
    }

    if (node.isWord) {
      steps.push(
        frame(next, {
          found: node.id,
          path,
          prefix: word,
          resultBadge: "ALREADY STORED",
          message: `"${word}" is already marked end-of-word — a trie stores each word once`,
        })
      );
      return { steps, finalTrie: trie };
    }

    node.isWord = true;
    steps.push(
      frame(next, {
        wordEnd: node.id,
        path,
        created,
        prefix: word,
        message:
          created.length === 0
            ? `Every character was already there — only the end-of-word flag is new, which is what turns the prefix "${word}" into a stored word`
            : `Mark the last node as end-of-word`,
      })
    );

    steps.push(
      frame(next, {
        found: node.id,
        path,
        prefix: word,
        resultBadge: `+${created.length} NODE${created.length === 1 ? "" : "S"}`,
        message: `"${word}" inserted — ${reused} character${reused === 1 ? "" : "s"} reused from existing prefixes, ${created.length} new node${created.length === 1 ? "" : "s"}`,
      })
    );

    return { steps, finalTrie: next };
  },
};

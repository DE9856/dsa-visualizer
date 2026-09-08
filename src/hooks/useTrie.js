import { useState, useCallback } from "react";
import { TRIE_OP_MAP } from "../dataStructures/trie";
import {
  buildTrieFromWords,
  normalizeWord,
  parseWordList,
  randomWords,
  trieWords,
} from "../dataStructures/trie/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { root: null, message: "" };

/** `init` is the setup decoded from a shared link ({ words }). */
export function useTrie(init) {
  const { view, value: trie, apply, load } = useStructureRun({
    initial: () => buildTrieFromWords(init?.words ?? randomWords()),
    toFrame: (next, message) => ({ ...next, message }),
    emptyStep: EMPTY_STEP,
  });

  const [operation, setOperation] = useState("insert");
  const [wordInput, setWordInput] = useState("card");
  const [customInput, setCustomInput] = useState("");

  const opMeta = TRIE_OP_MAP[operation];

  const runOperation = useCallback(() => {
    const { steps: newSteps, finalTrie } = opMeta.run(trie, { word: normalizeWord(wordInput) });
    apply(newSteps, finalTrie);
  }, [trie, opMeta, wordInput, apply]);

  const loadWords = useCallback(
    (words) =>
      load(
        buildTrieFromWords(words),
        `Loaded ${words.length} word${words.length === 1 ? "" : "s"}: ${words.join(", ")}`
      ),
    [load]
  );

  const applyCustomTrie = useCallback(() => {
    const words = parseWordList(customInput);
    if (words.length === 0) return;
    loadWords(words);
    setCustomInput("");
  }, [customInput, loadWords]);

  const shuffle = useCallback(() => loadWords(randomWords()), [loadWords]);

  return {
    ...view,
    trie,
    words: trieWords(trie),
    operation,
    setOperation,
    opMeta,
    wordInput,
    setWordInput,
    customInput,
    setCustomInput,
    applyCustomTrie,
    shuffle,
    runOperation,
  };
}

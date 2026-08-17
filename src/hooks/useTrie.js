import { useState, useEffect, useCallback } from "react";
import { TRIE_OP_MAP } from "../dataStructures/trie";
import {
  buildTrieFromWords,
  normalizeWord,
  parseWordList,
  randomWords,
  trieWords,
} from "../dataStructures/trie/helpers";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

const EMPTY_STEP = { root: null, message: "" };

/** `init` is the setup decoded from a shared link ({ words }). */
export function useTrie(init) {
  const [trie, setTrie] = useState(() => buildTrieFromWords(init?.words ?? randomWords()));

  const [operation, setOperation] = useState("insert");
  const [wordInput, setWordInput] = useState("card");
  const [customInput, setCustomInput] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const opMeta = TRIE_OP_MAP[operation];

  const history = useHistory(
    () => ({ trie }),
    (doc, message) => {
      setTrie(doc.trie);
      setSteps([{ ...doc.trie, message }]);
      setStepIdx(0);
      setPlaying(false);
    }
  );

  useEffect(() => {
    setSteps([{ ...trie, message: "Ready" }]);
    setStepIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOperation = useCallback(() => {
    const { steps: newSteps, finalTrie } = opMeta.run(trie, { word: normalizeWord(wordInput) });
    history.record();
    setSteps(newSteps);
    setStepIdx(0);
    setTrie(finalTrie);
    setPlaying(newSteps.length > 1);
  }, [trie, opMeta, wordInput, setStepIdx, setPlaying, history]);

  const loadWords = useCallback(
    (words) => {
      const next = buildTrieFromWords(words);
      history.record();
      setTrie(next);
      setSteps([{ ...next, message: `Loaded ${words.length} word${words.length === 1 ? "" : "s"}: ${words.join(", ")}` }]);
      setStepIdx(0);
      setPlaying(false);
    },
    [setStepIdx, setPlaying, history]
  );

  const applyCustomTrie = useCallback(() => {
    const words = parseWordList(customInput);
    if (words.length === 0) return;
    loadWords(words);
    setCustomInput("");
  }, [customInput, loadWords]);

  const shuffle = useCallback(() => loadWords(randomWords()), [loadWords]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
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
    steps,
    step,
    runOperation,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}

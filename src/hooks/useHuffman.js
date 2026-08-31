import { useCallback, useEffect, useState } from "react";
import { HUFFMAN_META } from "../dataStructures/huffman";
import { useStepPlayer } from "./useStepPlayer.js";

const EMPTY_STEP = { forest: [], active: [], message: "" };

/**
 * The Huffman view. A run is a pure function of the text, so there is no
 * structure to keep and no history to restore — same shape as the DP and
 * string views.
 */
export function useHuffman(init) {
  const [text, setText] = useState(init?.text || "ABRACADABRA");
  const [error, setError] = useState("");
  const [steps, setSteps] = useState([{ ...EMPTY_STEP }]);

  const player = useStepPlayer(steps.length);
  const { setStepIdx, setPlaying, stepIdx } = player;

  const runWith = useCallback(
    (raw, { play = false } = {}) => {
      const parsed = HUFFMAN_META.parse({ text: raw });
      if (parsed.error) {
        setError(parsed.error);
        return false;
      }
      setError("");
      const { steps: next } = HUFFMAN_META.run(parsed);
      setSteps(next);
      setStepIdx(0);
      setPlaying(play && next.length > 1);
      return true;
    },
    [setStepIdx, setPlaying]
  );

  useEffect(() => {
    runWith(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOperation = useCallback(() => runWith(text, { play: true }), [text, runWith]);

  const shuffle = useCallback(() => {
    const next = HUFFMAN_META.random().text;
    setText(next);
    runWith(next, { play: true });
  }, [runWith]);

  const step = steps[Math.min(stepIdx, steps.length - 1)] || EMPTY_STEP;

  return {
    ...player,
    text,
    setText: (v) => {
      setText(v);
      setError("");
    },
    meta: HUFFMAN_META,
    opMeta: HUFFMAN_META,
    error,
    steps,
    step,
    runOperation,
    shuffle,
  };
}

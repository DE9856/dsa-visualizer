import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TREE_KINDS,
  ORDER_KEYS,
  ORDER_MAP,
  buildInsertOrder,
  runInserts,
} from "../dataStructures/tree/compare.js";
import { randomSeed } from "../utils/rng.js";
import { useStepPlayer } from "./useStepPlayer.js";
import { useHistory } from "./useHistory.js";

// What the three canvases can draw side by side and still be readable. The
// interesting sizes are far past this, which is what the height sweep is for.
export const MIN_KEYS = 4;
export const MAX_KEYS = 24;

/**
 * A BST, an AVL tree and a 2-3 tree built from the same keys in the same
 * order, one insert per transport tick.
 *
 * There is no lane picker: this is a fixed three-way comparison, and the
 * variable is the insertion order.
 */
export function useTreeCompare(init) {
  const [order, setOrderState] = useState(() =>
    ORDER_KEYS.includes(init?.order) ? init.order : "sorted"
  );
  const [size, setSize] = useState(() =>
    Number.isInteger(init?.size) && init.size >= MIN_KEYS && init.size <= MAX_KEYS ? init.size : 15
  );
  const [seed, setSeed] = useState(init?.seed ?? 7);

  const keys = useMemo(() => buildInsertOrder(order, size, seed), [order, size, seed]);

  const lanes = useMemo(
    () =>
      TREE_KINDS.map((kind) => {
        const run = runInserts(kind.key, keys, true);
        return { ...kind, ...run };
      }),
    [keys]
  );

  // Every lane has exactly one state per key inserted, plus the empty tree it
  // started from, so the transport is the insert count and needs no syncing
  // logic of its own.
  const ticks = keys.length + 1;
  const player = useStepPlayer(ticks);
  const { setStepIdx, setPlaying, pause } = player;

  const history = useHistory(
    () => ({ order, size, seed }),
    (doc) => {
      setOrderState(doc.order);
      setSize(doc.size);
      setSeed(doc.seed);
      setPlaying(false);
      setStepIdx(0);
    }
  );

  useEffect(() => {
    setPlaying(false);
    setStepIdx(0);
  }, [lanes, setPlaying, setStepIdx]);

  const tick = Math.min(player.stepIdx, ticks - 1);

  const lanesNow = useMemo(
    () => lanes.map((lane) => ({ ...lane, state: lane.states[tick] || lane.states[0] })),
    [lanes, tick]
  );

  // The shortest tree at this point in the run. A tie is normal here — the two
  // balanced structures often agree — so it marks every lane that shares the
  // minimum rather than picking one.
  const shortest = useMemo(() => {
    const best = Math.min(...lanesNow.map((l) => l.state.height));
    const winners = lanesNow.filter((l) => l.state.height === best);
    return winners.length === lanesNow.length ? [] : winners.map((l) => l.key);
  }, [lanesNow]);

  const record = history.record;

  const setOrder = useCallback(
    (key) => {
      if (!ORDER_KEYS.includes(key)) return;
      record();
      pause();
      setOrderState(key);
    },
    [record, pause]
  );

  const handleSizeChange = useCallback(
    (n) => {
      record();
      pause();
      setSize(n);
    },
    [record, pause]
  );

  const shuffle = useCallback(() => {
    record();
    pause();
    // Only the random order actually depends on the seed; re-rolling it for a
    // deterministic order would change nothing, so it jumps to that order
    // rather than looking broken.
    setSeed(randomSeed());
    setOrderState((prev) => (prev === "random" ? prev : "random"));
  }, [record, pause]);

  return {
    ...player,
    order,
    orderMeta: ORDER_MAP[order],
    size,
    seed,
    keys,
    lanes: lanesNow,
    shortest,
    tick,
    steps: new Array(ticks),
    step: lanesNow[0]?.state || {},
    setOrder,
    handleSizeChange,
    shuffle,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}

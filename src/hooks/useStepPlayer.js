import { useCallback, useEffect, useRef, useState } from "react";

// Playback timing lives here so a given SPEED value feels identical no matter
// which structure is on screen. speed is 1-100, higher = faster.
const SLOWEST_MS = 700;
const FASTEST_MS = 40;

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

export function delayForSpeed(speed) {
  const t = (clamp(speed, 1, 100) - 1) / 99;
  return SLOWEST_MS - t * (SLOWEST_MS - FASTEST_MS);
}

/**
 * Drives step-by-step playback for a visualizer.
 *
 * The loop runs on requestAnimationFrame and reads speed from a ref, so moving
 * the speed slider mid-run retimes the next step instead of tearing down and
 * restarting a timer (the old setInterval approach restarted on every speed or
 * steps change, which showed up as a stutter).
 */
export function useStepPlayer(stepCount, initialSpeed = 60) {
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);

  const lastIdx = Math.max(0, stepCount - 1);
  const atEnd = stepIdx >= lastIdx;

  const speedRef = useRef(speed);
  const lastIdxRef = useRef(lastIdx);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    lastIdxRef.current = lastIdx;
  }, [lastIdx]);

  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0;
    let prevTime = performance.now();
    let acc = 0;

    const tick = (now) => {
      const delay = delayForSpeed(speedRef.current);
      acc += now - prevTime;
      prevTime = now;
      // A backgrounded tab hands back a huge gap on return; don't fast-forward.
      if (acc > delay * 3) acc = delay;
      if (acc >= delay) {
        acc -= delay;
        setStepIdx((prev) => Math.min(prev + 1, lastIdxRef.current));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Stop once the final step is on screen.
  useEffect(() => {
    if (playing && stepIdx >= lastIdx) setPlaying(false);
  }, [playing, stepIdx, lastIdx]);

  const pause = useCallback(() => setPlaying(false), []);

  const seek = useCallback(
    (i) => {
      setPlaying(false);
      setStepIdx(clamp(i, 0, lastIdx));
    },
    [lastIdx]
  );

  const reset = useCallback(() => {
    setPlaying(false);
    setStepIdx(0);
  }, []);

  const stepForward = useCallback(() => {
    setPlaying(false);
    setStepIdx((i) => Math.min(i + 1, lastIdx));
  }, [lastIdx]);

  const stepBack = useCallback(() => {
    setPlaying(false);
    setStepIdx((i) => Math.max(0, i - 1));
  }, []);

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (lastIdx <= 0) return;
    // Replay from the top when the previous run already finished.
    if (stepIdx >= lastIdx) setStepIdx(0);
    setPlaying(true);
  }, [playing, stepIdx, lastIdx]);

  return {
    stepIdx,
    setStepIdx,
    playing,
    setPlaying,
    speed,
    setSpeed,
    atEnd,
    pause,
    seek,
    reset,
    stepForward,
    stepBack,
    togglePlay,
  };
}

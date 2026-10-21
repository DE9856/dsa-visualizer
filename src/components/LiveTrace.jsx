import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ALGO_MAP, getSteps } from "../algorithms/index.js";
import { buildInput } from "../utils/distributions.js";
import { stateColors, stateOfBar } from "../utils/stateStyle.js";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

// Four sorts that look nothing alike while they work: partitions, a growing
// sorted prefix, merged runs, a heap emptied from the back.
const SEQUENCE = ["quick", "insertion", "merge", "heap"];
const N = 26;
const STEP_MS = 60;
// How long a finished, all-green run is left on screen before the next starts.
const HOLD_MS = 1600;

function runFor(cycle) {
  const key = SEQUENCE[cycle % SEQUENCE.length];
  const seed = 1009 + cycle * 7919;
  return { key, steps: getSteps(key, buildInput("random", N, seed), undefined, { seed }) };
}

/**
 * The landing page's one live thing: a real run, not an illustration of one.
 * The frames come from the same algorithm code the sorting view plays, and the
 * bars take the same state colours, so what moves here is exactly what the
 * visitor will be stepping through a click later.
 *
 * It paces itself on requestAnimationFrame like the player does, stops when it
 * is scrolled away or the tab is hidden, and under reduced motion shows one
 * still frame from the middle of a run instead of playing.
 */
export default function LiveTrace({ onOpen }) {
  const reduced = usePrefersReducedMotion();
  const [cycle, setCycle] = useState(0);
  const run = useMemo(() => runFor(cycle), [cycle]);
  const [stepIdx, setStepIdx] = useState(0);
  const rootRef = useRef(null);
  const visible = useRef(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) {
      setStepIdx(Math.floor(run.steps.length * 0.45));
      return undefined;
    }
    setStepIdx(0);
    let raf = 0;
    let last = performance.now();
    let idx = 0;
    const lastIdx = run.steps.length - 1;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (!visible.current || document.hidden) {
        last = now;
        return;
      }
      const wait = idx >= lastIdx ? HOLD_MS : STEP_MS;
      if (now - last < wait) return;
      last = now;
      if (idx >= lastIdx) {
        cancelAnimationFrame(raf);
        setCycle((c) => c + 1);
        return;
      }
      idx += 1;
      setStepIdx(idx);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, reduced]);

  const frame = run.steps[Math.min(stepIdx, run.steps.length - 1)];
  const values = frame.array;
  const max = Math.max(...values, 1);
  const label = ALGO_MAP[run.key]?.label ?? run.key;

  return (
    <button
      type="button"
      ref={rootRef}
      className="live-trace"
      onClick={onOpen}
      aria-label={`Open the sorting visualizer — ${label} is running here`}
    >
      <span className="live-trace__head">
        <span className="live-trace__name">{label}</span>
        <span className="live-trace__step mono">
          step {stepIdx + 1}/{run.steps.length}
        </span>
      </span>
      <span className="live-trace__bars" aria-hidden="true">
        {values.map((v, i) => {
          const state = stateOfBar({
            swapping: frame.swap?.includes(i),
            comparing: frame.compare?.includes(i),
            sorted: frame.sorted?.includes(i),
          });
          const colors = stateColors(state);
          // A pivot is marked on the edge and keeps its state's fill, as on
          // the sorting canvas.
          const pivot = frame.pivot === i && state !== "swap";
          return (
            <span
              key={i}
              className="live-trace__bar"
              style={{
                height: `${Math.max(4, (v / max) * 100)}%`,
                background: colors.background,
                borderColor: pivot ? "rgb(var(--state-pivot-rgb))" : colors.border,
              }}
            />
          );
        })}
      </span>
      <span className="live-trace__open">
        Open the sorting view <ArrowRight size={14} aria-hidden="true" />
      </span>
    </button>
  );
}

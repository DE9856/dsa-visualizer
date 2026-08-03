import { useEffect, useRef, useState } from "react";

const BOOT_LINES = [
  "mounting dataStructures/ ...",
  "compiling algorithms/sorting, searching ...",
  "linking linkedList, polynomial modules ...",
  "initializing stack & queue frames ...",
  "building tree + 2-3 tree indices ...",
  "wiring graph traversal engine ...",
  "calibrating step visualizer ...",
];

export default function BootScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const rootRef = useRef(null);
  const doneRef = useRef(false);

  // progress ticking
  useEffect(() => {
    const start = performance.now();
    const durationMs = 2600;
    let raf;

    const tick = (now) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);
      setLineIdx(Math.min(BOOT_LINES.length - 1, Math.floor((pct / 100) * BOOT_LINES.length)));
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setReady(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // reactive glow that follows the pointer
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const handleMove = (e) => {
      const rect = node.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setGlow({ x, y });
    };
    node.addEventListener("mousemove", handleMove);
    return () => node.removeEventListener("mousemove", handleMove);
  }, []);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  // allow skipping with a click or a keypress
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Enter" || e.key === " ") finish();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="boot"
      ref={rootRef}
      onClick={() => ready && finish()}
      style={{
        "--glow-x": `${glow.x}%`,
        "--glow-y": `${glow.y}%`,
      }}
    >
      <div className="boot__glow" />

      <div className="boot__content">
        <div className="boot__mark mono">&#9642;</div>
        <h1 className="boot__title mono">DSA://VISUALIZER</h1>
        <p className="boot__subtitle mono">booting the visual runtime</p>

        <div className="boot__console mono">
          {BOOT_LINES.slice(0, lineIdx + 1).map((line, i) => (
            <div className="boot__line" key={line}>
              <span className="boot__prompt">$</span> {line}
              <span className="boot__ok">{i < lineIdx || progress >= 100 ? " OK" : ""}</span>
            </div>
          ))}
        </div>

        <div className="boot__bar-track">
          <div className="boot__bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="boot__pct mono">{progress}%</div>

        <button
          className={`boot__enter mono ${ready ? "boot__enter--ready" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (ready) finish();
          }}
        >
          {ready ? "PRESS TO ENTER ▸" : "LOADING ..."}
        </button>
      </div>
    </div>
  );
}
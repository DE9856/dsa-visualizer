import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";

export default function Controls({
  stepIdx,
  steps,
  step,
  playing,
  speed,
  setSpeed,
  meta,
  onReset,
  onStepBack,
  onStepForward,
  onTogglePlay,
}) {
  return (
    <div className="panel controls">
      <div className="controls__transport">
        <button className="btn icon" onClick={onReset}>
          <RotateCcw size={15} />
        </button>
        <button className="btn icon" onClick={onStepBack}>
          <SkipBack size={15} />
        </button>
        <button className="btn icon accent" onClick={onTogglePlay}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button className="btn icon" onClick={onStepForward}>
          <SkipForward size={15} />
        </button>
      </div>

      <div className="controls__speed">
        <span className="label mono">SPEED</span>
        <input
          type="range"
          min={1}
          max={100}
          value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
        />
      </div>

      <div className="lcd">
        STEP <strong>{stepIdx + 1}</strong>/{steps.length}
      </div>

      <div className="metrics">
        <div className="lcd">
          CMP <strong style={{ color: "var(--blue)" }}>{step.cCount ?? 0}</strong>
        </div>
        <div className="lcd">
          {meta.category === "sorting" ? "SWP" : "WRT"}{" "}
          <strong style={{ color: "var(--red)" }}>{step.sCount ?? 0}</strong>
        </div>
      </div>
    </div>
  );
}

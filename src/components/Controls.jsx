import { Play, Pause, SkipBack, SkipForward, RotateCcw, RefreshCw, Keyboard } from "lucide-react";
import { delayForSpeed } from "../hooks/useStepPlayer.js";
import { SHORTCUTS } from "../hooks/useKeyboardShortcuts.js";

/**
 * Transport bar shared by every visualizer. `metrics` is optional extra
 * read-out (sorting/searching pass comparison + swap counters).
 */
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
  onSeek,
  showHelp = false,
  onToggleHelp,
}) {
  const total = steps.length;
  const lastIdx = Math.max(0, total - 1);
  const current = Math.min(stepIdx, lastIdx);
  const atStart = current === 0;
  const atEnd = current >= lastIdx;
  const hasRun = lastIdx > 0;
  const rate = (1000 / delayForSpeed(speed)).toFixed(1);
  const progress = lastIdx > 0 ? (current / lastIdx) * 100 : 0;

  return (
    <div className="panel controls">
      <div className="controls__row">
        <div className="controls__transport">
          <button
            className="btn icon"
            onClick={onReset}
            disabled={atStart}
            title="Reset to first step (R)"
            aria-label="Reset to first step"
          >
            <RotateCcw size={15} />
          </button>
          <button
            className="btn icon"
            onClick={onStepBack}
            disabled={atStart}
            title="Previous step (←)"
            aria-label="Previous step"
          >
            <SkipBack size={15} />
          </button>
          <button
            className="btn icon accent"
            onClick={onTogglePlay}
            disabled={!hasRun}
            title={playing ? "Pause (Space)" : atEnd ? "Replay (Space)" : "Play (Space)"}
            aria-label={playing ? "Pause" : atEnd ? "Replay" : "Play"}
          >
            {playing ? <Pause size={15} /> : atEnd && hasRun ? <RefreshCw size={15} /> : <Play size={15} />}
          </button>
          <button
            className="btn icon"
            onClick={onStepForward}
            disabled={atEnd}
            title="Next step (→)"
            aria-label="Next step"
          >
            <SkipForward size={15} />
          </button>
        </div>

        <label className="controls__speed">
          <span className="label mono">SPEED</span>
          <input
            type="range"
            min={1}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
            aria-label="Playback speed"
          />
          <span className="lcd controls__rate">{rate}/s</span>
        </label>

        <div className="lcd controls__step">
          STEP <strong>{current + 1}</strong>/{total}
        </div>

        {step && meta && (
          <div className="metrics">
            <div className="lcd">
              CMP <strong style={{ color: "var(--blue)" }}>{step.cCount ?? 0}</strong>
            </div>
            <div className="lcd">
              {meta.category === "sorting" ? "SWP" : "WRT"}{" "}
              <strong style={{ color: "var(--red)" }}>{step.sCount ?? 0}</strong>
            </div>
          </div>
        )}

        {onToggleHelp && (
          <button
            className={`btn icon controls__help-btn ${showHelp ? "active" : ""}`}
            onClick={onToggleHelp}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
            aria-expanded={showHelp}
          >
            <Keyboard size={15} />
          </button>
        )}
      </div>

      <div className="timeline" style={{ "--progress": `${progress}%` }}>
        <input
          className="timeline__range"
          type="range"
          min={0}
          max={lastIdx}
          value={current}
          disabled={!hasRun}
          onChange={(e) => onSeek?.(parseInt(e.target.value, 10))}
          aria-label={`Step ${current + 1} of ${total}`}
        />
      </div>

      {showHelp && (
        <div className="controls__help">
          {SHORTCUTS.map((s) => (
            <div className="controls__help-item" key={s.keys}>
              <kbd className="mono">{s.keys}</kbd>
              <span>{s.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

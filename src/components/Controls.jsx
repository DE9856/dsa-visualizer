import { Play, Pause, SkipBack, SkipForward, RotateCcw, RefreshCw, Keyboard, Volume2, VolumeX } from "lucide-react";
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
  sound,
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

        {step && meta && <Metrics step={step} meta={meta} />}

        {sound && (
          <div className="controls__sound">
            <button
              className={`btn icon ${sound.enabled ? "active" : ""}`}
              onClick={sound.toggle}
              aria-pressed={sound.enabled}
              title={sound.enabled ? "Sound on — pitch follows each value" : "Play the run: pitch follows each value"}
              aria-label={sound.enabled ? "Turn sound off" : "Turn sound on"}
            >
              {sound.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            {/* The slider appears only once there is something to hear, so
                the transport isn't carrying a dead control most of the time. */}
            {sound.enabled && (
              <input
                className="controls__volume"
                type="range"
                min={0}
                max={100}
                value={Math.round(sound.volume * 100)}
                onChange={(e) => sound.setVolume(parseInt(e.target.value, 10) / 100)}
                aria-label="Volume"
              />
            )}
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

/**
 * The read-out beside the transport.
 *
 * Sorting algorithms count their own comparisons, reads, writes, auxiliary
 * memory and recursion depth as they run, so all five are real. The two that
 * are structurally zero for a given algorithm (an in-place sort holds no aux;
 * a loop-only sort recurses no deeper than not at all) are left out rather
 * than shown as a permanent 0. Searches carry no counters of their own, so
 * they keep the two-column read-out they always had.
 */
function Metrics({ step, meta }) {
  const stats = step.stats;
  if (!stats || meta.category !== "sorting") {
    return (
      <div className="metrics">
        <div className="lcd" title="Comparisons">
          CMP <strong style={{ color: "var(--blue)" }}>{step.cCount ?? 0}</strong>
        </div>
        <div className="lcd" title="Writes">
          WRT <strong style={{ color: "var(--red)" }}>{step.sCount ?? 0}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics">
      <div className="lcd" title="Key comparisons">
        CMP <strong style={{ color: "var(--blue)" }}>{stats.comparisons}</strong>
      </div>
      <div className="lcd" title="Array reads">
        RD <strong>{stats.reads}</strong>
      </div>
      <div className="lcd" title="Array writes">
        WR <strong style={{ color: "var(--red)" }}>{stats.writes}</strong>
      </div>
      {stats.aux > 0 && (
        <div className="lcd" title="Auxiliary memory high-water mark, in elements">
          AUX <strong style={{ color: "var(--yellow)" }}>{stats.aux}</strong>
        </div>
      )}
      {stats.depth > 0 && (
        <div className="lcd" title="Deepest recursion reached">
          DEP <strong style={{ color: "var(--purple)" }}>{stats.depth}</strong>
        </div>
      )}
    </div>
  );
}

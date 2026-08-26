import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Play, Square } from "lucide-react";

/**
 * The collapsible "measure it" panel the comparison views share.
 *
 * Every sweep has the same shape: real work that nobody should pay for on page
 * load, run on demand in chunks so the progress bar keeps painting,
 * cancellable, and invalidated when the setup it was measured under changes.
 * This owns that machinery; the caller supplies its own controls, its own
 * `run`, and whatever it wants to draw with the result.
 *
 * `summary` is for what a panel already knows without measuring anything — the
 * numbers for the structure currently on screen. It sits above the controls
 * and is there the moment the panel is opened, so a panel that has something
 * exact to say doesn't have to make you run a sweep to hear it.
 *
 * `setupKey` is what the result was measured under. When it stops matching,
 * the numbers are marked stale rather than silently redrawn as if they were
 * current — a plot quietly describing a different configuration is worse than
 * no plot.
 */
export default function SweepPanel({
  title,
  subtitle,
  setupKey,
  summary,
  controls,
  emptyText,
  runLabel = "RUN SWEEP",
  rerunLabel = "RE-RUN SWEEP",
  progressLabel,
  run,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const tokenRef = useRef(null);

  const stale = result && result.setupKey !== setupKey;

  const cancel = useCallback(() => {
    if (tokenRef.current) tokenRef.current.cancelled = true;
    tokenRef.current = null;
    setProgress(null);
  }, []);

  // Leaving the view mid-sweep must not leave it running against a component
  // that is no longer mounted.
  useEffect(() => cancel, [cancel]);

  const start = useCallback(async () => {
    cancel();
    const token = { cancelled: false };
    tokenRef.current = token;
    setProgress({ fraction: 0 });

    const measured = await run({
      token,
      onProgress: (fraction, detail) => setProgress({ fraction, detail }),
    });

    if (token.cancelled) return;
    tokenRef.current = null;
    setProgress(null);
    if (measured) setResult({ ...measured, setupKey });
  }, [run, setupKey, cancel]);

  return (
    <div className="panel complexity">
      <button className="complexity__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="complexity__title">{title}</span>
        <span className="complexity__sub">{subtitle}</span>
        <ChevronDown size={16} className={`complexity__chev ${open ? "open" : ""}`} />
      </button>

      {open && (
        <div className="complexity__body">
          {summary && <div className="complexity__summary">{summary}</div>}

          <div className="complexity__controls">
            {controls}
            <div className="complexity__control complexity__control--run">
              {progress ? (
                <button className="btn icon accent" onClick={cancel} title="Stop the sweep">
                  <Square size={14} /> STOP
                </button>
              ) : (
                <button className="btn icon accent" onClick={start} title="Run the sweep">
                  <Play size={14} /> {result ? rerunLabel : runLabel}
                </button>
              )}
            </div>
          </div>

          {progress && (
            <div className="complexity__progress" style={{ "--fraction": `${progress.fraction * 100}%` }}>
              <span className="lcd">{progressLabel?.(progress) ?? "measuring\u2026"}</span>
            </div>
          )}

          {stale && (
            <p className="complexity__stale">
              These numbers were measured for a different set-up. Re-run to match what is above.
            </p>
          )}

          {result ? children(result, stale) : !progress && <p className="complexity__empty">{emptyText}</p>}
        </div>
      )}
    </div>
  );
}

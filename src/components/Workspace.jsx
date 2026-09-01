import { useEffect, useState } from "react";
import { SlidersHorizontal, X, Shuffle, Play, Pause, RefreshCw, Download } from "lucide-react";
import { useIsMobile } from "../hooks/useMediaQuery.js";
import ShareButton from "./ShareButton.jsx";

// Buttons that kick off a new run — tapping one means "I'm done configuring",
// so the sheet gets out of the way. Selecting an operation deliberately does
// NOT close it: you usually still have a field to fill in afterwards.
const RUN_ACTION = 'button[type="submit"], .btn--block, .btn--block-flat';

/**
 * The visualizer shell. On desktop it is the plain two-column layout; on a
 * phone the sidebar moves into a bottom sheet and the visualization takes the
 * whole screen, with a fixed action bar for the things you reach for most.
 */
export default function Workspace({
  sidebar,
  panelLabel = "CONTROLS",
  onShuffle,
  playing,
  onTogglePlay,
  canPlay = false,
  atEnd = false,
  shareUrl,
  onExport,
  children,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Rotating to landscape / resizing must never strand an open sheet.
  useEffect(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isMobile) {
    return (
      <div className="layout">
        {sidebar}
        {/* The export capture reads this subtree, so it gets exactly the
            visualization and its transport — not the sidebar or the chrome. */}
        <div className="main-col" data-export-target>
          {/* Tucked into the canvas's top-right corner rather than given a row
              of its own: these are things you reach for occasionally, and the
              header has better uses for the height. On a phone they live in
              the nav sheet instead, where there is room to label them. */}
          {(shareUrl || onExport) && (
            <div className="main-col__share" data-export-drop>
              {onExport && (
                <button className="btn" onClick={onExport} title="Export this run as a GIF, video or printable table">
                  <Download size={13} /> EXPORT
                </button>
              )}
              {shareUrl && <ShareButton url={shareUrl} />}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }

  const handleSheetClick = (e) => {
    const action = e.target.closest(RUN_ACTION);
    if (!action) return;
    // A button that owns a form submits it as this click's *default action*,
    // which the browser only runs once the event has finished propagating.
    // Closing here unmounts the form first, and the submission algorithm drops
    // a form that is no longer connected — without ever firing `submit`. The
    // sheet would slide away and the operation would silently never run.
    // Those close from handleSheetSubmit instead, after the run has started.
    if (action.form && action.type === "submit") return;
    setOpen(false);
  };

  // Every sidebar runs its operation from a form's onSubmit, which bubbles to
  // here once that handler has done its work.
  const handleSheetSubmit = () => setOpen(false);

  return (
    <div className="layout layout--mobile">
      <div className="main-col" data-export-target>{children}</div>

      <div className="actionbar">
        <button
          className="btn icon actionbar__play"
          onClick={onTogglePlay}
          disabled={!canPlay}
          aria-label={playing ? "Pause" : atEnd ? "Replay" : "Play"}
        >
          {playing ? <Pause size={17} /> : atEnd && canPlay ? <RefreshCw size={17} /> : <Play size={17} />}
        </button>

        <button className="btn actionbar__main" onClick={() => setOpen(true)} aria-expanded={open}>
          <SlidersHorizontal size={15} /> {panelLabel}
        </button>

        <button className="btn icon" onClick={onShuffle} aria-label="New random data">
          <Shuffle size={17} />
        </button>
      </div>

      {open && (
        <>
          <button className="sheet__backdrop" onClick={() => setOpen(false)} aria-label="Close panel" />
          <div className="sheet" role="dialog" aria-modal="true" aria-label={panelLabel}>
            <div className="sheet__head">
              <span className="sheet__grip" aria-hidden="true" />
              <span className="sheet__title mono">{panelLabel}</span>
              <button className="btn icon" onClick={() => setOpen(false)} aria-label="Close panel">
                <X size={16} />
              </button>
            </div>
            <div className="sheet__body" onClick={handleSheetClick} onSubmit={handleSheetSubmit}>
              {sidebar}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

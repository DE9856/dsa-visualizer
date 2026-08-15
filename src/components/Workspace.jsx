import { useEffect, useState } from "react";
import { SlidersHorizontal, X, Shuffle, Play, Pause, RefreshCw } from "lucide-react";
import { useIsMobile } from "../hooks/useMediaQuery.js";

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
        <div className="main-col">{children}</div>
      </div>
    );
  }

  const handleSheetClick = (e) => {
    if (e.target.closest(RUN_ACTION)) setOpen(false);
  };

  return (
    <div className="layout layout--mobile">
      <div className="main-col">{children}</div>

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
            <div className="sheet__body" onClick={handleSheetClick}>
              {sidebar}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

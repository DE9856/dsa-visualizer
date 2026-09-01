import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Download, X, Film, Image as ImageIcon, Table } from "lucide-react";
import { createCapturer } from "../utils/domCapture.js";
import { buildPalette, createGifEncoder } from "../utils/gifEncoder.js";
import { createVideoRecorder, pickVideoFormat, videoSupported } from "../utils/videoRecorder.js";

// Above this the file stops being something anyone will actually send, and
// the export itself takes minutes. Longer runs are sampled instead.
const MAX_FRAMES = 240;

// Enough frames to see the palette the run ends on as well as the one it
// starts with — a sort's bars all turn green, and a table built from the
// first frame alone would have nothing to render that with.
const PALETTE_SAMPLES = 8;

const WIDTHS = [480, 720, 960, 1280];

/**
 * Which steps become frames. A run of a few hundred steps is exported whole;
 * a longer one is thinned evenly, always keeping the first and last frame so
 * the export still starts at the beginning and ends on the answer.
 */
export function planFrames(total, maxFrames = MAX_FRAMES) {
  if (total <= maxFrames) return Array.from({ length: total }, (_, i) => i);
  const stride = Math.ceil(total / maxFrames);
  const frames = [];
  for (let i = 0; i < total; i += stride) frames.push(i);
  if (frames[frames.length - 1] !== total - 1) frames.push(total - 1);
  return frames;
}

/**
 * Waits for the browser to have laid out the step just seeked to. Two frames
 * is enough to be sure React has committed and the page painted — but a
 * backgrounded tab never fires an animation frame at all, so the wait falls
 * back to a timeout. Without it, an export that gets tabbed away from hangs
 * forever behind a progress bar that never moves.
 */
const painted = () =>
  new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    requestAnimationFrame(() => requestAnimationFrame(finish));
    setTimeout(finish, 120);
  });

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function prettySize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExportDialog({ steps, stepIdx, seek, slug, table, onPrint, onClose }) {
  const [format, setFormat] = useState("gif");
  const [width, setWidth] = useState(720);
  const [fps, setFps] = useState(12);
  const [includeCode, setIncludeCode] = useState(false);
  const [status, setStatus] = useState(null); // { phase, done, total } | { error } | { done: blob }
  const [result, setResult] = useState(null);

  const cancelled = useRef(false);
  const running = status?.phase !== undefined;

  const total = steps.length;
  const frames = planFrames(total);
  const sampled = frames.length < total;
  const videoFormat = pickVideoFormat();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !running) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, running]);

  // Leaving the freeze class behind would kill every animation in the app.
  useEffect(() => () => document.body.classList.remove("is-exporting"), []);

  const runCapture = async () => {
    const target = document.querySelector("[data-export-target]");
    if (!target) {
      setStatus({ error: "Couldn't find the visualization to capture." });
      return;
    }

    cancelled.current = false;
    setResult(null);
    const restoreTo = stepIdx;
    // Transitions mid-flight would smear one step's colours into the next
    // frame's capture, so the whole app is frozen for the duration.
    document.body.classList.add("is-exporting");

    let recorder = null;
    try {
      setStatus({ phase: "Preparing", done: 0, total: frames.length });
      const capturer = await createCapturer(target, { includeCode, maxWidth: width });

      const frameAt = async (index) => {
        flushSync(() => seek(index));
        await painted();
        return capturer.capture();
      };

      if (format === "gif") {
        // A first pass over a handful of frames, purely to learn the colours.
        const sampleIndices = Array.from({ length: PALETTE_SAMPLES }, (_, i) =>
          frames[Math.floor((i * (frames.length - 1)) / Math.max(1, PALETTE_SAMPLES - 1))]
        );
        const samples = [];
        for (const [i, index] of sampleIndices.entries()) {
          if (cancelled.current) throw new Error("cancelled");
          setStatus({ phase: "Reading colours", done: i + 1, total: sampleIndices.length });
          samples.push(await frameAt(index));
        }

        const palette = buildPalette(samples);
        const encoder = createGifEncoder({
          width: capturer.width,
          height: capturer.height,
          palette,
          delayCs: Math.max(2, Math.round(100 / fps)),
        });

        for (const [i, index] of frames.entries()) {
          if (cancelled.current) throw new Error("cancelled");
          setStatus({ phase: "Encoding GIF", done: i + 1, total: frames.length });
          encoder.addFrame(await frameAt(index));
        }
        const blob = encoder.finish();
        setResult({ blob, filename: `${slug}.gif` });
      } else {
        const first = await frameAt(frames[0]);
        recorder = createVideoRecorder({ width: capturer.width, height: capturer.height, fps });
        setStatus({ phase: "Recording", done: 1, total: frames.length });
        await recorder.addFrame(first);

        for (let i = 1; i < frames.length; i++) {
          if (cancelled.current) throw new Error("cancelled");
          setStatus({ phase: "Recording", done: i + 1, total: frames.length });
          await recorder.addFrame(await frameAt(frames[i]));
        }
        const blob = await recorder.finish();
        recorder = null;
        setResult({ blob, filename: `${slug}.${videoFormat.extension}` });
      }
      setStatus(null);
    } catch (error) {
      recorder?.abort();
      setStatus(error.message === "cancelled" ? null : { error: error.message || "The export failed." });
    } finally {
      document.body.classList.remove("is-exporting");
      seek(restoreTo);
    }
  };

  const estimate = () => {
    if (format === "table") return `${total} rows`;
    const seconds = (frames.length / fps).toFixed(1);
    return `${frames.length} frames · ${seconds}s at ${fps}fps`;
  };

  return (
    <>
      <button className="export-dialog__backdrop" onClick={running ? undefined : onClose} aria-label="Close export" />
      <div className="panel export-dialog" role="dialog" aria-modal="true" aria-label="Export this run">
        <div className="export-dialog__head">
          <span className="label label--tight">EXPORT THIS RUN</span>
          <button className="btn icon" onClick={onClose} disabled={running} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="export-dialog__formats" role="tablist" aria-label="Export format">
          {[
            { key: "gif", label: "GIF", Icon: ImageIcon },
            { key: "video", label: videoFormat ? videoFormat.extension.toUpperCase() : "VIDEO", Icon: Film },
            { key: "table", label: "STEP TABLE", Icon: Table },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={format === key}
              className={`btn export-dialog__format ${format === key ? "active" : ""}`}
              disabled={running || (key === "video" && !videoSupported())}
              onClick={() => {
                setFormat(key);
                setResult(null);
                setStatus(null);
              }}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {format === "table" ? (
          <p className="export-dialog__note">
            Every step as a printable row — the line of code it ran, what it did, the state it left, and the
            running counters. Opens your browser&apos;s print dialog; choose <b>Save as PDF</b> as the
            destination.
          </p>
        ) : (
          <div className="export-dialog__options">
            <label className="export-dialog__field">
              <span className="label label--tight">WIDTH</span>
              <select className="text-input" value={width} onChange={(e) => setWidth(Number(e.target.value))} disabled={running}>
                {WIDTHS.map((w) => (
                  <option key={w} value={w}>
                    {w}px
                  </option>
                ))}
              </select>
            </label>

            <label className="export-dialog__field">
              <span className="label label--tight">FRAME RATE — {fps}fps</span>
              <input
                type="range"
                min="4"
                max="30"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                disabled={running}
              />
            </label>

            <label className="export-dialog__check">
              <input
                type="checkbox"
                checked={includeCode}
                onChange={(e) => setIncludeCode(e.target.checked)}
                disabled={running}
              />
              Include the code panel
            </label>
          </div>
        )}

        <div className="export-dialog__estimate mono">
          {estimate()}
          {sampled && format !== "table" && (
            <span className="export-dialog__warn"> — {total} steps thinned to fit</span>
          )}
        </div>

        {status?.phase && (
          <div className="export-dialog__progress">
            <div className="export-dialog__bar">
              <div style={{ width: `${(status.done / status.total) * 100}%` }} />
            </div>
            <span className="mono">
              {status.phase} {status.done}/{status.total}
            </span>
          </div>
        )}

        {status?.error && <div className="export-dialog__error">{status.error}</div>}

        {result && (
          <div className="export-dialog__result">
            <span className="mono">
              {result.filename} · {prettySize(result.blob.size)}
            </span>
            <button className="btn accent" onClick={() => download(result.blob, result.filename)}>
              <Download size={13} /> SAVE
            </button>
          </div>
        )}

        <div className="export-dialog__actions">
          {running ? (
            <button className="btn btn--block-flat" onClick={() => (cancelled.current = true)}>
              CANCEL
            </button>
          ) : (
            <button
              className="btn accent btn--block-flat"
              onClick={format === "table" ? onPrint : runCapture}
              disabled={total < 1}
            >
              {format === "table" ? "OPEN PRINT DIALOG" : result ? "RENDER AGAIN" : "RENDER"}
            </button>
          )}
        </div>

        {!videoSupported() && format === "video" && (
          <p className="export-dialog__note">This browser can&apos;t record video. GIF still works.</p>
        )}
        <p className="export-dialog__hint">
          {total <= 1 ? "Run an operation first — a single frame is all there is to capture." : ""}
        </p>
      </div>
    </>
  );
}

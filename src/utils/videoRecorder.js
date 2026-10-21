/**
 * Records a sequence of captured frames to a video file using the browser's
 * own `MediaRecorder`, so nothing has to be transcoded in JavaScript.
 *
 * Two consequences of using the platform encoder are worth knowing, because
 * neither is a bug to be fixed here:
 *
 * - **The container is whatever the browser can write.** MP4 is offered when
 *   the browser says it can produce it (Safari always, recent Chrome usually)
 *   and WebM otherwise. Both play in every modern browser and in the editors
 *   people actually paste these into; forcing MP4 everywhere would mean
 *   shipping a WebAssembly transcoder many times the size of this whole app.
 * - **Recording happens in real time.** `MediaRecorder` timestamps frames by
 *   the wall clock, so a thirty-second video takes thirty seconds to record
 *   no matter how fast the frames are produced. `pace()` below waits out the
 *   remainder of each frame's interval rather than racing ahead, which is
 *   what keeps the exported playback speed the one that was asked for.
 */

const CANDIDATES = [
  { mimeType: "video/mp4;codecs=avc1.42E01E", extension: "mp4" },
  { mimeType: "video/mp4", extension: "mp4" },
  { mimeType: "video/webm;codecs=vp9", extension: "webm" },
  { mimeType: "video/webm;codecs=vp8", extension: "webm" },
  { mimeType: "video/webm", extension: "webm" },
];

/** The best container this browser will actually write, or null if none. */
export function pickVideoFormat() {
  if (typeof MediaRecorder === "undefined") return null;
  return CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c.mimeType)) ?? null;
}

export function videoSupported() {
  return Boolean(pickVideoFormat()) && typeof HTMLCanvasElement.prototype.captureStream === "function";
}

/**
 * Starts recording. Frames are pushed in with `addFrame`, which returns once
 * enough real time has passed for that frame to have the duration asked for.
 */
export function createVideoRecorder({ width, height, fps = 20, quality = 8 }) {
  const format = pickVideoFormat();
  if (!format) throw new Error("This browser cannot record video.");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // A zero frame rate means "only the frames I explicitly request", which is
  // what makes the output exactly one frame per step instead of a real-time
  // sampling of whatever the page happened to be showing.
  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0];

  const chunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: format.mimeType,
    videoBitsPerSecond: Math.round(width * height * fps * quality * 0.06),
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();

  const interval = 1000 / fps;
  let due = performance.now();

  const pace = () => {
    due += interval;
    const wait = due - performance.now();
    // Capturing a frame can take longer than its own interval on a big view.
    // Rather than trying to claw the time back — which would silently speed
    // the video up — the clock is reset and the video simply runs at the rate
    // the machine could manage.
    if (wait <= 0) {
      due = performance.now();
      return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, wait));
  };

  const addFrame = async (imageData) => {
    ctx.putImageData(imageData, 0, 0);
    track.requestFrame();
    await pace();
  };

  const finish = () =>
    new Promise((resolve) => {
      recorder.onstop = () => {
        track.stop();
        resolve(new Blob(chunks, { type: format.mimeType.split(";")[0] }));
      };
      // The last frame needs a moment on screen before the stream is torn
      // down, or the encoder drops it.
      setTimeout(() => recorder.stop(), interval + 50);
    });

  const abort = () => {
    try {
      recorder.stop();
    } catch {
      /* already stopped */
    }
    track.stop();
  };

  return { addFrame, finish, abort, extension: format.extension, mimeType: format.mimeType };
}

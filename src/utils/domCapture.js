/**
 * Rasterises a live DOM subtree to a canvas, with no dependencies and no
 * server round trip.
 *
 * The trick is that an `<img>` pointed at an SVG data URL renders whatever is
 * inside a `<foreignObject>` with the browser's own layout engine — so the
 * export is drawn by the same code that drew the screen, and nothing has to
 * be re-implemented per view. That is what makes one capture path cover every
 * visualizer rather than needing a hand-written painter for each.
 *
 * Two things do not come along for free, and both are handled here once and
 * reused for every frame of a run:
 *
 * - **Styles.** The cloned markup inside the SVG cannot see the document's
 *   stylesheets, so the whole of `index.css` is collected and inlined. `:root`
 *   is rewritten to a class, because inside the SVG the custom properties have
 *   to hang off the wrapper rather than off an `<html>` that isn't there.
 * - **Fonts.** An image-rendered SVG is not allowed to fetch anything, so a
 *   webfont referenced by URL silently falls back to a system face and every
 *   glyph shifts. The font files are fetched once and inlined as data URLs.
 *   If that fails — offline, blocked — the capture still works, in whatever
 *   the fallback stack gives; nothing here is allowed to fail the export.
 *
 * The SVG is always sized to the element's real CSS pixels and scaled up on
 * the way into the canvas. Sizing the SVG to the output width instead would
 * re-run the layout at that width, and the app's own `@media (max-width:
 * 760px)` rules would flip a desktop run into the mobile layout halfway
 * through an export.
 */

// Chrome will not paint a `<foreignObject>` that carries a `position: fixed`
// descendant, and these are all furniture rather than the run anyway.
const ALWAYS_DROP = [".main-col__share", ".sheet", ".actionbar", ".export-dialog", "[data-export-drop]"];

const CODE_PANELS = [".panel.info", ".topic-panel"];

const FONT_CSS_HOST = "https://fonts.googleapis.com";

let stylesPromise = null;

/** Every same-origin rule in the document, as one string. */
function collectCss() {
  const chunks = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin (the webfont stylesheet). Its @font-face rules are
      // fetched and inlined separately below, so skipping it loses nothing.
      continue;
    }
    for (const rule of rules) chunks.push(rule.cssText);
  }
  // Inside the SVG the variables have to live on an element that exists.
  return chunks.join("\n").replace(/:root\b/g, ".dsa-capture-root");
}

async function asDataUrl(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:font/woff2;base64,${btoa(binary)}`;
}

/**
 * The document's webfaces with their files inlined. Only the faces covering
 * basic Latin are taken: Google serves one `@font-face` per unicode-range
 * subset, and fetching all of them for every weight would be most of a
 * megabyte to render text that is entirely ASCII.
 */
async function inlineFonts() {
  const link = [...document.querySelectorAll('link[rel="stylesheet"]')].find((l) =>
    l.href.startsWith(FONT_CSS_HOST)
  );
  if (!link) return "";

  const css = await fetch(link.href).then((r) => r.text());
  const faces = css.split("@font-face").slice(1);

  const wanted = faces
    .map((face) => `@font-face${face.slice(0, face.indexOf("}") + 1)}`)
    .filter((face) => /U\+0000-00FF/.test(face));

  const inlined = await Promise.all(
    wanted.map(async (face) => {
      const url = face.match(/url\((https:\/\/[^)]+)\)/)?.[1];
      if (!url) return "";
      try {
        return face.replace(url, await asDataUrl(url));
      } catch {
        return "";
      }
    })
  );
  return inlined.join("\n");
}

/**
 * Fetches and caches the stylesheet text and font data the captures need.
 * Resolves to a string even when the fonts could not be fetched — a capture
 * with fallback glyphs beats no capture at all.
 */
export function prepareStyles() {
  if (!stylesPromise) {
    stylesPromise = (async () => {
      const css = collectCss();
      let fonts = "";
      try {
        fonts = await inlineFonts();
      } catch {
        // Offline, or the font host is blocked. Carry on without.
      }
      return `${fonts}\n${css}`;
    })().catch(() => "");
  }
  return stylesPromise;
}

function escapeForStyleTag(css) {
  return css.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/**
 * A capturer bound to one element. Holds the style blob and the scratch
 * canvas so a run of hundreds of frames pays the setup cost once.
 *
 * `capture()` reads whatever the element looks like *now*, so the caller is
 * responsible for putting the view on the step it wants first.
 */
export async function createCapturer(element, { includeCode = false, maxWidth = 960 } = {}) {
  const css = escapeForStyleTag(await prepareStyles());
  const drop = includeCode ? ALWAYS_DROP : [...ALWAYS_DROP, ...CODE_PANELS];

  const rect = element.getBoundingClientRect();
  const cssWidth = Math.max(1, Math.round(rect.width));
  // Scales down as readily as up: a narrower export is the one lever that
  // reliably shrinks a GIF, so clamping this at 1 would have made every width
  // below the window's own a no-op.
  const scale = Math.min(2, Math.max(0.25, maxWidth / cssWidth));

  const root = document.documentElement;
  const vars = getComputedStyle(root);
  const background = vars.getPropertyValue("--bg").trim() || "#0b0d12";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // The height is measured per capture: panels grow and shrink between steps
  // (a verdict line appears, a recursion tree gains rows), and a fixed height
  // would either clip them or leave a band of background.
  let size = null;

  const capture = async () => {
    const w = Math.max(1, Math.round(element.getBoundingClientRect().width));

    const clone = element.cloneNode(true);
    for (const selector of drop) {
      for (const node of clone.querySelectorAll(selector)) node.remove();
    }

    const wrapper = document.createElement("div");
    wrapper.setAttribute("class", "dsa-capture-root");
    const style = `width:${w}px;background:${background};padding:0;margin:0;--step-anim:0ms;`;

    // The height has to be measured on the clone, not on the live element.
    // Dropping a panel from the middle of the column lets everything below it
    // move up, so the clone is genuinely shorter than the thing it was copied
    // from — measuring the original would leave a band of empty background as
    // tall as the panels that aren't in the frame. Laying the clone out
    // off-screen costs one reflow and is the only answer that stays right
    // whatever a view puts in its column.
    wrapper.setAttribute("style", `${style}position:absolute;left:-10000px;top:0;`);
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);
    const h = Math.max(1, Math.ceil(Math.max(wrapper.getBoundingClientRect().height, wrapper.scrollHeight)));
    document.body.removeChild(wrapper);
    wrapper.setAttribute("style", style);

    const markup = new XMLSerializer().serializeToString(wrapper);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<foreignObject x="0" y="0" width="${w}" height="${h}">` +
      `<style>${css}</style>${markup}` +
      `</foreignObject></svg>`;

    const image = new Image();
    image.width = w;
    image.height = h;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("The browser could not render this frame."));
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });

    const outW = Math.round(w * scale);
    const outH = Math.round(h * scale);
    // A GIF's frames must all be the same size, so once a run has started the
    // first frame's dimensions win and later frames are letterboxed into them.
    if (!size) size = { width: outW, height: outH };
    if (canvas.width !== size.width || canvas.height !== size.height) {
      canvas.width = size.width;
      canvas.height = size.height;
    }

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.drawImage(image, 0, 0, outW, outH);

    return ctx.getImageData(0, 0, size.width, size.height);
  };

  return {
    capture,
    canvas,
    get width() {
      return size?.width ?? Math.round(cssWidth * scale);
    },
    get height() {
      return size?.height ?? Math.round(rect.height * scale);
    },
  };
}

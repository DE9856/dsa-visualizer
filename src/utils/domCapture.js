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
 *   glyph shifts. Every `url(….woff2)` the collected CSS mentions is therefore
 *   fetched once and swapped for a data URL. Rewriting whatever the stylesheet
 *   declares, rather than naming the files here, is what keeps this working
 *   when a face is added or renamed. If it fails — offline, blocked — the
 *   capture still works in whatever the fallback stack gives; nothing here is
 *   allowed to fail the export.
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

let stylesPromise = null;

/** Every same-origin rule in the document, as one string. */
function collectCss() {
  const chunks = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      // A cross-origin stylesheet won't expose its rules. The app's own fonts
      // and styles are all same-origin, so there is nothing here to lose.
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

// Matches the font files an @font-face rule points at, however it quotes them.
const FONT_FILE_RE = /url\(\s*['"]?([^)'"]+\.woff2)['"]?\s*\)/g;

/**
 * The collected CSS with every webfont file it references embedded in it.
 *
 * A face whose file cannot be fetched is left pointing at its original URL
 * rather than dropped: inside the SVG that URL simply doesn't load and the
 * text falls back, which is the same outcome, and it keeps one failed font
 * from taking the others down with it.
 */
async function inlineFontFiles(css) {
  const urls = [...new Set([...css.matchAll(FONT_FILE_RE)].map((match) => match[1]))];
  if (!urls.length) return css;

  const embedded = await Promise.all(
    urls.map(async (url) => {
      try {
        return [url, await asDataUrl(url)];
      } catch {
        return [url, null];
      }
    })
  );

  let out = css;
  for (const [url, data] of embedded) {
    // split/join rather than a RegExp: a font URL is a path, and escaping one
    // to be safe as a pattern is work this doesn't need to do.
    if (data) out = out.split(url).join(data);
  }
  return out;
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
      try {
        return await inlineFontFiles(css);
      } catch {
        // Carry on with the styles alone; the text falls back to a system face.
        return css;
      }
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

  // Read live rather than cached: the theme can be changed between exports,
  // and a stale background would letterbox a light capture in near-black.
  const backgroundNow = () =>
    getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#0b0d12";

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
    // The appearance axes live as attributes on <html>, and `:root` has been
    // rewritten to this wrapper — so without copying them across, a light or
    // high-contrast or colour-blind-safe run would export in the dark default
    // palette instead of the one on screen.
    for (const attribute of ["data-theme", "data-contrast", "data-palette"]) {
      const value = document.documentElement.getAttribute(attribute);
      if (value) wrapper.setAttribute(attribute, value);
    }
    const style = `width:${w}px;background:${backgroundNow()};padding:0;margin:0;--step-anim:0ms;`;

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

    ctx.fillStyle = backgroundNow();
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

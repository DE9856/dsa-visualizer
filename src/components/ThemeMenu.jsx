import { useEffect, useRef, useState } from "react";
import { Contrast, Check } from "lucide-react";
import { PALETTES, THEMES } from "../hooks/useTheme.js";
import { PIVOT, STATES } from "../utils/stateStyle.js";

// What the palette preview shows: the four states a sorting run spends
// almost all of its time in, which is exactly the set that has to stay
// separable for the picture to be readable.
const PREVIEW = [
  ["compare", STATES.compare],
  ["swap", STATES.swap],
  ["sorted", STATES.sorted],
  ["pivot", PIVOT],
];

/**
 * The appearance picker. It sits in the top bar rather than in a settings
 * page because the palette is not a preference you set once — it is
 * something you check the picture against, and the swatches below let you do
 * that without leaving the run.
 */
export default function ThemeMenu({ theme, palette, contrast, onTheme, onPalette, onToggleContrast }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="thememenu" ref={rootRef}>
      <button
        className="btn icon"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Appearance: theme, contrast and colour palette"
        aria-label="Appearance settings"
      >
        <Contrast size={15} />
      </button>

      {open && (
        <div className="thememenu__panel panel" role="dialog" aria-label="Appearance">
          <div className="label label--tight">THEME</div>
          <div className="thememenu__row">
            {THEMES.map((option) => (
              <button
                key={option.key}
                className={`btn thememenu__choice ${theme === option.key ? "active" : ""}`}
                onClick={() => onTheme(option.key)}
                aria-pressed={theme === option.key}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            className={`btn btn--block-flat thememenu__toggle ${contrast === "high" ? "active" : ""}`}
            onClick={onToggleContrast}
            aria-pressed={contrast === "high"}
          >
            {contrast === "high" ? <Check size={13} /> : <Contrast size={13} />} HIGH CONTRAST
          </button>

          <div className="label label--tight thememenu__section">STATE COLOURS</div>
          {PALETTES.map((option) => (
            <button
              key={option.key}
              className={`thememenu__palette ${palette === option.key ? "is-active" : ""}`}
              onClick={() => onPalette(option.key)}
              aria-pressed={palette === option.key}
            >
              <span className="thememenu__palette-head">
                <span className="thememenu__palette-name">{option.label}</span>
                {palette === option.key && <Check size={12} />}
              </span>
              <span className="thememenu__palette-desc">{option.desc}</span>
              {/* Rendered under the palette's own attribute rather than the
                  live one, so the swatches show what you would be switching
                  *to* instead of what is already on screen. */}
              <span className="thememenu__swatches" data-palette={option.key}>
                {PREVIEW.map(([state, { glyph, label }]) => (
                  <span
                    className="thememenu__swatch"
                    key={state}
                    title={label}
                    style={{
                      background: `rgb(var(--state-${state}-rgb) / var(--fill-mid))`,
                      borderColor: `rgb(var(--state-${state}-rgb))`,
                      color: `rgb(var(--state-${state}-rgb))`,
                    }}
                  >
                    {glyph}
                  </span>
                ))}
              </span>
            </button>
          ))}

          <p className="thememenu__note">
            Every state carries a glyph as well as a colour, so the picture stays readable in greyscale and
            in print.
          </p>
        </div>
      )}
    </div>
  );
}

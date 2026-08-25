import { Shuffle, Palette } from "lucide-react";
import { ALGO_MAP } from "../algorithms";
import { DISTRIBUTIONS } from "../utils/distributions.js";
import { MIN_LANES, MAX_LANES, SYNC_MODES } from "../hooks/useRace.js";
import { useIsMobile } from "../hooks/useMediaQuery.js";

export default function RaceSidebar({
  raceable,
  algos,
  onToggleAlgo,
  size,
  onSizeChange,
  distribution,
  onDistributionChange,
  distributionMeta,
  onShuffle,
  seed,
  syncMode,
  onSyncModeChange,
  showTags,
  onToggleTags,
  variants,
  onVariantChange,
}) {
  const isMobile = useIsMobile();
  const syncMeta = SYNC_MODES.find((m) => m.key === syncMode);

  return (
    <div className="panel sidebar">
      {!isMobile && <div className="label">RACE</div>}

      <div className="sidebar__section sidebar__section--first">
        <div className="label">
          LANES — {algos.length} OF {MAX_LANES}
        </div>
        <div className="algo-list">
          {raceable.map((key) => {
            const on = algos.includes(key);
            const locked = (on && algos.length <= MIN_LANES) || (!on && algos.length >= MAX_LANES);
            return (
              <button
                type="button"
                key={key}
                className={`algo-row ${on ? "active" : ""}`}
                onClick={() => onToggleAlgo(key)}
                disabled={locked}
                aria-pressed={on}
                title={
                  locked
                    ? on
                      ? `A race needs at least ${MIN_LANES} lanes`
                      : `A race holds at most ${MAX_LANES} lanes`
                    : ALGO_MAP[key].desc
                }
              >
                {ALGO_MAP[key].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar__section">
        <label className="label" htmlFor="race-dist">
          INPUT SHAPE
        </label>
        <select
          id="race-dist"
          className="text-input"
          value={distribution}
          onChange={(e) => onDistributionChange(e.target.value)}
        >
          {DISTRIBUTIONS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
        <p className="sidebar__note">{distributionMeta?.desc}</p>
      </div>

      <div className="sidebar__section">
        <label className="label" htmlFor="race-size">
          ARRAY SIZE — {size}
        </label>
        <input
          id="race-size"
          type="range"
          min={6}
          max={40}
          value={size}
          onChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
        />
        <button className="btn btn--block" onClick={onShuffle} title="Rebuild the input from a new seed (S)">
          <Shuffle size={13} /> NEW DATA
        </button>
        <p className="sidebar__note">
          Seed <span className="mono">{seed}</span> — the same seed always rebuilds the same array,
          so a shared link is the same race.
        </p>
      </div>

      <div className="sidebar__section">
        <div className="label">SYNC LANES</div>
        <div className="seg">
          {SYNC_MODES.map((mode) => (
            <button
              type="button"
              key={mode.key}
              className={`seg__btn ${syncMode === mode.key ? "active" : ""}`}
              onClick={() => onSyncModeChange(mode.key)}
              aria-pressed={syncMode === mode.key}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="sidebar__note">{syncMeta?.desc}</p>
      </div>

      <div className="sidebar__section">
        <div className="label">STABILITY</div>
        <button
          className={`btn btn--block-flat ${showTags ? "active" : ""}`}
          onClick={onToggleTags}
          aria-pressed={showTags}
        >
          <Palette size={13} /> {showTags ? "COLOURING BY ORIGIN" : "COLOUR BY ORIGIN"}
        </button>
        <p className="sidebar__note">
          Tints every bar by the index it started at. Pair it with the FEW UNIQUE or ALL EQUAL input
          shapes: equal values are identical as bars, so the colours are the only way to see which
          sorts kept tied elements in their original order.
        </p>
      </div>

      {algos
        .filter((key) => ALGO_MAP[key].variants?.length)
        .map((key) => (
          <div className="sidebar__section" key={key}>
            <div className="label">{ALGO_MAP[key].label.toUpperCase()}</div>
            {ALGO_MAP[key].variants.map((variant) => {
              const chosen = variants[key]?.[variant.key] ?? variant.default;
              const chosenMeta = variant.options.find((o) => o.key === chosen);
              return (
                <div key={variant.key}>
                  <label className="label label--tight" htmlFor={`v-${key}-${variant.key}`}>
                    {variant.label}
                  </label>
                  <select
                    id={`v-${key}-${variant.key}`}
                    className="text-input"
                    value={chosen}
                    onChange={(e) => onVariantChange(key, variant.key, e.target.value)}
                  >
                    {variant.options.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="sidebar__note">{chosenMeta?.desc}</p>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}

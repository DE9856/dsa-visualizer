import { Shuffle, Target, Palette } from "lucide-react";
import { SORT_KEYS, SEARCH_KEYS, ALGO_MAP } from "../algorithms";
import { DISTRIBUTIONS } from "../utils/distributions.js";
import { CUSTOM_DISTRIBUTION } from "../hooks/useVisualizer.js";
import { useIsMobile } from "../hooks/useMediaQuery.js";

export default function Sidebar({
  category,
  algo,
  onAlgoChange,
  size,
  onSizeChange,
  onShuffle,
  customInput,
  setCustomInput,
  onApplyCustom,
  meta,
  target,
  onRandomTarget,
  distribution,
  distributionMeta,
  onDistributionChange,
  variants,
  onVariantChange,
  showTags,
  onToggleTags,
}) {
  const keys = category === "sorting" ? SORT_KEYS : SEARCH_KEYS;
  // On a phone this sidebar only ever renders inside the sheet, whose header
  // already reads ALGORITHMS — repeating it twice looks like a mistake.
  const isMobile = useIsMobile();
  const isSorting = meta.category === "sorting";

  return (
    <div className="panel sidebar">
      {!isMobile && <div className="label">ALGORITHMS</div>}
      <div className="algo-list">
        {keys.map((key) => (
          <button
            type="button"
            key={key}
            className={`algo-row ${algo === key ? "active" : ""}`}
            onClick={() => onAlgoChange(key)}
            aria-pressed={algo === key}
          >
            {ALGO_MAP[key].label}
          </button>
        ))}
      </div>

      {(meta.variants || []).map((variant) => {
        const chosen = variants?.[algo]?.[variant.key] ?? variant.default;
        const chosenMeta = variant.options.find((o) => o.key === chosen);
        return (
          <div className="sidebar__section" key={variant.key}>
            <label className="label" htmlFor={`variant-${variant.key}`}>
              {variant.label}
            </label>
            <select
              id={`variant-${variant.key}`}
              className="text-input"
              value={chosen}
              onChange={(e) => onVariantChange(variant.key, e.target.value)}
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

      <div className="sidebar__section">
        <label className="label" htmlFor="input-shape">
          INPUT SHAPE
        </label>
        <select
          id="input-shape"
          className="text-input"
          value={distribution}
          onChange={(e) => onDistributionChange(e.target.value)}
        >
          {distribution === CUSTOM_DISTRIBUTION && (
            <option value={CUSTOM_DISTRIBUTION}>Custom (typed below)</option>
          )}
          {DISTRIBUTIONS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
        {distributionMeta && <p className="sidebar__note">{distributionMeta.desc}</p>}
      </div>

      <div className="sidebar__section">
        <label className="label" htmlFor="array-size">
          ARRAY SIZE — {size}
        </label>
        <input
          id="array-size"
          type="range"
          min={6}
          max={40}
          value={size}
          onChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
        />
        <button className="btn btn--block" onClick={onShuffle} title="New random array (S)">
          <Shuffle size={13} /> NEW ARRAY
        </button>
      </div>

      {isSorting && (
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
            Tints each bar by the index it started at. With the FEW UNIQUE or ALL EQUAL shapes the
            values are identical, so the colours are the only way to see whether tied elements came
            out in their original order.
          </p>
        </div>
      )}

      <div className="sidebar__section">
        <label className="label" htmlFor="custom-array">
          CUSTOM ARRAY
        </label>
        <input
          id="custom-array"
          type="text"
          className="text-input"
          placeholder="5, 12, 3, 8..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onApplyCustom()}
        />
        <button className="btn btn--block btn--tight" onClick={onApplyCustom}>
          APPLY
        </button>
      </div>

      {meta.category === "searching" && (
        <div className="sidebar__section">
          <div className="label">TARGET</div>
          <div className="target-value">{target === null ? "--" : target}</div>
          <div className="target-row">
            <button className="btn" onClick={() => onRandomTarget(true)}>
              <Target size={12} /> IN ARRAY
            </button>
            <button className="btn" onClick={() => onRandomTarget(false)}>
              MISS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

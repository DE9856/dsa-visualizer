import { Shuffle, Target } from "lucide-react";
import { SORT_KEYS, SEARCH_KEYS, ALGO_MAP } from "../algorithms";

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
}) {
  const keys = category === "sorting" ? SORT_KEYS : SEARCH_KEYS;

  return (
    <div className="panel sidebar">
      <div className="label">ALGORITHMS</div>
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

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
          <div
            key={key}
            className={`algo-row ${algo === key ? "active" : ""}`}
            onClick={() => onAlgoChange(key)}
          >
            {ALGO_MAP[key].label}
          </div>
        ))}
      </div>

      <div className="sidebar__section">
        <div className="label">ARRAY SIZE — {size}</div>
        <input
          type="range"
          min={6}
          max={40}
          value={size}
          onChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
        />
        <button className="btn" style={{ width: "100%", marginTop: 10 }} onClick={onShuffle}>
          <Shuffle size={13} /> NEW ARRAY
        </button>
      </div>

      <div className="sidebar__section">
        <div className="label">CUSTOM ARRAY</div>
        <input
          type="text"
          className="text-input"
          placeholder="5, 12, 3, 8..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
        />
        <button className="btn" style={{ width: "100%", marginTop: 6 }} onClick={onApplyCustom}>
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

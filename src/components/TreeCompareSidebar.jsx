import { Shuffle } from "lucide-react";
import { INSERT_ORDERS } from "../dataStructures/tree/compare.js";
import { MIN_KEYS, MAX_KEYS } from "../hooks/useTreeCompare.js";
import { useIsMobile } from "../hooks/useMediaQuery.js";

export default function TreeCompareSidebar({
  order,
  orderMeta,
  onOrderChange,
  size,
  onSizeChange,
  seed,
  onShuffle,
  keys,
}) {
  const isMobile = useIsMobile();

  return (
    <div className="panel sidebar">
      {!isMobile && <div className="label">BALANCE &amp; HEIGHT</div>}

      <div className="sidebar__section sidebar__section--first">
        <label className="label" htmlFor="tree-order">
          INSERTION ORDER
        </label>
        <select
          id="tree-order"
          className="text-input"
          value={order}
          onChange={(e) => onOrderChange(e.target.value)}
        >
          {INSERT_ORDERS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="sidebar__note">{orderMeta?.desc}</p>
      </div>

      <div className="sidebar__section">
        <label className="label" htmlFor="tree-size">
          KEYS — {size}
        </label>
        <input
          id="tree-size"
          type="range"
          min={MIN_KEYS}
          max={MAX_KEYS}
          value={size}
          onChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
        />
        <button className="btn btn--block" onClick={onShuffle} title="A fresh random order (S)">
          <Shuffle size={13} /> NEW RANDOM ORDER
        </button>
        <p className="sidebar__note">
          The canvases cap at {MAX_KEYS} keys because that is what three trees side by side can
          show legibly. Seed <span className="mono">{seed}</span> — only the random order uses it.
        </p>
      </div>

      <div className="sidebar__section">
        <div className="label">KEYS IN ORDER</div>
        <p className="sidebar__note mono">{keys.join(", ")}</p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "../data/categories.js";

export default function CategoryLanding({ onSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="landing">
      <div className="landing__header">
        <div className="landing__mark mono">&#9642;</div>
        <h1 className="landing__title mono">DSA://VISUALIZER</h1>
        <p className="landing__subtitle mono">choose a category to start visualizing</p>
      </div>

      <div className="landing__grid">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className={`landing__card ${hovered === cat.key ? "landing__card--active" : ""}`}
            style={{ "--accent": cat.accent }}
            onMouseEnter={() => setHovered(cat.key)}
            onMouseLeave={() => setHovered((h) => (h === cat.key ? null : h))}
          >
            <div className="landing__card-top">
              <span className="landing__card-label mono">{cat.label}</span>
              <span className="landing__card-dot" />
            </div>
            <p className="landing__card-blurb">{cat.blurb}</p>

            <div className="landing__card-items">
              {cat.items.map((item) => (
                <button
                  key={item.key}
                  className="landing__item-btn mono"
                  onClick={() => onSelect(item.key)}
                >
                  <span>{item.label}</span>
                  <ArrowRight size={14} />
                  <span className="landing__item-desc">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
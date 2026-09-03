import { useState } from "react";
import ThemeMenu from "./ThemeMenu.jsx";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { CATEGORIES } from "../data/categories.js";

export default function CategoryLanding({ onSelect, appearance }) {
  const [hovered, setHovered] = useState(null);

  // Every category starts closed, so the whole map of the app is one screen
  // rather than a page and a half of scrolling. The label, the blurb and the
  // count say what a card holds; opening one is what lists it. Kept as a set
  // rather than a single key because comparing two families side by side is a
  // reasonable thing to want, and an accordion that closes the last one for
  // you is not.
  const [openCategories, setOpenCategories] = useState(() => new Set());

  const toggleCategory = (key) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="landing">
      {appearance && (
        <div className="landing__appearance">
          <ThemeMenu
            theme={appearance.theme}
            palette={appearance.palette}
            contrast={appearance.contrast}
            onTheme={appearance.setTheme}
            onPalette={appearance.setPalette}
            onToggleContrast={appearance.toggleContrast}
          />
        </div>
      )}
      <div className="landing__header">
        <div className="landing__mark mono">&#9642;</div>
        <h1 className="landing__title mono">DSA://VISUALIZER</h1>
        <p className="landing__subtitle mono">choose a category to start visualizing</p>
      </div>

      <div className="landing__grid">
        {CATEGORIES.map((cat) => {
          const isOpen = openCategories.has(cat.key);
          return (
            <div
              key={cat.key}
              className={`landing__card ${hovered === cat.key ? "landing__card--active" : ""} ${
                isOpen ? "landing__card--open" : ""
              }`}
              style={{ "--accent": cat.accent }}
              onMouseEnter={() => setHovered(cat.key)}
              onMouseLeave={() => setHovered((h) => (h === cat.key ? null : h))}
            >
              {/* The whole head is the control, not a chevron off to one side:
                  on a closed card the head is nearly all of it, and a target
                  that size shouldn't need aiming at. */}
              <button
                type="button"
                className="landing__card-top"
                onClick={() => toggleCategory(cat.key)}
                aria-expanded={isOpen}
              >
                <span className="landing__card-label mono">{cat.label}</span>
                <span className="landing__card-meta">
                  <span className="landing__card-count mono">{cat.items.length}</span>
                  <span className="landing__card-dot" />
                  <span className="landing__card-chevron">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </span>
              </button>

              <p className="landing__card-blurb">{cat.blurb}</p>

              {isOpen && (
                <div className="landing__card-items">
                  {cat.items.map((item) => (
                    <button
                      key={item.key}
                      className="landing__item-btn mono"
                      onClick={() => onSelect(item.key)}
                    >
                      <span className="landing__item-head">
                        <span>{item.label}</span>
                        <ArrowRight size={14} />
                      </span>
                      <span className="landing__item-desc">{item.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* A plain anchor, not a view: the notice is a standalone page under
          public/, so it survives the app failing to load — which is exactly
          when someone might want to read what the site does. */}
      <footer className="landing__footer mono">
        <a href="/privacy.html">PRIVACY</a>
        <span aria-hidden="true">&middot;</span>
        <a href="/terms.html">TERMS</a>
      </footer>
    </div>
  );
}

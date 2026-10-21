import { useEffect, useState } from "react";
import ThemeMenu from "./ThemeMenu.jsx";
import BrandMark from "./BrandMark.jsx";
import CategoryGlyph from "./CategoryGlyph.jsx";
import LiveTrace from "./LiveTrace.jsx";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CATEGORIES } from "../data/categories.js";

// Counted from the registry, so the line under the title can never drift from
// what the cards below it actually hold.
const VIEW_COUNT = CATEGORIES.reduce((n, cat) => n + cat.items.length, 0);

// The family with the most topics takes two columns. Eleven cards on a
// three-column grid otherwise leave one orphan in the last row; one double
// card makes twelve cells, which close on three columns and on two.
const WIDE_KEY = CATEGORIES.reduce((a, b) => (b.items.length > a.items.length ? b : a)).key;

// The intro — cards rising in, each family's drawing traced like a beam —
// plays once per page load. This screen is passed through between every
// topic, and an entrance on each return would be a wait, not a welcome.
let introPlayed = false;

export default function CategoryLanding({ onSelect, appearance }) {
  const [intro] = useState(() => !introPlayed);
  // Marked in an effect, not during render: StrictMode renders twice, and the
  // second render would otherwise find the flag already set.
  useEffect(() => {
    introPlayed = true;
  }, []);

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

  /**
   * Anywhere on the card toggles it — the blurb, the padding, the gap between
   * topics. The head stays a real button underneath this, because that is what
   * carries the keyboard and the `aria-expanded` state; this only widens what a
   * mouse may hit, and so deliberately adds no tab stop of its own.
   */
  const handleCardClick = (event, key) => {
    // A topic inside an open card is the way *out* of this screen, not a
    // toggle. Without this, choosing one would collapse the card and navigate
    // at the same time.
    if (event.target.closest(".landing__item-btn")) return;
    // The head fires its own onClick and then bubbles to here; handling it
    // twice would toggle it straight back.
    if (event.target.closest(".landing__card-top")) return;
    // A click that ends a text selection is the end of a drag, not a press.
    if (window.getSelection()?.toString()) return;
    toggleCategory(key);
  };

  return (
    <div className={`landing ${intro ? "landing--intro" : ""}`}>
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
      <header className="landing__header">
        <div className="landing__intro">
          <h1 className="landing__title mono">
            <BrandMark size={26} className="landing__mark" />
            DSA://VISUALIZER
          </h1>
          <p className="landing__subtitle">
            Watch data structures and algorithms work one step at a time — forwards, backwards and
            side by side.
          </p>
          <p className="landing__meta mono">
            {VIEW_COUNT} views · {CATEGORIES.length} families · runs entirely in your browser
          </p>
        </div>
        <LiveTrace onOpen={() => onSelect("sorting")} />
      </header>

      <div className="landing__grid">
        {CATEGORIES.map((cat, index) => {
          const isOpen = openCategories.has(cat.key);
          const count = cat.items.length;
          return (
            <div
              key={cat.key}
              className={`landing__card ${isOpen ? "landing__card--open" : ""} ${
                cat.key === WIDE_KEY ? "landing__card--wide" : ""
              }`}
              style={{ "--accent": cat.accent, "--i": index }}
              onClick={(event) => handleCardClick(event, cat.key)}
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
                <span className="landing__card-row">
                  <CategoryGlyph category={cat.key} />
                  <span className="landing__card-meta">
                    <span className="landing__card-count mono">
                      {count} {count === 1 ? "view" : "views"}
                    </span>
                    <ChevronDown size={15} className="landing__card-chevron" />
                  </span>
                </span>
                <span className="landing__card-label mono">{cat.label}</span>
              </button>

              <p className="landing__card-blurb">{cat.blurb}</p>

              {/* What is inside, readable without opening anything. Opening the
                  card replaces it with the same topics as buttons. */}
              {!isOpen && (
                <p className="landing__card-topics">
                  {cat.items.map((item) => item.label).join(" · ")}
                </p>
              )}

              {isOpen && (
                <div className="landing__card-items">
                  {cat.items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="landing__item-btn"
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
      <footer className="landing__footer">
        <a href="/privacy.html">Privacy</a>
        <span aria-hidden="true">&middot;</span>
        <a href="/terms.html">Terms</a>
      </footer>
    </div>
  );
}

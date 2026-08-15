import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X, Home } from "lucide-react";
import { CATEGORIES } from "../data/categories.js";
import { useIsMobile } from "../hooks/useMediaQuery.js";
import ShareButton from "./ShareButton.jsx";

export default function TopBar({ category, onCategoryChange, onGoHome, shareUrl }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const rootRef = useRef(null);
  const isMobile = useIsMobile();

  const activeCategory = CATEGORIES.find((cat) => cat.items.some((item) => item.key === category));
  const activeItem = activeCategory?.items.find((item) => item.key === category);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setNavOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // The two variants have different open state; leaving one open while the
  // other renders would strand a menu off-screen.
  useEffect(() => {
    setOpenMenu(null);
    setNavOpen(false);
  }, [isMobile]);

  const toggleMenu = (key) => {
    setOpenMenu((prev) => (prev === key ? null : key));
  };

  const selectItem = (item) => {
    onCategoryChange(item.key);
    setOpenMenu(null);
    setNavOpen(false);
  };

  // On a phone the row of dropdowns doesn't fit, so navigation moves into a
  // single full-width sheet — one tap to open, one tap to pick a topic.
  if (isMobile) {
    return (
      <div className="topbar topbar--mobile" ref={rootRef}>
        <div className="topbar__title" onClick={onGoHome}>
          <span className="topbar__mark">&#9642;</span>
          <h1 className="mono">DSA://VIS</h1>
          {activeItem && <span className="topbar__now mono">{activeItem.label}</span>}
        </div>

        <button
          className={`btn icon ${navOpen ? "active" : ""}`}
          onClick={() => setNavOpen((o) => !o)}
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
        >
          {navOpen ? <X size={17} /> : <Menu size={17} />}
        </button>

        {navOpen && (
          <>
            <button className="sheet__backdrop" onClick={() => setNavOpen(false)} aria-label="Close menu" />
            <nav className="topbar__nav-sheet" aria-label="Topics">
              {/* Actions first — the topic list below is long enough to bury
                  anything that sits under it. */}
              {shareUrl && (
                <ShareButton url={shareUrl} label="SHARE THIS SETUP" className="btn--block-flat topbar__nav-share" />
              )}

              {CATEGORIES.map((cat) => (
                <div className="topbar__nav-group" key={cat.key} style={{ "--accent": cat.accent }}>
                  <div className="topbar__nav-label mono">{cat.label}</div>
                  {cat.items.map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      className={`topbar__nav-item ${category === item.key ? "active" : ""}`}
                      onClick={() => selectItem(item)}
                    >
                      <span className="topbar__nav-item-label mono">{item.label}</span>
                      <span className="topbar__nav-item-desc">{item.desc}</span>
                    </button>
                  ))}
                </div>
              ))}

              {onGoHome && (
                <button
                  type="button"
                  className="btn btn--block-flat topbar__nav-home"
                  onClick={() => {
                    setNavOpen(false);
                    onGoHome();
                  }}
                >
                  <Home size={14} /> ALL CATEGORIES
                </button>
              )}
            </nav>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="topbar" ref={rootRef}>
      <div
        className={`topbar__title ${onGoHome ? "topbar__title--clickable" : ""}`}
        onClick={onGoHome}
        title={onGoHome ? "Back to category select" : undefined}
      >
        <span className="topbar__mark">&#9642;</span>
        <h1 className="mono">DSA://VISUALIZER</h1>
      </div>
      <div className="topbar__tabs">
        {CATEGORIES.map((cat) => {
          const isActiveCategory = activeCategory?.key === cat.key;
          const catItem = cat.items.find((item) => item.key === category);
          const isOpen = openMenu === cat.key;
          return (
            <div className="topbar__dropdown" key={cat.key}>
              <button
                className={`btn topbar__category ${isActiveCategory ? "active" : ""}`}
                onClick={() => toggleMenu(cat.key)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
              >
                {cat.label}
                {isActiveCategory && catItem && (
                  <span className="topbar__category-sub">/ {catItem.label}</span>
                )}
                <ChevronDown size={13} className={`topbar__chevron ${isOpen ? "open" : ""}`} />
              </button>
              {isOpen && (
                <div className="topbar__menu" role="menu">
                  {cat.items.map((item) => (
                    <button
                      type="button"
                      role="menuitem"
                      key={item.key}
                      className={`topbar__menu-item ${category === item.key ? "active" : ""}`}
                      onClick={() => selectItem(item)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {shareUrl && <ShareButton url={shareUrl} className="topbar__share" />}
    </div>
  );
}

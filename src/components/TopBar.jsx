import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORIES } from "../data/categories.js";

export default function TopBar({ category, onCategoryChange, onGoHome }) {
  const [openMenu, setOpenMenu] = useState(null);
  const rootRef = useRef(null);

  const activeCategory = CATEGORIES.find((cat) => cat.items.some((item) => item.key === category));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleMenu = (key) => {
    setOpenMenu((prev) => (prev === key ? null : key));
  };

  const selectItem = (item) => {
    onCategoryChange(item.key);
    setOpenMenu(null);
  };

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
          const activeItem = cat.items.find((item) => item.key === category);
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
                {isActiveCategory && activeItem && (
                  <span className="topbar__category-sub">/ {activeItem.label}</span>
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
    </div>
  );
}
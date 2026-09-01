import { useCallback, useEffect, useState } from "react";

/**
 * The three appearance axes, stored and applied to <html> as attributes so
 * the whole of `index.css` can key off them and nothing has to be threaded
 * through the component tree.
 *
 * They are separate settings because they answer separate questions. Someone
 * reading in daylight wants light; someone who needs stronger edges wants
 * high contrast on whichever surface they already chose; someone with a
 * colour vision deficiency wants the state hues re-pointed regardless of
 * either. Folding contrast into the theme list would have made a light
 * high-contrast mode unreachable.
 *
 * Appearance is deliberately kept out of the shareable link: it is a property
 * of the person reading, not of the run, and a link that silently forced its
 * author's theme on everyone who opened it would be a bug.
 */

const STORE = "dsa-viz:appearance";

export const THEMES = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

export const PALETTES = [
  { key: "default", label: "Default", desc: "The original hues." },
  {
    key: "safe",
    label: "Colour-blind safe",
    desc: "Okabe-Ito, separable under the common deficiencies.",
  },
];

const DEFAULTS = { theme: "system", contrast: "normal", palette: "default" };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
    return {
      theme: THEMES.some((t) => t.key === saved.theme) ? saved.theme : DEFAULTS.theme,
      contrast: saved.contrast === "high" ? "high" : DEFAULTS.contrast,
      palette: PALETTES.some((p) => p.key === saved.palette) ? saved.palette : DEFAULTS.palette,
    };
  } catch {
    // Private mode, blocked storage, or something hand-edited into nonsense.
    return DEFAULTS;
  }
}

const DARK_BACKGROUND = "#0b0d12";
const LIGHT_BACKGROUND = "#f2f3f6";

export function useTheme() {
  const [appearance, setAppearance] = useState(load);
  // Only meaningful while the theme is "system", but tracked always so
  // switching back to system doesn't need a fresh read.
  const [systemDark, setSystemDark] = useState(
    () => !window.matchMedia || window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = appearance.theme === "system" ? (systemDark ? "dark" : "light") : appearance.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    root.setAttribute("data-palette", appearance.palette);
    if (appearance.contrast === "high") root.setAttribute("data-contrast", "high");
    else root.removeAttribute("data-contrast");

    // The browser's own chrome — the address bar on a phone, the scrollbars,
    // form controls — reads these rather than the stylesheet.
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", resolvedTheme === "light" ? LIGHT_BACKGROUND : DARK_BACKGROUND);
    const scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme) scheme.setAttribute("content", resolvedTheme);

    try {
      localStorage.setItem(STORE, JSON.stringify(appearance));
    } catch {
      // Not worth telling anyone about; the setting just won't outlive the tab.
    }
  }, [appearance, resolvedTheme]);

  const set = useCallback((patch) => setAppearance((prev) => ({ ...prev, ...patch })), []);

  return {
    ...appearance,
    resolvedTheme,
    setTheme: (theme) => set({ theme }),
    setPalette: (palette) => set({ palette }),
    toggleContrast: () => set({ contrast: appearance.contrast === "high" ? "normal" : "high" }),
  };
}

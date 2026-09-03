import { useEffect, useState } from "react";

/** Phone-sized layout: the sidebar becomes a bottom sheet below this width. */
export const MOBILE_QUERY = "(max-width: 760px)";

/** Fingers rather than a cursor: the gestures differ, the layout need not. */
export const TOUCH_QUERY = "(pointer: coarse)";

/**
 * Subscribes to a CSS media query so components can change *structure*, not
 * just styling — a bottom sheet and a portrait graph layout can't be built
 * from CSS alone.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    // Re-read on mount: the query may have changed before the listener existed.
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY);
}

/**
 * Whether the primary pointer is a finger. Separate from `useIsMobile` on
 * purpose: the sheet is about how much room there is, while gesture wording is
 * about what is doing the pointing — a narrow desktop window is not a phone,
 * and a touchscreen laptop is not a desktop.
 */
export function useIsTouch() {
  return useMediaQuery(TOUCH_QUERY);
}

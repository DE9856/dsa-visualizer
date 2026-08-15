import { useEffect, useState } from "react";

/** Phone-sized layout: the sidebar becomes a bottom sheet below this width. */
export const MOBILE_QUERY = "(max-width: 760px)";

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

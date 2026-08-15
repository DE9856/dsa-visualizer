import { useEffect, useRef } from "react";

export const SHORTCUTS = [
  { keys: "Space", desc: "play / pause" },
  { keys: "← →", desc: "step back / forward" },
  { keys: "Home / End", desc: "jump to first / last step" },
  { keys: "R", desc: "reset to first step" },
  { keys: "S", desc: "shuffle / new data" },
  { keys: "?", desc: "toggle this help" },
];

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/**
 * Global transport shortcuts. Handlers are read through a ref so passing fresh
 * closures every render never re-binds the listener.
 */
export function useKeyboardShortcuts(handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (ref.current.enabled === false) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target;
      // Let inputs keep their own arrow/space behaviour (sliders, text fields).
      if (isTypingTarget(target)) return;
      // A focused button already answers to Space/Enter natively.
      const onButton = target && (target.tagName === "BUTTON" || target.closest?.("button"));

      const h = ref.current;
      let handled = true;

      switch (e.key) {
        case " ":
          if (onButton) return;
          h.onTogglePlay?.();
          break;
        case "ArrowLeft":
          h.onStepBack?.();
          break;
        case "ArrowRight":
          h.onStepForward?.();
          break;
        case "Home":
          h.onFirst?.();
          break;
        case "End":
          h.onLast?.();
          break;
        case "r":
        case "R":
          h.onReset?.();
          break;
        case "s":
        case "S":
          h.onShuffle?.();
          break;
        case "?":
          h.onToggleHelp?.();
          break;
        default:
          handled = false;
      }

      if (handled) e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

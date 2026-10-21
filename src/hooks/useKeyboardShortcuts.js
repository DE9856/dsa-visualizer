import { useEffect, useRef } from "react";

export const SHORTCUTS = [
  { keys: "Space", desc: "play / pause" },
  { keys: "← →", desc: "step back / forward" },
  { keys: "Home / End", desc: "jump to first / last step" },
  { keys: "R", desc: "reset to first step" },
  { keys: "S", desc: "shuffle / new data" },
  { keys: "Ctrl+Z / Ctrl+Y", desc: "undo / redo the last edit" },
  { keys: "Ctrl+C / Ctrl+V", desc: "copy / paste (graph view)" },
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

      const target = e.target;
      // Let inputs keep their own arrow/space behaviour (sliders, text fields)
      // and, just as importantly, their own undo stack.
      if (isTypingTarget(target)) return;

      // Undo/redo are the one place a modifier is wanted. Ctrl+Shift+Z is
      // accepted alongside Ctrl+Y because the two conventions split roughly
      // evenly across platforms and nobody should have to remember which.
      if (e.ctrlKey || e.metaKey) {
        if (e.altKey) return;
        const key = e.key.toLowerCase();
        if (key === "z" && !e.shiftKey) {
          ref.current.onUndo?.();
          e.preventDefault();
        } else if (key === "y" || (key === "z" && e.shiftKey)) {
          ref.current.onRedo?.();
          e.preventDefault();
        }
        // Ctrl+C / Ctrl+V are deliberately not handled here — the browser's
        // own copy/paste events carry the clipboard with them, and reaching
        // for it any other way needs a permission prompt.
        return;
      }
      if (e.altKey) return;
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

    // Copy and paste ride the browser's own events rather than a Ctrl+C/Ctrl+V
    // keydown: the event hands over the clipboard directly, where reading it
    // any other way means asking for the clipboard-read permission.
    const onCopy = (e) => {
      if (ref.current.enabled === false) return;
      if (isTypingTarget(e.target)) return;
      // Someone copying selected text on the page means that, not this.
      if (!window.getSelection?.()?.isCollapsed) return;
      const text = ref.current.onCopy?.();
      if (typeof text !== "string" || !text) return;
      e.clipboardData?.setData("text/plain", text);
      e.preventDefault();
    };

    const onPaste = (e) => {
      if (ref.current.enabled === false) return;
      if (isTypingTarget(e.target)) return;
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (ref.current.onPaste?.(text)) e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, []);
}

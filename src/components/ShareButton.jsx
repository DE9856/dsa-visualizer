import { useEffect, useRef, useState } from "react";
import { Link2, Check } from "lucide-react";

/**
 * Copies the link that reproduces the current setup. The clipboard needs a
 * secure context and the user's permission, so when it isn't available the
 * link is shown in a selected field to copy by hand instead.
 */
export default function ShareButton({ url, label = "SHARE", className = "" }) {
  const [state, setState] = useState("idle"); // "idle" | "copied" | "manual"
  const inputRef = useRef(null);

  useEffect(() => {
    if (state !== "copied") return;
    const id = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(id);
  }, [state]);

  // Any change of setup makes an already-copied link stale.
  useEffect(() => {
    setState("idle");
  }, [url]);

  useEffect(() => {
    if (state === "manual") inputRef.current?.select();
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("manual");
    }
  };

  return (
    <div className="share">
      <button
        className={`btn ${className} ${state === "copied" ? "active" : ""}`}
        onClick={copy}
        title="Copy a link to this setup"
      >
        {state === "copied" ? <Check size={13} /> : <Link2 size={13} />}
        {state === "copied" ? "COPIED" : label}
      </button>

      {state === "manual" && (
        <div className="share__manual">
          <div className="label">COPY THIS LINK</div>
          <input
            ref={inputRef}
            className="text-input mono"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
          />
          <button className="btn btn--block-flat btn--tight" onClick={() => setState("idle")}>
            DONE
          </button>
        </div>
      )}
    </div>
  );
}

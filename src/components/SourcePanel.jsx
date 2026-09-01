import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { LANGUAGES, hasSource, loadSource } from "../data/sourceCode/index.js";

const PSEUDO = "pseudo";
const REMEMBERED = "dsa-viz:code-tab";

/**
 * Remembering the tab is the whole point of persisting it: someone reading
 * the Java is reading the Java for every algorithm they click through, and
 * having it snap back to pseudocode each time would be the one annoying thing
 * about the panel. Storage can throw (private mode, blocked cookies), so the
 * value is only ever a nice-to-have.
 */
function rememberedTab() {
  try {
    const saved = localStorage.getItem(REMEMBERED);
    if (saved === PSEUDO || LANGUAGES.some((l) => l.key === saved)) return saved;
  } catch {
    /* no storage — pseudocode it is */
  }
  return PSEUDO;
}

function remember(tab) {
  try {
    localStorage.setItem(REMEMBERED, tab);
  } catch {
    /* not worth telling anyone about */
  }
}

/**
 * The code block beside the picture: pseudocode, plus a real implementation in
 * each of five languages, with the line the current step is executing lit up
 * in whichever is showing.
 *
 * Every listing's lines are tagged with the pseudocode index they implement
 * (see `data/sourceCode/index.js`), so the highlight is the same `step.line`
 * in every tab — the C and the Python light up on the same step, at whatever
 * number of lines each of them needs to say it.
 */
export default function SourcePanel({ algoKey, pseudocode, activeLine, codeLabel = "PSEUDOCODE" }) {
  const offersSource = hasSource(algoKey);
  const [tab, setTab] = useState(() => (offersSource ? rememberedTab() : PSEUDO));
  // Keyed by algorithm, because a listing that arrived for the algorithm the
  // user just clicked away from must not be rendered against this one's steps.
  const [loaded, setLoaded] = useState(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  // Listings are per-algorithm and arrive asynchronously, so a slow chunk for
  // an algorithm the user has already clicked away from must not land.
  useEffect(() => {
    if (!offersSource || tab === PSEUDO) return;
    let live = true;
    setFailed(false);
    loadSource(algoKey)
      .then((listings) => live && setLoaded({ key: algoKey, listings: listings || {} }))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [algoKey, tab, offersSource]);

  // Switching algorithm or language makes a "copied" tick a lie about what is
  // on the clipboard.
  useEffect(() => {
    setCopied(false);
  }, [algoKey, tab]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const listings = loaded?.key === algoKey ? loaded.listings : null;
  const listing = tab === PSEUDO ? null : listings?.[tab];
  const pending = tab !== PSEUDO && !listings && !failed;

  const rows =
    tab === PSEUDO
      ? pseudocode.map((text, i) => ({ text, tag: i }))
      : listing?.lines || [];

  const copy = async () => {
    const text = tab === PSEUDO ? pseudocode.join("\n") : listing?.text;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // No clipboard permission (or no secure context): select the code so
      // the browser's own copy still works.
      const node = codeRef.current;
      if (!node) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  return (
    <div className="info__code">
      <div className="source__bar">
        {offersSource ? (
          <div className="source__tabs" role="tablist" aria-label="Code language">
            <button
              role="tab"
              aria-selected={tab === PSEUDO}
              className={`source__tab ${tab === PSEUDO ? "is-active" : ""}`}
              onClick={() => {
                setTab(PSEUDO);
                remember(PSEUDO);
              }}
            >
              {codeLabel}
            </button>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.key}
                role="tab"
                aria-selected={tab === lang.key}
                className={`source__tab ${tab === lang.key ? "is-active" : ""}`}
                onClick={() => {
                  setTab(lang.key);
                  remember(lang.key);
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="label">{codeLabel}</div>
        )}

        <button
          className={`btn source__copy ${copied ? "active" : ""}`}
          onClick={copy}
          disabled={pending || failed}
          title="Copy this code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>

      <div className="source__code" ref={codeRef}>
        {pending && <div className="info__code-line source__note">Loading…</div>}
        {failed && (
          <div className="info__code-line source__note">Couldn&apos;t load this code — check your connection.</div>
        )}
        {!pending && !failed && tab !== PSEUDO && !listing && (
          <div className="info__code-line source__note">No {tab} listing for this algorithm yet.</div>
        )}
        {rows.map((row, i) => (
          <div
            key={i}
            className={`info__code-line ${row.tag !== null && row.tag === activeLine ? "is-active" : ""}`}
            aria-current={row.tag !== null && row.tag === activeLine ? "step" : undefined}
          >
            {row.text || "\u00A0"}
          </div>
        ))}
      </div>
    </div>
  );
}

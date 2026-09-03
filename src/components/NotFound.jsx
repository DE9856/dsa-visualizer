import { ArrowLeft } from "lucide-react";
import ThemeMenu from "./ThemeMenu.jsx";

// Enough of the hash to recognise a link by, short enough that a pasted essay
// can't stretch the page. React renders it as text and never as markup, so a
// hand-crafted hash is inert here.
const MAX_SHOWN = 90;

/**
 * Where a link that names nothing lands. It shares the landing page's shell —
 * same background, same appearance menu — because it *is* the landing page
 * with an explanation on it: the one useful thing to do from here is start
 * over, and that is one button away.
 */
export default function NotFound({ requested, onHome, appearance }) {
  const shown = requested && requested.length > MAX_SHOWN ? `${requested.slice(0, MAX_SHOWN)}…` : requested;

  return (
    <div className="landing landing--message">
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

      <div className="notfound">
        <div className="notfound__code mono">404</div>
        <h1 className="notfound__title mono">NOTHING TO VISUALIZE HERE</h1>
        <p className="notfound__blurb">
          This link points at a view the visualizer doesn&rsquo;t have. It was probably cut short on its
          way here &mdash; a shared link carries its whole setup in the address, so losing the end of one
          is enough to break it.
        </p>

        {shown && (
          <div className="notfound__asked">
            <span className="notfound__asked-label mono">ASKED FOR</span>
            {/* The full text in the tooltip, so a truncated one is still
                recoverable by someone trying to work out what went wrong. */}
            <code className="notfound__asked-value mono" title={`#${requested}`}>
              #{shown}
            </code>
          </div>
        )}

        <button className="btn notfound__home" onClick={onHome}>
          <ArrowLeft size={14} /> PICK A TOPIC INSTEAD
        </button>
      </div>
    </div>
  );
}

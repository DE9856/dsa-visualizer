/**
 * A small drawing of what each family actually looks like on the canvas — the
 * bars a sort moves, the tree a rotation reshapes, the table a DP fills — so a
 * card is recognised by its structure before its name is read. Each is drawn
 * in the card's accent with the same stroke, on one 64×28 grid, and one mark
 * per drawing is filled to show where the action is, the way a run highlights
 * the element it is working on.
 */
const W = 64;
const H = 28;

const DRAWINGS = {
  arrays: (
    <>
      {[10, 18, 7, 22, 14, 25, 12].map((h, i) => (
        <rect
          key={i}
          x={2 + i * 9}
          y={H - 1 - h}
          width={6}
          height={h}
          rx={1.5}
          className={i === 3 || i === 4 ? "glyph__on" : undefined}
        />
      ))}
    </>
  ),
  trees: (
    <>
      <path d="M32 6L18 15M32 6L46 15M18 15L11 23M18 15L25 23M46 15L53 23" />
      <circle cx={32} cy={5} r={3.2} className="glyph__on" />
      <circle cx={18} cy={15} r={3} />
      <circle cx={46} cy={15} r={3} />
      <circle cx={11} cy={23} r={2.6} />
      <circle cx={25} cy={23} r={2.6} />
      <circle cx={53} cy={23} r={2.6} />
    </>
  ),
  graphs: (
    <>
      <path d="M8 20L22 6L40 10L56 5M22 6L28 22L40 10M28 22L50 22L56 5" />
      <circle cx={8} cy={20} r={3} />
      <circle cx={22} cy={6} r={3} className="glyph__on" />
      <circle cx={40} cy={10} r={3} />
      <circle cx={28} cy={22} r={3} />
      <circle cx={50} cy={22} r={3} />
      <circle cx={56} cy={5} r={3} />
    </>
  ),
  matrices: (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const r = Math.floor(i / 6);
        const c = i % 6;
        const on = i === 1 || i === 9;
        return (
          <rect
            key={i}
            x={4 + c * 10}
            y={3 + r * 12}
            width={8}
            height={10}
            rx={1.5}
            className={on ? "glyph__on" : "glyph__faint"}
          />
        );
      })}
    </>
  ),
  linkedlists: (
    <>
      {[2, 24, 46].map((x, i) => (
        <rect key={x} x={x} y={8} width={14} height={12} rx={2} className={i === 1 ? "glyph__on" : undefined} />
      ))}
      <path d="M16 14H23M20.5 11.5L23 14L20.5 16.5M38 14H45M42.5 11.5L45 14L42.5 16.5" />
      <path d="M60 14H62" />
    </>
  ),
  stacksqueues: (
    <>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={2} y={22 - i * 6} width={28} height={4.5} rx={1.5} className={i === 3 ? "glyph__on" : undefined} />
      ))}
      <path d="M37 5V12M34 9L37 12L40 9" />
    </>
  ),
  hashing: (
    <>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={2} y={2 + i * 6.5} width={12} height={5} rx={1.5} className={i === 2 ? "glyph__on" : "glyph__faint"} />
      ))}
      <path d="M14 17.5H22" />
      <rect x={22} y={15} width={10} height={5} rx={1.5} />
      <path d="M32 17.5H40" />
      <rect x={40} y={15} width={10} height={5} rx={1.5} className="glyph__on" />
    </>
  ),
  dp: (
    <>
      {Array.from({ length: 15 }, (_, i) => {
        const r = Math.floor(i / 5);
        const c = i % 5;
        // The path a traceback walks: down the diagonal to the corner.
        const on = (r === 0 && c === 0) || (r === 1 && c === 1) || (r === 1 && c === 2) || (r === 2 && c === 3) || (r === 2 && c === 4);
        return (
          <rect
            key={i}
            x={2 + c * 10}
            y={1 + r * 9}
            width={8}
            height={7.5}
            rx={1.5}
            className={on ? "glyph__on" : "glyph__faint"}
          />
        );
      })}
    </>
  ),
  strings: (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={3 + i * 10} y={11} width={8} height={10} rx={1.5} className={i >= 2 && i <= 4 ? "glyph__on" : undefined} />
      ))}
      <path d="M23 6H51M23 4V8M51 4V8" />
    </>
  ),
  backtracking: (
    <>
      <path d="M32 5L18 15M32 5L46 15M18 15L12 24M18 15L24 24" />
      <path d="M46 15L52 24" className="glyph__cut" />
      <path d="M49.5 18.5L54.5 23.5M54.5 18.5L49.5 23.5" />
      <circle cx={32} cy={5} r={3} />
      <circle cx={18} cy={15} r={3} />
      <circle cx={46} cy={15} r={3} />
      <circle cx={12} cy={24} r={2.6} />
      <circle cx={24} cy={24} r={2.6} className="glyph__on" />
    </>
  ),
  greedy: (
    <>
      <path d="M4 25H60" className="glyph__faint" />
      <rect x={4} y={16} width={16} height={4.5} rx={1.5} className="glyph__on" />
      <rect x={14} y={9} width={22} height={4.5} rx={1.5} />
      <rect x={24} y={16} width={14} height={4.5} rx={1.5} className="glyph__on" />
      <rect x={34} y={2} width={18} height={4.5} rx={1.5} />
      <rect x={42} y={16} width={16} height={4.5} rx={1.5} className="glyph__on" />
    </>
  ),
};

export default function CategoryGlyph({ category }) {
  const drawing = DRAWINGS[category];
  if (!drawing) return null;
  return (
    <svg
      className="glyph"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      focusable="false"
    >
      {drawing}
    </svg>
  );
}

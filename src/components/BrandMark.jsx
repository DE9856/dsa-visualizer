/**
 * The product's mark: a short trace on the instrument's screen, a level line
 * that steps up, holds, and settles — what a single run looks like from the
 * outside. Drawn rather than borrowed from a font glyph so it keeps its shape
 * and weight at every size and in every theme.
 */
export default function BrandMark({ size = 18, className = "" }) {
  return (
    <svg
      className={`brand-mark ${className}`}
      width={size}
      height={Math.round(size * 0.78)}
      viewBox="0 0 18 14"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 11H5V3H9.5V11H12.5V7H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

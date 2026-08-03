// Formats a single term as a string, e.g. (5, 3) -> "5x^3", (-1, 1) -> "-x",
// (7, 0) -> "7". Sign is baked into the string.
export function formatTerm(coeff, exp) {
  const sign = coeff < 0 ? "-" : "";
  const abs = Math.abs(coeff);

  if (exp === 0) return `${sign}${abs}`;

  const coeffStr = abs === 1 ? "" : `${abs}`;
  const varStr = exp === 1 ? "x" : `x^${exp}`;
  return `${sign}${coeffStr}${varStr}`;
}

// Formats a full list of {coeff, exp} terms as a human-readable polynomial,
// e.g. "4x^3 + 3x^2 - 5x + 7". Terms are shown highest exponent first and
// zero-coefficient terms are dropped.
export function formatPolynomial(terms) {
  const sorted = (terms || [])
    .filter((t) => t.coeff !== 0)
    .slice()
    .sort((a, b) => b.exp - a.exp);

  if (sorted.length === 0) return "0";

  return sorted
    .map((t, i) => {
      const formatted = formatTerm(t.coeff, t.exp);
      if (i === 0) return formatted;
      return t.coeff < 0 ? `- ${formatted.slice(1)}` : `+ ${formatted}`;
    })
    .join(" ");
}

// Parses a polynomial expression string, e.g. "4x^3 + 3x^2 - 5x + 7" or
// "3:2, 2:1, 5:0" (coeff:exp pairs), into a normalized, sorted array of
// { coeff, exp } terms with like terms combined and zero terms dropped.
export function parsePolynomial(input) {
  if (!input || !input.trim()) return [];

  const raw = input.trim();
  const terms = raw.includes(":") ? parseCoeffExpPairs(raw) : parseExpression(raw);

  const byExponent = new Map();
  for (const { coeff, exp } of terms) {
    if (Number.isNaN(coeff) || Number.isNaN(exp)) continue;
    byExponent.set(exp, (byExponent.get(exp) || 0) + coeff);
  }

  return [...byExponent.entries()]
    .filter(([, coeff]) => coeff !== 0)
    .sort((a, b) => b[0] - a[0])
    .map(([exp, coeff]) => ({ coeff, exp }));
}

// "3:2, 2:1, 5:0" -> [{coeff:3, exp:2}, {coeff:2, exp:1}, {coeff:5, exp:0}]
function parseCoeffExpPairs(input) {
  return input
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [c, e] = pair.split(":").map((s) => s.trim());
      return { coeff: parseFloat(c), exp: parseInt(e, 10) || 0 };
    });
}

// "4x^3 + 3x^2 - 5x + 7" -> [{coeff:4, exp:3}, {coeff:3, exp:2}, ...]
function parseExpression(input) {
  const cleaned = input.replace(/\s+/g, "");
  const rawTerms = cleaned.match(/[+-]?[^+-]+/g) || [];

  return rawTerms.map((chunk) => {
    let sign = 1;
    let t = chunk;
    if (t[0] === "+") t = t.slice(1);
    else if (t[0] === "-") {
      sign = -1;
      t = t.slice(1);
    }

    if (t.includes("x")) {
      const [coeffPart, expPart] = t.split("x");
      const coeff = coeffPart === "" ? 1 : parseFloat(coeffPart);
      const exp = expPart && expPart.startsWith("^") ? parseInt(expPart.slice(1), 10) : 1;
      return { coeff: sign * coeff, exp };
    }

    return { coeff: sign * (parseFloat(t) || 0), exp: 0 };
  });
}

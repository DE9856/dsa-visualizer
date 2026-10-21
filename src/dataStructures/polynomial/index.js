import { addPolynomials } from "./addPolynomials";
import { multiplyPolynomials } from "./multiplyPolynomials";
import { evaluatePolynomial } from "./evaluatePolynomial";

export const POLY_OPERATIONS = [addPolynomials, multiplyPolynomials, evaluatePolynomial];

export const POLY_OP_MAP = Object.fromEntries(POLY_OPERATIONS.map((op) => [op.key, op]));

// Determines the sidebar section ordering / headings, same pattern as
// LL_GROUPS for the regular linked-list operations.
export const POLY_GROUPS = [
  { key: "combine", label: "Combine" },
  { key: "query", label: "Query" },
];

export { formatTerm, formatPolynomial, parsePolynomial } from "./helpers";

import { infixToPostfix } from "./infixToPostfix";
import { infixToPrefix } from "./infixToPrefix";
import { polishToInfix } from "./polishToInfix";
import { evaluateInfix } from "./evaluateInfix";
import { evaluatePostfix } from "./evaluatePostfix";
import { evaluatePrefix } from "./evaluatePrefix";
import { MAX_TOKENS, NOTATIONS, NOTATION_MAP } from "./helpers";

// Every operation declares which notations it applies to, and the sidebar
// shows only those — "evaluate postfix" is not a thing you can do to an infix
// expression, and offering it would be offering a mistake.
export const EXPR_OPERATIONS = [
  infixToPostfix,
  infixToPrefix,
  polishToInfix,
  evaluateInfix,
  evaluatePostfix,
  evaluatePrefix,
];

export const EXPR_OP_MAP = Object.fromEntries(EXPR_OPERATIONS.map((op) => [op.key, op]));

export const EXPR_GROUPS = [
  { key: "convert", label: "Convert" },
  { key: "evaluate", label: "Evaluate" },
];

/** The operations that make sense for an expression written in `notation`. */
export function operationsFor(notation) {
  return EXPR_OPERATIONS.filter((op) => op.notations.includes(notation));
}

export { MAX_TOKENS, NOTATIONS, NOTATION_MAP };

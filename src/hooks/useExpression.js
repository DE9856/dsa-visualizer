import { useCallback, useState } from "react";
import { EXPR_OP_MAP, operationsFor } from "../dataStructures/expression";
import {
  DEFAULT_EXPRESSIONS,
  randomExpression,
  toFrame,
  tokenize,
  validate,
} from "../dataStructures/expression/helpers";
import { useStructureRun } from "./useStructureRun.js";

const EMPTY_STEP = { tokens: [], stack: [], output: [], message: "" };

/**
 * The expression view's state: the text typed, which notation it is in, and
 * the token list that text parsed to.
 *
 * The token list is the structure, even though no operation changes it —
 * every conversion and evaluation reads the expression and reports, rather
 * than editing it. What undo comes back to, then, is an earlier *expression*,
 * which is why both the text and the notation travel in the snapshot: they
 * are the document, and the tokens are derived from them.
 *
 * `init` is the setup decoded from a shared link ({ expr, notation }).
 */
export function useExpression(init) {
  const initialNotation = init?.notation && DEFAULT_EXPRESSIONS[init.notation] ? init.notation : "infix";
  const initialText = init?.expr ?? DEFAULT_EXPRESSIONS[initialNotation];

  const [notation, setNotationState] = useState(initialNotation);
  const [exprInput, setExprInput] = useState(initialText);

  const { view, value: tokens, apply, load } = useStructureRun({
    initial: () => tokenize(initialText, initialNotation),
    toFrame: (next, message) => toFrame(next, notation, message),
    emptyStep: EMPTY_STEP,
    readyMessage: "Ready — pick an operation",
    // The text and the notation are the document; the tokens are what they
    // parsed to. An undo that restored one without the others would leave the
    // box and the strip describing different expressions.
    snapshot: () => ({ exprInput, notation }),
    restore: (doc) => {
      setExprInput(doc.exprInput);
      setNotationState(doc.notation);
    },
  });

  const [operation, setOperation] = useState("toPostfix");

  const opMeta = EXPR_OP_MAP[operation];
  // What the box currently holds, checked as you type. Committing it is a
  // separate act, so this is a warning rather than a refusal.
  const inputError = validate(tokenize(exprInput, notation), notation);

  const runOperation = useCallback(() => {
    const { steps: newSteps, finalTokens } = opMeta.run(tokens, { notation });
    apply(newSteps, finalTokens);
  }, [tokens, opMeta, notation, apply]);

  const applyExpression = useCallback(() => {
    const parsed = tokenize(exprInput, notation);
    if (parsed.length === 0) return;
    load(parsed, "Expression loaded");
  }, [exprInput, notation, load]);

  /**
   * Switching notation is not a reinterpretation of the same text — `A + B`
   * is not a postfix expression — so it brings its own example along, and the
   * operation follows if the current one does not apply to the new notation.
   */
  const setNotation = useCallback(
    (next) => {
      const text = DEFAULT_EXPRESSIONS[next];
      const available = operationsFor(next);
      setNotationState(next);
      if (!available.some((op) => op.key === operation)) setOperation(available[0].key);
      setExprInput(text);
      // `load` records first, and the snapshot above still reads the previous
      // notation — the state setter has not re-rendered yet — so undo lands
      // on the expression this switch left rather than the one it arrived at.
      load(tokenize(text, next), `A ${next} expression to read`);
    },
    [operation, load]
  );

  const shuffle = useCallback(() => {
    const text = randomExpression(notation);
    setExprInput(text);
    load(tokenize(text, notation), "New random expression");
  }, [notation, load]);

  return {
    ...view,
    tokens,
    notation,
    setNotation,
    operation,
    setOperation,
    opMeta,
    exprInput,
    setExprInput,
    inputError,
    applyExpression,
    shuffle,
    runOperation,
  };
}

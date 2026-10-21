import { entry, frame, tokenText, validate } from "./helpers";

export const polishToInfix = {
  key: "toInfix",
  label: "→ Infix (fully bracketed)",
  group: "convert",
  notations: ["postfix", "prefix"],
  fields: [],
  desc: "The evaluator with strings in place of numbers. Instead of applying an operator to two values, wrap the two operands in brackets around it and push the text back — so the stack holds half-built expressions rather than half-computed ones, and the last thing on it is the whole expression. The result is fully bracketed, and worth reading twice: every bracket it prints is a grouping the postfix form was already stating, just by operator position. Removing the redundant ones needs the precedence table that postfix was doing without.",
  time: "O(n)",
  space: "O(n)",

  run(tokens, { notation }) {
    const base = {
      tokens,
      notation,
      stack: [],
      output: [],
      inputLabel: notation === "prefix" ? "PREFIX INPUT" : "POSTFIX INPUT",
      stackLabel: "EXPRESSION STACK",
      outputLabel: "BUILT",
      outputKind: "queue",
    };

    const error = validate(tokens, notation);
    if (error) return { steps: [frame(base, { notFound: true, message: error })], finalTokens: tokens };

    const ctx = { ...base };
    const steps = [];
    const parts = [];
    const backwards = notation === "prefix";

    steps.push(
      frame(ctx, {
        message: `${tokenText(tokens)} — read ${backwards ? "right to left" : "left to right"}, building text on the stack instead of numbers.`,
      })
    );

    const order = backwards ? [...tokens.keys()].reverse() : [...tokens.keys()];
    for (const i of order) {
      const token = tokens[i];
      const at = { scanned: backwards ? tokens.length - i : i + 1, cursor: i, backwards };

      if (token.kind === "operand") {
        parts.push(token.text);
        ctx.stack.push(entry(token.text));
        steps.push(frame(ctx, { ...at, message: `Push ${token.text} — an operand is already a complete expression.` }));
        continue;
      }

      // Prefix pops its left operand first, postfix its right — the same
      // asymmetry the two evaluators have, for the same reason.
      const first = parts.pop();
      const second = parts.pop();
      const [left, right] = backwards ? [first, second] : [second, first];
      ctx.stack.pop();
      ctx.stack.pop();
      const built = `(${left} ${token.text} ${right})`;
      parts.push(built);
      ctx.stack.push(entry(built, "result"));
      ctx.output.push(entry(built));
      steps.push(
        frame(ctx, {
          ...at,
          note: `${left} ${token.text} ${right}`,
          message: `${token.text} takes the top two: ${left} on the left, ${right} on the right. Push ${built} — one string standing for a whole subtree.`,
        })
      );
    }

    const result = parts[0];
    steps.push(
      frame(ctx, {
        scanned: tokens.length,
        message: `One expression left on the stack: ${result}. Every bracket in it was already implied by where the operators sat.`,
        resultBadge: result,
      })
    );

    return { steps, finalTokens: tokens };
  },
};

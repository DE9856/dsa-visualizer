import { OPERATORS, allNumeric, entry, frame, numericValue, show, tokenText, validate } from "./helpers";

export const evaluatePrefix = {
  key: "evalPrefix",
  label: "Evaluate Prefix",
  group: "evaluate",
  notations: ["prefix"],
  fields: [],
  desc: "The postfix evaluator with the direction reversed: scan right to left, and on an operator pop two and push the result. Because the scan is backwards, so is the operand order — the value popped first is now the *left* operand, which is the one asymmetry between the two evaluators. Prefix is what a syntax tree looks like written down (it is exactly a pre-order walk), which is why Lisp is written this way and why a prefix expression can be read straight off a parse tree with no bracketing decisions to make.",
  time: "O(n)",
  space: "O(n)",

  run(tokens, { notation }) {
    const base = {
      tokens,
      notation,
      stack: [],
      output: [],
      inputLabel: "PREFIX INPUT",
      stackLabel: "OPERAND STACK",
      outputLabel: "APPLIED",
      outputKind: "queue",
    };

    const error = validate(tokens, notation) || (allNumeric(tokens) ? null : "Evaluation needs numbers, not names — try - + 2 * 3 4 5.");
    if (error) return { steps: [frame(base, { notFound: true, message: error })], finalTokens: tokens };

    const ctx = { ...base };
    const steps = [];
    const values = [];

    steps.push(
      frame(ctx, {
        message: `${tokenText(tokens)} — read right to left. An operator in prefix comes before its operands, so scanning backwards is what makes them available when it is reached.`,
      })
    );

    for (let i = tokens.length - 1; i >= 0; i--) {
      const token = tokens[i];
      const at = { scanned: tokens.length - i, cursor: i, backwards: true };

      if (token.kind === "operand") {
        const value = numericValue(token);
        values.push(value);
        ctx.stack.push(entry(show(value)));
        steps.push(frame(ctx, { ...at, message: `Push ${show(value)}.` }));
        continue;
      }

      const a = values.pop();
      const b = values.pop();
      ctx.stack.pop();
      ctx.stack.pop();
      steps.push(
        frame(ctx, {
          ...at,
          note: `${show(a)} ${token.text} ${show(b)}`,
          message: `${token.text} — pop two: ${show(a)} came off first and is the *left* operand this time, because the scan is backwards. ${show(a)} ${token.text} ${show(b)}.`,
        })
      );

      const result = OPERATORS[token.text].apply(a, b);
      if (result === null) {
        return {
          steps: [
            ...steps,
            frame(ctx, {
              ...at,
              notFound: true,
              message: `${show(a)} ${token.text} ${show(b)} — division by zero. The expression is well-formed; it just has no value.`,
            }),
          ],
          finalTokens: tokens,
        };
      }

      values.push(result);
      ctx.stack.push(entry(show(result), "result"));
      ctx.output.push(entry(`${show(a)} ${token.text} ${show(b)} = ${show(result)}`));
      steps.push(frame(ctx, { ...at, message: `Push ${show(result)} back.` }));
    }

    const answer = values[0];
    steps.push(
      frame(ctx, {
        scanned: tokens.length,
        message: `The first token was the last one read, and it left exactly one value. ${tokenText(tokens)} = ${show(answer)}.`,
        resultBadge: `= ${show(answer)}`,
      })
    );

    return { steps, finalTokens: tokens };
  },
};

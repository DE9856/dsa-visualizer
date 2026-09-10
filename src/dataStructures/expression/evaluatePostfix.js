import { OPERATORS, allNumeric, entry, frame, numericValue, show, tokenText, validate } from "./helpers";

export const evaluatePostfix = {
  key: "evalPostfix",
  label: "Evaluate Postfix",
  group: "evaluate",
  notations: ["postfix"],
  fields: [],
  desc: "One left-to-right pass and one stack, with no precedence table and no lookahead anywhere in it — the reason postfix exists. Push every operand; on an operator, pop two, apply, push the result. The order matters: the top of the stack is the *right* operand, so 8 2 / is 8/2 and not 2/8, which is the mistake worth making once. Nothing is ever revisited, so the whole evaluation is O(n) and the stack never holds more than the deepest run of pending operands.",
  time: "O(n)",
  space: "O(n)",

  run(tokens, { notation }) {
    const base = {
      tokens,
      notation,
      stack: [],
      output: [],
      inputLabel: "POSTFIX INPUT",
      stackLabel: "OPERAND STACK",
      outputLabel: "APPLIED",
      outputKind: "queue",
    };

    const error = validate(tokens, notation) || (allNumeric(tokens) ? null : "Evaluation needs numbers, not names — try 2 3 4 * + 5 -.");
    if (error) return { steps: [frame(base, { notFound: true, message: error })], finalTokens: tokens };

    const ctx = { ...base };
    const steps = [];
    const values = [];

    steps.push(
      frame(ctx, {
        message: `${tokenText(tokens)} — read left to right. No brackets to match and no precedence to check: the order the operators appear in already says everything.`,
      })
    );

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const at = { scanned: i + 1, cursor: i };

      if (token.kind === "operand") {
        const value = numericValue(token);
        values.push(value);
        ctx.stack.push(entry(show(value)));
        steps.push(frame(ctx, { ...at, message: `Push ${show(value)} — an operand has nothing to do but wait for its operator.` }));
        continue;
      }

      const b = values.pop();
      const a = values.pop();
      ctx.stack.pop();
      ctx.stack.pop();
      steps.push(
        frame(ctx, {
          ...at,
          note: `${show(a)} ${token.text} ${show(b)}`,
          message: `${token.text} — pop two: ${show(b)} came off first, so it is the right operand, and ${show(a)} is the left. ${show(a)} ${token.text} ${show(b)}.`,
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
      steps.push(
        frame(ctx, {
          ...at,
          message: `Push ${show(result)} back. The two operands are gone for good — a value on this stack is a whole subexpression that has already been reduced.`,
        })
      );
    }

    const answer = values[0];
    steps.push(
      frame(ctx, {
        scanned: tokens.length,
        message: `Input exhausted and exactly one value is left, which is what a well-formed postfix expression guarantees. ${tokenText(
          tokens
        )} = ${show(answer)}.`,
        resultBadge: `= ${show(answer)}`,
      })
    );

    return { steps, finalTokens: tokens };
  },
};

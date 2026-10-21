import { OPERATORS, allNumeric, entry, frame, numericValue, popsBefore, precedenceNote, show, tokenText, validate } from "./helpers";

export const evaluateInfix = {
  key: "evalInfix",
  label: "Evaluate Infix (two stacks)",
  group: "evaluate",
  notations: ["infix"],
  fields: [],
  desc: "Infix can be evaluated in one pass without ever writing the postfix down — but it takes two stacks instead of one, and that is the honest cost of the notation. Operands go on one stack, operators on the other, and the moment an operator arrives that cannot outrank the one waiting, the waiting one is applied immediately. It is the shunting yard with 'send to output' replaced by 'apply now': the same precedence decision, made at the same points. Compare the step count with evaluating the postfix form and the conversion is paid for either way; the difference is whether you pay it once or on every evaluation.",
  time: "O(n)",
  space: "O(n)",

  run(tokens, { notation }) {
    const base = {
      tokens,
      notation,
      stack: [],
      stack2: [],
      output: [],
      inputLabel: "INFIX INPUT",
      stackLabel: "OPERANDS",
      stack2Label: "OPERATORS",
      outputLabel: "APPLIED",
      outputKind: "queue",
    };

    const error = validate(tokens, notation) || (allNumeric(tokens) ? null : "Evaluation needs numbers, not names — try ( 8 + 2 ) * 5 - 6.");
    if (error) return { steps: [frame(base, { notFound: true, message: error })], finalTokens: tokens };

    const ctx = { ...base };
    const steps = [];
    const values = [];
    const ops = [];
    let failed = null;

    /** Applies the waiting operator to the top two operands. */
    const reduce = (at, why) => {
      const op = ops.pop();
      const b = values.pop();
      const a = values.pop();
      ctx.stack2.pop();
      ctx.stack.pop();
      ctx.stack.pop();
      const result = OPERATORS[op].apply(a, b);
      if (result === null) {
        failed = `${show(a)} ${op} ${show(b)} — division by zero. The expression is well-formed; it just has no value.`;
        steps.push(frame(ctx, { ...at, notFound: true, message: failed }));
        return false;
      }
      values.push(result);
      ctx.stack.push(entry(show(result), "result"));
      ctx.output.push(entry(`${show(a)} ${op} ${show(b)} = ${show(result)}`));
      steps.push(frame(ctx, { ...at, note: `${show(a)} ${op} ${show(b)}`, message: `${why} Apply it now: ${show(a)} ${op} ${show(b)} = ${show(result)}.` }));
      return true;
    };

    steps.push(
      frame(ctx, {
        message: `${tokenText(tokens)} — one pass, two stacks. An operator is applied the moment it is certain nothing to its right can bind tighter.`,
      })
    );

    for (let i = 0; i < tokens.length && !failed; i++) {
      const token = tokens[i];
      const at = { scanned: i + 1, cursor: i };

      if (token.kind === "operand") {
        values.push(numericValue(token));
        ctx.stack.push(entry(token.text));
        steps.push(frame(ctx, { ...at, message: `Push the operand ${token.text}.` }));
        continue;
      }

      if (token.kind === "lparen") {
        ops.push("(");
        ctx.stack2.push(entry("(", "wall"));
        steps.push(frame(ctx, { ...at, message: "( goes on the operator stack as a wall — nothing inside it can be applied against anything outside." }));
        continue;
      }

      if (token.kind === "rparen") {
        steps.push(frame(ctx, { ...at, message: ") — everything back to the matching ( can be applied now: the bracket has closed, so nothing more can join it." }));
        while (!failed && ops.length && ops[ops.length - 1] !== "(") {
          if (!reduce(at, `${ops[ops.length - 1]} is inside the bracket that just closed.`)) break;
        }
        if (failed) break;
        ops.pop();
        ctx.stack2.pop();
        steps.push(frame(ctx, { ...at, message: "The matching ( is discarded — the bracket has been reduced to a single value." }));
        continue;
      }

      while (!failed && ops.length && ops[ops.length - 1] !== "(" && popsBefore(ops[ops.length - 1], token.text)) {
        const top = ops[ops.length - 1];
        if (!reduce({ ...at, note: precedenceNote(top, token.text) }, `${top} already outranks ${token.text}, so its right operand is complete.`)) break;
      }
      if (failed) break;

      const blocked = ops.length ? ops[ops.length - 1] : null;
      ops.push(token.text);
      ctx.stack2.push(entry(token.text));
      steps.push(
        frame(ctx, {
          ...at,
          note: blocked && blocked !== "(" ? precedenceNote(blocked, token.text) : null,
          message: `${token.text} waits — how much of what follows belongs to it is not settled yet.`,
        })
      );
    }

    if (failed) return { steps, finalTokens: tokens };

    steps.push(frame(ctx, { scanned: tokens.length, message: "Input exhausted — apply what is left, innermost first." }));
    while (ops.length) {
      if (!reduce({ scanned: tokens.length }, `${ops[ops.length - 1]} is the last operator waiting.`)) {
        return { steps, finalTokens: tokens };
      }
    }

    const answer = values[0];
    steps.push(
      frame(ctx, {
        scanned: tokens.length,
        message: `Both stacks are spent and one value is left. ${tokenText(tokens)} = ${show(answer)} — ${steps.length} steps, against the shorter run the postfix form takes.`,
        resultBadge: `= ${show(answer)}`,
      })
    );

    return { steps, finalTokens: tokens };
  },
};

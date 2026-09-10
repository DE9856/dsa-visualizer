import { entry, frame, isOperator, popsBefore, precedenceNote, tokenText, validate } from "./helpers";

export const infixToPostfix = {
  key: "toPostfix",
  label: "Infix → Postfix",
  group: "convert",
  notations: ["infix"],
  fields: [],
  desc: "Dijkstra's shunting yard. Operands go straight to the output in the order they are read — postfix never reorders them — and operators wait on a stack until an operator of equal or lower precedence turns up, which is the moment the waiting one can no longer be given a bigger right-hand side. A '(' goes on as a wall nothing pops past, and the matching ')' drains everything back down to it. The only asymmetry is associativity: '^' is popped by a higher precedence but not by an equal one, because 2^3^2 groups to the right.",
  time: "O(n)",
  space: "O(n)",

  run(tokens, { notation }) {
    const error = validate(tokens, notation);
    if (error) {
      return { steps: [frame({ tokens, notation, stack: [], output: [], stackLabel: "OPERATOR STACK", outputLabel: "POSTFIX OUTPUT", outputKind: "queue" }, { notFound: true, message: error })], finalTokens: tokens };
    }

    const ctx = {
      tokens,
      notation,
      stack: [],
      output: [],
      stackLabel: "OPERATOR STACK",
      outputLabel: "POSTFIX OUTPUT",
      outputKind: "queue",
    };
    const steps = [];

    steps.push(
      frame(ctx, {
        message: `${tokens.length} tokens to read, left to right. Operands are copied out as they arrive; operators wait on the stack until something forces them off.`,
      })
    );

    tokens.forEach((token, i) => {
      const at = { scanned: i + 1, cursor: i };

      if (token.kind === "operand") {
        ctx.output.push(entry(token.text));
        steps.push(
          frame(ctx, {
            ...at,
            message: `${token.text} is an operand — straight to the output. Postfix keeps operands in their original order, so there is never a reason to hold one back.`,
          })
        );
        return;
      }

      if (token.kind === "lparen") {
        ctx.stack.push(entry("(", "wall"));
        steps.push(
          frame(ctx, {
            ...at,
            message: "( goes on the stack as a wall — nothing below it can be popped until the matching ) arrives.",
          })
        );
        return;
      }

      if (token.kind === "rparen") {
        steps.push(frame(ctx, { ...at, message: ") — pop operators back to the matching ( and send each to the output." }));
        while (ctx.stack.length && ctx.stack[ctx.stack.length - 1].text !== "(") {
          const popped = ctx.stack.pop();
          ctx.output.push(entry(popped.text));
          steps.push(
            frame(ctx, {
              ...at,
              message: `Pop ${popped.text} to the output — the bracket it was inside has closed, so it can no longer take anything more on its right.`,
            })
          );
        }
        ctx.stack.pop();
        steps.push(
          frame(ctx, {
            ...at,
            message: "The matching ( is discarded. Brackets never appear in postfix — the order of the operators is what they were saying.",
          })
        );
        return;
      }

      // An operator: pop everything that already outranks it, then wait.
      while (ctx.stack.length && ctx.stack[ctx.stack.length - 1].text !== "(" && popsBefore(ctx.stack[ctx.stack.length - 1].text, token.text)) {
        const top = ctx.stack[ctx.stack.length - 1].text;
        const note = precedenceNote(top, token.text);
        ctx.stack.pop();
        ctx.output.push(entry(top));
        steps.push(
          frame(ctx, {
            ...at,
            note,
            message: `${top} is already on the stack and outranks ${token.text}, so its right-hand operand is complete — pop it to the output.`,
          })
        );
      }

      const blocked = ctx.stack.length ? ctx.stack[ctx.stack.length - 1].text : null;
      ctx.stack.push(entry(token.text));
      steps.push(
        frame(ctx, {
          ...at,
          note: blocked && isOperator(blocked) ? precedenceNote(blocked, token.text) : null,
          message: `${token.text} waits on the stack — it does not yet know how much of what follows belongs to it.`,
        })
      );
    });

    steps.push(frame(ctx, { scanned: tokens.length, message: "Input exhausted — drain the stack." }));
    while (ctx.stack.length) {
      const popped = ctx.stack.pop();
      ctx.output.push(entry(popped.text));
      steps.push(
        frame(ctx, {
          scanned: tokens.length,
          message: `Pop ${popped.text} — nothing is left to be its right-hand operand.`,
        })
      );
    }

    const result = ctx.output.map((e) => e.text).join(" ");
    steps.push(
      frame(ctx, {
        scanned: tokens.length,
        message: `${tokenText(tokens)} is ${result} in postfix — the same expression with the brackets and the precedence rules dissolved into the operator order.`,
        resultBadge: result,
      })
    );

    return { steps, finalTokens: tokens };
  },
};

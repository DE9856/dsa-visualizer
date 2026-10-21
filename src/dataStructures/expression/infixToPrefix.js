import { entry, frame, popsBeforeMirrored, precedenceNote, reverseInfix, tokenText, validate } from "./helpers";

export const infixToPrefix = {
  key: "toPrefix",
  label: "Infix → Prefix",
  group: "convert",
  notations: ["infix"],
  fields: [],
  desc: "Not a second algorithm — the same shunting yard, run backwards. Read the expression right to left with '(' and ')' swapped, convert that to postfix, and reverse the answer: prefix is the mirror image of postfix, so mirroring the input and the output turns one into the other. Two details change in the mirror. Associativity flips, and so does the pop rule with it: a left-associative operator no longer pops an equal precedence, while '^' now does — exactly the opposite of the outward pass. And the brackets have to be swapped, or the walls end up enclosing the wrong side.",
  time: "O(n)",
  space: "O(n)",

  run(tokens, { notation }) {
    const error = validate(tokens, notation);
    const base = {
      tokens,
      notation,
      stack: [],
      output: [],
      inputLabel: "INFIX INPUT",
      stackLabel: "OPERATOR STACK",
      outputLabel: "REVERSED POSTFIX",
      outputKind: "queue",
    };
    if (error) {
      return { steps: [frame(base, { notFound: true, message: error })], finalTokens: tokens };
    }

    const ctx = { ...base };
    const steps = [];

    steps.push(
      frame(ctx, {
        message: `${tokenText(tokens)} — read right to left, with the brackets swapped, this becomes an ordinary shunting-yard problem.`,
      })
    );

    const reversed = reverseInfix(tokens);
    ctx.tokens = reversed;
    ctx.inputLabel = "REVERSED · BRACKETS SWAPPED";
    steps.push(
      frame(ctx, {
        message: `${tokenText(reversed)} — every ( became ) and every ) became (, so the walls still enclose what they used to.`,
      })
    );

    reversed.forEach((token, i) => {
      const at = { scanned: i + 1, cursor: i };

      if (token.kind === "operand") {
        ctx.output.push(entry(token.text));
        steps.push(frame(ctx, { ...at, message: `${token.text} is an operand — out it goes.` }));
        return;
      }

      if (token.kind === "lparen") {
        ctx.stack.push(entry("(", "wall"));
        steps.push(frame(ctx, { ...at, message: "( is a wall, exactly as before." }));
        return;
      }

      if (token.kind === "rparen") {
        steps.push(frame(ctx, { ...at, message: ") — drain back to the matching (." }));
        while (ctx.stack.length && ctx.stack[ctx.stack.length - 1].text !== "(") {
          const popped = ctx.stack.pop();
          ctx.output.push(entry(popped.text));
          steps.push(frame(ctx, { ...at, message: `Pop ${popped.text} to the output.` }));
        }
        ctx.stack.pop();
        steps.push(frame(ctx, { ...at, message: "The matching ( is discarded." }));
        return;
      }

      // The mirror flips associativity, so the pop rule flips with it: `-`
      // no longer pops an equal precedence, and `^` now does.
      while (
        ctx.stack.length &&
        ctx.stack[ctx.stack.length - 1].text !== "(" &&
        popsBeforeMirrored(ctx.stack[ctx.stack.length - 1].text, token.text)
      ) {
        const top = ctx.stack[ctx.stack.length - 1].text;
        const note = precedenceNote(top, token.text);
        ctx.stack.pop();
        ctx.output.push(entry(top));
        steps.push(
          frame(ctx, {
            ...at,
            note,
            message: `${top} comes off before ${token.text} goes on. The test is stricter than on the way out — the reversal has flipped which side associativity favours, so ${
              token.text === "^" ? "an equal precedence now pops" : "an equal precedence now stays"
            }.`,
          })
        );
      }

      const blocked = ctx.stack.length ? ctx.stack[ctx.stack.length - 1].text : null;
      ctx.stack.push(entry(token.text));
      steps.push(
        frame(ctx, {
          ...at,
          note: blocked && blocked !== "(" ? precedenceNote(blocked, token.text) : null,
          message: `${token.text} waits on the stack.`,
        })
      );
    });

    steps.push(frame(ctx, { scanned: reversed.length, message: "Input exhausted — drain the stack." }));
    while (ctx.stack.length) {
      const popped = ctx.stack.pop();
      ctx.output.push(entry(popped.text));
      steps.push(frame(ctx, { scanned: reversed.length, message: `Pop ${popped.text}.` }));
    }

    const reversedPostfix = ctx.output.map((e) => e.text);
    const result = [...reversedPostfix].reverse();

    ctx.tokens = tokens;
    ctx.inputLabel = "INFIX INPUT";
    ctx.outputLabel = "PREFIX OUTPUT";
    ctx.output = result.map((text) => entry(text));
    steps.push(
      frame(ctx, {
        scanned: tokens.length,
        message: `Reverse the output — ${reversedPostfix.join(" ")} becomes ${result.join(
          " "
        )} — and the mirror is undone. ${tokenText(tokens)} is ${result.join(" ")} in prefix.`,
        resultBadge: result.join(" "),
      })
    );

    return { steps, finalTokens: tokens };
  },
};

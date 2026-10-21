import { nextId } from "../linkedList/nodeId";

/**
 * Expression notation — infix, postfix and prefix, and the one stack that
 * converts and evaluates all three.
 *
 * The expression is the document here: there is no structure being mutated
 * between operations, only a token list and which notation it is written in.
 * What the view actually shows is the *stack*, because that is the whole
 * content of the subject — precedence and associativity are not properties of
 * the notation, they are the rules that decide when an operator comes off the
 * stack, and every one of these algorithms is the same loop with a different
 * answer to that question.
 *
 * A token: { id, text, kind } with kind one of
 *
 *   operand | operator | lparen | rparen
 *
 * `id` is stable across a run so the canvas can animate a token moving from
 * the input strip onto the stack and off again, rather than redrawing.
 */

export const NOTATIONS = [
  {
    key: "infix",
    label: "Infix",
    short: "INFIX",
    hint: "operator between its operands — A + B — so precedence and brackets are needed to read it",
  },
  {
    key: "postfix",
    label: "Postfix",
    short: "POSTFIX",
    hint: "operator after both operands — A B + — no brackets, no precedence, read left to right",
  },
  {
    key: "prefix",
    label: "Prefix",
    short: "PREFIX",
    hint: "operator before both operands — + A B — no brackets either, but read right to left",
  },
];

export const NOTATION_MAP = Object.fromEntries(NOTATIONS.map((n) => [n.key, n]));

// Long enough for a bracketed expression with every precedence level in it,
// short enough that the token strip and both stacks fit on a phone.
export const MAX_TOKENS = 24;

/**
 * Precedence and associativity — the entire difference between the notations.
 * `^` is the only right-associative operator here, and it is the reason the
 * pop rule is `>` for it and `>=` for everything else: 2^3^2 is 2^(3^2), so
 * an equal-precedence `^` must *not* be popped by the next one.
 */
export const OPERATORS = {
  "^": { prec: 4, right: true, apply: (a, b) => a ** b, label: "power" },
  "*": { prec: 3, right: false, apply: (a, b) => a * b, label: "multiply" },
  "/": { prec: 3, right: false, apply: (a, b) => (b === 0 ? null : a / b), label: "divide" },
  "%": { prec: 3, right: false, apply: (a, b) => (b === 0 ? null : a % b), label: "remainder" },
  "+": { prec: 2, right: false, apply: (a, b) => a + b, label: "add" },
  "-": { prec: 2, right: false, apply: (a, b) => a - b, label: "subtract" },
};

export const isOperator = (text) => Object.prototype.hasOwnProperty.call(OPERATORS, text);

/** Does `top` come off the stack before `incoming` goes on? */
export function popsBefore(top, incoming) {
  const t = OPERATORS[top];
  const i = OPERATORS[incoming];
  if (!t || !i) return false;
  return i.right ? t.prec > i.prec : t.prec >= i.prec;
}

/**
 * The same question asked on the reversed pass that infix→prefix runs.
 *
 * Reversing the string reverses associativity with it, so the rule is
 * `popsBefore` with `right` inverted: a left-associative operator that would
 * pop an equal precedence on the way out must *not* pop one on the way back,
 * and a right-associative one must. Getting this backwards produces
 * `^ ^ A B C` for `A ^ B ^ C` — the correct prefix for `(A^B)^C`, which is
 * not what was written.
 */
export function popsBeforeMirrored(top, incoming) {
  const t = OPERATORS[top];
  const i = OPERATORS[incoming];
  if (!t || !i) return false;
  return i.right ? t.prec >= i.prec : t.prec > i.prec;
}

/** The precedence comparison a step is making, spelled out for the canvas. */
export function precedenceNote(top, incoming) {
  const t = OPERATORS[top];
  const i = OPERATORS[incoming];
  if (!t || !i) return null;
  const rel = t.prec === i.prec ? "=" : t.prec > i.prec ? ">" : "<";
  const assoc = i.right ? " · right-associative, so equal precedence stays put" : "";
  return `prec(${top}) ${t.prec} ${rel} ${i.prec} prec(${incoming})${assoc}`;
}

// ---------------------------------------------------------------------
// tokenising
// ---------------------------------------------------------------------

const TOKEN = /\d+(?:\.\d+)?|[A-Za-z][A-Za-z0-9]*|[-+*/%^()]|\S/g;

/**
 * Splits an expression into tokens. Whitespace is optional everywhere except
 * between two adjacent operands, which is what separates postfix `A B +` from
 * an identifier called `AB`.
 *
 * In infix, a `-` directly in front of a number and not after an operand is
 * folded into that number, so `-3 + 4` and `2 * (-5)` work. There is
 * deliberately no general unary operator: `-A` would need one, and a stack
 * machine handling unary and binary minus with the same symbol is a separate
 * lesson.
 *
 * That folding is infix-only, and the notation has to be passed in for it.
 * In prefix, `-` at the front of the expression is the *operator* — `- 9 * +
 * 2 3 2` is a subtraction, not a literal −9 — and reading it as a literal
 * turns a well-formed expression into one that fails validation.
 */
export function tokenize(input, notation = "infix") {
  const raw = String(input || "").match(TOKEN) || [];
  const tokens = [];

  for (let i = 0; i < raw.length; i++) {
    const text = raw[i];

    if (text === "(") {
      tokens.push({ id: nextId(), text, kind: "lparen" });
      continue;
    }
    if (text === ")") {
      tokens.push({ id: nextId(), text, kind: "rparen" });
      continue;
    }
    if (isOperator(text)) {
      const prev = tokens[tokens.length - 1];
      const negatable = notation === "infix" && (!prev || prev.kind === "operator" || prev.kind === "lparen");
      if (text === "-" && negatable && /^\d/.test(raw[i + 1] || "")) {
        tokens.push({ id: nextId(), text: `-${raw[i + 1]}`, kind: "operand" });
        i++;
        continue;
      }
      tokens.push({ id: nextId(), text, kind: "operator" });
      continue;
    }
    if (/^[A-Za-z0-9]/.test(text)) {
      tokens.push({ id: nextId(), text, kind: "operand" });
      continue;
    }
    tokens.push({ id: nextId(), text, kind: "bad" });
  }

  return tokens.slice(0, MAX_TOKENS);
}

export const tokenText = (tokens) => tokens.map((t) => t.text).join(" ");

/** A token's numeric value, or null if it is a name rather than a number. */
export function numericValue(token) {
  if (!/^-?\d/.test(token.text)) return null;
  const n = Number(token.text);
  return Number.isFinite(n) ? n : null;
}

export const allNumeric = (tokens) => tokens.filter((t) => t.kind === "operand").every((t) => numericValue(t) !== null);

// ---------------------------------------------------------------------
// validation
// ---------------------------------------------------------------------

/**
 * Why this token list is not a well-formed expression in `notation`, or null.
 *
 * Checked before anything runs, because a malformed expression makes a stack
 * machine fail somewhere in the middle with an underflow, and "the stack was
 * empty at token 7" explains nothing about the missing operand at token 3.
 */
export function validate(tokens, notation) {
  if (tokens.length === 0) return "Type an expression first.";
  const bad = tokens.find((t) => t.kind === "bad");
  if (bad) return `"${bad.text}" is not an operand, an operator or a bracket.`;

  if (notation === "infix") return validateInfix(tokens);
  return validatePolish(tokens, notation);
}

function validateInfix(tokens) {
  let depth = 0;
  let expectOperand = true;

  for (const token of tokens) {
    if (token.kind === "lparen") {
      if (!expectOperand) return "A bracket cannot open straight after an operand — an operator is missing.";
      depth++;
    } else if (token.kind === "rparen") {
      if (expectOperand) return "A bracket closes with no operand inside it.";
      if (depth === 0) return "A bracket closes that was never opened.";
      depth--;
    } else if (token.kind === "operator") {
      if (expectOperand) return `"${token.text}" has nothing on its left to work on.`;
      expectOperand = true;
    } else {
      if (!expectOperand) return `"${token.text}" follows an operand with no operator between them.`;
      expectOperand = false;
    }
  }

  if (expectOperand) return "The expression ends on an operator, with nothing for it to work on.";
  if (depth > 0) return `${depth} bracket${depth > 1 ? "s" : ""} opened and never closed.`;
  return null;
}

/**
 * Postfix and prefix are validated by counting: every operand adds one to the
 * stack and every binary operator takes two and returns one, so a well-formed
 * expression never dips below the operands an operator needs and finishes at
 * exactly one. Prefix is the same count run right to left.
 */
function validatePolish(tokens, notation) {
  if (tokens.some((t) => t.kind === "lparen" || t.kind === "rparen")) {
    return `${NOTATION_MAP[notation].label} needs no brackets — that is the point of it. Remove them.`;
  }

  const order = notation === "prefix" ? [...tokens].reverse() : tokens;
  let depth = 0;
  for (const token of order) {
    if (token.kind === "operator") {
      if (depth < 2) return `"${token.text}" has only ${depth} operand${depth === 1 ? "" : "s"} available — it needs two.`;
      depth--;
    } else {
      depth++;
    }
  }
  if (depth === 0) return "Nothing to evaluate.";
  if (depth > 1) return `${depth} values are left over — there are ${depth - 1} too few operators.`;
  return null;
}

// ---------------------------------------------------------------------
// frames
// ---------------------------------------------------------------------

/**
 * One frame. `stack` and `output` are both stored bottom-first; the canvas
 * reverses the stack for display so its top is drawn on top.
 */
export function frame(ctx, extra = {}) {
  return {
    tokens: ctx.tokens,
    notation: ctx.notation,
    inputLabel: ctx.inputLabel || "INPUT",
    stack: ctx.stack.map((item) => ({ ...item })),
    output: ctx.output.map((item) => ({ ...item })),
    // Only the infix evaluator runs two stacks at once, so the second one is
    // absent rather than empty everywhere else — the canvas draws a column
    // for it only when there is one.
    stack2: ctx.stack2 ? ctx.stack2.map((item) => ({ ...item })) : null,
    stackLabel: ctx.stackLabel,
    stack2Label: ctx.stack2Label,
    outputLabel: ctx.outputLabel,
    outputKind: ctx.outputKind,
    scanned: 0,
    cursor: null,
    active: [],
    note: null,
    message: "",
    ...extra,
  };
}

/** The still frame a freshly typed expression gets. */
export function toFrame(tokens, notation, message) {
  return frame(
    {
      tokens,
      notation,
      stack: [],
      output: [],
      stackLabel: "STACK",
      outputLabel: "OUTPUT",
      outputKind: "queue",
    },
    { message }
  );
}

/** The one entry a stack or output row is made of. */
export const entry = (text, tone) => ({ id: nextId(), text, ...(tone ? { tone } : {}) });

// ---------------------------------------------------------------------
// defaults and randoms
// ---------------------------------------------------------------------

export const DEFAULT_EXPRESSIONS = {
  infix: "A + B * C - ( D / E + F ) ^ G",
  postfix: "2 3 4 * + 5 -",
  prefix: "- + 2 * 3 4 5",
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const SYMBOLIC = [
  "A + B * C",
  "A * ( B + C ) / D",
  "A + B * C - D / E",
  "( A + B ) * ( C - D )",
  "A ^ B ^ C + D",
  "A * B + C * D - E",
];

const NUMERIC = ["3 + 4 * 2", "( 8 + 2 ) * 5 - 6", "2 ^ 3 ^ 2 - 1", "7 * 3 + 12 / 4", "9 - ( 2 + 3 ) * 2"];

/**
 * A fresh expression in the notation on screen. The infix ones alternate
 * between names and numbers on purpose: the conversions read better with
 * names, since there is nothing to be tempted to work out in your head, and
 * the evaluations need numbers.
 */
export function randomExpression(notation) {
  if (notation === "infix") return pick(Math.random() < 0.5 ? SYMBOLIC : NUMERIC);
  const infix = pick(NUMERIC);
  return notation === "postfix" ? silentToPostfix(infix) : silentToPrefix(infix);
}

/** Shunting yard with no frames — for building a random postfix expression. */
export function silentToPostfix(infix) {
  const tokens = tokenize(infix);
  const out = [];
  const stack = [];
  for (const token of tokens) {
    if (token.kind === "operand") out.push(token.text);
    else if (token.kind === "lparen") stack.push("(");
    else if (token.kind === "rparen") {
      while (stack.length && stack[stack.length - 1] !== "(") out.push(stack.pop());
      stack.pop();
    } else {
      while (stack.length && stack[stack.length - 1] !== "(" && popsBefore(stack[stack.length - 1], token.text)) {
        out.push(stack.pop());
      }
      stack.push(token.text);
    }
  }
  while (stack.length) out.push(stack.pop());
  return out.join(" ");
}

export function silentToPrefix(infix) {
  const reversed = reverseInfix(tokenize(infix));
  const out = [];
  const stack = [];
  for (const token of reversed) {
    if (token.kind === "operand") out.push(token.text);
    else if (token.kind === "lparen") stack.push("(");
    else if (token.kind === "rparen") {
      while (stack.length && stack[stack.length - 1] !== "(") out.push(stack.pop());
      stack.pop();
    } else {
      while (stack.length && stack[stack.length - 1] !== "(" && popsBeforeMirrored(stack[stack.length - 1], token.text)) {
        out.push(stack.pop());
      }
      stack.push(token.text);
    }
  }
  while (stack.length) out.push(stack.pop());
  return out.reverse().join(" ");
}

/**
 * The token list read right to left with the brackets turned round — the
 * whole of what makes infix→prefix the same algorithm as infix→postfix.
 * New ids, because these are drawn as a second strip alongside the original.
 */
export function reverseInfix(tokens) {
  return [...tokens].reverse().map((token) => {
    if (token.kind === "lparen") return { id: nextId(), text: ")", kind: "rparen" };
    if (token.kind === "rparen") return { id: nextId(), text: "(", kind: "lparen" };
    return { ...token, id: nextId() };
  });
}

/** Rounded for display: 12/5 is 2.4, not 2.4000000000000004. */
export const show = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 1e6) / 1e6));

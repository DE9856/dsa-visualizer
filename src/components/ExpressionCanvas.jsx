/**
 * An expression being converted or evaluated: the input strip along the top,
 * the stack (or two) below it, and whatever is coming out.
 *
 * The three read together on purpose. A token leaves the strip, sits on the
 * stack for a while, and lands in the output — and how long it sat there is
 * the entire content of precedence. Tokens already consumed are dimmed rather
 * than removed, so the strip stays a fixed ruler you can see the scan position
 * against instead of a shrinking queue.
 */
export default function ExpressionCanvas({ step }) {
  const tokens = step.tokens || [];
  const stack = step.stack || [];
  const output = step.output || [];
  const stack2 = step.stack2;
  // Stored bottom-first, drawn top-first, like the stack view.
  const column = (items) => [...items].reverse();

  return (
    <div className="panel canvas expr-canvas">
      <div className="expr-strip-wrap">
        <span className="expr-strip__label mono">{step.inputLabel || "INPUT"}</span>
        <div className="canvas-scroll">
          <div className="expr-strip">
            {tokens.length === 0 ? (
              <div className="ll-empty mono">NO EXPRESSION</div>
            ) : (
              tokens.map((token, i) => (
                <span
                  key={token.id}
                  className={[
                    "expr-token mono",
                    `expr-token--${token.kind}`,
                    i === step.cursor ? "is-cursor" : "",
                    consumed(step, i) ? "is-consumed" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {token.text}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {step.note && <div className="expr-note mono">{step.note}</div>}

      <div className="expr-body">
        <StackColumn label={step.stackLabel || "STACK"} items={column(stack)} />
        {stack2 && <StackColumn label={step.stack2Label || "OPERATORS"} items={column(stack2)} />}

        <div className="expr-out">
          <span className="expr-out__label mono">{step.outputLabel || "OUTPUT"}</span>
          <div className="canvas-scroll">
            <div className={`expr-out__items ${step.outputKind === "queue" ? "expr-out__items--wrap" : ""}`}>
              {output.length === 0 ? (
                <span className="expr-out__empty mono">nothing yet</span>
              ) : (
                output.map((item) => (
                  <span key={item.id} className={`expr-chip mono ${item.tone ? `expr-chip--${item.tone}` : ""}`}>
                    {item.text}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">NOT AN EXPRESSION</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

function StackColumn({ label, items }) {
  return (
    <div className="expr-stack-wrap">
      <span className="expr-stack__label mono">{label}</span>
      <div className="expr-stack">
        {items.length === 0 ? (
          <div className="expr-stack__empty mono">EMPTY</div>
        ) : (
          items.map((item, i) => (
            <div
              key={item.id}
              className={`expr-slot mono ${item.tone ? `expr-slot--${item.tone}` : ""} ${i === 0 ? "is-top" : ""}`}
            >
              {item.text}
              {i === 0 && <span className="expr-slot__tag">TOP</span>}
            </div>
          ))
        )}
        <div className="expr-stack__base mono">— base —</div>
      </div>
    </div>
  );
}

/**
 * Has the scan passed this token? A backwards scan (prefix) has consumed the
 * tokens to the *right* of the cursor, so "before the cursor" is the wrong
 * test for half the operations here.
 */
function consumed(step, i) {
  if (step.cursor === null || step.cursor === undefined) return step.scanned > 0 && step.scanned >= step.tokens.length;
  return step.backwards ? i > step.cursor : i < step.cursor;
}

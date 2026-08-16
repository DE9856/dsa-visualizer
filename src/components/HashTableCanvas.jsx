import SlotBox from "./SlotBox.jsx";
import { STRATEGY_MAP } from "../dataStructures/hashTable";
import { loadLimitFor } from "../dataStructures/hashTable/helpers";

/**
 * The bucket array, drawn one row per index so the probe walk reads top to
 * bottom and its wrap past the last bucket is visible. Chaining grows a row
 * sideways; open addressing keeps every row one slot wide, which is exactly
 * the difference the two strategies are trying to show.
 */
export default function HashTableCanvas({ step }) {
  const buckets = step.buckets || [];
  const capacity = step.capacity || 0;
  const strategy = step.strategy || "chaining";
  const count = step.order?.length ?? 0;

  const alpha = capacity ? count / capacity : 0;
  const limit = loadLimitFor(strategy);
  const over = alpha > limit;
  const probed = new Set(step.probed || []);

  return (
    <div className="panel canvas ht-canvas">
      <div className="ht-head">
        <span className="ht-head__strategy mono">{STRATEGY_MAP[strategy]?.short || strategy}</span>
        <span className="ht-head__stat mono">
          {capacity} BUCKETS &middot; {count} KEYS
        </span>
        <div className="ht-load" title={`load factor ${alpha.toFixed(2)} / limit ${limit.toFixed(2)}`}>
          <div className={`ht-load__fill ${over ? "ht-load__fill--over" : ""}`} style={{ width: `${Math.min(1, alpha) * 100}%` }} />
          <div className="ht-load__limit" style={{ left: `${limit * 100}%` }} />
        </div>
        <span className={`ht-head__alpha mono ${over ? "ht-head__alpha--over" : ""}`}>&alpha; {alpha.toFixed(2)}</span>
      </div>

      <div className="ht-subhead">
        {step.hash ? <span className="ht-hash mono">{step.hash}</span> : <span className="ht-hash ht-hash--idle mono">h(k) = k mod m</span>}
        {step.resizing && (
          <span className="ht-resizing mono">
            RESIZING {step.resizing.from} &rarr; {step.resizing.to}
          </span>
        )}
      </div>

      <div className="ht-grid">
        {buckets.map((bucket, index) => {
          const isProbe = step.probe === index;
          const isHome = step.home === index;
          const entries = bucket || [];
          return (
            <div
              key={index}
              className={`ht-row ${isProbe ? "ht-row--probe" : ""} ${probed.has(index) && !isProbe ? "ht-row--probed" : ""} ${
                isProbe && step.collision ? "ht-row--collision" : ""
              }`}
            >
              <span className="ht-row__marker mono">{isProbe ? "▸" : ""}</span>
              <span className={`ht-row__index mono ${isHome ? "ht-row__index--home" : ""}`}>{index}</span>

              <div className="ht-row__slots">
                {entries.length === 0 ? (
                  <div className="ht-slot ht-slot--empty" />
                ) : (
                  entries.map((entry, i) => (
                    <div className="ht-chain-link" key={entry.id}>
                      {i > 0 && <span className="ht-arrow mono">&rarr;</span>}
                      {entry.deleted ? (
                        <div className={`ht-slot ht-slot--tomb ${step.tombstoned === entry.id ? "ht-slot--fresh-tomb" : ""}`}>
                          <span className="ht-slot__tomb-label mono">DEL</span>
                        </div>
                      ) : (
                        <SlotBox node={entry} step={step} />
                      )}
                    </div>
                  ))
                )}
                {isHome && <span className="ht-tag ht-tag--home mono">HOME</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">{step.overflow ? "TABLE FULL" : "NOT FOUND"}</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

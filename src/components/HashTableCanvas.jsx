import SlotBox from "./SlotBox.jsx";
import { STRATEGY_MAP } from "../dataStructures/hashTable";
import { HASH_FN_MAP, isRobinHood, loadLimitFor, probeDistance, slotCount } from "../dataStructures/hashTable/helpers";

/**
 * The bucket array, drawn one row per index so the probe walk reads top to
 * bottom and its wrap past the last bucket is visible. Chaining grows a row
 * sideways; open addressing keeps every row one slot wide, which is exactly
 * the difference the two strategies are trying to show. Cuckoo hashing gets
 * two of these side by side, because a key lives in one table or the other.
 */
function BucketGrid({ buckets, step, probe, home, probed, caption, showDistance, homeLabel = "HOME" }) {
  return (
    <div className="ht-table">
      {caption && <div className="ht-table__caption mono">{caption}</div>}
      <div className="ht-grid">
        {buckets.map((bucket, index) => {
          const isProbe = probe === index;
          const isHome = home === index;
          const entries = bucket || [];
          const live = entries[0] && !entries[0].deleted ? entries[0] : null;
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
                {/* Robin Hood's whole invariant is about these numbers, so the
                    table shows how far each key had to travel from its home. */}
                {showDistance && live && (
                  <span className="ht-tag ht-tag--dist mono">+{probeDistance(step, index, live)}</span>
                )}
                {isHome && <span className="ht-tag ht-tag--home mono">{homeLabel}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HashTableCanvas({ step }) {
  const buckets = step.buckets || [];
  const capacity = step.capacity || 0;
  const strategy = step.strategy || "chaining";
  const count = step.order?.length ?? 0;
  const slots = capacity ? slotCount(step) : 0;

  const alpha = slots ? count / slots : 0;
  const limit = loadLimitFor(strategy);
  const over = alpha > limit;
  const probed = new Set(step.probed || []);
  const fn = HASH_FN_MAP[step.hashFn] || HASH_FN_MAP.division;

  return (
    <div className="panel canvas ht-canvas">
      <div className="ht-head">
        <span className="ht-head__strategy mono">{STRATEGY_MAP[strategy]?.short || strategy}</span>
        <span className="ht-head__stat mono">
          {slots} SLOTS &middot; {count} KEYS
        </span>
        <div className="ht-load" title={`load factor ${alpha.toFixed(2)} / limit ${limit.toFixed(2)}`}>
          <div className={`ht-load__fill ${over ? "ht-load__fill--over" : ""}`} style={{ width: `${Math.min(1, alpha) * 100}%` }} />
          <div className="ht-load__limit" style={{ left: `${limit * 100}%` }} />
        </div>
        <span className={`ht-head__alpha mono ${over ? "ht-head__alpha--over" : ""}`}>&alpha; {alpha.toFixed(2)}</span>
      </div>

      <div className="ht-subhead">
        {step.hash ? <span className="ht-hash mono">{step.hash}</span> : <span className="ht-hash ht-hash--idle mono">{fn.formula}</span>}
        {step.resizing && (
          <span className="ht-resizing mono">
            RESIZING {step.resizing.from} &rarr; {step.resizing.to}
          </span>
        )}
      </div>

      {step.buckets2 ? (
        <div className="ht-tables">
          <BucketGrid
            buckets={buckets}
            step={step}
            probe={step.probe}
            home={step.home}
            probed={probed}
            caption="T1 · h(k)"
          />
          <BucketGrid
            buckets={step.buckets2}
            step={step}
            probe={step.probe2}
            home={step.home2}
            probed={new Set()}
            caption="T2 · h₂(k) = ⌊k/m⌋ mod m"
            homeLabel="ALT"
          />
        </div>
      ) : (
        <BucketGrid
          buckets={buckets}
          step={step}
          probe={step.probe}
          home={step.home}
          probed={probed}
          showDistance={isRobinHood(strategy)}
        />
      )}

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">{step.overflow ? "TABLE FULL" : "NOT FOUND"}</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

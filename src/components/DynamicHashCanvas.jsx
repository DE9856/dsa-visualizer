import { binary, levelSize, loadFactor, slotCount } from "../dataStructures/dynamicHash/helpers";

/**
 * One bucket, drawn the same way in both schemes: a row of key slots, padded
 * out to the bucket's capacity so a bucket that is about to overflow looks
 * like one. Linear hashing's overflow block hangs off the end on an arrow,
 * because that is exactly what it is — a separate block, not more capacity.
 */
function Bucket({ bucket, size, active, activeKey, splitFrom, splitTo }) {
  const filler = Math.max(0, size - bucket.keys.length);
  return (
    <div
      className={`dh-bucket ${active ? "dh-bucket--active" : ""} ${splitFrom ? "dh-bucket--split-from" : ""} ${
        splitTo ? "dh-bucket--split-to" : ""
      }`}
    >
      {bucket.keys.map((key) => (
        <div key={key} className={`dh-slot mono ${activeKey === key ? "dh-slot--active" : ""}`}>
          {key}
        </div>
      ))}
      {Array.from({ length: filler }, (_, i) => (
        <div key={`empty-${i}`} className="dh-slot dh-slot--empty" />
      ))}
      {bucket.overflow?.length > 0 && (
        <>
          <span className="ht-arrow mono">&rarr;</span>
          <div className="dh-overflow">
            {bucket.overflow.map((key) => (
              <div key={key} className={`dh-slot dh-slot--overflow mono ${activeKey === key ? "dh-slot--active" : ""}`}>
                {key}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DynamicHashCanvas({ step }) {
  const buckets = step.buckets || [];
  const extendible = step.kind === "extendible";
  const split = step.splitting;
  const alpha = buckets.length ? loadFactor(step) : 0;

  return (
    <div className="panel canvas dh-canvas">
      <div className="ht-head">
        <span className="ht-head__strategy mono">{extendible ? "EXTENDIBLE" : "LINEAR"}</span>
        <span className="ht-head__stat mono">
          {extendible
            ? `GLOBAL DEPTH ${step.globalDepth} · ${step.directory?.length ?? 0} DIR ENTRIES · ${buckets.length} BUCKETS`
            : `LEVEL ${step.level} · N ${levelSize(step)} · ${buckets.length} BUCKETS · NEXT ▸ ${step.next}`}
        </span>
        <span className="ht-head__alpha mono">
          &alpha; {alpha.toFixed(2)} ({step.order?.length ?? 0}/{slotCount(step)})
        </span>
      </div>

      <div className="ht-subhead">
        {step.hash ? (
          <span className="ht-hash mono">{step.hash}</span>
        ) : (
          <span className="ht-hash ht-hash--idle mono">
            {extendible ? "h(k) = last d bits of k" : `h${step.level}(k) = k mod ${levelSize(step)}`}
          </span>
        )}
      </div>

      <div className="dh-cols">
        {extendible && (
          <div className="dh-dir">
            <div className="dh-col__caption mono">DIRECTORY</div>
            <div className="dh-list">
              {(step.directory || []).map((target, index) => (
                <div key={index} className={`dh-dir__row ${step.dirIndex === index ? "dh-dir__row--active" : ""}`}>
                  <span className="dh-dir__bits mono">{binary(index, step.globalDepth)}</span>
                  <span className="dh-dir__arrow mono">&rarr;</span>
                  <span className="dh-dir__target mono">B{target}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dh-buckets">
          <div className="dh-col__caption mono">BUCKETS</div>
          <div className="dh-list">
            {buckets.map((bucket, index) => (
              <div
                key={bucket.id}
                className={`dh-row ${step.bucketIndex === index ? "dh-row--active" : ""} ${
                  step.full && step.bucketIndex === index ? "dh-row--full" : ""
                }`}
              >
                <span className="dh-row__marker mono">{!extendible && step.next === index ? "▸" : ""}</span>
                <span className="dh-row__label mono">{extendible ? `B${index}` : index}</span>
                {extendible ? (
                  <span className="dh-row__depth mono" title="local depth">
                    d{bucket.localDepth}
                  </span>
                ) : (
                  <span className="dh-row__depth mono" title="hash this bucket answers to">
                    {index < step.next || index >= levelSize(step) ? `mod ${levelSize(step) * 2}` : `mod ${levelSize(step)}`}
                  </span>
                )}
                <Bucket
                  bucket={bucket}
                  size={step.bucketSize}
                  active={step.bucketIndex === index}
                  activeKey={step.activeKey}
                  splitFrom={split?.from === index}
                  splitTo={split?.to === index}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ll-message mono">{step.message}</div>
      {step.notFound && <div className="not-found">NOT FOUND</div>}
      {step.resultBadge && <div className="result-badge">{step.resultBadge}</div>}
    </div>
  );
}

export default function InfoPanel({ meta, step }) {
  const hasDetails = meta.overview || meta.howItWorks || meta.useCases || meta.advantages || meta.disadvantages;
  // Every step frame carries the pseudocode line it is executing. A finished
  // run reports null — nothing is executing, so nothing is highlighted.
  const activeLine = step?.line ?? null;

  return (
    <div className="panel info">
      <div className="info__summary">
        <div className="info__title">{meta.label}</div>
        <p className="info__desc">{meta.desc}</p>
        <div className="info__complexity">
          <div><span>BEST </span>{meta.time.best}</div>
          <div><span>AVG </span>{meta.time.avg}</div>
          <div><span>WORST </span>{meta.time.worst}</div>
          <div><span>SPACE </span>{meta.space}</div>
        </div>
      </div>
      <div className="info__code">
        <div className="label">PSEUDOCODE</div>
        {meta.pseudocode.map((line, i) => (
          <div
            key={i}
            className={`info__code-line ${i === activeLine ? "is-active" : ""}`}
            aria-current={i === activeLine ? "step" : undefined}
          >
            {line}
          </div>
        ))}
      </div>

      {hasDetails && (
        <details className="topic-panel topic-panel--inline">
          <summary className="topic-panel__summary">
            <span className="topic-panel__title">Learn more about {meta.label}</span>
            <span className="topic-panel__hint">click to expand</span>
          </summary>

          <div className="topic-panel__body">
            {meta.overview && <p className="info__desc">{meta.overview}</p>}

            {meta.howItWorks && meta.howItWorks.length > 0 && (
              <div className="topic-section">
                <div className="label">HOW IT WORKS</div>
                <ul className="topic-list">
                  {meta.howItWorks.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {meta.useCases && meta.useCases.length > 0 && (
              <div className="topic-section">
                <div className="label">COMMON USES</div>
                <ul className="topic-list">
                  {meta.useCases.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {(meta.advantages || meta.disadvantages) && (
              <div className="topic-proscons">
                {meta.advantages && (
                  <div className="topic-section">
                    <div className="label">ADVANTAGES</div>
                    <ul className="topic-list">
                      {meta.advantages.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {meta.disadvantages && (
                  <div className="topic-section">
                    <div className="label">LIMITATIONS</div>
                    <ul className="topic-list">
                      {meta.disadvantages.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

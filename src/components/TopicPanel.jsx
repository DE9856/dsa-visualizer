export default function TopicPanel({ topic }) {
  if (!topic) return null;

  return (
    <details className="panel info topic-panel">
      <summary className="topic-panel__summary">
        <span className="topic-panel__title">About: {topic.title}</span>
        <span className="topic-panel__hint">click to expand</span>
      </summary>

      <div className="topic-panel__body">
        <p className="info__desc">{topic.overview}</p>

        {topic.howItWorks && topic.howItWorks.length > 0 && (
          <div className="topic-section">
            <div className="label">HOW IT WORKS</div>
            <ul className="topic-list">
              {topic.howItWorks.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {topic.useCases && topic.useCases.length > 0 && (
          <div className="topic-section">
            <div className="label">COMMON USES</div>
            <ul className="topic-list">
              {topic.useCases.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {(topic.advantages || topic.disadvantages) && (
          <div className="topic-proscons">
            {topic.advantages && (
              <div className="topic-section">
                <div className="label">ADVANTAGES</div>
                <ul className="topic-list">
                  {topic.advantages.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {topic.disadvantages && (
              <div className="topic-section">
                <div className="label">LIMITATIONS</div>
                <ul className="topic-list">
                  {topic.disadvantages.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  );
}

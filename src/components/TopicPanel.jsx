import { useState } from "react";
import { TOPIC_TITLES } from "../data/topicTitles.js";

/**
 * The long-form write-up for a topic, collapsed by default.
 *
 * The prose is a good 30 kB and most visits never expand it, so it is not in
 * the initial bundle: the title comes from the small static map, and the body
 * is fetched the first time someone opens the panel. `topicOverviews.js` is
 * imported nowhere else, which is what keeps it in a chunk of its own.
 */
export default function TopicPanel({ topicKey }) {
  const title = TOPIC_TITLES[topicKey];
  const [overviews, setOverviews] = useState(null);
  const [failed, setFailed] = useState(false);

  if (!title) return null;

  const load = () => {
    if (overviews || failed) return;
    import("../data/topicOverviews.js")
      .then((module) => setOverviews(module.TOPIC_OVERVIEWS))
      .catch(() => setFailed(true));
  };

  const topic = overviews?.[topicKey];

  return (
    <details
      className="panel info topic-panel"
      onToggle={(e) => e.currentTarget.open && load()}
    >
      <summary className="topic-panel__summary">
        <span className="topic-panel__title">About: {title}</span>
        <span className="topic-panel__hint">click to expand</span>
      </summary>

      <div className="topic-panel__body">
        {!topic ? (
          <p className="info__desc">{failed ? "Couldn't load this write-up — check your connection." : "Loading…"}</p>
        ) : (
          <>
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
          </>
        )}
      </div>
    </details>
  );
}

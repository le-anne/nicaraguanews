import { useEffect, useMemo, useState } from "react";
import { getArticles } from "../API/News";

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function ArticleMeta({ article }) {
  const date = formatDate(article.publishedAt);
  return (
    <div className="story-meta">
      <span className="story-source">{article.source}</span>
      {date ? <time dateTime={article.publishedAt}>{date}</time> : null}
    </div>
  );
}

function FeaturedStory({ article, style }) {
  return (
    <a
      className="story story-featured"
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
    >
      <div className="story-featured-media">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            loading="eager"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement?.classList.add("is-fallback");
            }}
          />
        ) : (
          <div className="story-fallback-art" aria-hidden="true" />
        )}
      </div>
      <div className="story-featured-copy">
        <ArticleMeta article={article} />
        <h2>{article.title}</h2>
        <span className="story-cta">Read the story</span>
      </div>
    </a>
  );
}

function StoryCard({ article, index }) {
  return (
    <a
      className="story story-card"
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ "--delay": `${0.08 + index * 0.04}s` }}
    >
      <div className={`story-card-media${article.imageUrl ? "" : " is-fallback"}`}>
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement?.classList.add("is-fallback");
            }}
          />
        ) : (
          <div className="story-fallback-art" aria-hidden="true" />
        )}
      </div>
      <div className="story-card-copy">
        <ArticleMeta article={article} />
        <h3>{article.title}</h3>
      </div>
    </a>
  );
}

export default function Body() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    getArticles()
      .then((articles) => {
        if (cancelled) return;
        setData(articles);
        setStatus(articles.length ? "ready" : "empty");
      })
      .catch(() => {
        if (cancelled) return;
        setData([]);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { featured, rest } = useMemo(() => {
    if (!data.length) return { featured: null, rest: [] };
    const withImage = data.find((article) => article.imageUrl);
    const featuredArticle = withImage || data[0];
    const restArticles = data.filter((article) => article !== featuredArticle);
    return { featured: featuredArticle, rest: restArticles };
  }, [data]);

  if (status === "loading") {
    return <p className="status-message">Loading Nicaragua news…</p>;
  }

  if (status === "error") {
    return (
      <p className="status-message">
        Could not load news right now. Make sure the API server is running.
      </p>
    );
  }

  if (status === "empty" || !featured) {
    return (
      <p className="status-message">No articles found from the configured sources.</p>
    );
  }

  return (
    <main className="newsdesk">
      <FeaturedStory article={featured} style={{ "--delay": "0.05s" }} />
      <section className="latest" aria-labelledby="latest-heading">
        <div className="latest-heading-row">
          <h2 id="latest-heading">Latest coverage</h2>
          <p>{rest.length} more stories</p>
        </div>
        <div className="story-grid">
          {rest.map((article, index) => (
            <StoryCard
              key={article.url || article.title}
              article={article}
              index={index}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

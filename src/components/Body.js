import React from "react";
import { getArticles } from "../API/News";

export default function Body() {
  const [data, setData] = React.useState([]);
  const [status, setStatus] = React.useState("loading");

  React.useEffect(() => {
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

  if (status === "empty") {
    return <p className="status-message">No articles found from the configured sources.</p>;
  }

  return (
    <div>
      {data.map((article) => (
        <div className="card" key={article.url || article.title}>
          <div className="card-body">
            <a
              href={article.url}
              className="card-text"
              target="_blank"
              rel="noopener noreferrer"
            >
              {article.title}
            </a>
            <p className="card-text">Source: {article.source}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

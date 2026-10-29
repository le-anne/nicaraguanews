const express = require("express");
const cors = require("cors");
const {
  getCachedArticles,
  listSources,
  sourceNames,
} = require("./aggregate");

const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/sources", (_req, res) => {
  res.json(listSources());
});

async function handleNewsRequest(req, res) {
  try {
    const force = req.query.refresh === "1";
    const { articles, errors, cached, fetchedAt } = await getCachedArticles({ force });

    if (!articles.length) {
      return res.status(502).json({
        error: "No articles could be loaded from any source.",
        errors,
      });
    }

    if (req.query.meta === "1") {
      return res.json({
        articles,
        count: articles.length,
        sources: sourceNames(),
        errors,
        cached,
        fetchedAt: new Date(fetchedAt).toISOString(),
      });
    }

    res.json(articles);
  } catch (error) {
    console.error("GET /api/news failed:", error);
    res.status(500).json({ error: "Failed to load news." });
  }
}

app.get("/api/news", handleNewsRequest);
app.get("/news", handleNewsRequest);

app.listen(PORT, () => {
  console.log(`Nicaragua news API listening on http://localhost:${PORT}`);
});

const Parser = require("rss-parser");
const sources = require("./sources");

const CACHE_TTL_MS = 5 * 60 * 1000;
const NICARAGUA_RE = /\b(nicaragua|nicaraguan|ortega|murillo|managua|sandinista)\b/i;

// Drop low-signal publishers that dominate Google News Nicaragua results.
const BLOCKED_SOURCE_RE =
  /volcano\s*discovery|church\s*news|lds\s*living|newsroom\.churchofjesuschrist|britannica|streamlinefeed|новости\s*gxp/i;

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "NicaraguaNewsEnEnglish/1.0 (+https://github.com/le-anne/nicaraguanews)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

let cache = { articles: null, fetchedAt: 0, errors: [] };

function normalizeTitle(title) {
  return (title || "").replace(/\s+/g, " ").trim();
}

function stripPublisherSuffix(title) {
  const cleaned = normalizeTitle(title);
  const parts = cleaned.split(" - ");
  if (parts.length < 2) {
    return { title: cleaned, publisher: null };
  }
  const publisher = parts[parts.length - 1].trim();
  if (publisher.length > 0 && publisher.length < 60) {
    return {
      title: parts.slice(0, -1).join(" - ").trim(),
      publisher,
    };
  }
  return { title: cleaned, publisher: null };
}

function articleKey(article) {
  const url = (article.url || "").split("?")[0].toLowerCase();
  if (url) return `url:${url}`;
  return `title:${normalizeTitle(article.title).toLowerCase()}`;
}

async function fetchSource(source) {
  const feed = await parser.parseURL(source.url);
  const items = feed.items || [];

  return items
    .map((item) => {
      const rawTitle = item.title || "";
      const parsed = source.parsePublisherFromTitle
        ? stripPublisherSuffix(rawTitle)
        : { title: normalizeTitle(rawTitle), publisher: null };

      return {
        title: parsed.title,
        url: item.link || item.guid || "",
        source: parsed.publisher || source.name,
        sourceId: source.id,
        publishedAt: item.isoDate || item.pubDate || null,
      };
    })
    .filter((article) => article.title && article.url)
    .filter((article) => {
      if (!source.filterNicaragua) return true;
      return NICARAGUA_RE.test(`${article.title} ${article.url}`);
    })
    .filter((article) => !BLOCKED_SOURCE_RE.test(article.source || ""));
}

async function aggregateArticles() {
  const results = await Promise.allSettled(sources.map((source) => fetchSource(source)));
  const articles = [];
  const errors = [];

  results.forEach((result, index) => {
    const source = sources[index];
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      errors.push({
        source: source.name,
        message: result.reason?.message || String(result.reason),
      });
      console.error(`Failed to fetch ${source.name}:`, result.reason);
    }
  });

  const seen = new Set();
  const deduped = [];
  for (const article of articles) {
    const key = articleKey(article);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(article);
  }

  deduped.sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });

  return { articles: deduped, errors };
}

async function getCachedArticles({ force = false } = {}) {
  const isFresh = cache.articles && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
  if (!force && isFresh) {
    return {
      articles: cache.articles,
      errors: cache.errors,
      cached: true,
      fetchedAt: cache.fetchedAt,
    };
  }

  const { articles, errors } = await aggregateArticles();
  cache = { articles, errors, fetchedAt: Date.now() };
  return {
    articles,
    errors,
    cached: false,
    fetchedAt: cache.fetchedAt,
  };
}

function listSources() {
  return sources.map(({ id, name, url, filterNicaragua }) => ({
    id,
    name,
    url,
    filterNicaragua: Boolean(filterNicaragua),
  }));
}

function sourceNames() {
  return sources.map((source) => source.name);
}

module.exports = {
  getCachedArticles,
  listSources,
  sourceNames,
};

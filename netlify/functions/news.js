const {
  getCachedArticles,
  listSources,
  sourceNames,
} = require("../../server/aggregate");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  const path = event.path || "";
  const params = event.queryStringParameters || {};

  try {
    if (path.endsWith("/sources") || params.list === "sources") {
      return json(200, listSources());
    }

    const force = params.refresh === "1";
    const { articles, errors, cached, fetchedAt } = await getCachedArticles({ force });

    if (!articles.length) {
      return json(502, {
        error: "No articles could be loaded from any source.",
        errors,
      });
    }

    if (params.meta === "1") {
      return json(200, {
        articles,
        count: articles.length,
        sources: sourceNames(),
        errors,
        cached,
        fetchedAt: new Date(fetchedAt).toISOString(),
      });
    }

    return json(200, articles);
  } catch (error) {
    console.error("Netlify news function failed:", error);
    return json(500, { error: "Failed to load news." });
  }
};

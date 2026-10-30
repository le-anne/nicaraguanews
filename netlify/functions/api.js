const { getCachedArticles, listSources, sources } = require("../../server/news");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

function requestPath(event) {
  const raw = event.path || event.rawPath || "";
  // Support direct function URLs and rewritten /api/* paths.
  let path = raw.replace(/^https?:\/\/[^/]+/, "");
  path = path.replace(/^\/\.netlify\/functions\/api/, "");
  if (!path.startsWith("/")) path = `/${path}`;
  if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
  // Rewrites of /api/news → function splat "news" become /news;
  // also accept full /api/... paths if Netlify preserves them.
  if (path === "/news" || path === "/sources" || path === "/health") {
    return `/api${path}`;
  }
  return path || "/";
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

  if (event.httpMethod && event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const path = requestPath(event);
  const params = event.queryStringParameters || {};

  if (path === "/api/health" || path === "/health") {
    return json(200, { ok: true });
  }

  if (path === "/api/sources") {
    return json(200, listSources());
  }

  if (path === "/api/news" || path === "/") {
    try {
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
          sources: sources.map((s) => s.name),
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
  }

  return json(404, { error: "Not found", path });
};

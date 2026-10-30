const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Fetch aggregated Nicaragua news articles.
 * Returns an array of { title, url, source, publishedAt?, sourceId? }.
 * Always resolves to an array (empty on failure) so callers can map safely.
 */
export async function getArticles() {
  try {
    const response = await fetch(`${API_BASE}/api/news`);

    if (!response.ok) {
      console.error("News API error:", response.status, await response.text());
      return [];
    }

    const json = await response.json();

    if (Array.isArray(json)) {
      return json;
    }

    if (Array.isArray(json?.articles)) {
      return json.articles;
    }

    console.error("Unexpected news API response shape:", json);
    return [];
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

export async function getSources() {
  try {
    const response = await fetch(`${API_BASE}/api/sources`);
    if (!response.ok) return [];
    const json = await response.json();
    return Array.isArray(json) ? json : [];
  } catch (error) {
    console.error("Failed to fetch sources:", error);
    return [];
  }
}

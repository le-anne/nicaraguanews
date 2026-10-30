/**
 * Map feed ids and common publisher display names to a homepage domain
 * used for logo lookups when an article has no photo.
 */
const SOURCE_DOMAINS = {
  // Feed sourceIds
  confidencial: "confidencial.digital",
  "havana-times": "havanatimes.org",
  "tico-times": "ticotimes.net",
  "guardian-americas": "theguardian.com",
  "bbc-latam": "bbc.com",
  ap: "apnews.com",
  reuters: "reuters.com",
  bbc: "bbc.com",
  guardian: "theguardian.com",
  "al-jazeera": "aljazeera.com",
  "washington-post": "washingtonpost.com",

  // Common Google News publisher labels
  Confidencial: "confidencial.digital",
  "Confidencial Nicaragua": "confidencial.digital",
  "Havana Times": "havanatimes.org",
  "The Tico Times": "ticotimes.net",
  "The Guardian": "theguardian.com",
  Guardian: "theguardian.com",
  BBC: "bbc.com",
  "BBC News": "bbc.com",
  "Associated Press": "apnews.com",
  "AP News": "apnews.com",
  AP: "apnews.com",
  Reuters: "reuters.com",
  "Al Jazeera": "aljazeera.com",
  "The Washington Post": "washingtonpost.com",
  "Washington Post": "washingtonpost.com",
  "New York Times": "nytimes.com",
  "The New York Times": "nytimes.com",
  CNN: "cnn.com",
  NPR: "npr.org",
  "Wall Street Journal": "wsj.com",
  "Financial Times": "ft.com",
  Bloomberg: "bloomberg.com",
  Politico: "politico.com",
  "Foreign Policy": "foreignpolicy.com",
  "Human Rights Watch": "hrw.org",
  Amnesty: "amnesty.org",
  "Amnesty International": "amnesty.org",
};

const BLOCKED_LOGO_HOSTS = new Set([
  "news.google.com",
  "google.com",
  "www.google.com",
  "googleapis.com",
  "gstatic.com",
]);

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'");
}

const SOURCE_DOMAINS_NORMALIZED = Object.fromEntries(
  Object.entries(SOURCE_DOMAINS).map(([key, domain]) => [normalizeKey(key), domain])
);

function hostnameFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (!host || BLOCKED_LOGO_HOSTS.has(host) || host.endsWith(".google.com")) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

export function getSourceDomain(article) {
  if (!article) return null;

  const byId = SOURCE_DOMAINS_NORMALIZED[normalizeKey(article.sourceId)];
  if (byId) return byId;

  const byName = SOURCE_DOMAINS_NORMALIZED[normalizeKey(article.source)];
  if (byName) return byName;

  return hostnameFromUrl(article.url);
}

/**
 * Public logo icon for a publisher. Uses Google's favicon service (no API key).
 * Falls back to null when we cannot resolve a domain.
 */
export function getSourceLogoUrl(article) {
  const domain = getSourceDomain(article);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function getSourceInitials(sourceName) {
  const parts = String(sourceName || "News")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "N";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 7000;
const MICROLINK_TIMEOUT_MS = 10000;
const ENRICH_CONCURRENCY = 4;
const MAX_ENRICH = 48;

const LOGO_URL_RE =
  /logo|favicon|apple-touch|site-icon|brand[_-]?asset|placeholder|default[-_]share|sprite|avatar|\/plugins\/|gfl\.png|wordpress\.com\/.*gravatar|googleusercontent\.com\/.*[=/]s0-w\d+|og-default|default-meta|social[-_]?default/i;

function isUsableImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  if (LOGO_URL_RE.test(trimmed)) return false;
  if (trimmed.startsWith("data:")) return false;
  return true;
}

function absoluteUrl(maybeUrl, baseUrl) {
  try {
    return new URL(maybeUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

function firstImgFromHtml(html, baseUrl) {
  if (!html) return null;
  const matches = String(html).matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const match of matches) {
    const abs = absoluteUrl(match[1], baseUrl);
    if (isUsableImageUrl(abs)) return abs;
  }
  return null;
}

function imageFromRssItem(item, articleUrl) {
  if (item.enclosure?.url && /^image\//i.test(item.enclosure.type || "image/")) {
    const url = absoluteUrl(item.enclosure.url, articleUrl);
    if (isUsableImageUrl(url)) return url;
  }

  // Some feeds put the image URL on enclosure without a type.
  if (item.enclosure?.url && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(item.enclosure.url)) {
    const url = absoluteUrl(item.enclosure.url, articleUrl);
    if (isUsableImageUrl(url)) return url;
  }

  const media = []
    .concat(item.mediaContent || [])
    .concat(item.mediaThumbnail || []);
  for (const entry of media) {
    const candidate = entry?.$?.url || entry?.url || entry?.["$"]?.url;
    const abs = absoluteUrl(candidate, articleUrl);
    if (isUsableImageUrl(abs)) return abs;
  }

  return (
    firstImgFromHtml(item.contentEncoded || item["content:encoded"], articleUrl) ||
    firstImgFromHtml(item.content, articleUrl)
  );
}

function extractOgImage(html) {
  if (!html) return null;
  const patterns = [
    /property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i,
    /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i,
    /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const url = match[1].replace(/&amp;/g, "&").trim();
      if (isUsableImageUrl(url)) return url;
    }
  }
  return null;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!response.ok) return null;
    return {
      url: response.url,
      html: await response.text(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Microlink Open Graph API — reaches many publishers that block datacenter fetches.
 * Optional MICROLINK_API_KEY raises rate limits: https://microlink.io/docs/api/basics/authentication
 */
async function fetchMicrolinkImageOnce(articleUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MICROLINK_TIMEOUT_MS);
  try {
    const endpoint = new URL("https://api.microlink.io");
    endpoint.searchParams.set("url", articleUrl);
    endpoint.searchParams.set("meta", "true");

    const headers = {
      Accept: "application/json",
      "User-Agent": "NicaraguaNewsEnEnglish/1.0 (+https://github.com/le-anne/nicaraguanews)",
    };
    if (process.env.MICROLINK_API_KEY) {
      headers["x-api-key"] = process.env.MICROLINK_API_KEY;
    }

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers,
    });
    if (response.status === 429) return { retry: true, imageUrl: null };
    if (!response.ok) return { retry: false, imageUrl: null };

    const json = await response.json();
    if (json.status !== "success") {
      // Microlink uses fail for unreachable pages; retry once on transient fails.
      return { retry: json.status === "fail", imageUrl: null };
    }

    const imageUrl = json.data?.image?.url || null;
    return {
      retry: false,
      imageUrl: isUsableImageUrl(imageUrl) ? imageUrl : null,
    };
  } catch {
    return { retry: true, imageUrl: null };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMicrolinkImage(articleUrl) {
  const first = await fetchMicrolinkImageOnce(articleUrl);
  if (first.imageUrl) return first.imageUrl;
  if (!first.retry) return null;
  await new Promise((resolve) => setTimeout(resolve, 500));
  const second = await fetchMicrolinkImageOnce(articleUrl);
  return second.imageUrl;
}

async function resolveGoogleNewsUrl(articleUrl) {
  const articleId = articleUrl.split("/articles/")[1]?.split("?")[0];
  if (!articleId) return null;

  const page = await fetchText(
    `https://news.google.com/rss/articles/${articleId}?hl=en-US&gl=US&ceid=US:en`
  );
  if (!page?.html) return null;

  const signature = page.html.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const timestamp = page.html.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!signature || !timestamp) return null;

  const rpcInner = JSON.stringify([
    "garturlreq",
    [
      ["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1],
      "X",
      "X",
      1,
      [1, 1, 1],
      1,
      1,
      null,
      0,
      0,
      null,
      0,
    ],
    articleId,
    Number(timestamp),
    signature,
  ]);
  const fReq = JSON.stringify([[["Fbv4je", rpcInner, null, "generic"]]]);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "User-Agent": UA,
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: `f.req=${encodeURIComponent(fReq)}`,
      }
    );
    const text = await response.text();
    const match = text.match(/https?:\/\/(?!news\.google\.com)[^\\"'\s\]\[]{10,400}/);
    if (!match) return null;
    return match[0].replace(/\\u003d/g, "=").replace(/\\\//g, "/");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => run());
  await Promise.all(runners);
  return results;
}

async function enrichArticleImages(articles) {
  const targets = articles.slice(0, MAX_ENRICH);

  const enriched = await mapPool(targets, ENRICH_CONCURRENCY, async (article) => {
    let url = article.url;
    let imageUrl = article.imageUrl || null;

    if (/news\.google\.com\/.*articles\//i.test(url)) {
      const resolved = await resolveGoogleNewsUrl(url);
      if (resolved) url = resolved;
    }

    // 1) Direct HTML / og:image (fast when the publisher allows it)
    if (!imageUrl) {
      const page = await fetchText(url);
      if (page?.html) {
        imageUrl = extractOgImage(page.html);
        if (!imageUrl) {
          imageUrl = firstImgFromHtml(page.html, page.url || url);
        }
      }
    }

    // 2) Microlink metadata API — works for many bot-blocked publishers (AP, WaPo, Havana Times)
    if (!imageUrl) {
      imageUrl = await fetchMicrolinkImage(url);
    }

    return {
      ...article,
      url,
      imageUrl: isUsableImageUrl(imageUrl) ? imageUrl : null,
    };
  });

  return enriched.concat(articles.slice(MAX_ENRICH));
}

module.exports = {
  imageFromRssItem,
  enrichArticleImages,
  isUsableImageUrl,
  fetchMicrolinkImage,
};

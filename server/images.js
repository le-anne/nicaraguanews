const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 7000;
const ENRICH_CONCURRENCY = 5;
const MAX_ENRICH = 36;

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

    if (!imageUrl && /news\.google\.com\/.*articles\//i.test(url)) {
      const resolved = await resolveGoogleNewsUrl(url);
      if (resolved) url = resolved;
    }

    if (!imageUrl) {
      const page = await fetchText(url);
      if (page?.html) {
        imageUrl = extractOgImage(page.html);
        if (!imageUrl) {
          imageUrl = firstImgFromHtml(page.html, page.url || url);
        }
      }
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
};

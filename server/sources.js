/**
 * RSS sources for Nicaragua news in English.
 * Feeds marked filterNicaragua keep only items that mention Nicaragua (or related terms).
 */
module.exports = [
  {
    id: "confidencial",
    name: "Confidencial",
    url: "https://confidencial.digital/english/feed/",
    filterNicaragua: false,
  },
  {
    id: "havana-times",
    name: "Havana Times",
    url: "https://havanatimes.org/category/nicaragua/feed/",
    filterNicaragua: false,
  },
  {
    id: "google-news",
    name: "Google News",
    // Prefer politics/human-rights coverage over sports/weather noise.
    url: "https://news.google.com/rss/search?q=Nicaragua+(Ortega+OR+Murillo+OR+Managua+OR+politics+OR+%22human+rights%22+OR+sanctions)+when:14d&hl=en-US&gl=US&ceid=US:en",
    filterNicaragua: true,
    parsePublisherFromTitle: true,
  },
  {
    id: "ap",
    name: "Associated Press",
    url: "https://news.google.com/rss/search?q=Nicaragua+site:apnews.com+when:30d&hl=en-US&gl=US&ceid=US:en",
    filterNicaragua: true,
    parsePublisherFromTitle: true,
  },
  {
    id: "reuters",
    name: "Reuters",
    url: "https://news.google.com/rss/search?q=Nicaragua+(site:reuters.com+OR+site:reuters.tv)+when:30d&hl=en-US&gl=US&ceid=US:en",
    filterNicaragua: true,
    parsePublisherFromTitle: true,
  },
  {
    id: "bbc",
    name: "BBC",
    url: "https://news.google.com/rss/search?q=Nicaragua+(site:bbc.com+OR+site:bbc.co.uk)+when:30d&hl=en-US&gl=US&ceid=US:en",
    filterNicaragua: true,
    parsePublisherFromTitle: true,
  },
  {
    id: "guardian",
    name: "The Guardian",
    url: "https://news.google.com/rss/search?q=Nicaragua+site:theguardian.com+when:30d&hl=en-US&gl=US&ceid=US:en",
    filterNicaragua: true,
    parsePublisherFromTitle: true,
  },
  {
    id: "al-jazeera",
    name: "Al Jazeera",
    url: "https://news.google.com/rss/search?q=Nicaragua+site:aljazeera.com+when:30d&hl=en-US&gl=US&ceid=US:en",
    filterNicaragua: true,
    parsePublisherFromTitle: true,
  },
  {
    id: "washington-post",
    name: "Washington Post",
    url: "https://news.google.com/rss/search?q=Nicaragua+site:washingtonpost.com+when:30d&hl=en-US&gl=US&ceid=US:en",
    filterNicaragua: true,
    parsePublisherFromTitle: true,
  },
];

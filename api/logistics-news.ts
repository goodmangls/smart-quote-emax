import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RssFeed {
  url: string;
  source: string;
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

const RSS_FEEDS: RssFeed[] = [
  // English - Ocean & General Freight
  { url: 'https://www.freightwaves.com/feed', source: 'FreightWaves' },
  { url: 'https://theloadstar.com/feed', source: 'The Loadstar' },
  { url: 'https://gcaptain.com/feed', source: 'gCaptain' },
  // English - Air Cargo
  { url: 'https://www.aircargonews.net/feed', source: 'Air Cargo News' },
  { url: 'https://aircargoworld.com/feed', source: 'Air Cargo World' },
  // Korean - Ocean & Air Logistics
  { url: 'https://www.klnews.co.kr/rss/allArticle.xml', source: '물류신문' },
  { url: 'https://www.maritimepress.co.kr/rss/allArticle.xml', source: '해양한국' },
  { url: 'https://www.spnews.co.kr/rss/allArticle.xml', source: '해운항만물류' },
];

function extractItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/);
    const link = block.match(/<link>(.*?)<\/link>/);
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/);

    if (title && link) {
      items.push({
        title: (title[1] || title[2] || '').trim(),
        link: link[1].trim(),
        pubDate: pubDate ? pubDate[1].trim() : new Date().toISOString(),
        source,
      });
    }
  }

  return items;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'SmartQuote/1.0 RSS Reader' },
        });
        clearTimeout(timeout);

        if (!response.ok) return [];
        const xml = await response.text();
        return extractItems(xml, feed.source);
      } catch {
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const allItems = results
      .flat()
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 15);

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300');
    return res.status(200).json({
      items: allItems,
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return res.status(500).json({
      error: 'Failed to fetch RSS feeds',
      items: [],
      fetchedAt: new Date().toISOString(),
    });
  }
}

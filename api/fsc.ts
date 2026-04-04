import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const upsUrl = 'https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page';
    
    // Use native fetch (Node 18+)
    const res = await fetch(upsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
        // Try without .page extension if it fails, or handle redirect
        throw new Error(`Failed to fetch UPS page: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    
    // We are looking for "International Air Export" rate.
    // The structure is often a table. We look for the text and then the next percentage number.
    // Example target text: "International Air Export" ... "32.00%"
    // Regex: Match "International Air Export" (case insensitive), then any chars/newlines, then a percent value.
    // Limit the search distance to avoid false positives? 
    // Usually it's within the same table row.
    
    const regex = /International Air Export.*?(\d{1,2}\.\d{2})%/is;
    const match = html.match(regex);

    if (match && match[1]) {
      const rate = parseFloat(match[1]);
      return response.status(200).json({
        rate,
        effectiveDate: new Date().toISOString().split('T')[0], 
        source: 'ups_scrape'
      });
    }

    return response.status(404).json({
      error: 'Could not extract FSC rate from UPS page',
      details: 'Regex match failed - page structure may have changed'
    });

  } catch (error) {
    console.error('Error fetching FSC:', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    const naverUrl = 'https://finance.naver.com/marketindex/exchangeDetail.naver?marketindexCd=FX_USDKRW';
    
    // Use native fetch (Node 18+)
    // Naver Finance might block simple fetches without headers
    const res = await fetch(naverUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!res.ok) {
        return response.status(res.status).json({
          error: `Failed to fetch Naver Finance page: ${res.statusText}`
        });
    }

    const html = await res.text();
    
    // Detailed Parsing for "송금 보내실때" (Telegraphic Transfer Sending - TTS)
    // The Naver Finance page structure usually has a table or list
    // Look for text "보내실때" or "송금"
    // The structure often looks like: 
    // <th class="th_ex6"><span>보내실때</span></th>
    // ...
    // <td>...</td>
    
    // Or we can look for specific class names if we know them, but text regex is safer against layout tweaks.
    // Let's try to match "보내실때" and then find the next number.
    // Be careful not to match the "Cash Buying/Selling" rates which are different.
    
    // Using a more robust regex that looks for the specific label "보내실때" (Sending)
    // then captures the digits.
    // Example: "보내실때" ... 1,445.50
    
    const sendingRateRegex = /보내실때.*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/s;
    const match = html.match(sendingRateRegex);

    if (match && match[1]) {
      // Remove commas
      const rawRate = match[1].replace(/,/g, '');
      const rate = parseFloat(rawRate);
      
      if (!isNaN(rate)) {
        return response.status(200).json({
          rate,
          effectiveDate: new Date().toISOString(), 
          source: 'naver_finance_scrape'
        });
      }
    }

    // Fallback: Try searching for "TTS" or "전신환매도율" if the label is different
    const ttsRegex = /전신환매도율.*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/s;
    const fallbackMatch = html.match(ttsRegex);
    
    if (fallbackMatch && fallbackMatch[1]) {
        const rawRate = fallbackMatch[1].replace(/,/g, '');
        const rate = parseFloat(rawRate);
        return response.status(200).json({
          rate,
          effectiveDate: new Date().toISOString(),
          source: 'naver_finance_scrape_fallback'
        });
    }

    return response.status(404).json({
      error: 'Could not extract Sending (TTS) rate from Naver Finance page',
      details: 'Regex match failed'
    });

  } catch (error) {
    console.error('Error fetching Exchange Rate:', error);
    return response.status(500).json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

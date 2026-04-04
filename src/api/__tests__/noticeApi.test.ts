import { fetchLogisticsNews } from '../noticeApi';

vi.mock('../apiClient', () => ({
  request: vi.fn(),
}));

import { request } from '../apiClient';
const mockRequest = vi.mocked(request);

describe('fetchLogisticsNews', () => {
  it('returns news items from backend API', async () => {
    const mockNews = [
      { title: 'Port congestion easing', link: 'https://example.com/1', pubDate: '2026-03-08T00:00:00Z', source: 'FreightWaves' },
      { title: 'IATA cargo update', link: 'https://example.com/2', pubDate: '2026-03-07T00:00:00Z', source: 'IATA' },
    ];
    mockRequest.mockResolvedValue(mockNews);

    const result = await fetchLogisticsNews();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expect.objectContaining({
      title: 'Port congestion easing',
      source: 'FreightWaves',
    }));
  });

  it('returns empty array on API error', async () => {
    mockRequest.mockRejectedValue(new Error('Network error'));

    const result = await fetchLogisticsNews();
    expect(result).toEqual([]);
  });

  it('returns a promise (async interface)', async () => {
    mockRequest.mockResolvedValue([]);
    const promise = fetchLogisticsNews();
    expect(promise).toBeInstanceOf(Promise);
    await promise;
  });
});

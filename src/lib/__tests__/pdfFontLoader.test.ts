import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { jsPDF } from 'jspdf';
import { loadKoreanFont, resetFontCache } from '../pdfFontLoader';

vi.mock('@sentry/browser', () => ({
  captureException: vi.fn(),
}));

const TTF_HEADER = new Uint8Array([0x00, 0x01, 0x00, 0x00]);
const BASE64_FIXTURE = 'AAEAAA==';

function makeFontBlob(): Blob {
  return new Blob([TTF_HEADER], { type: 'font/ttf' });
}

function okFetch(): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    blob: async () => makeFontBlob(),
  });
}

function failFetch(status = 404): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: 'Not Found',
    blob: async () => new Blob(),
  });
}

function makeDoc(): jsPDF {
  return {
    addFileToVFS: vi.fn(),
    addFont: vi.fn(),
    setFont: vi.fn(),
  } as unknown as jsPDF;
}

describe('pdfFontLoader', () => {
  beforeEach(() => {
    resetFontCache();
    vi.restoreAllMocks();
  });

  it('fetches font once and registers it on the document', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);

    const doc = makeDoc();
    await loadKoreanFont(doc);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/assets/fonts/NotoSansKR-Regular.ttf');
    expect(doc.addFileToVFS).toHaveBeenCalledWith('NotoSansKR-Regular.ttf', BASE64_FIXTURE);
    expect(doc.addFont).toHaveBeenCalledWith('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
    expect(doc.setFont).toHaveBeenCalledWith('NotoSansKR');
  });

  it('does not fetch again when called twice with the same document', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);

    const doc = makeDoc();
    await loadKoreanFont(doc);
    await loadKoreanFont(doc);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(doc.addFileToVFS).toHaveBeenCalledTimes(1);
    expect(doc.setFont).toHaveBeenCalledTimes(2);
  });

  it('reuses cached base64 for a new document without refetching', async () => {
    const fetchMock = okFetch();
    vi.stubGlobal('fetch', fetchMock);

    const docA = makeDoc();
    await loadKoreanFont(docA);

    const docB = makeDoc();
    await loadKoreanFont(docB);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(docB.addFileToVFS).toHaveBeenCalledWith('NotoSansKR-Regular.ttf', BASE64_FIXTURE);
  });

  it('falls back to Helvetica and reports to Sentry on fetch failure', async () => {
    const { captureException } = await import('@sentry/browser');
    vi.stubGlobal('fetch', failFetch(404));

    const doc = makeDoc();
    await loadKoreanFont(doc);

    expect(doc.setFont).not.toHaveBeenCalled();
    expect(doc.addFont).not.toHaveBeenCalled();
    expect(captureException).toHaveBeenCalledTimes(1);
  });

  it('skips refetching during the cooldown window after a failure', async () => {
    const fetchMock = failFetch(500);
    vi.stubGlobal('fetch', fetchMock);

    const doc = makeDoc();
    await loadKoreanFont(doc);
    await loadKoreanFont(makeDoc());

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries fetch after cooldown elapses', async () => {
    const now = Date.now();
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        blob: async () => new Blob(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        blob: async () => makeFontBlob(),
      });
    vi.stubGlobal('fetch', fetchMock);

    await loadKoreanFont(makeDoc());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    dateNowSpy.mockReturnValue(now + 61_000);

    const doc = makeDoc();
    await loadKoreanFont(doc);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(doc.setFont).toHaveBeenCalledWith('NotoSansKR');
  });
});

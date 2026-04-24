import type { jsPDF } from 'jspdf';
import * as Sentry from '@sentry/browser';

const FONT_URL = '/assets/fonts/NotoSansKR-Regular.ttf';
const FONT_VFS_NAME = 'NotoSansKR-Regular.ttf';
const FONT_FAMILY = 'NotoSansKR';
const RETRY_COOLDOWN_MS = 60_000;

let cachedBase64: string | null = null;
let registeredDocs = new WeakSet<jsPDF>();
let lastErrorAt: number | null = null;

async function fetchFontAsBase64(): Promise<string> {
  const res = await fetch(FONT_URL);
  if (!res.ok) {
    throw new Error(`Font fetch failed: ${res.status} ${res.statusText}`);
  }
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('FileReader produced non-string result'));
        return;
      }
      const commaIdx = result.indexOf(',');
      if (commaIdx < 0) {
        reject(new Error('Data URL missing base64 payload'));
        return;
      }
      resolve(result.slice(commaIdx + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Load Noto Sans KR font into a jsPDF document.
 *
 * On first call per session fetches the TTF from /assets/fonts/ and caches the
 * base64 payload in module scope. On subsequent calls reuses the cache. On
 * fetch failure falls back to jsPDF's default Helvetica and enters a 60s
 * cooldown before retrying, reporting the error to Sentry.
 */
export async function loadKoreanFont(doc: jsPDF): Promise<void> {
  if (registeredDocs.has(doc)) {
    doc.setFont(FONT_FAMILY);
    return;
  }

  if (!cachedBase64) {
    if (lastErrorAt && Date.now() - lastErrorAt < RETRY_COOLDOWN_MS) {
      // Cooldown active — stay on Helvetica fallback.
      return;
    }
    try {
      cachedBase64 = await fetchFontAsBase64();
      lastErrorAt = null;
    } catch (error) {
      lastErrorAt = Date.now();
      Sentry.captureException(error, {
        level: 'warning',
        tags: { component: 'pdfFontLoader' },
      });
      return;
    }
  }

  doc.addFileToVFS(FONT_VFS_NAME, cachedBase64);
  doc.addFont(FONT_VFS_NAME, FONT_FAMILY, 'normal');
  doc.setFont(FONT_FAMILY);
  registeredDocs.add(doc);
}

/** Reset caches (for testing). */
export function resetFontCache(): void {
  cachedBase64 = null;
  lastErrorAt = null;
  registeredDocs = new WeakSet<jsPDF>();
}

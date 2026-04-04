import type { jsPDF } from 'jspdf';

let fontLoaded = false;

/**
 * Lazy-load Noto Sans KR font into jsPDF document.
 * Font module (~3MB base64) is dynamically imported on first use only.
 */
export async function loadKoreanFont(doc: jsPDF): Promise<void> {
  if (fontLoaded) {
    doc.setFont('NotoSansKR');
    return;
  }

  const fontModule = await import('@/assets/fonts/NotoSansKR-Regular-base64');
  doc.addFileToVFS('NotoSansKR-Regular.ttf', fontModule.default);
  doc.addFont('NotoSansKR-Regular.ttf', 'NotoSansKR', 'normal');
  doc.setFont('NotoSansKR');
  fontLoaded = true;
}

/** Reset font cache (for testing) */
export function resetFontCache(): void {
  fontLoaded = false;
}

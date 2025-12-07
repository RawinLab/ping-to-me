const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Tracks a bio page view event.
 * Uses sessionStorage to ensure only one page_view per session.
 *
 * @param pageId - The bio page ID
 */
export function trackBioPageView(pageId: string): void {
  const sessionKey = `bio_viewed_${pageId}`;
  if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
    sessionStorage.setItem(sessionKey, 'true');
    navigator.sendBeacon(
      `${API_URL}/biopages/${pageId}/track`,
      JSON.stringify({
        eventType: 'page_view',
        referrer: document.referrer || undefined
      })
    );
  }
}

/**
 * Tracks a bio link click event.
 *
 * @param pageId - The bio page ID
 * @param linkId - The bio link ID that was clicked
 */
export function trackBioLinkClick(pageId: string, linkId: string): void {
  if (typeof window !== 'undefined') {
    navigator.sendBeacon(
      `${API_URL}/biopages/${pageId}/track`,
      JSON.stringify({
        eventType: 'link_click',
        bioLinkId: linkId,
        referrer: document.referrer || undefined
      })
    );
  }
}

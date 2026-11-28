// GA4 conversion event tracking.
// GA4 recommended events: sign_up, login, begin_checkout, purchase.
// Mark these as "key events" in GA4 Admin → Events to build the funnel.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params)
  }
}

import type { CookieConsent } from './cookieConsent';

const MEASUREMENT_ID = 'G-RMBXWLR658';
const SCRIPT_ID = 'dudo-gtag-script';

const DEFAULT_CONSENT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
} as const;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __dudoAnalyticsConfigured?: boolean;
  }
}

function ensureGtagStub(): void {
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
  }
}

function ensureAnalyticsScript(): void {
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

function updateConsentMode(granted: boolean): void {
  if (!window.gtag) return;

  window.gtag('consent', 'update', {
    ad_storage: DEFAULT_CONSENT.ad_storage,
    ad_user_data: DEFAULT_CONSENT.ad_user_data,
    ad_personalization: DEFAULT_CONSENT.ad_personalization,
    analytics_storage: granted ? 'granted' : 'denied',
  });
}

export function applyAnalyticsConsent(consent: CookieConsent | null): void {
  ensureGtagStub();

  if (!window.__dudoAnalyticsConfigured) {
    window.gtag?.('consent', 'default', DEFAULT_CONSENT);
    window.gtag?.('js', new Date());
    window.gtag?.('config', MEASUREMENT_ID, { send_page_view: false });
    window.__dudoAnalyticsConfigured = true;
  }

  if (consent === null) {
    return;
  }

  ensureAnalyticsScript();
  updateConsentMode(consent === 'all');
}

export function trackPageView(path: string, title: string): void {
  if (!window.__dudoAnalyticsConfigured || !window.gtag) {
    return;
  }

  window.gtag('event', 'page_view', {
    page_title: title,
    page_path: path,
    page_location: `${window.location.origin}${path}`,
  });
}

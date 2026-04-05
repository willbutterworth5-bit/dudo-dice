import type { CookieConsent } from './cookieConsent';

const MEASUREMENT_ID = 'G-RMBXWLR658';
const SCRIPT_ID = 'dudo-gtag-script';
const DISABLE_KEY = `ga-disable-${MEASUREMENT_ID}`;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __dudoAnalyticsConfigured?: boolean;
    [DISABLE_KEY]?: boolean;
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
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
  });
}

export function applyAnalyticsConsent(consent: CookieConsent | null): void {
  ensureGtagStub();

  const granted = consent === 'all';
  window[DISABLE_KEY] = !granted;

  if (!granted) {
    updateConsentMode(false);
    return;
  }

  ensureAnalyticsScript();
  updateConsentMode(true);

  if (!window.__dudoAnalyticsConfigured) {
    window.gtag?.('js', new Date());
    window.gtag?.('config', MEASUREMENT_ID, { send_page_view: false });
    window.__dudoAnalyticsConfigured = true;
  }
}

export function trackPageView(path: string, title: string): void {
  if (window[DISABLE_KEY] || !window.__dudoAnalyticsConfigured || !window.gtag) {
    return;
  }

  window.gtag('event', 'page_view', {
    page_title: title,
    page_path: path,
    page_location: `${window.location.origin}${path}`,
  });
}

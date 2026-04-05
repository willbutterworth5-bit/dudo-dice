import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { applyAnalyticsConsent, trackPageView } from '../utils/analytics';
import { COOKIE_CONSENT_EVENT, getConsent, type CookieConsent } from '../utils/cookieConsent';

export default function AnalyticsManager() {
  const location = useLocation();
  const [consent, setConsent] = useState<CookieConsent | null>(() => getConsent());

  useEffect(() => {
    applyAnalyticsConsent(consent);
  }, [consent]);

  useEffect(() => {
    const handleConsentChanged = (event: Event) => {
      const nextConsent = (event as CustomEvent<CookieConsent>).detail ?? getConsent();
      setConsent(nextConsent);
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentChanged);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsentChanged);
  }, []);

  useEffect(() => {
    if (consent === null) return;

    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path, document.title);
  }, [consent, location.hash, location.pathname, location.search]);

  return null;
}

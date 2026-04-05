export type CookieConsent = 'essential' | 'all';

const KEY = 'dudo-cookie-consent';
const TS_KEY = 'dudo-cookie-consent-ts';

export function getConsent(): CookieConsent | null {
  const v = localStorage.getItem(KEY);
  if (v === 'essential' || v === 'all') return v;
  return null;
}

export function setConsent(choice: CookieConsent): void {
  localStorage.setItem(KEY, choice);
  localStorage.setItem(TS_KEY, new Date().toISOString());
}

export function hasConsent(): boolean {
  return getConsent() !== null;
}

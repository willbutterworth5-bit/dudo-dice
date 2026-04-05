export type CookieConsent = 'essential' | 'all';

const KEY = 'dudo-cookie-consent';

export function getConsent(): CookieConsent | null {
  const v = localStorage.getItem(KEY);
  if (v === 'essential' || v === 'all') return v;
  return null;
}

export function setConsent(choice: CookieConsent): void {
  localStorage.setItem(KEY, choice);
}

export function hasConsent(): boolean {
  return getConsent() !== null;
}

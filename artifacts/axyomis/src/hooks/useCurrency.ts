import { useEffect, useState } from 'react';

export type CurrencyCode = 'USD' | 'NPR' | 'INR' | 'GBP' | 'AUD' | 'CAD' | 'EUR';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  country: string;
  flag: string;
}

const CURRENCY_BY_TIMEZONE: Record<string, CurrencyInfo> = {
  'Asia/Kathmandu': { code: 'NPR', symbol: 'रू', country: 'Nepal', flag: '🇳🇵' },
  'Asia/Kolkata': { code: 'INR', symbol: '₹', country: 'India', flag: '🇮🇳' },
  'Asia/Calcutta': { code: 'INR', symbol: '₹', country: 'India', flag: '🇮🇳' },
  'Europe/London': { code: 'GBP', symbol: '£', country: 'United Kingdom', flag: '🇬🇧' },
  'Europe/Belfast': { code: 'GBP', symbol: '£', country: 'United Kingdom', flag: '🇬🇧' },
  'Australia/Sydney': { code: 'AUD', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
  'Australia/Melbourne': { code: 'AUD', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
  'Australia/Brisbane': { code: 'AUD', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
  'Australia/Perth': { code: 'AUD', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
  'Australia/Adelaide': { code: 'AUD', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
  'America/Toronto': { code: 'CAD', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
  'America/Vancouver': { code: 'CAD', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
  'America/Montreal': { code: 'CAD', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
  'America/Edmonton': { code: 'CAD', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
  'America/Halifax': { code: 'CAD', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
  'America/Winnipeg': { code: 'CAD', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
};

const DEFAULT_CURRENCY: CurrencyInfo = { code: 'USD', symbol: '$', country: 'United States', flag: '🇺🇸' };

export interface TierPricing {
  scholar: number;
  premium: number;
  elite: number;
}

// Locally-priced tiers — calibrated to be affordable in each region rather than
// strict FX conversion. Numbers chosen for monthly subscriptions students can
// realistically pay in each market.
const PRICING: Record<CurrencyCode, TierPricing> = {
  USD: { scholar: 4.99, premium: 9.99, elite: 19.99 },
  NPR: { scholar: 399, premium: 799, elite: 1599 },
  INR: { scholar: 249, premium: 499, elite: 999 },
  GBP: { scholar: 3.99, premium: 7.99, elite: 15.99 },
  AUD: { scholar: 7.99, premium: 14.99, elite: 29.99 },
  CAD: { scholar: 6.99, premium: 13.99, elite: 27.99 },
  EUR: { scholar: 4.49, premium: 8.99, elite: 17.99 },
};

function detectFromTimezone(): CurrencyInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && CURRENCY_BY_TIMEZONE[tz]) return CURRENCY_BY_TIMEZONE[tz];
    if (tz?.startsWith('Australia/')) return { code: 'AUD', symbol: 'A$', country: 'Australia', flag: '🇦🇺' };
    if (tz?.startsWith('America/') && /Toronto|Vancouver|Montreal|Edmonton|Halifax|Winnipeg|St_Johns|Regina/.test(tz))
      return { code: 'CAD', symbol: 'C$', country: 'Canada', flag: '🇨🇦' };
    if (tz?.startsWith('Europe/') && !/London|Belfast/.test(tz))
      return { code: 'EUR', symbol: '€', country: 'Europe', flag: '🇪🇺' };
  } catch {
    // ignore
  }
  return DEFAULT_CURRENCY;
}

export function formatPrice(amount: number, info: CurrencyInfo): string {
  // Whole-rupee markets render without decimals
  const noDecimals = info.code === 'NPR' || info.code === 'INR';
  const value = noDecimals ? Math.round(amount).toLocaleString('en-IN') : amount.toFixed(2);
  return `${info.symbol}${value}`;
}

export function useCurrency() {
  const [info, setInfo] = useState<CurrencyInfo>(() => detectFromTimezone());

  // Async refinement using a free IP geolocation service (best-effort, cached)
  useEffect(() => {
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem('axyomis_geo_currency') : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CurrencyInfo;
        if (parsed?.code) setInfo(parsed);
        return;
      } catch { /* ignore */ }
    }
    const controller = new AbortController();
    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        const countryCode = (data.country_code || '').toUpperCase();
        const map: Record<string, CurrencyInfo> = {
          NP: { code: 'NPR', symbol: 'रू', country: 'Nepal', flag: '🇳🇵' },
          IN: { code: 'INR', symbol: '₹', country: 'India', flag: '🇮🇳' },
          GB: { code: 'GBP', symbol: '£', country: 'United Kingdom', flag: '🇬🇧' },
          AU: { code: 'AUD', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
          CA: { code: 'CAD', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
          US: { code: 'USD', symbol: '$', country: 'United States', flag: '🇺🇸' },
        };
        const resolved = map[countryCode];
        if (resolved) {
          setInfo(resolved);
          try { window.localStorage.setItem('axyomis_geo_currency', JSON.stringify(resolved)); } catch { /* ignore */ }
        }
      })
      .catch(() => { /* fall back to timezone detection */ });
    return () => controller.abort();
  }, []);

  const pricing = PRICING[info.code];
  return {
    currency: info,
    pricing,
    format: (amount: number) => formatPrice(amount, info),
    setCurrency: setInfo,
  };
}

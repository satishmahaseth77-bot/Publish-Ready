import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, DollarSign, BarChart3, Clock3 } from 'lucide-react';

const initialMarkets = [
  { label: 'Global Tech', value: 11.2, change: 1.8, symbol: 'GTX' },
  { label: 'Bio Intelligence', value: 8.7, change: -0.6, symbol: 'BIO' },
  { label: 'Energy Pulse', value: 6.4, change: 2.1, symbol: 'NRG' },
  { label: 'Crypto Index', value: 12.9, change: -0.4, symbol: 'CRX' },
];

export const MarketTicker: React.FC = () => {
  const [markets, setMarkets] = useState(initialMarkets);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMarkets((current) => current.map((item) => {
        const delta = (Math.random() - 0.5) * 1.2;
        const value = Number((item.value + delta).toFixed(2));
        return { ...item, value: Math.max(1, value), change: Number((delta).toFixed(2)) };
      }));
    }, 9000);
    return () => window.clearInterval(interval);
  }, []);

  const summary = useMemo(() => {
    const positive = markets.filter((item) => item.change >= 0).length;
    return `${positive}/${markets.length} markets trending up`;
  }, [markets]);

  return (
    <div className="rounded-[32px] border border-white/10 bg-[#08101c]/95 p-6 shadow-[0_0_70px_rgba(0,0,0,0.22)] backdrop-blur-3xl overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Finance & Market Ticker</p>
          <h3 className="text-2xl font-bold tracking-tight">Market Pulse</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-cyan-200">
          <DollarSign className="w-4 h-4" /> {summary}
        </div>
      </div>
      <div className="grid gap-4">
        {markets.map((market) => (
          <div key={market.symbol} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{market.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{market.value.toFixed(2)}%</p>
              </div>
              <div className={`inline-flex items-center rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.35em] ${market.change >= 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                <TrendingUp className="w-4 h-4" /> {market.change >= 0 ? `+${market.change}` : market.change}
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${Math.min(100, market.value * 8)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { Brain, Sparkles, Activity, Zap } from 'lucide-react';

const states = [
  { label: 'Listening', color: 'from-cyan-400 to-blue-600', description: 'Receiving your voice command with ultra-low latency.' },
  { label: 'Analyzing', color: 'from-blue-500 to-violet-600', description: 'Synthesizing the neural model and cross-referencing knowledge bases.' },
  { label: 'Speaking', color: 'from-emerald-400 to-teal-500', description: 'Delivering a response in polished, executive tone.' },
  { label: 'Idle', color: 'from-slate-600 to-slate-800', description: 'Awaiting your next command with full system awareness.' },
];

export const AstraCore: React.FC = () => {
  const [activeStateIndex, setActiveStateIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStateIndex((index) => (index + 1) % states.length);
    }, 5200);
    return () => window.clearInterval(interval);
  }, []);

  const active = useMemo(() => states[activeStateIndex], [activeStateIndex]);

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] rounded-[32px] border border-white/10 bg-[#08101e]/95 p-6 shadow-[0_0_60px_rgba(34,211,238,0.16)] backdrop-blur-3xl overflow-hidden">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Astra Neural Core</p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Voice & Orb Command Center</h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-cyan-300">
            <Brain className="w-4 h-4 text-cyan-300" /> Core Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Neural Load', value: '92%', accent: 'from-cyan-400 to-blue-500' },
            { label: 'Response Confidence', value: '98%', accent: 'from-emerald-400 to-teal-500' },
            { label: 'Latency', value: '74ms', accent: 'from-violet-500 to-fuchsia-500' },
            { label: 'Session Uptime', value: '5h 14m', accent: 'from-slate-500 to-slate-700' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-2">{stat.label}</p>
              <div className="flex items-end justify-between gap-4">
                <span className="text-2xl font-semibold text-white">{stat.value}</span>
                <span className={`inline-flex h-3 w-3 rounded-full bg-gradient-to-br ${stat.accent}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-slate-300 leading-relaxed">
          <p className="uppercase tracking-[0.32em] text-[10px] text-slate-500 mb-2">Neural Pulse</p>
          <p className="text-sm">{active.description}</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-[#02050c] p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-violet-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative flex h-[240px] w-[240px] items-center justify-center rounded-full bg-[#071018]/80 border border-cyan-300/20 shadow-[0_0_60px_rgba(34,211,238,0.25)]">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_40%)]" />
            <div className="absolute inset-7 rounded-full border border-cyan-400/15 animate-pulse" />
            <div className="absolute inset-16 rounded-full border border-white/10" />
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_40px_rgba(34,211,238,0.35)] animate-pulseSlow">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),rgba(34,211,238,0.3)_25%,rgba(34,211,238,0.05)_60%)] mix-blend-screen" />
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-[11px] uppercase tracking-[0.35em] text-slate-400/90">{active.label}</div>
          </div>

          <button className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-white/5 px-5 py-3 text-[12px] uppercase tracking-[0.35em] text-cyan-200 transition hover:bg-cyan-500/10">
            <Sparkles className="w-4 h-4" /> Activate Hologram
          </button>
          <div className="grid grid-cols-3 gap-3 text-center">
            {['Listen', 'Compute', 'Respond'].map((step) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-1">{step}</p>
                <span className="text-lg font-bold text-white">{step === 'Listen' ? '✔' : step === 'Compute' ? '▣' : '➤'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

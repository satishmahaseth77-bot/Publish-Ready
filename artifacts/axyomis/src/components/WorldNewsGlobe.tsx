import React, { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';
import { Globe2, MessageCircle, Layers } from 'lucide-react';

const newsEvents = [
  {
    id: 'un-summit',
    title: 'Global Education Summit',
    location: [38.9072, -77.0369],
    region: 'Washington D.C.',
    summary: 'Delegates from 120 nations discuss AI-driven learning, climate science education, and curriculum resilience.',
    category: 'Education',
  },
  {
    id: 'arctic-data',
    title: 'Polar Climate Alert',
    location: [82.8628, -135.0000],
    region: 'Arctic Circle',
    summary: 'Satellite systems record accelerated ice melt linked to global energy policy shifts.',
    category: 'Climate',
  },
  {
    id: 'med-innovation',
    title: 'Quantum Bio Imaging',
    location: [51.5074, -0.1278],
    region: 'London',
    summary: 'A new imaging protocol promises real-time cellular diagnostics in remote clinics.',
    category: 'Health',
  },
  {
    id: 'market-momentum',
    title: 'Market Pulse: Tech Surge',
    location: [37.7749, -122.4194],
    region: 'San Francisco',
    summary: 'AI chip and green energy equities continue their upward run amid global demand.',
    category: 'Finance',
  },
  {
    id: 'space-launch',
    title: 'Civilian Orbital Launch',
    location: [28.3968, -80.6057],
    region: 'Kennedy Space Center',
    summary: 'A new reusable capsule begins routine orbital data relays for research platforms.',
    category: 'Space',
  },
];

export const WorldNewsGlobe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(newsEvents[0]);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    const onResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        width = canvasRef.current.parentElement.offsetWidth;
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: window.devicePixelRatio || 1,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 2.2,
      mapSamples: 22000,
      mapBrightness: 0,
      baseColor: [0.04, 0.08, 0.14],
      markerColor: [0.26, 0.95, 1],
      glowColor: [0.05, 0.55, 0.78],
      markers: newsEvents.map((event) => ({ location: event.location, size: 0.02 })),
      onRender: (state: any) => {
        if (document.visibilityState === 'visible') {
          state.phi = phi;
          phi += 0.007;
        }
        state.width = width * 2;
        state.height = width * 2;
      },
    } as any);

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr] rounded-[32px] border border-white/10 bg-[#05101c]/95 p-6 shadow-[0_0_80px_rgba(0,0,0,0.25)] backdrop-blur-3xl overflow-hidden">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Holographic World News</p>
            <h3 className="text-3xl font-bold tracking-tight">Interactive Globe Intelligence</h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-slate-300">
            <Globe2 className="w-4 h-4" /> Live Briefing
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {newsEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelected(event)}
              className={`rounded-3xl border px-4 py-4 text-left transition ${selected.id === event.id ? 'border-cyan-400/30 bg-cyan-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/20 hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{event.category}</p>
              </div>
              <p className="font-semibold text-sm leading-snug">{event.title}</p>
              <p className="text-[11px] text-slate-400 mt-2">{event.region}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#02060f]/90 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%)] pointer-events-none" />
        <div className="relative z-10 aspect-square">
          <canvas ref={canvasRef} className="w-full h-full rounded-[28px] bg-[#02060f]" />
        </div>
        <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Focused Event</p>
              <h4 className="mt-2 text-xl font-semibold text-white">{selected.title}</h4>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-2 text-[11px] uppercase tracking-[0.35em] text-cyan-200">
              <MessageCircle className="w-3 h-3" /> {selected.region}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{selected.summary}</p>
          <div className="mt-5 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-500">
            <span>Hologram Nodes</span>
            <span>{selected.category}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

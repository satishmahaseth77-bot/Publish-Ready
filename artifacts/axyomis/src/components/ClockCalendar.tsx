import React, { useEffect, useState } from 'react';
import { Clock3, CalendarDays, CalendarCheck, Bell } from 'lucide-react';

const schedule = [
  { time: '08:30', label: 'Morning Revision', note: 'Physics formulas and quick concept maps' },
  { time: '11:00', label: 'Holographic News Brief', note: 'World news update and current affairs' },
  { time: '14:00', label: 'AI Study Drill', note: 'Biology simulation and active recall session' },
  { time: '18:30', label: 'Review & Reflect', note: 'Daily error journal and concept review' },
];

export const ClockCalendar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rounded-[32px] border border-white/10 bg-[#050b14]/95 p-6 shadow-[0_0_60px_rgba(0,0,0,0.2)] backdrop-blur-3xl overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Digital Clock & Calendar</p>
          <h3 className="text-2xl font-bold tracking-tight">Command Schedule</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-blue-200">
          <Clock3 className="w-4 h-4" /> Real-time
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Local Time</p>
              <p className="mt-3 text-5xl font-bold text-white">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            </div>
            <div className="rounded-3xl bg-[#08151f] p-3 text-cyan-300">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">{time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Upcoming Objectives</p>
            <Bell className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="space-y-3">
            {schedule.map((item) => (
              <div key={item.time} className="rounded-3xl border border-white/10 bg-[#020611] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.time}</span>
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-cyan-200">{item.label}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

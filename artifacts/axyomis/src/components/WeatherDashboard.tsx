import React, { useEffect, useState } from 'react';
import { CloudRain, Sun, Cloud, Wind, Thermometer, CalendarDays } from 'lucide-react';

const weatherNames: Record<number, { label: string; icon: React.ReactNode }> = {
  0: { label: 'Clear', icon: <Sun className="w-5 h-5" /> },
  1: { label: 'Mainly Clear', icon: <Sun className="w-5 h-5" /> },
  2: { label: 'Partly Cloudy', icon: <Cloud className="w-5 h-5" /> },
  3: { label: 'Cloudy', icon: <Cloud className="w-5 h-5" /> },
  45: { label: 'Fog', icon: <CloudRain className="w-5 h-5" /> },
  48: { label: 'Depositing Rime Fog', icon: <CloudRain className="w-5 h-5" /> },
  51: { label: 'Drizzle', icon: <CloudRain className="w-5 h-5" /> },
  61: { label: 'Rain', icon: <CloudRain className="w-5 h-5" /> },
  80: { label: 'Rain Shower', icon: <CloudRain className="w-5 h-5" /> },
};

const fallbackForecast = {
  current: { temperature: 26, weathercode: 1, windspeed: 8 },
  daily: [
    { day: 'Mon', max: 28, min: 20, code: 1 },
    { day: 'Tue', max: 29, min: 21, code: 2 },
    { day: 'Wed', max: 25, min: 19, code: 61 },
    { day: 'Thu', max: 24, min: 18, code: 3 },
    { day: 'Fri', max: 27, min: 20, code: 0 },
  ],
};

export const WeatherDashboard: React.FC = () => {
  const [forecast, setForecast] = useState(typeof window !== 'undefined' ? fallbackForecast : null);
  const [location, setLocation] = useState('Global Study Hub');

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const data = await response.json();
        if (data.current_weather && data.daily) {
          setForecast({
            current: {
              temperature: Math.round(data.current_weather.temperature),
              weathercode: data.current_weather.weathercode,
              windspeed: Math.round(data.current_weather.windspeed),
            },
            daily: data.daily.time.slice(0, 5).map((date: string, index: number) => ({
              day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
              max: Math.round(data.daily.temperature_2m_max[index]),
              min: Math.round(data.daily.temperature_2m_min[index]),
              code: data.daily.weathercode[index],
            })),
          });
          setLocation(`${data.timezone || 'Local'}`);
        }
      } catch (error) {
        console.warn('Weather fetch failed', error);
      }
    }, () => {
      setForecast(fallbackForecast);
    }, { timeout: 12000 });
  }, []);

  const active = forecast?.current ? weatherNames[forecast.current.weathercode] ?? { label: 'Clear', icon: <Sun className="w-5 h-5" /> } : { label: 'Loading', icon: <Sun className="w-5 h-5" /> };

  return (
    <div className="rounded-[32px] border border-white/10 bg-[#07101c]/95 p-6 shadow-[0_0_60px_rgba(0,0,0,0.24)] backdrop-blur-3xl overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Next Week Weather</p>
          <h3 className="text-2xl font-bold tracking-tight">Weather Intelligence</h3>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-slate-300">
          <CalendarDays className="w-4 h-4" /> Forecast Sync
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr] items-center">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
            {active.icon}
          </div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">{active.label}</p>
          <p className="mt-3 text-5xl font-bold text-white">{forecast?.current.temperature ?? '--'}°C</p>
          <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1"><Wind className="w-4 h-4" /> {forecast?.current.windspeed ?? '--'} km/h</span>
            <span className="inline-flex items-center gap-1"><Thermometer className="w-4 h-4" /> {forecast?.current.temperature ?? '--'}°</span>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500 mb-4">Observed Location</p>
          <p className="text-sm font-semibold text-white">{location}</p>
          <div className="mt-6 space-y-3">
            {forecast?.daily.map((day) => (
              <div key={day.day} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#020509] p-3">
                <div>
                  <p className="text-sm font-semibold text-white">{day.day}</p>
                  <p className="text-[11px] text-slate-400">{weatherNames[day.code]?.label ?? 'Clear'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{day.max}° / {day.min}°</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

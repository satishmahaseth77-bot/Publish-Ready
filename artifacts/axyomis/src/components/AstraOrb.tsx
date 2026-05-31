import React, { useEffect, useRef, type MutableRefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AstraOrbProps {
  state: OrbState;
  analyserRef?: MutableRefObject<AnalyserNode | null>;
  size?: number;
}

const STATE_PALETTE: Record<OrbState, string[]> = {
  idle:      ['#4285f4', '#9b72cb', '#d96570', '#f59e0b', '#4285f4'],
  listening: ['#22d3ee', '#3b82f6', '#a855f7', '#22d3ee', '#3b82f6'],
  thinking:  ['#a855f7', '#ec4899', '#f59e0b', '#22d3ee', '#a855f7'],
  speaking:  ['#4285f4', '#9b72cb', '#ec4899', '#f59e0b', '#22d3ee'],
};

export const AstraOrb: React.FC<AstraOrbProps> = ({ state, analyserRef, size = 320 }) => {
  const coreRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const dataRef = useRef<Uint8Array | null>(null);
  const smoothRef = useRef(0);
  const phaseRef = useRef(0);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sparkleCount = isMobile ? 6 : 14;

  useEffect(() => {
    let paused = document.hidden;
    const onVis = () => {
      paused = document.hidden;
      if (!paused) rafRef.current = requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', onVis);
    const tick = () => {
      if (paused) return;
      let level = 0;
      const analyser = analyserRef?.current;
      if (analyser && (state === 'speaking' || state === 'listening')) {
        if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
          dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
        }
        const data = dataRef.current;
        analyser.getByteTimeDomainData(data as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        level = Math.min(1, rms * 4);
      }

      phaseRef.current += 0.04;
      if (state === 'thinking') {
        level = Math.max(level, 0.35 + Math.sin(phaseRef.current * 2) * 0.15);
      } else if (state === 'listening' && level < 0.05) {
        level = 0.15 + Math.sin(phaseRef.current * 1.6) * 0.1;
      } else if (state === 'idle') {
        level = 0.08 + Math.sin(phaseRef.current) * 0.04;
      } else if (state === 'speaking' && level < 0.1) {
        level = 0.2 + Math.sin(phaseRef.current * 2.4) * 0.18;
      }

      smoothRef.current += (level - smoothRef.current) * 0.18;
      const s = smoothRef.current;

      if (coreRef.current) {
        coreRef.current.style.transform = `translate3d(0,0,0) scale(${(1 + s * 0.35).toFixed(3)})`;
      }
      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(0,0,0) scale(${(1 + s * 0.55).toFixed(3)})`;
        haloRef.current.style.opacity = (0.4 + s * 0.6).toFixed(3);
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = (0.25 + s * 0.6).toFixed(3);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [state, analyserRef]);

  const palette = STATE_PALETTE[state];
  const conic = `conic-gradient(from 140deg, ${palette.join(', ')})`;
  const nebula = `radial-gradient(circle at 18% 24%, rgba(255,255,255,0.28), transparent 16%), radial-gradient(circle at 72% 38%, ${palette[2]}22, transparent 22%), radial-gradient(circle at 48% 72%, ${palette[3]}16, transparent 18%)`;
  const mesh = `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.92), transparent 18%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.18), transparent 24%), linear-gradient(135deg, rgba(34,211,238,0.22), rgba(168,85,247,0.18) 35%, rgba(236,72,153,0.12))`;
  const ringSpeed = state === 'thinking' ? 4 : state === 'speaking' ? 6 : 18;
  const innerSpeed = state === 'thinking' ? 6 : state === 'speaking' ? 8 : 22;
  const isActive = state !== 'idle';

  return (
    <div className="astra-orb-root" style={{ width: size, height: size }}>
      <div
        ref={haloRef}
        className="astra-orb-ambient"
        style={{
          background: conic,
          filter: `blur(${isMobile ? 24 : 42}px) saturate(180%)`,
          opacity: 0.68,
        }}
      />

      <div className="astra-orb-nebula" style={{ background: nebula }} />
      <div className="astra-orb-grid" />

      {isActive && [0, 1, 2].map((index) => (
        <motion.div
          key={`listen-ring-${index}`}
          initial={{ opacity: 0.4, scale: 1 }}
          animate={{ opacity: [0.4, 0.05, 0.4], scale: [1, 1.4 + index * 0.08, 1.08] }}
          transition={{ duration: 2.6 + index * 0.45, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: index * 0.15 }}
          className="astra-orb-listen-ring"
          style={{ borderColor: `rgba(34, 211, 238, ${0.14 - index * 0.03})` }}
        />
      ))}

      {[0, 1].map((idx) => (
        <motion.div
          key={`astro-arc-${idx}`}
          animate={prefersReducedMotion ? undefined : { rotate: idx % 2 ? 360 : -360 }}
          transition={{ duration: 20 + idx * 6, repeat: Infinity, ease: 'linear' }}
          className={`astra-orb-arc astra-orb-arc-${idx}`}
          style={{ borderColor: `rgba(255,255,255,${0.16 - idx * 0.04})` }}
        />
      ))}

      <motion.div
        ref={ringRef}
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: ringSpeed, repeat: Infinity, ease: 'linear' }}
        className="astra-orb-ring"
        style={{ background: conic }}
      />

      <motion.div
        animate={prefersReducedMotion ? undefined : { rotate: -360 }}
        transition={{ duration: innerSpeed, repeat: Infinity, ease: 'linear' }}
        className="astra-orb-layer"
        style={{ background: conic, opacity: 0.82 }}
      />

      <div
        ref={coreRef}
        className="astra-orb-core"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: `${mesh}, ${conic}`,
          boxShadow: `0 0 100px ${palette[0]}99, 0 0 160px ${palette[2]}66, inset 0 0 80px rgba(255,255,255,0.32)`,
        }}
      >
        <div className="astra-orb-inner-mesh" style={{ background: `radial-gradient(circle at 60% 40%, rgba(255,255,255,0.48), transparent 20%), repeating-linear-gradient(96deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 1px, transparent 1px, transparent 6px)` }} />
      </div>

      <motion.div
        animate={{ opacity: [0.65, 0.95, 0.65], scale: [1, 1.1, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="astra-orb-specular"
      />

      <div className="astra-orb-sparkles">
        {Array.from({ length: sparkleCount }).map((_, i) => {
          const angle = (i / sparkleCount) * Math.PI * 2;
          const r = size * 0.42;
          const x = Math.cos(angle) * r * 0.8;
          const y = Math.sin(angle) * r * 0.8;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              animate={{ opacity: [0.15, 0.85, 0.15], scale: [0.4, 1, 0.4], x: [0, x, x * 0.92], y: [0, y, y * 0.92] }}
              transition={{ duration: 4.4 + (i % 4) * 0.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: i * 0.18 }}
              className="astra-orb-spark"
              style={{ background: palette[i % palette.length], boxShadow: `0 0 12px ${palette[i % palette.length]}` }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ── Gemini-style animated waveform ──────────────────────────────────────────
interface GeminiWaveProps {
  state: OrbState;
  width?: number;
  height?: number;
}

const WAVE_COLORS: Record<OrbState, string[]> = {
  idle:      ['#4285f4cc', '#9b72cbcc', '#d96570cc', '#f59e0bcc'],
  listening: ['#22d3eecc', '#3b82f6cc', '#a855f7cc', '#06b6d4cc'],
  thinking:  ['#a855f7cc', '#ec4899cc', '#f59e0bcc', '#22d3eecc'],
  speaking:  ['#4285f4cc', '#9b72cbcc', '#ec4899cc', '#f59e0bcc'],
};

export const GeminiWave: React.FC<GeminiWaveProps> = ({ state, width = 400, height = 80 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = WAVE_COLORS[state];
    const W = canvas.width;
    const H = canvas.height;
    const cy = H / 2;

    const amplitudes = state === 'idle'      ? [6, 5, 4, 3]
                     : state === 'listening' ? [18, 15, 12, 10]
                     : state === 'thinking'  ? [22, 18, 14, 10]
                                             : [28, 22, 16, 10];
    const speeds    = [0.04, 0.05, 0.06, 0.07];
    const phases    = [0, 0.7, 1.4, 2.1];
    const freqs     = [0.018, 0.022, 0.026, 0.015];

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      tRef.current += 1;
      const t = tRef.current;

      for (let li = 0; li < 4; li++) {
        const amp = amplitudes[li] * (1 + 0.15 * Math.sin(t * 0.03 + li));
        ctx.beginPath();
        ctx.strokeStyle = colors[li];
        ctx.lineWidth = 2.5 - li * 0.3;
        ctx.lineCap = 'round';
        ctx.shadowColor = colors[li];
        ctx.shadowBlur = 8;

        for (let x = 0; x <= W; x += 2) {
          const y = cy + amp * Math.sin(x * freqs[li] + t * speeds[li] + phases[li]);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full"
      style={{ maxWidth: width, opacity: state === 'idle' ? 0.4 : 0.85, transition: 'opacity 600ms ease' }}
    />
  );
};

// ── Gemini ring pulse (glow ring around orb) ────────────────────────────────
export const GeminiGlow: React.FC<{ state: OrbState; size?: number }> = ({ state, size = 200 }) => {
  const palette = STATE_PALETTE[state];
  const conic = `conic-gradient(from 0deg, ${palette.join(', ')})`;
  const isActive = state !== 'idle';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer pulse rings */}
      <AnimatePresence>
        {isActive && [0, 1, 2].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 + i * 0.25 }}
            transition={{ duration: 1.8 + i * 0.3, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full"
            style={{ background: conic, filter: 'blur(12px)' }}
          />
        ))}
      </AnimatePresence>
      {/* Rotating glow ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: state === 'speaking' ? 4 : state === 'thinking' ? 6 : 12, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[-8%] rounded-full"
        style={{
          background: conic,
          filter: 'blur(20px)',
          opacity: isActive ? 0.7 : 0.3,
          maskImage: 'radial-gradient(circle, transparent 54%, black 58%, black 68%, transparent 73%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 54%, black 58%, black 68%, transparent 73%)',
          transition: 'opacity 400ms ease',
        }}
      />
    </div>
  );
};

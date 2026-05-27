import React, { useEffect, useRef, type MutableRefObject } from 'react';
import { motion } from 'motion/react';

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

  // Mobile / reduced-motion detection — used to lower visual cost
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

      // Faux idle/thinking oscillation for visual life when no analyser data
      phaseRef.current += 0.04;
      if (state === 'thinking') {
        level = Math.max(level, 0.35 + Math.sin(phaseRef.current * 2) * 0.15);
      } else if (state === 'listening' && level < 0.05) {
        level = 0.15 + Math.sin(phaseRef.current * 1.6) * 0.1;
      } else if (state === 'idle') {
        level = 0.08 + Math.sin(phaseRef.current) * 0.04;
      }

      // Smooth toward target
      smoothRef.current += (level - smoothRef.current) * 0.18;
      const s = smoothRef.current;

      if (coreRef.current) {
        const scale = 1 + s * 0.35;
        coreRef.current.style.transform = `translate3d(0,0,0) scale(${scale.toFixed(3)})`;
      }
      if (haloRef.current) {
        const haloScale = 1 + s * 0.55;
        haloRef.current.style.transform = `translate3d(0,0,0) scale(${haloScale.toFixed(3)})`;
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
  const conic = `conic-gradient(from 0deg, ${palette.join(', ')})`;
  const ringSpeed = state === 'thinking' ? 4 : state === 'speaking' ? 8 : 18;
  const innerSpeed = state === 'thinking' ? 6 : state === 'speaking' ? 10 : 22;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer halo glow */}
      <div
        ref={haloRef}
        className="absolute inset-0 rounded-full will-change-transform"
        style={{
          background: conic,
          filter: `blur(${isMobile ? 36 : 60}px) saturate(140%)`,
          opacity: 0.5,
          transition: 'opacity 200ms linear',
        }}
      />

      {/* Rotating outer ring */}
      <motion.div
        ref={ringRef}
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: ringSpeed, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[-6%] rounded-full will-change-transform"
        style={{
          background: conic,
          filter: 'blur(18px) saturate(160%)',
          opacity: 0.55,
          maskImage: 'radial-gradient(circle, transparent 56%, black 60%, black 70%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 56%, black 60%, black 70%, transparent 75%)',
        }}
      />

      {/* Rotating inner gradient body */}
      <motion.div
        animate={prefersReducedMotion ? undefined : { rotate: -360 }}
        transition={{ duration: innerSpeed, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[12%] rounded-full"
        style={{
          background: conic,
          filter: 'blur(22px) saturate(180%)',
          opacity: 0.9,
        }}
      />

      {/* Core sphere */}
      <div
        ref={coreRef}
        className="relative rounded-full will-change-transform"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.25) 28%, rgba(255,255,255,0) 55%), ${conic}`,
          filter: 'blur(2px) saturate(160%)',
          boxShadow: `0 0 80px ${palette[0]}66, 0 0 160px ${palette[2]}44, inset 0 0 60px rgba(255,255,255,0.25)`,
          transition: 'background 600ms linear, box-shadow 600ms linear',
        }}
      />

      {/* Specular highlight */}
      <motion.div
        animate={{ opacity: [0.6, 0.95, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.22,
          height: size * 0.22,
          top: size * 0.22,
          left: size * 0.28,
          background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)',
          filter: 'blur(6px)',
        }}
      />

      {/* Drifting sparkles */}
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        {Array.from({ length: sparkleCount }).map((_, i) => {
          const angle = (i / sparkleCount) * Math.PI * 2;
          const r = size * 0.46;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0, 1, 0],
                x: [0, x, 0],
                y: [0, y, 0],
              }}
              transition={{
                duration: 3 + (i % 5) * 0.6,
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeInOut',
              }}
              className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full"
              style={{
                background: palette[i % palette.length],
                boxShadow: `0 0 8px ${palette[i % palette.length]}`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

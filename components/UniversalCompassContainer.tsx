'use client';

import React, { useState, useEffect } from 'react';
import { useRealityStore } from '@/store/realityStore';
import { useBioSync } from '@/hooks/useBioSync';
import { useUniversalAudio } from '@/hooks/useUniversalAudio';
import ActivationVeil from './ActivationVeil';
import CompassDashboard from './CompassDashboard';
import TechnicalPresentation from './TechnicalPresentation';

/* ------------------------------------------------------------------ */
/*  Inject keyframes once                                              */
/* ------------------------------------------------------------------ */
const STYLE_ID = '__ucc-keyframes';
function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ucc-float-particle {
      0%   { transform: translateY(0) translateX(0); opacity: 0; }
      10%  { opacity: 0.6; }
      90%  { opacity: 0.6; }
      100% { transform: translateY(-100vh) translateX(40px); opacity: 0; }
    }
    @keyframes ucc-corner-pulse {
      0%, 100% { opacity: 0.25; }
      50%      { opacity: 0.55; }
    }
    @keyframes ucc-grid-drift {
      0%   { transform: translate(0, 0); }
      100% { transform: translate(40px, 40px); }
    }
  `;
  document.head.appendChild(style);
}

/* ------------------------------------------------------------------ */
/*  Floating ambient particles                                         */
/* ------------------------------------------------------------------ */
const PARTICLE_COUNT = 18;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: 1 + Math.random() * 2,
  duration: 12 + Math.random() * 20,
  delay: Math.random() * 14,
  opacity: 0.15 + Math.random() * 0.35,
}));

/* ------------------------------------------------------------------ */
/*  Corner bracket decoration component                                */
/* ------------------------------------------------------------------ */
function CornerBracket({
  position,
  theme,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  theme: 'light' | 'dark';
}) {
  const base = 'absolute w-6 h-6 pointer-events-none';
  const border = theme === 'light' ? 'border-slate-300' : 'border-cyan-400/20';

  const posStyles: Record<string, string> = {
    tl: `top-2 left-2 border-t-2 border-l-2 ${border}`,
    tr: `top-2 right-2 border-t-2 border-r-2 ${border}`,
    bl: `bottom-2 left-2 border-b-2 border-l-2 ${border}`,
    br: `bottom-2 right-2 border-b-2 border-r-2 ${border}`,
  };

  return (
    <div
      className={`${base} ${posStyles[position]}`}
      style={{ animation: 'ucc-corner-pulse 4s ease-in-out infinite' }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main container                                                     */
/* ------------------------------------------------------------------ */
export default function UniversalCompassContainer() {
  const currentReality = useRealityStore((s) => s.currentReality);
  const setDemoSession = useRealityStore((s) => s.setDemoSession);
  const theme = useRealityStore((s) => s.theme);
  const [triggerGlitch, setTriggerGlitch] = useState(false);

  /* Inject keyframes on mount */
  useEffect(() => {
    ensureKeyframes();
  }, []);

  /* Check query parameters for shareable session on mount */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const session = params.get('session');
      if (session === 'mercedes-to-bbd') {
        setDemoSession('mercedes-to-bbd');
      } else if (session === 'tiwariganj-to-bbd') {
        setDemoSession('tiwariganj-to-bbd');
      }
    }
  }, [setDemoSession]);

  /* Biometric Synchronization Hooks */
  const {
    state: bioState,
    isOperational,
    handleTouchStart,
    handleTouchEnd,
    handleGazeStart,
    handleGazeEnd,
    handlePalmDown,
    handlePalmUp,
  } = useBioSync();

  const soundEnabled = useRealityStore((s) => s.soundEnabled);

  /* Web Audio Hook */
  const { initializeAudio, isInitialized: audioInitialized } =
    useUniversalAudio({
      psi: currentReality.psi,
      dims: currentReality.dims,
      entropy: currentReality.entropy,
      localGravity: currentReality.localGravity,
      quantumFlux: currentReality.quantumFlux,
      triggerGlitch,
      soundEnabled,
    });

  /* Initialize audio context if user explicitly turns sound on */
  useEffect(() => {
    if (soundEnabled && !audioInitialized) {
      initializeAudio();
    }
  }, [soundEnabled, audioInitialized, initializeAudio]);

  const handleTransitStart = () => {
    setTriggerGlitch(true);
    setTimeout(() => {
      setTriggerGlitch(false);
    }, 1600);
  };

  return (
    <main className={`relative w-screen h-screen overflow-hidden transition-colors duration-500 ${theme === 'light' ? 'bg-[#f8fafc]' : 'bg-[#020210]'}`}>
      {/* ---- Animated grid pattern overlay ---- */}
      <div
        className={`absolute inset-0 pointer-events-none z-[1] transition-opacity duration-500 ${theme === 'light' ? 'opacity-[0.05]' : 'opacity-[0.03]'}`}
        style={{
          backgroundImage: theme === 'light'
            ? 'linear-gradient(rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.12) 1px, transparent 1px)'
            : 'linear-gradient(rgba(6,182,212,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'ucc-grid-drift 30s linear infinite',
        }}
      />

      {/* ---- Futuristic Dashboard overlay ---- */}
      <CompassDashboard
        isOperational={isOperational}
        onTransitStart={handleTransitStart}
        audioInitialized={audioInitialized}
        onInitializeAudio={initializeAudio}
        triggerGlitch={triggerGlitch}
      />

      {/* ---- Holographic Slideshow Presentation Overlay ---- */}
      <TechnicalPresentation />

      {/* ---- Biometric lock screen overlay ---- */}
      <ActivationVeil
        state={bioState}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onGazeStart={handleGazeStart}
        onGazeEnd={handleGazeEnd}
      />

      {/* ---- Scanline overlay (ultra-subtle) ---- */}
      <div
        className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-500 ${theme === 'light' ? 'opacity-[0.04]' : 'opacity-[0.12]'}`}
        style={{
          backgroundImage: [
            'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%)',
            'linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.015), rgba(0,0,255,0.04))',
          ].join(', '),
          backgroundSize: '100% 4px, 3px 100%',
        }}
      />

      {/* ---- Floating ambient particles ---- */}
      <div className="absolute inset-0 pointer-events-none z-[11] overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className={`absolute rounded-full transition-colors duration-500 ${theme === 'light' ? 'bg-cyan-600' : 'bg-cyan-400'}`}
            style={{
              left: p.left,
              bottom: '-4px',
              width: p.size,
              height: p.size,
              opacity: 0,
              animation: `ucc-float-particle ${p.duration}s linear ${p.delay}s infinite`,
              boxShadow: theme === 'light'
                ? `0 0 ${p.size * 3}px rgba(6,182,212,${p.opacity * 0.8})`
                : `0 0 ${p.size * 3}px rgba(6,182,212,${p.opacity})`,
            }}
          />
        ))}
      </div>

      {/* ---- Vignette overlay ---- */}
      <div
        className="absolute inset-0 pointer-events-none z-[12] transition-all duration-500"
        style={{
          background: theme === 'light'
            ? 'radial-gradient(ellipse at center, transparent 45%, rgba(248,250,252,0.3) 80%, rgba(248,250,252,0.65) 100%)'
            : 'radial-gradient(ellipse at center, transparent 45%, rgba(2,2,16,0.55) 80%, rgba(2,2,16,0.85) 100%)',
        }}
      />

      {/* ---- Corner bracket decorations ---- */}
      <CornerBracket position="tl" theme={theme} />
      <CornerBracket position="tr" theme={theme} />
      <CornerBracket position="bl" theme={theme} />
      <CornerBracket position="br" theme={theme} />
    </main>
  );
}

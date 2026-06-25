'use client';

import { useEffect, useState } from 'react';
import { ActivationState } from '@/utils/bioSyncEngine';
import { useRealityStore } from '@/store/realityStore';

const VEIL_STYLE_ID = '__veil-kf';
function ensureVeilKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(VEIL_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = VEIL_STYLE_ID;
  style.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: 0.6; }
      80%  { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes veil-fade-out {
      0%   { opacity: 1; }
      100% { opacity: 0; pointer-events: none; }
    }
    @keyframes orb-charge {
      0%   { box-shadow: 0 0 20px rgba(6,182,212,0.2), 0 0 40px rgba(168,85,247,0.1); }
      50%  { box-shadow: 0 0 40px rgba(6,182,212,0.6), 0 0 80px rgba(168,85,247,0.4); }
      100% { box-shadow: 0 0 60px rgba(52,211,153,0.8), 0 0 120px rgba(6,182,212,0.5); }
    }
    @keyframes progress-fill {
      0%   { width: 0%; }
      100% { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

interface VeilProps {
  state: ActivationState;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onGazeStart: () => void;
  onGazeEnd: () => void;
}

export default function ActivationVeil({
  state,
  onTouchStart,
  onTouchEnd,
  onGazeStart,
  onGazeEnd,
}: VeilProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const theme = useRealityStore((s) => s.theme);

  useEffect(() => { ensureVeilKeyframes(); }, []);

  const { phase } = state;

  // Auto-dismiss when ACTIVE
  useEffect(() => {
    if (phase === 'ACTIVE' && !isDismissed) {
      setTimeout(() => setIsDismissed(true), 600);
    }
  }, [phase, isDismissed]);

  if (phase === 'ACTIVE' && isDismissed) return null;

  const handleEnter = () => {
    if (isActivating) return;
    setIsActivating(true);
    // Trigger the bio-sync sequence automatically
    onTouchStart();
    onGazeStart();
  };

  const showingActive = phase === 'ACTIVE';

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme === 'light' ? 'rgba(248, 250, 252, 0.96)' : 'rgba(2, 2, 16, 0.97)',
        backdropFilter: 'blur(24px)',
        animation: showingActive ? 'veil-fade-out 0.6s ease-out forwards' : undefined,
      }}
    >
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: theme === 'light'
              ? 'radial-gradient(circle at 20% 30%, rgba(6,182,212,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.4) 0%, transparent 50%)'
              : 'radial-gradient(circle at 20% 30%, rgba(6,182,212,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.3) 0%, transparent 50%)',
          }}
        />
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${1 + Math.random() * 2.5}px`,
              height: `${1 + Math.random() * 2.5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? 'rgba(6,182,212,0.5)' : 'rgba(168,85,247,0.5)',
              opacity: theme === 'light' ? 0.25 + Math.random() * 0.35 : 0.15 + Math.random() * 0.3,
              animation: `float ${4 + Math.random() * 6}s ease-in-out ${Math.random() * 4}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Central Orb */}
      <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
        {/* Pulse rings */}
        {[0, 1, 2].map((i) => (
          <div
            key={`pulse-${i}`}
            className="absolute inset-0 rounded-full border"
            style={{
              borderColor: isActivating ? 'rgba(52,211,153,0.3)' : 'rgba(6,182,212,0.15)',
              animation: `pulse-ring ${2.5 + i * 0.5}s cubic-bezier(0.4, 0, 0.6, 1) ${i * 0.6}s infinite`,
            }}
          />
        ))}

        {/* Orbital rings */}
        <div
          className="absolute w-44 h-44 rounded-full border border-dashed"
          style={{
            borderColor: theme === 'light' ? 'rgba(15,23,42,0.06)' : 'rgba(6,182,212,0.12)',
            animation: 'spin 12s linear infinite',
          }}
        />
        <div
          className="absolute w-36 h-36 rounded-full border"
          style={{
            borderColor: theme === 'light' ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.1)',
            transform: 'rotateX(60deg)',
            animation: 'spin 8s linear infinite reverse',
          }}
        />

        {/* Core orb */}
        <div
          className="absolute w-24 h-24 rounded-full transition-all duration-1000"
          style={{
            background: isActivating
              ? 'radial-gradient(circle at 40% 35%, rgba(52,211,153,0.4), rgba(6,182,212,0.2), transparent 70%)'
              : 'radial-gradient(circle at 40% 35%, rgba(6,182,212,0.3), rgba(168,85,247,0.15), transparent 70%)',
            animation: isActivating ? 'orb-charge 1.5s ease-out forwards' : undefined,
          }}
        />
        <div
          className="absolute w-20 h-20 rounded-full border-2 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 transition-all duration-700"
          style={{
            borderColor: isActivating ? 'rgba(52,211,153,0.35)' : 'rgba(6,182,212,0.2)',
          }}
        />

        {/* Icon */}
        <div
          className="absolute text-4xl select-none transition-all duration-500"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          {isActivating ? (phase === 'ACTIVE' ? '✅' : '⚡') : '🌐'}
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center max-w-md px-6 relative z-10">
        <h1
          className={`text-xl md:text-2xl font-bold tracking-[0.15em] uppercase mb-3 bg-gradient-to-r bg-clip-text text-transparent ${
            theme === 'light'
              ? 'from-cyan-600 via-slate-800 to-purple-600'
              : 'from-cyan-300 via-white to-purple-300'
          }`}
        >
          {isActivating ? (phase === 'ACTIVE' ? 'Welcome Aboard' : 'Connecting...') : 'Universal Compass'}
        </h1>
        <p className={`text-sm tracking-wider font-light leading-relaxed mb-8 ${
          theme === 'light' ? 'text-slate-500/80' : 'text-white/40'
        }`}>
          {isActivating
            ? phase === 'ACTIVE'
              ? 'Navigation systems online'
              : 'Establishing secure observer link...'
            : 'Navigate anywhere in the multiverse'}
        </p>

        {/* Progress bar during activation */}
        {isActivating && phase !== 'ACTIVE' && (
          <div className={`w-48 mx-auto h-1 rounded-full overflow-hidden mb-6 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/[0.06]'}`}>
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #06b6d4, #8b5cf6, #34d399)',
                animation: 'progress-fill 3s ease-out forwards',
              }}
            />
          </div>
        )}

        {/* Enter button */}
        {!isActivating && (
          <button
            onClick={handleEnter}
            className={`group relative px-10 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-[0.25em] transition-all duration-500 overflow-hidden border ${
              theme === 'light'
                ? 'border-slate-200 text-slate-800 hover:border-cyan-400/40 hover:scale-[1.03] active:scale-[0.97]'
                : 'border-white/10 text-white hover:border-cyan-400/40 hover:scale-[1.03] active:scale-[0.97]'
            }`}
            style={{
              background: theme === 'light'
                ? 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(168,85,247,0.1))'
                : 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(168,85,247,0.15))',
              boxShadow: theme === 'light'
                ? '0 0 30px rgba(6,182,212,0.05), 0 0 60px rgba(168,85,247,0.03)'
                : '0 0 30px rgba(6,182,212,0.1), 0 0 60px rgba(168,85,247,0.05)',
            }}
          >
            <span className="relative z-10">Enter Navigator</span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(168,85,247,0.2))',
              }}
            />
          </button>
        )}
      </div>

      {/* Bottom hint */}
      {!isActivating && (
        <p
          className={`absolute bottom-8 text-[10px] tracking-[0.25em] uppercase font-light ${
            theme === 'light' ? 'text-slate-400/80' : 'text-white/15'
          }`}
          style={{ animation: 'float 4s ease-in-out infinite' }}
        >
          Tap to begin your journey
        </p>
      )}
    </div>
  );
}
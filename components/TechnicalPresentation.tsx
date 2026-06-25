'use client';

import React, { useState, useEffect } from 'react';
import { useRealityStore } from '@/store/realityStore';

interface Slide {
  title: string;
  subtitle: string;
  points: { title: string; desc: string }[];
  visual: React.ReactNode;
}

export default function TechnicalPresentation() {
  const showPresentation = useRealityStore((s) => s.showPresentation);
  const setShowPresentation = useRealityStore((s) => s.setShowPresentation);
  const setDemoSession = useRealityStore((s) => s.setDemoSession);
  const theme = useRealityStore((s) => s.theme);

  const [currentSlide, setCurrentSlide] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    if (!showPresentation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setShowPresentation(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPresentation, setShowPresentation]);

  if (!showPresentation) return null;

  const slides: Slide[] = [
    {
      title: 'Universal Compass',
      subtitle: 'What is this and why do we need it?',
      points: [
        {
          title: 'Ditching the Traffic',
          desc: 'Regular maps (like Google Maps) lock you to the road. If there is a traffic jam on Faizabad Road, you are stuck. The Universal Compass lets you bypass the road entirely.',
        },
        {
          title: 'Folding Space Like Paper',
          desc: 'Instead of driving a long way around, think of folding a paper map. When you fold it, the starting point and the ending point touch each other instantly.',
        },
        {
          title: 'Warp Speed Shortcuts',
          desc: 'By finding shortcuts through other dimensions (like a hidden tunnel), we compress a 15-minute drive into a 1.5-second step.',
        },
      ],
      visual: (
        <div className="relative w-full h-64 bg-slate-950/40 rounded-2xl border border-cyan-500/20 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
          {/* Animated 3D Wireframe Orbit */}
          <div className="relative w-36 h-36 border border-cyan-400/40 rounded-full animate-[spin_10s_linear_infinite] flex items-center justify-center">
            <div className="w-28 h-28 border border-purple-400/40 rounded-full animate-[spin_6s_linear_infinite] rotate-45 flex items-center justify-center">
              <div className="w-16 h-16 border border-amber-400/40 rounded-full animate-[spin_3s_linear_infinite] -rotate-45 flex items-center justify-center">
                <div className="w-4 h-4 bg-cyan-400 rounded-full shadow-[0_0_15px_#06b6d4] animate-pulse" />
              </div>
            </div>
            <div className="absolute top-0 w-2.5 h-2.5 bg-purple-400 rounded-full" />
            <div className="absolute bottom-0 w-2.5 h-2.5 bg-amber-400 rounded-full" />
            <div className="absolute left-0 w-2.5 h-2.5 bg-cyan-400 rounded-full" />
          </div>
          {/* Legend HUD overlay */}
          <div className="absolute bottom-3 left-4 font-mono text-[9px] text-zinc-500 flex flex-col gap-0.5">
            <span>OBSERVER FRAME: STABLE</span>
            <span>GRID DIMENSION: 5-AXIS</span>
          </div>
        </div>
      ),
    },
    {
      title: 'How the Compass Works',
      subtitle: 'Tuning the Portal to Lucknow Locations',
      points: [
        {
          title: 'Pinpoint Accuracy',
          desc: 'For our Lucknow routes, the compass calculates position with extreme accuracy down to the millimeter, so you land exactly where you want.',
        },
        {
          title: 'Tuning to a Reality Layer',
          desc: 'We use a "Reality Layer" setting. Think of it like tuning a radio—tuning to the right channel aligns you perfectly with your destination.',
        },
        {
          title: 'Time Compression',
          desc: 'Warping changes how time flows. Since the trip takes only 1.5 seconds, you bypass standard clock time completely.',
        },
      ],
      visual: (
        <div className="w-full h-64 bg-slate-950/40 rounded-2xl border border-purple-500/20 overflow-hidden flex flex-col items-center justify-center p-4 font-mono">
          <div className="text-left w-full max-w-[280px] space-y-3">
            <div className="text-[10px] text-purple-400/80 border-b border-purple-500/20 pb-1 uppercase tracking-widest font-bold">
              Metric Tensor Matrix
            </div>
            <div className="bg-purple-950/20 border border-purple-500/10 rounded-lg p-2.5 text-zinc-400 text-[10px] space-y-1">
              <div>g₀₀ = [ 1 - Φ ] = 0.706</div>
              <div>g₁₁ = [ 1 / g₀₀ ] = 1.416</div>
              <div>g₂₂ = [ 1 + 0.3Ψ ] = 2.800</div>
              <div>g₃₃ = [ 1 + 0.3S ] = 1.054</div>
              <div>g₄₄ = [ 1 + 0.5gΦ ] = 1.002</div>
            </div>
            <div className="text-[9px] text-zinc-500 leading-relaxed">
              {"ds² = g₀₀dg² + g₁₁dD² + g₂₂dΨ² + g₃₃dS² + g₄₄dΦ²"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Mercedes Showroom to BBD',
      subtitle: 'Folding Spacetime on Faizabad Road',
      points: [
        {
          title: 'The Road Traffic Problem',
          desc: 'Travelling from the Mercedes Showroom to BBD University on Faizabad Road requires navigating 4.86 km of road, traffic jams, signals, and pedestrian blockages.',
        },
        {
          title: 'Hyperspatial Warp Option',
          desc: 'By initiating a 5D transit, the Universal Compass folds spacetime. The geodesic distance is recalculated through higher dimensions, bringing the showroom and BBD into spatial coherence.',
        },
        {
          title: 'Instantaneous Quantum Transit',
          desc: 'Instead of a 15-minute drive, transit is compressed to a 1.5-second quantum drift. Bypassing standard spacetime geometry, you arrive outside the limits of planetary boundaries.',
        },
      ],
      visual: (
        <div className="relative w-full h-64 bg-slate-950/40 rounded-2xl border border-amber-500/20 overflow-hidden flex flex-col items-center justify-center p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0%,transparent_75%)]" />
          {/* Warp Path Schematic SVG */}
          <svg viewBox="0 0 200 100" className="w-full max-w-[240px] h-32">
            {/* Standard path (curved road) */}
            <path
              d="M 20 80 Q 70 90 100 70 T 180 80"
              fill="none"
              stroke="#52525b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <text x="18" y="93" fill="#71717a" className="font-mono text-[8px]">
              Mercedes Showroom (GPS)
            </text>
            <text x="135" y="93" fill="#71717a" className="font-mono text-[8px]">
              BBD (GPS)
            </text>
            <text x="50" y="60" fill="#71717a" className="font-mono text-[8px]">
              Faizabad Road: 4.86 km
            </text>

            {/* Quantum Warp Tunnel */}
            <path
              d="M 20 80 Q 100 15 180 80"
              fill="none"
              stroke="url(#warp-grad)"
              strokeWidth="3.5"
              className="drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            />
            <defs>
              <linearGradient id="warp-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            {/* Tunnel particles */}
            <circle cx="100" cy="47" r="3" fill="#fbbf24" className="animate-ping" />

            <text x="75" y="32" fill="#fbbf24" className="font-mono text-[9px] font-bold">
              5D Warp Tunnel: 1.5s
            </text>
          </svg>
          <button
            onClick={() => {
              setDemoSession('mercedes-to-bbd');
              setShowPresentation(false);
            }}
            className="mt-2 px-4 py-2 border border-amber-500/40 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 font-semibold font-mono text-[10px] rounded-lg tracking-wider transition-all duration-300 uppercase shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          >
            Launch Warp Demo Mode
          </button>
        </div>
      ),
    },
    {
      title: 'Keeping You Safe',
      subtitle: 'Safety Scanners and Connection Locks',
      points: [
        {
          title: 'The Stability Scan',
          desc: 'Before you warp, the compass scans the path. If the route is unstable or there is a "quantum storm", it lights up yellow or red to warn you.',
        },
        {
          title: 'Biometric Connection Lock',
          desc: 'The system matches your hand touch and gaze to confirm you are ready. This secures the portal link and keeps you stable.',
        },
        {
          title: 'Smooth Landing Shield',
          desc: 'During the warp, visual safeguards absorb any extra energy, guaranteeing you step out smoothly without any glitches.',
        },
      ],
      visual: (
        <div className="w-full h-64 bg-slate-950/40 rounded-2xl border border-rose-500/20 overflow-hidden flex flex-col items-center justify-center p-4 font-mono text-[10px] text-zinc-400 space-y-4">
          <div className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3 w-full max-w-[240px]">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div>
              <div className="font-bold text-rose-400 uppercase tracking-widest text-[9px]">
                SAFETY STATUS
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                RATING: 100.0% (SECURE)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 w-full max-w-[240px]">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="font-bold text-emerald-400 uppercase tracking-widest text-[9px]">
                PORTAL SYNC LOCK
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                STATUS: ACTIVE (CONNECTED)
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Sharing the Portal',
      subtitle: 'Letting Friends Follow Your Path',
      points: [
        {
          title: 'Copy & Paste Portals',
          desc: 'You can copy a single sync link from the compass and send it directly to your family or friends.',
        },
        {
          title: 'Instant Syncing',
          desc: 'When they open the link on their mobile or web browser, their compass will automatically point to the exact same route.',
        },
        {
          title: 'Traveling Together',
          desc: 'Once synced, everyone follows the same path and arrives at the exact same location together.',
        },
      ],
      visual: (
        <div className="relative w-full h-64 bg-slate-950/40 rounded-2xl border border-cyan-500/20 overflow-hidden flex flex-col items-center justify-center p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0%,transparent_75%)]" />
          {/* Synchronized observer nodes representation */}
          <div className="flex items-center gap-6 relative z-10">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-cyan-950/40 border border-cyan-400/30 rounded-xl flex items-center justify-center text-cyan-400 animate-pulse text-lg font-bold">
                A
              </div>
              <span className="font-mono text-[8px] text-zinc-500">OBSERVER A</span>
            </div>
            <div className="h-[2px] w-16 bg-gradient-to-r from-cyan-400 to-purple-400 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 bg-purple-950/40 border border-purple-400/30 rounded-xl flex items-center justify-center text-purple-400 animate-pulse text-lg font-bold">
                B
              </div>
              <span className="font-mono text-[8px] text-zinc-500">OBSERVER B</span>
            </div>
          </div>
          <p className="mt-4 font-mono text-[9px] text-cyan-400/70 border border-cyan-500/20 bg-cyan-950/20 px-3 py-1.5 rounded-full tracking-wider">
            ?session=mercedes-to-bbd
          </p>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  };

  const activeSlide = slides[currentSlide];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-500 ${
      theme === 'light' ? 'bg-[#f8fafc]/95 backdrop-blur-2xl' : 'bg-[#020210]/95 backdrop-blur-2xl'
    }`}>
      {/* Dynamic Background Stars */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 bg-[background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)] ${
        theme === 'light'
          ? 'opacity-10 bg-[radial-gradient(#0f172a_1px,transparent_1px)]'
          : 'opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)]'
      }`} />

      {/* Slide Container */}
      <div className={`relative w-full max-w-4xl rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[500px] md:min-h-[580px] overflow-hidden transition-all duration-500 border ${
        theme === 'light'
          ? 'bg-white/80 border-slate-200 shadow-[0_8px_32px_rgba(15,23,42,0.06)]'
          : 'bg-white/[0.02] border-white/10 shadow-[0_0_60px_rgba(6,182,212,0.15)]'
      }`}>
        {/* Top HUD decoration */}
        <div className={`flex items-center justify-between border-b pb-4 mb-4 ${theme === 'light' ? 'border-slate-200' : 'border-white/[0.08]'}`}>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
            <span className={`font-mono text-[9px] uppercase tracking-[0.25em] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>
              ODRM Holographic Presentation Engine
            </span>
          </div>
          <button
            onClick={() => setShowPresentation(false)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 font-mono text-xs border ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-800'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white'
            }`}
            title="Close presentation (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Text content (Left) */}
          <div className="space-y-4">
            <div>
              <span className="font-mono text-[10px] text-cyan-500 uppercase tracking-widest font-bold">
                Slide {currentSlide + 1} of {slides.length}
              </span>
              <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight mt-1 leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {activeSlide.title}
              </h2>
              <p className={`text-xs font-semibold tracking-wide mt-1.5 ${theme === 'light' ? 'text-slate-600' : 'text-zinc-300/80'}`}>
                {activeSlide.subtitle}
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {activeSlide.points.map((p, i) => (
                <div key={i} className="flex gap-3 items-start group">
                  <span className="mt-1 font-bold text-xs text-cyan-500 group-hover:scale-125 transition-transform">
                    ✦
                  </span>
                  <div>
                    <h4 className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-800' : 'text-zinc-200'}`}>
                      {p.title}
                    </h4>
                    <p className={`text-[10px] leading-relaxed mt-0.5 transition-colors ${theme === 'light' ? 'text-slate-500 group-hover:text-slate-700' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Graphical/Visual Panel (Right) */}
          <div className="flex items-center justify-center">{activeSlide.visual}</div>
        </div>

        {/* Bottom controls panel */}
        <div className={`flex items-center justify-between border-t pt-4 mt-6 ${theme === 'light' ? 'border-slate-200' : 'border-white/[0.08]'}`}>
          <button
            disabled={currentSlide === 0}
            onClick={handlePrev}
            className={`px-4 py-2 border font-mono text-[10px] rounded-xl font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
              currentSlide === 0
                ? theme === 'light' ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                : theme === 'light'
                  ? 'border-slate-200 hover:border-cyan-500/30 text-slate-500 hover:text-cyan-600 hover:shadow-[0_0_14px_rgba(6,182,212,0.1)] bg-slate-50'
                  : 'border-white/10 hover:border-cyan-500/30 text-zinc-400 hover:text-cyan-400 hover:shadow-[0_0_14px_rgba(6,182,212,0.15)] bg-white/[0.02]'
            }`}
          >
            ◀ Prev
          </button>

          {/* Slide dots */}
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === i
                    ? 'bg-cyan-500 w-5 shadow-[0_0_8px_#06b6d4]'
                    : theme === 'light' ? 'bg-slate-300 hover:bg-slate-400' : 'bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>

          {currentSlide === slides.length - 1 ? (
            <button
              onClick={() => setShowPresentation(false)}
              className={`px-4 py-2 border font-mono text-[10px] rounded-xl font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] ${
                theme === 'light'
                  ? 'border-purple-500/20 bg-purple-500/5 text-purple-600 hover:text-purple-700'
                  : 'border-purple-500/40 hover:border-purple-400 bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 hover:text-white'
              }`}
            >
              Exit Deck ✕
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={`px-4 py-2 border font-mono text-[10px] rounded-xl font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] ${
                theme === 'light'
                  ? 'border-cyan-500/20 bg-cyan-500/5 text-cyan-600 hover:text-cyan-700'
                  : 'border-cyan-500/30 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 text-cyan-300 hover:text-white'
              }`}
            >
              Next ▶
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

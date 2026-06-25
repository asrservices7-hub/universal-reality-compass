'use client';

import React, { useEffect, useState } from 'react';
import { useRealityStore } from '@/store/realityStore';
import {
  translateTelemetry,
  generateEnvironmentReport,
  CompassColor,
} from '@/utils/uxTranslator';
import { RealityCoordinate } from '@/utils/routingEngine';
import UniversalRealityMap from './UniversalRealityMap';
import { hashStringToCoordinate } from '@/utils/deterministicHash';

interface DashboardProps {
  isOperational: boolean;
  onTransitStart: () => void;
  audioInitialized: boolean;
  onInitializeAudio: () => void;
  triggerGlitch: boolean;
}

const STYLE_ID = '__compass-dash-kf';
function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes cdb-gradient-shift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes cdb-bar-glow {
      0%, 100% { opacity: 0.7; }
      50%      { opacity: 1; }
    }
    @keyframes cdb-pulse-ring {
      0%   { transform: scale(1);   opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes cdb-arrow-slide {
      0%   { transform: translateX(-4px); opacity: 0.4; }
      50%  { transform: translateX(4px);  opacity: 1; }
      100% { transform: translateX(-4px); opacity: 0.4; }
    }
    @keyframes cdb-btn-shimmer {
      0%   { background-position: 200% 50%; }
      100% { background-position: -200% 50%; }
    }
  `;
  document.head.appendChild(style);
}

function CoherenceGauge({ value, theme }: { value: number; theme: 'light' | 'dark' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const label = clamped >= 80 ? 'Strong' : clamped >= 50 ? 'Moderate' : 'Weak';
  const color = clamped >= 80 ? '#34d399' : clamped >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-3">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke={theme === 'light' ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.06)"} strokeWidth="5" />
        <defs>
          <linearGradient id="coh-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke="url(#coh-grad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.5))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-mono font-bold leading-none ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{Math.round(clamped)}%</span>
        <span className="text-[8px] uppercase tracking-[0.15em] mt-0.5 font-semibold" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

export default function CompassDashboard({
  isOperational,
  onTransitStart,
  audioInitialized,
  onInitializeAudio,
  triggerGlitch,
}: DashboardProps) {
  const currentReality = useRealityStore((s) => s.currentReality);
  const targetReality = useRealityStore((s) => s.targetReality);
  const telemetry = useRealityStore((s) => s.telemetry);
  const setTarget = useRealityStore((s) => s.setTarget);
  const setCurrentReality = useRealityStore((s) => s.setCurrentReality);
  const clearTarget = useRealityStore((s) => s.clearTarget);
  const travelLog = useRealityStore((s) => s.travelLog);
  const recordTravel = useRealityStore((s) => s.recordTravel);
  const activeDemo = useRealityStore((s) => s.activeDemo);
  const shareLinkCopied = useRealityStore((s) => s.shareLinkCopied);
  const setDemoSession = useRealityStore((s) => s.setDemoSession);
  const setShowPresentation = useRealityStore((s) => s.setShowPresentation);
  const setShareLinkCopied = useRealityStore((s) => s.setShareLinkCopied);
  const theme = useRealityStore((s) => s.theme);
  const toggleTheme = useRealityStore((s) => s.toggleTheme);
  const soundEnabled = useRealityStore((s) => s.soundEnabled);
  const toggleSound = useRealityStore((s) => s.toggleSound);

  const [activeTab, setActiveTab] = useState<'map' | 'history' | 'demos'>('map');
  const [tourStep, setTourStep] = useState<number | null>(null);

  const LOCATION_PRESETS = {
    tiwariganj: {
      name: 'Tiwariganj Crossing',
      coords: { dims: 3, psi: 5.985, entropy: 0.16, localGravity: 0.2917, quantumFlux: 0.01 }
    },
    mercedes: {
      name: 'Mercedes Showroom',
      coords: { dims: 3, psi: 6.0185, entropy: 0.18, localGravity: 0.2944, quantumFlux: 0.01 }
    },
    bbd: {
      name: 'BBD University Gate',
      coords: { dims: 3, psi: 6.0604, entropy: 0.18, localGravity: 0.2976, quantumFlux: 0.01 }
    },
    kamta: {
      name: 'Kamta Crossing',
      coords: { dims: 3, psi: 6.002, entropy: 0.17, localGravity: 0.295, quantumFlux: 0.01 }
    },
    anorakala: {
      name: 'Anora Kala Sector',
      coords: { dims: 3, psi: 5.955, entropy: 0.20, localGravity: 0.285, quantumFlux: 0.01 }
    }
  };

  const [startInputText, setStartInputText] = useState<string>('');
  const [endInputText, setEndInputText] = useState<string>('');
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  const getPresetKeyByName = (name: string): string | null => {
    const entry = Object.entries(LOCATION_PRESETS).find(
      ([_, item]) => item.name.toLowerCase() === name.trim().toLowerCase()
    );
    return entry ? entry[0] : null;
  };

  useEffect(() => {
    if (activeDemo === 'tiwariganj-to-bbd') {
      setStartInputText(LOCATION_PRESETS.tiwariganj.name);
      setEndInputText(LOCATION_PRESETS.bbd.name);
    } else if (activeDemo === 'mercedes-to-bbd') {
      setStartInputText(LOCATION_PRESETS.mercedes.name);
      setEndInputText(LOCATION_PRESETS.bbd.name);
    }
  }, [activeDemo]);

  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGpsLoading(true);
    setStartInputText("My Current Location");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Map real lat/lon deterministically to valid RealityCoordinate bounds
        const psi = Math.round((5.0 + (lat - 26.84) * 20) * 10000) / 10000;
        const localGravity = Math.round((0.29 + (lon - 80.94) * 5) * 10000) / 10000;
        
        const boundedPsi = Math.max(1, Math.min(10, psi));
        const boundedGravity = Math.max(0.05, Math.min(2, localGravity));

        const coords = {
          dims: 3,
          psi: boundedPsi,
          entropy: 0.18,
          localGravity: boundedGravity,
          quantumFlux: 0.05
        };

        setCurrentReality(coords);
        setGpsLoading(false);
        setStartInputText(`My Current Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`);
      },
      (error) => {
        console.warn("Geolocation access denied or failed: ", error.message);
        // Fallback to Lucknow default coordinates
        const coords = {
          dims: 3,
          psi: 6.002,
          entropy: 0.17,
          localGravity: 0.295,
          quantumFlux: 0.01
        };
        setCurrentReality(coords);
        setGpsLoading(false);
        setStartInputText("My Current Location (Lucknow)");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleStartInputChange = (val: string) => {
    setStartInputText(val);
    if (!val) {
      setCurrentReality({ dims: 3, psi: 5, entropy: 0.2, localGravity: 0.3, quantumFlux: 0.5 });
      return;
    }
    
    const presetKey = getPresetKeyByName(val);
    if (presetKey) {
      const preset = LOCATION_PRESETS[presetKey as keyof typeof LOCATION_PRESETS];
      setCurrentReality(preset.coords);
    } else if (val.toLowerCase() === 'my current location') {
      handleUseCurrentLocation();
    } else {
      const coords = hashStringToCoordinate(val);
      setCurrentReality(coords);
    }
  };

  const handleEndInputChange = (val: string) => {
    setEndInputText(val);
    if (!val) {
      clearTarget();
      return;
    }

    const presetKey = getPresetKeyByName(val);
    if (presetKey) {
      const preset = LOCATION_PRESETS[presetKey as keyof typeof LOCATION_PRESETS];
      setTarget(preset.coords);
    } else {
      const coords = hashStringToCoordinate(val);
      setTarget(coords);
    }
  };

  const handleShareSession = () => {
    if (typeof window === 'undefined') return;
    const demo = activeDemo || 'tiwariganj-to-bbd';
    const url = `${window.location.origin}${window.location.pathname}?session=${demo}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setShareLinkCopied(true);
        setTimeout(() => setShareLinkCopied(false), 2000);
      }).catch((err) => {
        console.error("Clipboard copy failed: ", err);
      });
    } else {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setShareLinkCopied(true);
          setTimeout(() => setShareLinkCopied(false), 2000);
          return;
        }
      } catch (err) {
        console.error("Fallback copy failed: ", err);
      }
      alert(`Copy this URL to share: ${url}`);
    }
  };

  const [currentTime, setCurrentTime] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => { ensureKeyframes(); }, []);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSliderChange = (key: keyof RealityCoordinate, value: number) => {
    if (targetReality) { setTarget({ ...targetReality, [key]: value }); }
  };

  const handleTransit = () => {
    if (!isOperational || !targetReality || !telemetry || !telemetry.isPhysicallyPossible) return;
    onTransitStart();
    setTimeout(() => {
      recordTravel(currentReality);
      setCurrentReality(targetReality);
      clearTarget();
      setEndInputText('');
    }, 1500);
  };
  const getEnvironmentalDetails = (key: string | null) => {
    if (!key) {
      return {
        temp: '22.0°C (71.6°F)',
        wind: '15.0 km/h W',
        pressure: '1013 hPa',
        humidity: '45%',
        uvIndex: '1 (Low)',
        visibility: 'Infinite',
        stormFactor: '0.12% (Stable)',
        weatherSummary: 'Clear Sky · Space Folding Active',
      };
    }
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('tiwariganj') || lowerKey.includes('bbd')) {
      return {
        temp: '32.4°C (90.3°F)',
        wind: '8.5 km/h NE',
        pressure: '1011 hPa',
        humidity: '58%',
        uvIndex: '6 (High)',
        visibility: '10.2 km',
        stormFactor: '0.04% (Negligible)',
        weatherSummary: 'Partly Cloudy · Normal Gravity',
      };
    } else if (lowerKey.includes('mercedes')) {
      return {
        temp: '33.1°C (91.6°F)',
        wind: '6.2 km/h E',
        pressure: '1009 hPa',
        humidity: '54%',
        uvIndex: '7 (High)',
        visibility: '12.0 km',
        stormFactor: '0.01% (Negligible)',
        weatherSummary: 'Sunny · Balanced Manifold',
      };
    } else {
      return {
        temp: '22.0°C (71.6°F)',
        wind: '15.0 km/h W',
        pressure: '1013 hPa',
        humidity: '45%',
        uvIndex: '1 (Low)',
        visibility: 'Infinite',
        stormFactor: '0.12% (Stable)',
        weatherSummary: 'Clear Sky · Space Folding Active',
      };
    }
  };

  const getRouteDetails = (startName: string, endName: string) => {
    const details = {
      start: {
        name: startName || 'Observer Core',
        address: 'Faizabad Road, Lucknow Periphery',
        coords: `${currentReality.localGravity.toFixed(4)}G · ${currentReality.psi.toFixed(4)} Hz`,
        elevation: '111 meters',
      },
      end: {
        name: endName || 'Target Space',
        address: 'Lucknow Outer Sector',
        coords: targetReality 
          ? `${targetReality.localGravity.toFixed(4)}G · ${targetReality.psi.toFixed(4)} Hz`
          : '0.00G · 0.0 Hz',
        elevation: '110 meters',
      }
    };

    const startKey = getPresetKeyByName(startName);
    if (startKey) {
      let address = 'Lucknow, Uttar Pradesh, 226028';
      if (startKey === 'tiwariganj') {
        address = 'Faizabad Rd, nearby Tiwariganj Crossing, Lucknow, UP';
      } else if (startKey === 'mercedes') {
        address = 'Faizabad Rd, Silver Arrows Crossing, Lucknow, UP';
      } else if (startKey === 'bbd') {
        address = 'Babu Banarasi Das Campus Gate, Faizabad Rd, Lucknow, UP';
      } else if (startKey === 'kamta') {
        address = 'Kamta Flyover Crossing, Chinhat, Lucknow, UP';
      } else if (startKey === 'anorakala') {
        address = 'Anora Kala Sector Road, Lucknow Outer Ring, UP';
      }
      details.start = {
        name: LOCATION_PRESETS[startKey as keyof typeof LOCATION_PRESETS].name,
        address,
        coords: '26.88° N, 81.02° E',
        elevation: '111 meters',
      };
    } else if (startName.toLowerCase().includes('current')) {
      details.start.address = 'Your Actual GPS Coordinate (High Precision)';
    }

    const endKey = getPresetKeyByName(endName);
    if (endKey) {
      let address = 'Lucknow, Uttar Pradesh, 226028';
      if (endKey === 'tiwariganj') {
        address = 'Faizabad Rd, nearby Tiwariganj Crossing, Lucknow, UP';
      } else if (endKey === 'mercedes') {
        address = 'Faizabad Rd, Silver Arrows Crossing, Lucknow, UP';
      } else if (endKey === 'bbd') {
        address = 'Babu Banarasi Das Campus Gate, Faizabad Rd, Lucknow, UP';
      } else if (endKey === 'kamta') {
        address = 'Kamta Flyover Crossing, Chinhat, Lucknow, UP';
      } else if (endKey === 'anorakala') {
        address = 'Anora Kala Sector Road, Lucknow Outer Ring, UP';
      }
      details.end = {
        name: LOCATION_PRESETS[endKey as keyof typeof LOCATION_PRESETS].name,
        address,
        coords: '26.89° N, 81.06° E',
        elevation: '110 meters',
      };
    } else if (endName.toLowerCase().startsWith('map point')) {
      details.end.address = 'User pointed location on 3D Reality Manifold';
    } else if (endName) {
      details.end.address = 'Deterministically Hashed Celestial Space';
    }

    return details;
  };

  const getRouteCheckpoints = (startName: string, endName: string) => {
    const startKey = getPresetKeyByName(startName) || (startName ? 'custom' : '');
    const endKey = getPresetKeyByName(endName) || (endName ? 'custom' : '');

    const startLabel = startName || 'Observer Core';
    const endLabel = endName || 'Target Reality';

    let intermediate1 = 'Faizabad Rd Bridge';
    let intermediate2 = 'Chinhat Intersection';

    if (startKey === 'mercedes') {
      intermediate1 = 'Kamta Intersection';
      intermediate2 = 'Faizabad Rd Bridge';
    } else if (startKey === 'tiwariganj') {
      intermediate1 = 'Juggaur Crossing';
      intermediate2 = 'Semra Mod';
    } else if (startKey === 'kamta') {
      intermediate1 = 'Chinhat bypass';
      intermediate2 = 'Semra Mod';
    } else if (startKey === 'custom' || endKey === 'custom') {
      const displayLabel = endLabel.length > 15 ? 'Celestial' : endLabel;
      intermediate1 = `${displayLabel} Gateway`;
      intermediate2 = `${displayLabel} Dimension Sync`;
    }

    return [
      { label: `${startLabel} (Origin)`, desc: 'Road marker 0.0 km · Phase Lock' },
      { label: `${intermediate1} Fold`, desc: 'Faizabad Rd · Wave Align' },
      { label: `${intermediate2} Modulator`, desc: 'Geodesic Spacetime Fold' },
      { label: `${endLabel} (Target)`, desc: 'Warp coordinates locked · Coherence 100%' },
    ];
  };

  const getRouteForecast = (startName: string, endName: string) => {
    const startKey = getPresetKeyByName(startName);
    const endKey = getPresetKeyByName(endName);

    let roadDist = '5.0 km';
    let drivingTime = '12 mins';
    let traffic = 'Light traffic on Faizabad Road';
    let delay = '+1 min';
    let warpTime = '1.5s';
    let timeSaved = '12 mins equivalent saved';

    if (startKey === 'tiwariganj' && endKey === 'bbd') {
      roadDist = '8.4 km';
      drivingTime = '18 mins';
      traffic = 'Moderate congestion near Chinhat flyover';
      delay = '+4 mins';
      timeSaved = '18 mins equivalent saved';
    } else if (startKey === 'mercedes' && endKey === 'bbd') {
      roadDist = '4.9 km';
      drivingTime = '12 mins';
      traffic = 'Light congestion near Kamta crossing';
      delay = '+1 min';
      timeSaved = '12 mins equivalent saved';
    } else if (startKey === 'kamta' && endKey === 'bbd') {
      roadDist = '3.5 km';
      drivingTime = '8 mins';
      traffic = 'Heavy congestion near BBD Campus';
      delay = '+3 mins';
      timeSaved = '8 mins equivalent saved';
    } else if (startKey === 'anorakala' && endKey === 'bbd') {
      roadDist = '10.5 km';
      drivingTime = '22 mins';
      traffic = 'Congestion: high traffic near Chinhat flyover';
      delay = '+6 mins';
      timeSaved = '22 mins equivalent saved';
    } else if (targetReality && targetReality.dims > 3) {
      roadDist = 'N/A (Multi-dimensional)';
      drivingTime = 'Infinite';
      traffic = 'Quantum noise; no road traffic in higher dimensions';
      delay = '0 delay';
      timeSaved = 'Instantaneous transition across dimensions';
    } else if (targetReality) {
      const distanceVal = Math.abs(targetReality.psi - currentReality.psi) * 15;
      roadDist = `${distanceVal.toFixed(1)} km`;
      const timeVal = Math.round(distanceVal * 2.2);
      drivingTime = `${timeVal} mins`;
      traffic = 'Variable traffic conditions detected';
      delay = `+${Math.round(targetReality.entropy * 8)} mins`;
      timeSaved = `${timeVal} mins equivalent saved`;
    }

    return {
      roadDist,
      drivingTime,
      warpTime,
      timeSaved,
      traffic,
      delay,
      weather: targetReality 
        ? `Atmosphere stable · ${(targetReality.psi * 5 + 15).toFixed(1)}°C · Wind ${(targetReality.entropy * 20).toFixed(1)} km/h`
        : 'Stable Atmosphere · 32.4°C · NE 8.5 km/h',
    };
  };

  const ux = telemetry && targetReality ? translateTelemetry(telemetry, targetReality) : null;
  const envReport = targetReality ? generateEnvironmentReport(targetReality) : null;

  const colorMap: Record<CompassColor, string> = theme === 'light' ? {
    green: 'text-emerald-600 border-emerald-200 bg-emerald-50/50',
    amber: 'text-amber-700 border-amber-200 bg-amber-50/50',
    red: 'text-rose-600 border-rose-200 bg-rose-50/50',
    violet: 'text-violet-600 border-violet-200 bg-violet-50/50',
  } : {
    green: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
    red: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
    violet: 'text-violet-400 border-violet-500/30 bg-violet-500/5',
  };

  const glass = theme === 'light'
    ? 'bg-white/80 backdrop-blur-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] rounded-2xl'
    : 'bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl';

  const sliderDefs = [
    { key: 'dims' as const, label: 'Reality Layer', unit: 'D', min: 3, max: 11, step: 1, decimals: 0, desc: 'Spatial dimensions' },
    { key: 'psi' as const, label: 'Wave Sync', unit: ' Hz', min: 1, max: 10, step: 0.1, decimals: 1, desc: 'Frequency alignment' },
    { key: 'entropy' as const, label: 'Stability', unit: '', min: 0, max: 1, step: 0.01, decimals: 2, desc: 'Route stability' },
    { key: 'localGravity' as const, label: 'Mass Field', unit: 'G', min: 0, max: 1, step: 0.01, decimals: 2, desc: 'Gravitational pull' },
    { key: 'quantumFlux' as const, label: 'Energy Flow', unit: '', min: 0.01, max: 1, step: 0.01, decimals: 2, desc: 'Quantum energy' },
  ] as const;

  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20 gap-3 ${theme === 'light' ? 'light' : ''}`}>
      {/* TOP BAR */}
      <header
        className={`pointer-events-auto ${glass} px-5 py-3 flex items-center justify-between relative overflow-hidden`}
        style={{
          borderBottomWidth: 2,
          borderImage: theme === 'light'
            ? 'linear-gradient(90deg, #a855f7, #06b6d4, #a855f7) 1'
            : 'linear-gradient(90deg, #a855f7, #06b6d4, #a855f7) 1',
          animation: 'cdb-gradient-shift 6s ease infinite',
          backgroundSize: '200% 200%',
        }}
      >
        <div className="flex items-center gap-3">
          <svg className="w-7 h-7 text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity={0.35} stroke="currentColor" />
          </svg>
          <div>
            <h1 className={`text-[11px] font-bold tracking-[0.35em] uppercase leading-none ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Universal Compass</h1>
            <p className={`text-[9px] tracking-[0.2em] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>Your Path Across Realities</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 relative">
            <span className={`w-2 h-2 rounded-full ${isOperational ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ boxShadow: isOperational ? '0 0 8px rgba(52,211,153,0.7)' : 'none' }} />
            {isOperational && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-emerald-400" style={{ animation: 'cdb-pulse-ring 2s ease-out infinite' }} />}
            <span className={`text-[9px] font-semibold tracking-[0.15em] uppercase ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>{isOperational ? 'Connected' : 'Offline'}</span>
          </div>

          <button onClick={toggleTheme} className={`px-3 py-1.5 rounded-lg text-[9px] transition-all duration-300 font-semibold uppercase tracking-[0.15em] ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 hover:text-slate-800'
              : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white'
          }`}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button onClick={() => setShowPresentation(true)} className={`px-3 py-1.5 rounded-lg text-[9px] transition-all duration-300 font-semibold uppercase tracking-[0.15em] ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-purple-500/10 border border-slate-200 text-slate-600 hover:text-purple-600'
              : 'bg-white/[0.04] hover:bg-purple-500/10 border border-white/10 text-zinc-400 hover:text-purple-400'
          }`}>
            📂 How It Works
          </button>
          <button onClick={handleShareSession} className={`px-3 py-1.5 rounded-lg text-[9px] transition-all duration-300 font-semibold uppercase tracking-[0.15em] ${
            theme === 'light'
              ? 'bg-slate-100 hover:bg-amber-500/10 border border-slate-200 text-slate-600 hover:text-amber-600'
              : 'bg-white/[0.04] hover:bg-amber-500/10 border border-white/10 text-zinc-400 hover:text-amber-400'
          }`}>
            {shareLinkCopied ? '✓ Link Copied!' : '🔗 Share Route'}
          </button>
          <button onClick={toggleSound} className={`px-3 py-1.5 rounded-lg text-[9px] transition-all duration-300 font-semibold uppercase tracking-[0.15em] ${
            soundEnabled
              ? theme === 'light'
                ? 'bg-cyan-100 hover:bg-cyan-200/80 border border-cyan-200 text-cyan-700 hover:text-cyan-900'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300'
              : theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-700'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-zinc-300'
          }`}>
            {soundEnabled ? '🔊 Sound On' : '🔇 Muted'}
          </button>
          <span className={`font-mono text-[10px] tracking-wider tabular-nums ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>{currentTime}</span>
        </div>
      </header>

      {/* MAIN PANELS */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch overflow-hidden min-h-0">
        {/* LEFT PANEL */}
        <section className={`pointer-events-auto ${glass} p-5 flex flex-col overflow-y-auto max-h-[72vh] relative`}>
          {telemetry && <CoherenceGauge value={telemetry.anchorCoherence} theme={theme} />}

          {/* Destination Settings Form */}
          <div className="mb-5 space-y-3.5">
            <h2 className={`text-[10px] font-bold uppercase tracking-[0.25em] pb-1.5 border-b flex items-center gap-2 ${theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-zinc-400 border-white/[0.06]'}`}>
              <span>🗺️</span> Route Selector
            </h2>
            
            {/* Start Location Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Start Origin Point
                </label>
                <button
                  onClick={handleUseCurrentLocation}
                  disabled={gpsLoading}
                  className={`text-[8px] uppercase tracking-wider font-bold flex items-center gap-1 transition-all duration-300 pointer-events-auto ${
                    gpsLoading 
                      ? 'text-zinc-400 cursor-not-allowed'
                      : theme === 'light'
                        ? 'text-cyan-600 hover:text-cyan-700'
                        : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  {gpsLoading ? (
                    <span className="inline-block animate-spin">⏳</span>
                  ) : '📍'} {gpsLoading ? 'Locating...' : 'Use My GPS Location'}
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  list="start-presets-list"
                  value={startInputText}
                  onChange={(e) => handleStartInputChange(e.target.value)}
                  placeholder="Type any place name, galaxy or preset..."
                  className={`w-full p-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-300 pointer-events-auto ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500 focus:bg-white'
                      : 'bg-white/[0.02] border-white/10 text-white focus:border-cyan-500 focus:bg-slate-900'
                  }`}
                />
                <datalist id="start-presets-list">
                  <option value="My Current Location" />
                  {Object.entries(LOCATION_PRESETS).map(([key, item]) => (
                    <option key={key} value={item.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* End Location Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                  End Destination Point
                </label>
                <span className={`text-[8px] uppercase tracking-wider font-bold ${
                  theme === 'light' ? 'text-purple-600' : 'text-purple-400'
                }`}>
                  🗺️ Click map to select target
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  list="end-presets-list"
                  value={endInputText}
                  onChange={(e) => handleEndInputChange(e.target.value)}
                  placeholder="Type a custom name, galaxy or click on map..."
                  className={`w-full p-2.5 rounded-xl border text-[11px] font-semibold transition-all duration-300 pointer-events-auto ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500 focus:bg-white'
                      : 'bg-white/[0.02] border-white/10 text-white focus:border-cyan-500 focus:bg-slate-900'
                  }`}
                />
                <datalist id="end-presets-list">
                  {Object.entries(LOCATION_PRESETS).map(([key, item]) => (
                    <option key={key} value={item.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Spacetime Checkpoints Route Map */}
          <div className="mb-5 flex-1 flex flex-col min-h-0">
            <h2 className={`text-[10px] font-bold uppercase tracking-[0.25em] mb-4 pb-1.5 border-b flex items-center gap-2 ${theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-zinc-400 border-white/[0.06]'}`}>
              <span>📍</span> Route Checkpoint Map
            </h2>
            <div className="relative pl-6 space-y-4 overflow-y-auto pr-2 scrollbar-none flex-1">
              {/* Vertical timeline line */}
              <div className={`absolute left-[11px] top-1.5 bottom-1.5 w-0.5 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/[0.06]'}`} />
              
              {getRouteCheckpoints(startInputText, endInputText).map((cp, idx, arr) => (
                <div key={idx} className="relative group/cp">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    idx === 0 
                      ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                      : idx === arr.length - 1
                        ? 'bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                        : theme === 'light'
                          ? 'bg-slate-100 border-slate-300 group-hover/cp:border-cyan-400'
                          : 'bg-zinc-800 border-zinc-700 group-hover/cp:border-cyan-500'
                  }`}>
                    {/* Inner pulse for active endpoints */}
                    {(idx === 0 || idx === arr.length - 1) && (
                      <span className="absolute w-2 h-2 rounded-full bg-white animate-ping opacity-75" />
                    )}
                  </div>
                  
                  {/* Checkpoint text */}
                  <div>
                    <div className={`text-[10px] font-bold tracking-wide uppercase ${theme === 'light' ? 'text-slate-700' : 'text-zinc-200'}`}>
                      {cp.label}
                    </div>
                    <div className={`text-[9px] mt-0.5 font-mono ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                      {cp.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`text-[9px] uppercase tracking-[0.2em] mb-3 pb-1.5 border-b flex items-center gap-1.5 transition-colors font-semibold ${
              theme === 'light'
                ? 'text-slate-500 hover:text-slate-700 border-slate-200'
                : 'text-zinc-500 hover:text-zinc-300 border-white/[0.06]'
            }`}
          >
            <span className="text-[7px]">{showAdvanced ? '▼' : '▶'}</span> Advanced Controls
          </button>

          {showAdvanced && targetReality && (
            <div className="space-y-3 flex-1">
              {sliderDefs.map(({ key, label, unit, min, max, step, decimals, desc }) => (
                <div key={key} className={`group rounded-xl p-2 -mx-1 transition-all duration-300 ${theme === 'light' ? 'hover:bg-slate-100/50' : 'hover:bg-white/[0.03]'}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <div>
                      <span className={`tracking-wider text-[10px] transition-colors ${theme === 'light' ? 'text-slate-600 group-hover:text-slate-900' : 'text-zinc-400 group-hover:text-zinc-300'}`}>{label}</span>
                      <span className={`text-[8px] ml-1.5 ${theme === 'light' ? 'text-slate-400' : 'text-zinc-600'}`}>{desc}</span>
                    </div>
                    <span className={`font-mono font-semibold text-[11px] tabular-nums ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      {key === 'dims' ? `${targetReality[key]}${unit}` : `${(targetReality[key] as number).toFixed(decimals)}${unit}`}
                    </span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={targetReality[key]}
                    onChange={(e) => handleSliderChange(key, key === 'dims' ? parseInt(e.target.value) : parseFloat(e.target.value))}
                    className="w-full" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CENTER PANEL – 3D Map or Warp History under Tabs */}
        <section className={`pointer-events-auto ${glass} p-5 flex flex-col overflow-hidden max-h-[72vh] relative`}>
          {/* Tour banner if user is in idle mode */}
          {tourStep === null && !targetReality && (
            <div className={`mb-3.5 p-3 rounded-xl border flex items-center justify-between text-xs transition-all duration-300 ${
              theme === 'light' ? 'bg-cyan-50 border-cyan-100 text-cyan-800' : 'bg-cyan-500/[0.03] border-cyan-500/20 text-cyan-300'
            }`}>
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span className="font-medium">New to the Portal? Take a quick 30-second guided tour.</span>
              </div>
              <button
                onClick={() => setTourStep(0)}
                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-white font-mono font-bold text-[9px] uppercase rounded-lg tracking-wider transition-all duration-300"
              >
                Start Tour
              </button>
            </div>
          )}

          {/* Tab buttons */}
          <div className="flex gap-3 mb-4 border-b border-white/[0.06] pb-2">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'map'
                  ? theme === 'light'
                    ? 'bg-cyan-100 border border-cyan-200 text-cyan-700 font-bold'
                    : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold'
                  : theme === 'light'
                    ? 'text-slate-400 hover:text-slate-600'
                    : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🌐 3D Reality Map
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'history'
                  ? theme === 'light'
                    ? 'bg-purple-100 border border-purple-200 text-purple-700 font-bold'
                    : 'bg-purple-500/15 border border-purple-500/30 text-purple-400 font-bold'
                  : theme === 'light'
                    ? 'text-slate-400 hover:text-slate-600'
                    : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🕒 Warp History
            </button>
            <button
              onClick={() => setActiveTab('demos')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'demos'
                  ? theme === 'light'
                    ? 'bg-amber-100 border border-amber-200 text-amber-700 font-bold'
                    : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold'
                  : theme === 'light'
                    ? 'text-slate-400 hover:text-slate-600'
                    : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🎁 Demo Routes
            </button>
          </div>

          {/* Tab contents */}
          <div className="flex-1 min-h-0 relative">
            {activeTab === 'map' ? (
              <div className="absolute inset-0 rounded-xl overflow-hidden border border-white/[0.06] bg-slate-950/20">
                <UniversalRealityMap
                  triggerGlitch={triggerGlitch}
                  phaseLock={isOperational}
                  onMapClick={(coords, label) => {
                    setEndInputText(label);
                    setTarget(coords);
                  }}
                />
              </div>
            ) : activeTab === 'history' ? (
              <div className="absolute inset-0 overflow-y-auto pr-1 space-y-3.5 scrollbar-none">
                <h3 className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                  Trip Logs ({travelLog.length})
                </h3>
                {travelLog.length === 0 ? (
                  <p className={`text-xs italic ${theme === 'light' ? 'text-slate-400' : 'text-zinc-600'}`}>
                    No dimensions warped yet. Select a quick route and click "Start Journey" to record history!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {travelLog.map((log, idx) => (
                      <div key={idx} className={`border rounded-xl p-3 text-xs space-y-1.5 ${
                        theme === 'light' ? 'bg-slate-100/50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
                      }`}>
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className={theme === 'light' ? 'text-purple-600' : 'text-purple-400'}>WARP MATCH #{idx + 1}</span>
                          <span className={theme === 'light' ? 'text-slate-400' : 'text-zinc-500'}>1.5s TRANSIT</span>
                        </div>
                        <div className={`font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                          {log.dims}D Manifold ({log.psi.toFixed(1)},{log.entropy.toFixed(1)})
                        </div>
                        <div className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                          Coordinates: Gravity {log.localGravity.toFixed(3)}G · Flux {log.quantumFlux.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 overflow-y-auto pr-1 space-y-3.5 scrollbar-none">
                <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                  Quick Demo Routes
                </h3>
                <p className={`text-[10px] leading-relaxed mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Click any demo route below to auto-configure start and target coordinates across Faizabad Road checkpoints.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => setDemoSession('tiwariganj-to-bbd')}
                    className={`w-full py-3 px-4 border rounded-xl text-left transition-all duration-500 group pointer-events-auto ${
                      activeDemo === 'tiwariganj-to-bbd'
                        ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : theme === 'light'
                          ? 'border-slate-200 hover:border-cyan-500/30 bg-slate-100/30 hover:bg-slate-100/60'
                          : 'border-white/10 hover:border-cyan-500/30 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          activeDemo === 'tiwariganj-to-bbd'
                            ? 'text-cyan-600'
                            : theme === 'light'
                              ? 'text-slate-700 group-hover:text-cyan-600'
                              : 'text-zinc-300 group-hover:text-cyan-400'
                        }`}>
                          📍 Tiwariganj → BBD University
                        </div>
                        <div className={`text-[9px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>~8.4 km road · 1.5s warp</div>
                      </div>
                      {activeDemo === 'tiwariganj-to-bbd' && <span className="text-cyan-500 text-[9px] font-bold">ACTIVE</span>}
                    </div>
                  </button>
                  <button
                    onClick={() => setDemoSession('mercedes-to-bbd')}
                    className={`w-full py-3 px-4 border rounded-xl text-left transition-all duration-500 group pointer-events-auto ${
                      activeDemo === 'mercedes-to-bbd'
                        ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : theme === 'light'
                          ? 'border-slate-200 hover:border-amber-500/30 bg-slate-100/30 hover:bg-slate-100/60'
                          : 'border-white/10 hover:border-amber-500/30 bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          activeDemo === 'mercedes-to-bbd'
                            ? 'text-amber-600'
                            : theme === 'light'
                              ? 'text-slate-700 group-hover:text-amber-600'
                              : 'text-zinc-300 group-hover:text-amber-400'
                        }`}>
                          🚗 Mercedes Showroom → BBD
                        </div>
                        <div className={`text-[9px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>~4.9 km road · 1.5s warp</div>
                      </div>
                      {activeDemo === 'mercedes-to-bbd' && <span className="text-amber-500 text-[9px] font-bold">ACTIVE</span>}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className={`pointer-events-auto ${glass} p-5 flex flex-col overflow-y-auto max-h-[72vh] relative`}>
          <h2 className={`text-[10px] font-bold uppercase tracking-[0.25em] mb-4 pb-2 border-b flex items-center gap-2 ${theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-zinc-400 border-white/[0.06]'}`}>
            <span>📊</span> Journey Details
          </h2>

          {!targetReality && (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-3">
              <span className="text-4xl">🚀</span>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-700' : 'text-zinc-300'}`}>
                Ready to Navigate
              </h3>
              <p className={`text-[10px] leading-relaxed max-w-[200px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                Select a quick route on the left or use the onboarding tour to calibrate target reality coordinates.
              </p>
              <button
                onClick={() => setTourStep(0)}
                className={`px-3 py-1.5 border rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-white/10 text-zinc-400 hover:bg-white/[0.04]'
                }`}
              >
                💡 Start Tour
              </button>
            </div>
          )}

          {ux && telemetry && envReport && (
            <div className="space-y-4 flex-1">
              {/* Status card */}
              <div className={`border rounded-xl p-3.5 flex gap-3 items-start transition-all duration-500 ${colorMap[ux.trafficLight.color]}`}>
                <span className="relative flex h-4 w-4 shrink-0 mt-0.5">
                  <span className={`absolute inset-0 rounded-full opacity-50 ${
                    ux.trafficLight.color === 'green' ? 'bg-emerald-400' : ux.trafficLight.color === 'amber' ? 'bg-amber-400' : ux.trafficLight.color === 'red' ? 'bg-rose-400' : 'bg-violet-400'
                  }`} style={{ animation: 'cdb-pulse-ring 2.5s ease-out infinite' }} />
                  <span className={`relative inline-flex rounded-full h-4 w-4 ${
                    ux.trafficLight.color === 'green' ? 'bg-emerald-400' : ux.trafficLight.color === 'amber' ? 'bg-amber-400' : ux.trafficLight.color === 'red' ? 'bg-rose-400' : 'bg-violet-400'
                  }`} />
                </span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.1em]">{ux.trafficLight.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5 leading-snug">{ux.trafficLight.description}</div>
                </div>
              </div>

              {/* Route path */}
              {telemetry.fromName && telemetry.toName && (
                <div className={`rounded-xl p-3.5 border ${theme === 'light' ? 'bg-purple-500/[0.04] border-purple-500/10' : 'bg-purple-500/[0.06] border-purple-500/20'}`}>
                  <div className="text-[9px] text-purple-500 uppercase tracking-[0.2em] font-bold mb-1.5">Your Route</div>
                  <div className={`font-semibold text-xs flex items-center gap-2 flex-wrap ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                    <span className="text-cyan-500">{telemetry.fromName}</span>
                    <span className="text-purple-400 text-sm" style={{ animation: 'cdb-arrow-slide 2s ease-in-out infinite', display: 'inline-block' }}>⟶</span>
                    <span className="text-amber-500">{telemetry.toName}</span>
                  </div>
                </div>
              )}

              {/* Detailed Starting / Ending points card */}
              {(() => {
                const details = getRouteDetails(startInputText, endInputText);
                return (
                  <div className={`rounded-xl p-3 border space-y-2.5 text-[10px] ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.06]'
                  }`}>
                    <div>
                      <span className={`uppercase font-bold tracking-wider text-[8px] ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'}`}>START POINT DETAILS</span>
                      <div className={`font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{details.start.name}</div>
                      <div className={`opacity-80 leading-snug mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>{details.start.address}</div>
                      <div className={`font-mono text-[9px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>{details.start.coords} · {details.start.elevation}</div>
                    </div>
                    <div className={`border-t border-dashed ${theme === 'light' ? 'border-slate-200' : 'border-white/[0.08]'}`} />
                    <div>
                      <span className={`uppercase font-bold tracking-wider text-[8px] ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`}>END POINT DETAILS</span>
                      <div className={`font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{details.end.name}</div>
                      <div className={`opacity-80 leading-snug mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>{details.end.address}</div>
                      <div className={`font-mono text-[9px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>{details.end.coords} · {details.end.elevation}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Route Forecast Preview Card */}
              {(() => {
                const forecast = getRouteForecast(startInputText, endInputText);
                return (
                  <div className={`rounded-xl p-3.5 border space-y-3 transition-all duration-300 ${
                    theme === 'light' ? 'bg-amber-50/40 border-slate-200 hover:border-amber-500/20 shadow-[0_2px_8px_rgba(245,158,11,0.02)]' : 'bg-white/[0.01] border-white/[0.06] hover:border-amber-500/20'
                  }`}>
                    <h3 className={`text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 ${theme === 'light' ? 'text-amber-700' : 'text-amber-400'}`}>
                      <span>📊</span> Route Forecast & Preview
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5 text-[10px] font-mono">
                      <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-slate-100/70' : 'bg-white/[0.02]'}`}>
                        <div className={theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}>ROAD DRIVING</div>
                        <div className={`font-semibold text-xs ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{forecast.drivingTime}</div>
                        <div className="text-[8px] text-rose-500">{forecast.delay} traffic delay</div>
                      </div>
                      <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-cyan-50' : 'bg-cyan-500/[0.05]'}`}>
                        <div className={theme === 'light' ? 'text-cyan-700' : 'text-cyan-500'}>COMPASS WARP</div>
                        <div className={`font-semibold text-xs ${theme === 'light' ? 'text-cyan-800' : 'text-cyan-400'}`}>{forecast.warpTime}</div>
                        <div className="text-[8px] text-emerald-500">100% time saved</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono leading-relaxed space-y-1">
                      <div className={`${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                        🚗 <span className="font-bold">Traffic:</span> {forecast.traffic}
                      </div>
                      <div className={`${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                        🌤️ <span className="font-bold">Weather:</span> {forecast.weather}
                      </div>
                      <div className={`${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                        ⏱️ <span className="font-bold">Time Saved:</span> {forecast.timeSaved}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                {[
                  { label: 'Distance', value: telemetry.geodesicDistance },
                  { label: 'Speed Factor', value: telemetry.lorentzFactor },
                  { label: 'Time Shift', value: telemetry.timeDilatation },
                  { label: 'Safety Level', value: telemetry.bekensteinSaturation },
                ].map((m) => (
                  <div key={m.label} className={`border rounded-xl p-3 transition-all duration-300 ${theme === 'light' ? 'bg-slate-100/40 border-slate-200 hover:border-cyan-500/20' : 'bg-white/[0.03] border-white/[0.06] hover:border-cyan-500/20'}`}>
                    <div className={`text-[8px] uppercase tracking-[0.15em] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>{m.label}</div>
                    <div className={`font-semibold mt-1 truncate tabular-nums ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Planetary Weather HUD */}
              {(() => {
                const weather = getEnvironmentalDetails(endInputText || activeDemo);
                return (
                  <div className={`border rounded-xl p-3.5 space-y-2.5 transition-all duration-300 ${
                    theme === 'light' 
                      ? 'bg-cyan-500/[0.02] border-slate-200 hover:border-cyan-500/20' 
                      : 'bg-white/[0.01] border-white/[0.06] hover:border-cyan-500/20'
                  }`}>
                    <h3 className={`text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'}`}>
                      <span>🌤️</span> Planetary Weather HUD
                    </h3>
                    <p className={`text-[10px] font-mono italic leading-snug ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                      {weather.weatherSummary}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className={`${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                        Temp: <span className={theme === 'light' ? 'text-slate-800 font-semibold' : 'text-white'}>{weather.temp}</span>
                      </div>
                      <div className={`${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                        Wind: <span className={theme === 'light' ? 'text-slate-800 font-semibold' : 'text-white'}>{weather.wind}</span>
                      </div>
                      <div className={`${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                        Pressure: <span className={theme === 'light' ? 'text-slate-800 font-semibold' : 'text-white'}>{weather.pressure}</span>
                      </div>
                      <div className={`${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                        Humidity: <span className={theme === 'light' ? 'text-slate-800 font-semibold' : 'text-white'}>{weather.humidity}</span>
                      </div>
                      <div className={`${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                        Visibility: <span className={theme === 'light' ? 'text-slate-800 font-semibold' : 'text-white'}>{weather.visibility}</span>
                      </div>
                      <div className={`${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                        Q-Storm: <span className={`font-semibold ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`}>{weather.stormFactor}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Environment */}
              <div className={`border rounded-xl p-3.5 space-y-2 ${theme === 'light' ? 'bg-slate-100/40 border-slate-200' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                <h3 className={`text-[9px] font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'}`}>Destination Environment</h3>
                <p className={`text-[10px] font-mono italic leading-snug ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>&ldquo;{envReport.summary}&rdquo;</p>
                <ul className={`text-[10px] space-y-1 font-mono ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>
                  {[
                    { icon: '🌤️', label: 'Atmosphere', value: envReport.atmosphere },
                    { icon: '⚖️', label: 'Gravity', value: envReport.gravity },
                    { icon: '⏱️', label: 'Time Flow', value: envReport.timeFlow },
                    { icon: '📐', label: 'Structure', value: envReport.dimensionality },
                  ].map((e) => (
                    <li key={e.label} className="flex items-start gap-1.5">
                      <span className="text-[9px] mt-px">{e.icon}</span>
                      <span><span className={theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}>{e.label}:</span> {e.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Journey button */}
          {ux && (
            <button
              disabled={!isOperational || !ux.canTravel}
              onClick={handleTransit}
              className={`w-full mt-4 py-4 px-4 rounded-2xl text-sm font-bold uppercase tracking-[0.25em] transition-all duration-500 border relative overflow-hidden ${
                isOperational && ux.canTravel
                  ? 'border-purple-500/40 text-white active:scale-[0.97]'
                  : theme === 'light'
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-600 cursor-not-allowed'
              }`}
              style={
                isOperational && ux.canTravel
                  ? {
                      background: 'linear-gradient(270deg, #a855f7, #06b6d4, #a855f7, #06b6d4)',
                      backgroundSize: '400% 400%',
                      animation: 'cdb-btn-shimmer 6s linear infinite',
                      boxShadow: '0 0 30px rgba(168,85,247,0.3), 0 0 60px rgba(6,182,212,0.15)',
                    }
                  : undefined
              }
            >
              {!isOperational ? 'Connecting...' : !ux.canTravel ? 'Route Unstable' : '🚀 Start Journey'}
            </button>
          )}
        </section>
      </div>

      {/* BOTTOM BAR */}
      <footer className={`pointer-events-auto ${glass} px-5 py-2.5 flex items-center gap-4 font-mono text-[10px] max-h-[56px]`}>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-500'}`}>Journey Log</span>
        </div>
        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-none">
          {travelLog.length === 0 ? (
            <span className={`italic ${theme === 'light' ? 'text-slate-400' : 'text-zinc-700'}`}>No journeys yet. Select a route and start your first trip!</span>
          ) : (
            travelLog.map((log, index) => (
              <div key={index} className={`flex items-center gap-1.5 shrink-0 border rounded-full px-3 py-1 transition-all duration-300 ${
                theme === 'light'
                  ? 'bg-slate-100/60 border-slate-200 text-slate-600 hover:border-cyan-500/20 hover:text-slate-800'
                  : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:border-cyan-500/20 hover:text-zinc-200'
              }`}>
                <span className={`text-[8px] ${theme === 'light' ? 'text-slate-400' : 'text-zinc-600'}`}>#{index + 1}</span>
                <span className="tabular-nums">{log.dims}D ({log.psi.toFixed(1)},{log.entropy.toFixed(1)})</span>
              </div>
            ))
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <span className={`text-[8px] uppercase tracking-[0.15em] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-600'}`}>Trips</span>
          <span className="font-semibold text-cyan-500 drop-shadow-[0_0_4px_rgba(6,182,212,0.4)] tabular-nums">{travelLog.length}</span>
        </div>
      </footer>

      {/* Interactive Tour Guide Box */}
      {tourStep !== null && (
        <div className={`fixed inset-x-4 bottom-20 md:bottom-auto md:top-24 md:left-[35%] md:w-[30%] z-40 p-4 border rounded-2xl shadow-[0_8px_32px_rgba(6,182,212,0.15)] transition-all duration-300 pointer-events-auto ${
          theme === 'light' ? 'bg-white border-cyan-200 text-slate-800' : 'bg-slate-900 border-cyan-500/30 text-white'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-mono font-bold text-cyan-500 uppercase tracking-widest">
              Guided Onboarding · Step {tourStep + 1} of 4
            </span>
            <button
              onClick={() => setTourStep(null)}
              className={`text-[10px] font-bold ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Skip ✕
            </button>
          </div>
          
          <p className={`text-xs leading-relaxed mb-3 ${theme === 'light' ? 'text-slate-600 font-medium' : 'text-zinc-300'}`}>
            {tourStep === 0 && "👋 Welcome! Start by choosing a travel route from the 'Quick Routes' menu on the left panel (like Tiwariganj to BBD)."}
            {tourStep === 1 && "📍 Review the Route Checkpoint Map and Destination Weather HUD to see your physical landmarks and real-time conditions."}
            {tourStep === 2 && "🔇 Adjust sound settings as you wish! You can mute or unmute the space folding oscillators using the button in the top bar."}
            {tourStep === 3 && "🚀 Ready? Press the glowing 'Start Journey' button on the right to initiate transit and step through the portal!"}
          </p>
          
          <div className="flex justify-between items-center">
            {tourStep > 0 ? (
              <button
                onClick={() => setTourStep((s) => s! - 1)}
                className={`px-2.5 py-1.5 border rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider ${
                  theme === 'light' ? 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100' : 'border-white/10 text-zinc-400 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                ◀ Back
              </button>
            ) : (
              <div />
            )}
            
            <button
              onClick={() => {
                if (tourStep === 3) {
                  setTourStep(null);
                } else {
                  setTourStep((s) => s! + 1);
                }
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-[9px] font-mono font-bold rounded-lg uppercase tracking-wider transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
            >
              {tourStep === 3 ? 'Finish Tour 🎉' : 'Next Step ▶'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

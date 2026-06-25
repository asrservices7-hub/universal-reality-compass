import { create } from 'zustand';
import {
  RealityCoordinate,
  RouteTelemetry,
  calculateUniversalRoute,
} from '@/utils/routingEngine';

interface RealityNode {
  id: string;
  label: string;
  coordinate: RealityCoordinate;
  connections: string[];
  timestamp: number;
}

interface RealityStore {
  currentReality: RealityCoordinate;
  setCurrentReality: (coord: Partial<RealityCoordinate>) => void;

  targetReality: RealityCoordinate | null;
  setTarget: (coord: RealityCoordinate) => void;
  clearTarget: () => void;

  telemetry: RouteTelemetry | null;
  calculateRoute: () => void;

  nodes: Record<string, RealityNode>;
  addNode: (label: string) => string;

  travelLog: RealityCoordinate[];
  recordTravel: (coord: RealityCoordinate) => void;

  activeDemo: 'mercedes-to-bbd' | 'tiwariganj-to-bbd' | null;
  showPresentation: boolean;
  shareLinkCopied: boolean;
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  setDemoSession: (active: 'mercedes-to-bbd' | 'tiwariganj-to-bbd' | null) => void;
  setShowPresentation: (show: boolean) => void;
  setShareLinkCopied: (copied: boolean) => void;
  toggleTheme: () => void;
  toggleSound: () => void;
}

function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useRealityStore = create<RealityStore>((set, get) => ({
  currentReality: {
    dims: 3,
    psi: 5,
    entropy: 0.2,
    localGravity: 0.3,
    quantumFlux: 0.5,
  },

  setCurrentReality: (partial) =>
    set((state) => ({
      currentReality: { ...state.currentReality, ...partial },
    })),

  targetReality: null,

  setTarget: (coord) => {
    const state = get();
    const telemetry = calculateUniversalRoute(state.currentReality, coord);
    set({ targetReality: coord, telemetry });
  },

  clearTarget: () => set({ targetReality: null, telemetry: null }),

  telemetry: null,

  calculateRoute: () => {
    const state = get();
    if (state.targetReality) {
      const telemetry = calculateUniversalRoute(
        state.currentReality,
        state.targetReality
      );
      set({ telemetry });
    }
  },

  nodes: {},

  addNode: (label) => {
    const id = generateId();
    const state = get();
    const node: RealityNode = {
      id,
      label,
      coordinate: { ...state.currentReality },
      connections: [],
      timestamp: Date.now(),
    };
    set((s) => ({ nodes: { ...s.nodes, [id]: node } }));
    return id;
  },

  travelLog: [],

  recordTravel: (coord) =>
    set((state) => ({
      travelLog: [...state.travelLog, { ...coord }],
    })),

  activeDemo: null,
  showPresentation: false,
  shareLinkCopied: false,
  theme: typeof window !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark' || 'light') : 'light',
  soundEnabled: false,

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
    }
    return { theme: nextTheme };
  }),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  setDemoSession: (active) => {
    if (active === 'mercedes-to-bbd') {
      const current = {
        dims: 3,
        psi: 6.0185,
        entropy: 0.18,
        localGravity: 0.2944,
        quantumFlux: 0.01,
      };
      const target = {
        dims: 3,
        psi: 6.0604,
        entropy: 0.18,
        localGravity: 0.2976,
        quantumFlux: 0.01,
      };
      const telemetry = calculateUniversalRoute(current, target);
      set({
        currentReality: current,
        targetReality: target,
        telemetry,
        activeDemo: 'mercedes-to-bbd',
      });
    } else if (active === 'tiwariganj-to-bbd') {
      const current = {
        dims: 3,
        psi: 5.985,
        entropy: 0.16,
        localGravity: 0.2917,
        quantumFlux: 0.01,
      };
      const target = {
        dims: 3,
        psi: 6.0604,
        entropy: 0.18,
        localGravity: 0.2976,
        quantumFlux: 0.01,
      };
      const telemetry = calculateUniversalRoute(current, target);
      set({
        currentReality: current,
        targetReality: target,
        telemetry,
        activeDemo: 'tiwariganj-to-bbd',
      });
    } else {
      set({ activeDemo: null });
    }
  },

  setShowPresentation: (show) => set({ showPresentation: show }),
  setShareLinkCopied: (copied) => set({ shareLinkCopied: copied }),
}));
import { RouteTelemetry, RealityCoordinate } from './routingEngine';

export type CompassColor = 'green' | 'amber' | 'red' | 'violet';

export interface UXOutput {
  trafficLight: {
    color: CompassColor;
    label: string;
    description: string;
  };
  optimalRoute: {
    quality: 'optimal' | 'acceptable' | 'difficult' | 'impossible';
    label: string;
    description: string;
  };
  pathStability: {
    level: 'clear' | 'crowded' | 'turbulent' | 'blocked';
    label: string;
    percentage: number;
    description: string;
  };
  signalStrength: {
    bars: 1 | 2 | 3 | 4 | 5;
    label: string;
    percentage: number;
    description: string;
  };
  syncStatus: {
    state: 'matched' | 'slight-drift' | 'significant-drift' | 'desynchronized';
    label: string;
    description: string;
  };
  canTravel: boolean;
  recommendation: string;
  warningMessage?: string;
}

export interface EnvironmentReport {
  atmosphere: string;
  gravity: string;
  timeFlow: string;
  dimensionality: string;
  summary: string;
}

export function translateTelemetry(
  telemetry: RouteTelemetry,
  target: RealityCoordinate
): UXOutput {
  const coherence = telemetry.anchorCoherence;
  const saturation = parseFloat(telemetry.bekensteinSaturation);
  const timeDilat = parseFloat(telemetry.timeDilatation);

  let trafficLight: UXOutput['trafficLight'];

  switch (telemetry.safetyStatus) {
    case 'SAFE':
      trafficLight = {
        color: 'green',
        label: 'Clear Path',
        description: 'All conditions are optimal for transit.',
      };
      break;
    case 'WARNING':
      trafficLight = {
        color: 'amber',
        label: 'Proceed with Caution',
        description: 'Some instability detected. Transit is possible.',
      };
      break;
    case 'CRITICAL_HAZARD':
      trafficLight = {
        color: 'red',
        label: 'Hazardous Conditions',
        description: 'Reality coherence is critically low.',
      };
      break;
    case 'PHYSICALLY_IMPOSSIBLE':
      trafficLight = {
        color: 'violet',
        label: 'Beyond Known Physics',
        description: 'This destination exceeds universal information bounds.',
      };
      break;
  }

  let optimalRoute: UXOutput['optimalRoute'];

  if (telemetry.safetyStatus === 'PHYSICALLY_IMPOSSIBLE') {
    optimalRoute = {
      quality: 'impossible',
      label: 'No Path Exists',
      description: 'The laws of physics do not permit transit.',
    };
  } else if (coherence >= 80) {
    optimalRoute = {
      quality: 'optimal',
      label: 'Optimal Route Found',
      description: 'The most efficient path has been calculated.',
    };
  } else if (coherence >= 50) {
    optimalRoute = {
      quality: 'acceptable',
      label: 'Acceptable Route',
      description: 'A viable path exists with some curvature.',
    };
  } else {
    optimalRoute = {
      quality: 'difficult',
      label: 'Difficult Path',
      description: 'The route requires significant energy.',
    };
  }

  let pathStability: UXOutput['pathStability'];

  if (saturation < 30) {
    pathStability = {
      level: 'clear',
      label: 'Clear Path',
      percentage: Math.round(100 - saturation),
      description: 'The route is wide open.',
    };
  } else if (saturation < 60) {
    pathStability = {
      level: 'crowded',
      label: 'Moderate Traffic',
      percentage: Math.round(100 - saturation),
      description: 'Some informational density detected.',
    };
  } else if (saturation < 85) {
    pathStability = {
      level: 'turbulent',
      label: 'Turbulent Conditions',
      percentage: Math.round(100 - saturation),
      description: 'Heavy informational congestion.',
    };
  } else {
    pathStability = {
      level: 'blocked',
      label: 'Path Blocked',
      percentage: Math.round(100 - saturation),
      description: 'Information density exceeds safe thresholds.',
    };
  }

  let signalStrength: UXOutput['signalStrength'];

  if (coherence >= 90) {
    signalStrength = { bars: 5, label: 'Full Signal', percentage: coherence, description: 'Perfect lock.' };
  } else if (coherence >= 70) {
    signalStrength = { bars: 4, label: 'Strong Signal', percentage: coherence, description: 'Good connection.' };
  } else if (coherence >= 50) {
    signalStrength = { bars: 3, label: 'Moderate Signal', percentage: coherence, description: 'Holding.' };
  } else if (coherence >= 30) {
    signalStrength = { bars: 2, label: 'Weak Signal', percentage: coherence, description: 'Interference.' };
  } else {
    signalStrength = { bars: 1, label: 'Signal Lost', percentage: Math.max(0, coherence), description: 'Degraded.' };
  }

  let syncStatus: UXOutput['syncStatus'];
  const dilatationRatio = Math.abs(timeDilat - 1.0);

  if (dilatationRatio < 0.001) {
    syncStatus = { state: 'matched', label: 'Time Flow Matched', description: 'Time passes at the same rate.' };
  } else if (dilatationRatio < 0.01) {
    syncStatus = { state: 'slight-drift', label: 'Slight Time Drift', description: `Time flows ${timeDilat > 1 ? 'slower' : 'faster'} at destination.` };
  } else if (dilatationRatio < 0.1) {
    syncStatus = { state: 'significant-drift', label: 'Noticeable Time Shift', description: 'Plan accordingly.' };
  } else {
    syncStatus = { state: 'desynchronized', label: 'Temporal Desynchronization', description: 'Extended stay not recommended.' };
  }

  let canTravel: boolean;
  let recommendation: string;
  let warningMessage: string | undefined;

  switch (telemetry.safetyStatus) {
    case 'SAFE':
      canTravel = true;
      recommendation = 'You are clear to travel.';
      break;
    case 'WARNING':
      canTravel = true;
      recommendation = 'Travel possible, expect some turbulence.';
      warningMessage = 'Minor reality fluctuations detected.';
      break;
    case 'CRITICAL_HAZARD':
      canTravel = false;
      recommendation = 'Transit not recommended.';
      warningMessage = 'Risk of temporal displacement.';
      break;
    case 'PHYSICALLY_IMPOSSIBLE':
      canTravel = false;
      recommendation = 'Destination unreachable.';
      warningMessage = 'Exceeds informational capacity of local universe.';
      break;
  }

  return {
    trafficLight,
    optimalRoute,
    pathStability,
    signalStrength,
    syncStatus,
    canTravel,
    recommendation,
    warningMessage,
  };
}

export function generateEnvironmentReport(
  coordinate: RealityCoordinate
): EnvironmentReport {
  let atmosphere: string;
  if (coordinate.entropy < 0.2) {
    atmosphere = 'Stable, breathable atmosphere.';
  } else if (coordinate.entropy < 0.5) {
    atmosphere = 'Thin atmosphere. Breathing assistance recommended.';
  } else if (coordinate.entropy < 0.8) {
    atmosphere = 'Toxic or absent atmosphere. Full suit required.';
  } else {
    atmosphere = 'Atmosphere in quantum flux.';
  }

  let gravity: string;
  if (coordinate.localGravity < 0.2) {
    gravity = 'Microgravity.';
  } else if (coordinate.localGravity < 0.5) {
    gravity = 'Low gravity.';
  } else if (coordinate.localGravity < 0.7) {
    gravity = 'Earth-normal gravity.';
  } else if (coordinate.localGravity < 0.9) {
    gravity = 'High gravity.';
  } else {
    gravity = 'Extreme gravity. Near event-horizon.';
  }

  let timeFlow: string;
  if (coordinate.quantumFlux < 0.3) {
    timeFlow = 'Standard temporal flow.';
  } else if (coordinate.quantumFlux < 0.6) {
    timeFlow = 'Slight temporal variance.';
  } else if (coordinate.quantumFlux < 0.8) {
    timeFlow = 'Significant temporal instability.';
  } else {
    timeFlow = 'Temporal flow unpredictable.';
  }

  let dimensionality: string;
  if (coordinate.dims <= 3) {
    dimensionality = 'Standard 3D space.';
  } else if (coordinate.dims <= 5) {
    dimensionality = `${coordinate.dims}D space. Extra axes present.`;
  } else if (coordinate.dims <= 8) {
    dimensionality = `${coordinate.dims}D hyperspace.`;
  } else {
    dimensionality = `${coordinate.dims}D reality. Beyond human cognition.`;
  }

  const summary = `${dimensionality} ${gravity} ${atmosphere} ${timeFlow}`;

  return { atmosphere, gravity, timeFlow, dimensionality, summary };
}
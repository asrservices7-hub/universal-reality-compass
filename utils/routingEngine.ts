import { geodesicDistance, timeDilatationCorrection } from './metricTensor';
import { checkInformationBound } from './informationBound';
import { hashCoordinate } from './deterministicHash';
import { resolveNounFromCoords } from './semanticGazetteer';

export interface RealityCoordinate {
  dims: number;
  psi: number;
  entropy: number;
  localGravity: number;
  quantumFlux: number;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  elevation?: number;
  mgrsGrid?: string;
  utmZone?: number;
  easting?: number;
  northing?: number;
  precisionMeters?: number;
}

export interface NavNode {
  name: string;
  geoPosition?: GeoPosition;
  coordinate?: RealityCoordinate;
}

export interface RouteTelemetry {
  geodesicDistance: string;
  metricSignature: string;
  informationDensity: string;
  bekensteinSaturation: string;
  isPhysicallyPossible: boolean;
  lorentzFactor: string;
  timeDilatation: string;
  anchorCoherence: number;
  safetyStatus: 'SAFE' | 'WARNING' | 'CRITICAL_HAZARD' | 'PHYSICALLY_IMPOSSIBLE';
  routeHash: number;
  fromName?: string;
  toName?: string;
}

export function detectNavigationMode(currentState: RealityCoordinate): 'earth' | 'multiverse' {
  return currentState.dims === 3 ? 'earth' : 'multiverse';
}

export function calculateTransitMetrics(
  from: NavNode,
  to: NavNode,
  currentState: RealityCoordinate
): { fromName: string; toName: string } {
  const mode = detectNavigationMode(currentState);

  let fromName = from.name;
  let toName = to.name;

  if (mode === 'earth' && from.geoPosition) {
    fromName = resolveNounFromCoords(from.geoPosition, 'earth');
  }
  if (mode === 'earth' && to.geoPosition) {
    toName = resolveNounFromCoords(to.geoPosition, 'earth');
  }

  return {
    fromName,
    toName,
  };
}

export function calculateUniversalRoute(
  current: RealityCoordinate,
  target: RealityCoordinate
): RouteTelemetry {
  const infoCheck = checkInformationBound(
    target.dims,
    target.entropy,
    target.localGravity,
    target.quantumFlux
  );

  const deltaD = target.dims - current.dims;
  const deltaPsi = target.psi - current.psi;
  const deltaS = target.entropy - current.entropy;
  const deltaG = target.localGravity - current.localGravity;
  const deltaQ = target.quantumFlux - current.quantumFlux;

  const geoDistance = geodesicDistance(
    deltaD, deltaPsi, deltaS, deltaG, deltaQ,
    current.localGravity, current.quantumFlux
  );

  const lorentz = 1 + Math.abs(deltaPsi) / 10;
  const timeDilat = timeDilatationCorrection(
    current.localGravity, target.localGravity, deltaPsi
  );

  const coherenceLoss =
    geoDistance * 35 + (infoCheck.saturationPercent / 100) * 25;
  const anchorCoherence = Math.max(0, Math.round(100 - coherenceLoss));

  let safetyStatus: RouteTelemetry['safetyStatus'];

  if (!infoCheck.isTraversable) {
    safetyStatus = 'PHYSICALLY_IMPOSSIBLE';
  } else if (anchorCoherence < 30) {
    safetyStatus = 'CRITICAL_HAZARD';
  } else if (anchorCoherence < 65) {
    safetyStatus = 'WARNING';
  } else {
    safetyStatus = 'SAFE';
  }

  const routeHash = hashCoordinate(
    target.dims, target.psi, target.entropy,
    target.localGravity, target.quantumFlux
  );

  const metricSignature = `(${current.localGravity.toFixed(2)},${current.quantumFlux.toFixed(2)})→(${target.localGravity.toFixed(2)},${target.quantumFlux.toFixed(2)})`;

  const mode = detectNavigationMode(current);

  const fromNode: NavNode = {
    name: mode === 'earth' ? 'Standard 3D Origin' : 'Multiverse Origin',
    geoPosition: {
      latitude: 26.0 + current.localGravity * 3.0,
      longitude: 75.0 + (current.psi / 10) * 10.0,
    },
    coordinate: current,
  };

  const toNode: NavNode = {
    name: mode === 'earth' ? 'Standard 3D Destination' : 'Multiverse Destination',
    geoPosition: {
      latitude: 26.0 + target.localGravity * 3.0,
      longitude: 75.0 + (target.psi / 10) * 10.0,
    },
    coordinate: target,
  };

  const { fromName, toName } = calculateTransitMetrics(fromNode, toNode, current);

  return {
    geodesicDistance: geoDistance.toFixed(6),
    metricSignature,
    informationDensity: infoCheck.informationDensity.toFixed(4),
    bekensteinSaturation: `${infoCheck.saturationPercent.toFixed(1)}%`,
    isPhysicallyPossible: infoCheck.isTraversable,
    lorentzFactor: lorentz.toFixed(4),
    timeDilatation: `${timeDilat.toFixed(3)}x`,
    anchorCoherence,
    safetyStatus,
    routeHash,
    fromName,
    toName,
  };
}
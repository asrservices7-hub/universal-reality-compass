/**
 * METRIC TENSOR ENGINE
 * 5D diagonal metric for geodesic path calculation
 */

export interface MetricTensor {
  g00: number;
  g11: number;
  g22: number;
  g33: number;
  g44: number;
}

export function calculateLocalMetric(
  localGravity: number,
  quantumFlux: number
): MetricTensor {
  const potential = localGravity * 0.9;

  const g00 = 1 - potential;
  const g11 = 1 / Math.max(g00, 0.01);
  const g22 = 1 + quantumFlux * 0.3;
  const g33 = 1 + quantumFlux * 0.3;
  const g44 = 1 + localGravity * quantumFlux * 0.5;

  return { g00, g11, g22, g33, g44 };
}

export function geodesicDistance(
  deltaD: number,
  deltaPsi: number,
  deltaS: number,
  deltaG: number,
  deltaQ: number,
  localGravity: number,
  quantumFlux: number
): number {
  const metric = calculateLocalMetric(localGravity, quantumFlux);

  const timeComponent = metric.g00 * Math.pow(deltaG, 2);
  const radialComponent = metric.g11 * Math.pow(deltaD / 11, 2);
  const angularComponent1 = metric.g22 * Math.pow(deltaPsi / 10, 2);
  const angularComponent2 = metric.g33 * Math.pow(deltaS, 2);
  const extraDimensional = metric.g44 * Math.pow(deltaQ, 2);

  return Math.sqrt(
    timeComponent +
    radialComponent +
    angularComponent1 +
    angularComponent2 +
    extraDimensional
  );
}

export function lorentzFactor(deltaPsi: number): number {
  const velocity = Math.abs(deltaPsi) / 11;
  const cappedVelocity = Math.min(velocity, 0.999);
  return 1 / Math.sqrt(1 - Math.pow(cappedVelocity, 2));
}

export function timeDilatationCorrection(
  currentGravity: number,
  targetGravity: number,
  deltaPsi: number
): number {
  const metricCurrent = calculateLocalMetric(currentGravity, 0.5);
  const metricTarget = calculateLocalMetric(targetGravity, 0.5);
  const gamma = lorentzFactor(deltaPsi);
  return Math.sqrt(metricTarget.g00 / Math.max(metricCurrent.g00, 0.01)) * gamma;
}
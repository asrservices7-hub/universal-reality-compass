/**
 * INFORMATION BOUND CHECK
 * Bekenstein-Hawking bound for traversability verification
 */

export interface InformationCheck {
  isTraversable: boolean;
  informationDensity: number;
  localBound: number;
  saturationPercent: number;
  reason?: string;
}

export function checkInformationBound(
  dims: number,
  entropy: number,
  localGravity: number,
  quantumFlux: number
): InformationCheck {
  const informationDensity =
    entropy * Math.pow(2, dims - 3) * (0.5 + localGravity * 0.5);

  const localBound = 1 / Math.max(quantumFlux, 0.01);

  const saturationPercent = (informationDensity / localBound) * 100;

  let isTraversable = true;
  let reason: string | undefined;

  if (saturationPercent > 95) {
    isTraversable = false;
    reason = `Information saturation at ${saturationPercent.toFixed(1)}%. Exceeds Bekenstein bound.`;
  } else if (saturationPercent > 75) {
    reason = `High information density (${saturationPercent.toFixed(1)}%). Route may be unstable.`;
  }

  return {
    isTraversable,
    informationDensity,
    localBound,
    saturationPercent,
    reason,
  };
}
/**
 * Seeded Deterministic Hash — MurmurHash3 32-bit variant
 * Replaces Math.random() for consistent multiverse rendering
 */

export function seededRandom(seed: number): () => number {
  let state = seed | 0;

  return function (): number {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashCoordinate(
  dims: number,
  psi: number,
  entropy: number,
  localGravity: number,
  quantumFlux: number
): number {
  const prime1 = 73856093;
  const prime2 = 19349663;
  const prime3 = 83492791;

  let hash =
    (dims * prime1) ^
    (psi * prime2 * 10) ^
    (entropy * prime3 * 100) ^
    (localGravity * prime1 * 50) ^
    (quantumFlux * prime2 * 75);

  hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
  hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
  hash = (hash >> 16) ^ hash;

  return Math.abs(hash) / 2147483647;
}

export function hashStringToCoordinate(name: string): {
  dims: number;
  psi: number;
  entropy: number;
  localGravity: number;
  quantumFlux: number;
} {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) + name.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  hash = Math.abs(hash);

  const nameLower = name.toLowerCase();

  // Check if it sounds like a normal Earth location to keep dims = 3
  const isEarth =
    nameLower.includes('lucknow') ||
    nameLower.includes('crossing') ||
    nameLower.includes('showroom') ||
    nameLower.includes('university') ||
    nameLower.includes('gate') ||
    nameLower.includes('road') ||
    nameLower.includes('sector') ||
    nameLower.includes('tiwariganj') ||
    nameLower.includes('mercedes') ||
    nameLower.includes('bbd') ||
    nameLower.includes('kamta') ||
    nameLower.includes('anorakala') ||
    nameLower.includes('current location') ||
    nameLower.includes('my location') ||
    nameLower.includes('home') ||
    nameLower.includes('office') ||
    nameLower.includes('street') ||
    nameLower.includes('campus');

  // Determine dimension count
  const dims = isEarth ? 3 : (hash % 9) + 3; // 3 to 11

  // Use seeded RNG to generate the other fields consistently
  const rng = seededRandom(hash);
  const psi = Math.round((rng() * 9.0 + 1.0) * 10000) / 10000;       // 1.0 to 10.0 Hz
  const entropy = Math.round((rng() * 0.90 + 0.05) * 10000) / 10000;   // 0.05 to 0.95
  const localGravity = Math.round((rng() * 1.95 + 0.05) * 10000) / 10000; // 0.05 to 2.0 G
  const quantumFlux = Math.round((rng() * 0.99 + 0.01) * 10000) / 10000;  // 0.01 to 1.00

  return { dims, psi, entropy, localGravity, quantumFlux };
}
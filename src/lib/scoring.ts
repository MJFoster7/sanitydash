// src/lib/scoring.ts
export type SanityLevel = 'good' | 'warning' | 'critical';

export function scoreFromIcon(icon?: SanityLevel | null): number {
  if (icon === 'good') return 1.0;
  if (icon === 'warning') return 0.5;
  if (icon === 'critical') return 0.0;
  return 0.5; // default if missing
}

export function weightedScore(icon: SanityLevel | null | undefined, weight: number | null | undefined): {sum:number, w:number} {
  const w = Math.max(1, Math.min(Number(weight ?? 1), 10)); // clamp 1..10
  return { sum: scoreFromIcon(icon) * w, w };
}

// Accepts up to two items (firewall, switches). Any can be null.
export function infraPercent(firewall?: {sanity_icon: SanityLevel|null, weight: number|null} | null,
                             switches?: {sanity_icon: SanityLevel|null, weight: number|null} | null): number | null {
  const parts = [];
  if (firewall) parts.push(weightedScore(firewall.sanity_icon, firewall.weight));
  if (switches) parts.push(weightedScore(switches.sanity_icon, switches.weight));
  if (parts.length === 0) return null;
  const totalW = parts.reduce((a,b)=>a+b.w, 0);
  const totalSum = parts.reduce((a,b)=>a+b.sum, 0);
  return Math.round((totalSum / totalW) * 100);
}

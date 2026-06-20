// XP and levelling utilities.
// Level formula: XP needed to go from level n → n+1 is 50*(n+1).
//   L1→L2: 100, L2→L3: 150, L3→L4: 200, ...
// Total XP to reach level n: 25*(n²+n-2) (verified below).

export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  return 25 * (level * level + level - 2);
}

export function xpNeededForLevel(level: number): number {
  return 50 * (level + 1);
}

// Given total XP, calculate what level the user should be at.
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  // Solve 25*(n²+n-2) <= xp  →  n = floor((-1 + sqrt(1 + 4*(2 + xp/25))) / 2)
  const n = Math.floor((-1 + Math.sqrt(1 + 4 * (2 + xp / 25))) / 2);
  return Math.max(1, Math.min(100, n));
}

export function xpProgressInLevel(
  xp: number,
  level: number,
): { current: number; needed: number; pct: number } {
  const start = xpToReachLevel(level);
  const needed = xpNeededForLevel(level);
  const current = Math.max(0, xp - start);
  return { current, needed, pct: Math.min(100, Math.max(0, (current / needed) * 100)) };
}

// Vibe score — normalised 0-100 for display, capped at 5000 raw.
export function normaliseVibe(raw: number): number {
  return Math.min(100, Math.round((raw / 5000) * 100));
}

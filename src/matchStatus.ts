export type MatchStatus = "live" | "upcoming" | "finished";

const MATCH_DURATION_MS = 2 * 60 * 60 * 1000; // asumsi ~2 jam per pertandingan

export function getMatchStatus(startTime: number): MatchStatus {
  const now = Date.now();
  if (now < startTime) return "upcoming";
  if (now <= startTime + MATCH_DURATION_MS) return "live";
  return "finished";
}

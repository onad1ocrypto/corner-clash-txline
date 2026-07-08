import axios from "axios";

const JWT = import.meta.env.VITE_TXLINE_JWT;
const API_TOKEN = import.meta.env.VITE_TXLINE_API_TOKEN;
const API_ORIGIN = "https://txline-dev.txodds.com";

export const txlineClient = axios.create({
  baseURL: API_ORIGIN,
  headers: {
    Authorization: `Bearer ${JWT}`,
    "X-Api-Token": API_TOKEN,
  },
});

export interface Fixture {
  FixtureId: number;
  Participant1: string;
  Participant2: string;
  Participant1IsHome: boolean;
  StartTime: number;
  CompetitionId: number;
}

export async function fetchAllFixtures(): Promise<Fixture[]> {
  const res = await txlineClient.get("/api/fixtures/snapshot");
  return res.data;
}

export interface ScoreSnapshot {
  FixtureId: number;
  StatusId?: number;
  Stats?: Record<string, number>;
  Ts: number;
}

export async function fetchScoreSnapshot(fixtureId: number): Promise<ScoreSnapshot> {
  const res = await txlineClient.get(`/api/scores/snapshot/${fixtureId}`, {
    params: { asOf: Date.now() },
  });
  // API mengembalikan array of updates; ambil yang terbaru
  const data = Array.isArray(res.data) ? res.data : [res.data];
  return data[data.length - 1];
}

// Total Corners = Participant1 Corners (key 7) + Participant2 Corners (key 8)
export function getTotalCorners(snapshot: ScoreSnapshot): number | null {
  if (!snapshot?.Stats) return null;
  const p1Corners = snapshot.Stats["7"] ?? 0;
  const p2Corners = snapshot.Stats["8"] ?? 0;
  return p1Corners + p2Corners;
}


// Selisih corner Home - Away. Bisa naik ATAU turun tergantung tim mana yang dapat corner berikutnya.
export function getCornerBattle(snapshot: ScoreSnapshot, homeIsParticipant1: boolean): number | null {
  if (!snapshot?.Stats) return null;
  const p1Corners = snapshot.Stats["7"] ?? 0;
  const p2Corners = snapshot.Stats["8"] ?? 0;
  return homeIsParticipant1 ? p1Corners - p2Corners : p2Corners - p1Corners;
}

export interface CornerCounts {
  home: number;
  away: number;
}

export function getCornerCounts(snapshot: ScoreSnapshot, participant1IsHome: boolean): CornerCounts | null {
  if (!snapshot?.Stats) return null;
  const p1Corners = snapshot.Stats["7"] ?? 0;
  const p2Corners = snapshot.Stats["8"] ?? 0;
  return participant1IsHome
    ? { home: p1Corners, away: p2Corners }
    : { home: p2Corners, away: p1Corners };
}

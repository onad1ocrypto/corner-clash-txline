import { useEffect, useState } from "react";
import { fetchAllFixtures, type Fixture } from "./txlineApi";
import { getFlag } from "./flags";
import { getMatchStatus, type MatchStatus } from "./matchStatus";

const WORLD_CUP_2026_COMPETITION_ID = 72;

const DEMO_FIXTURE: Fixture = {
  FixtureId: 18172379,
  Participant1: "USA",
  Participant2: "Bosnia & Herzegovina",
  Participant1IsHome: true,
  StartTime: 1782950400000,
  CompetitionId: 72,
};

const ACCENT_COLORS = ["accent-pink", "accent-blue", "accent-yellow", "accent-green", "accent-orange"];

const STATUS_BADGE: Record<MatchStatus, { label: string; className: string }> = {
  live: { label: "🔴 LIVE", className: "badge-live" },
  upcoming: { label: "⏰ Upcoming", className: "badge-upcoming" },
  finished: { label: "✅ Finished", className: "badge-finished" },
};

export default function FixturePicker({ onSelect }: { onSelect: (fixture: Fixture) => void }) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<MatchStatus>("live");

  useEffect(() => {
    fetchAllFixtures()
      .then(setFixtures)
      .catch((err) => console.error("Failed to fetch fixtures:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="info-text">Loading matches...</p>;

  const worldCupOnly = fixtures.filter((f) => f.CompetitionId === WORLD_CUP_2026_COMPETITION_ID);
  const allFixtures = [DEMO_FIXTURE, ...worldCupOnly];
  const filtered = allFixtures.filter((f) => getMatchStatus(f.StartTime) === tab || f.FixtureId === DEMO_FIXTURE.FixtureId);

  const counts = {
    live: allFixtures.filter((f) => getMatchStatus(f.StartTime) === "live").length,
    upcoming: allFixtures.filter((f) => getMatchStatus(f.StartTime) === "upcoming").length,
    finished: allFixtures.filter((f) => getMatchStatus(f.StartTime) === "finished").length,
  };

  const renderCard = (fixture: Fixture, index: number, isDemo = false) => {
    const home = fixture.Participant1IsHome ? fixture.Participant1 : fixture.Participant2;
    const away = fixture.Participant1IsHome ? fixture.Participant2 : fixture.Participant1;
    const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
    const status = getMatchStatus(fixture.StartTime);
    const badge = STATUS_BADGE[status];

    return (
      <div key={fixture.FixtureId} className={`match-pill ${accent}`} onClick={() => onSelect(fixture)}>
        {isDemo && <span className="demo-tag">DEMO</span>}
        <span className={`status-badge ${badge.className}`}>{badge.label}</span>
        <div className="match-pill-teams">
          <span className="match-pill-flag">{getFlag(home)}</span>
          <span className="match-pill-name">{home}</span>
          <span className="match-pill-vs">vs</span>
          <span className="match-pill-name">{away}</span>
          <span className="match-pill-flag">{getFlag(away)}</span>
        </div>
        <div className="match-pill-footer">
          <span className="match-pill-date">
            {new Date(fixture.StartTime).toLocaleDateString("en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </span>
          <span className="match-pill-play">Play Now 🎮</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="status-tabs">
        <button className={tab === "live" ? "status-tab active-live" : "status-tab"} onClick={() => setTab("live")}>
          🔴 Live ({counts.live})
        </button>
        <button className={tab === "upcoming" ? "status-tab active-upcoming" : "status-tab"} onClick={() => setTab("upcoming")}>
          ⏰ Upcoming ({counts.upcoming})
        </button>
        <button className={tab === "finished" ? "status-tab active-finished" : "status-tab"} onClick={() => setTab("finished")}>
          ✅ Finished ({counts.finished})
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="info-text">No {tab} matches right now. Try another tab!</p>
      )}

      <div className="match-grid">
        {filtered.map((f, i) => renderCard(f, i, f.FixtureId === DEMO_FIXTURE.FixtureId))}
      </div>
    </div>
  );
}

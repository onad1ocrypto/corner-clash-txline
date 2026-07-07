import { useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchScoreSnapshot, getCornerCounts, type Fixture } from "./txlineApi";
import { getMatchStatus } from "./matchStatus";
import { getFlag } from "./flags";
import { POLL_INTERVAL_MS, ROUND_WINDOW_MS } from "./constants";

type Guess = "home" | "away" | "draw" | null;
type RoundResult = "home" | "away" | "draw" | null;

function streakKey(addr: string) { return `hilo_best_streak_${addr}`; }
function gamesKey(addr: string) { return `hilo_total_games_${addr}`; }

const CONFETTI_EMOJIS = ["🎉", "⚽", "🏆", "✨", "🎊"];

export default function HiLoGame({ fixture, onBack }: { fixture: Fixture; onBack: () => void }) {
  const wallet = useWallet();
  const [homeCorners, setHomeCorners] = useState(0);
  const [awayCorners, setAwayCorners] = useState(0);
  const [loading, setLoading] = useState(true);

  const [guess, setGuess] = useState<Guess>(null);
  const [baselineHome, setBaselineHome] = useState(0);
  const [baselineAway, setBaselineAway] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastResult, setLastResult] = useState<RoundResult>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const homeTeam = fixture.Participant1IsHome ? fixture.Participant1 : fixture.Participant2;
  const awayTeam = fixture.Participant1IsHome ? fixture.Participant2 : fixture.Participant1;
  const matchStatus = getMatchStatus(fixture.StartTime);

  useEffect(() => {
    if (!wallet.publicKey) {
      setBestStreak(0);
      setTotalGames(0);
      return;
    }
    const addr = wallet.publicKey.toBase58();
    setBestStreak(parseInt(localStorage.getItem(streakKey(addr)) || "0", 10));
    setTotalGames(parseInt(localStorage.getItem(gamesKey(addr)) || "0", 10));
  }, [wallet.publicKey]);

  const saveBestStreak = useCallback((value: number) => {
    if (!wallet.publicKey) return;
    localStorage.setItem(streakKey(wallet.publicKey.toBase58()), value.toString());
  }, [wallet.publicKey]);

  const saveTotalGames = useCallback((value: number) => {
    if (!wallet.publicKey) return;
    localStorage.setItem(gamesKey(wallet.publicKey.toBase58()), value.toString());
  }, [wallet.publicKey]);

  const resolveRound = useCallback((result: RoundResult, currentGuess: Guess) => {
    setLastResult(result);
    setTotalGames((g) => {
      const next = g + 1;
      saveTotalGames(next);
      return next;
    });

    if (result === currentGuess) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1800);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => {
          const newBest = Math.max(b, next);
          saveBestStreak(newBest);
          return newBest;
        });
        return next;
      });
    } else {
      setStreak(0);
    }
    setGuess(null);
    setDeadline(null);
  }, [saveBestStreak, saveTotalGames]);

  const fetchLatest = useCallback(async () => {
    try {
      const snapshot = await fetchScoreSnapshot(fixture.FixtureId);
      const counts = getCornerCounts(snapshot, fixture.Participant1IsHome);
      if (!counts) return;

      setHomeCorners(counts.home);
      setAwayCorners(counts.away);

      setGuess((currentGuess) => {
        if (!currentGuess) return currentGuess;
        if (counts.home > baselineHome) { resolveRound("home", currentGuess); return null; }
        if (counts.away > baselineAway) { resolveRound("away", currentGuess); return null; }
        return currentGuess;
      });
    } catch (err) {
      console.error("Failed to fetch snapshot:", err);
    } finally {
      setLoading(false);
    }
  }, [fixture.FixtureId, fixture.Participant1IsHome, baselineHome, baselineAway, resolveRound]);

  useEffect(() => {
    fetchLatest();
    pollRef.current = setInterval(fetchLatest, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchLatest]);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setDeadline((currentDeadline) => {
        if (!currentDeadline) return currentDeadline;
        const remaining = currentDeadline - Date.now();
        setTimeLeft(Math.max(0, remaining));
        if (remaining <= 0) {
          setGuess((currentGuess) => {
            if (currentGuess) resolveRound("draw", currentGuess);
            return null;
          });
          return null;
        }
        return currentDeadline;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [resolveRound]);

  const startRound = (g: Guess) => {
    if (guess) return;
    setBaselineHome(homeCorners);
    setBaselineAway(awayCorners);
    setDeadline(Date.now() + ROUND_WINDOW_MS);
    setTimeLeft(ROUND_WINDOW_MS);
    setLastResult(null);
    setGuess(g);
  };

  if (loading) {
    return <p className="info-text">Loading live match data...</p>;
  }

  const total = homeCorners + awayCorners;
  const homePct = total > 0 ? (homeCorners / total) * 100 : 50;
  const minutesLeft = Math.floor(timeLeft / 60000);
  const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="hilo-card">
      {showConfetti && (
        <div className="confetti-burst">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.3}s`,
              }}
            >
              {CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length]}
            </span>
          ))}
        </div>
      )}

      <button className="back-btn" onClick={onBack}>← Back to matches</button>

      <div className="hilo-header-row">
        <h2 className="hilo-title">{getFlag(homeTeam)} {homeTeam} vs {awayTeam} {getFlag(awayTeam)}</h2>
        {matchStatus === "live" && <span className="live-pill">🔴 LIVE</span>}
      </div>
      <p className="hilo-subtitle">Who wins the next corner — within 5 minutes?</p>

      {!wallet.publicKey && (
        <p className="hilo-wallet-hint">💡 Connect your wallet to save your best streak</p>
      )}

      <div className="corner-battle-display">
        <div className="corner-side home">
          <div className="corner-count">{homeCorners}</div>
          <div className="corner-team-label">{homeTeam}</div>
        </div>
        <div className="corner-vs">⚔️</div>
        <div className="corner-side away">
          <div className="corner-count">{awayCorners}</div>
          <div className="corner-team-label">{awayTeam}</div>
        </div>
      </div>

      <div className="corner-bar">
        <div className="corner-bar-fill" style={{ width: `${homePct}%` }} />
      </div>

      {matchStatus === "upcoming" && <p className="hilo-waiting">⏰ Match hasn't started yet</p>}

      {lastResult && (
        <div className={`hilo-result-banner ${lastResult ? "correct" : "wrong"}`}>
          {lastResult === "draw"
            ? "🤝 No corner in 5 minutes — Draw!"
            : `${getFlag(lastResult === "home" ? homeTeam : awayTeam)} ${lastResult === "home" ? homeTeam : awayTeam} got the corner!`}
        </div>
      )}

      {!guess && (
        <div className="prediction-buttons">
          <button className="pred-btn home" onClick={() => startRound("home")}>{getFlag(homeTeam)} {homeTeam}</button>
          <button className="pred-btn draw" onClick={() => startRound("draw")}>🤝 Draw (no corner)</button>
          <button className="pred-btn away" onClick={() => startRound("away")}>{getFlag(awayTeam)} {awayTeam}</button>
        </div>
      )}

      {guess && (
        <div className="prediction-locked">
          🔒 Your guess: <strong>{guess === "draw" ? "No corner in 5 min" : guess === "home" ? homeTeam : awayTeam}</strong>
          <div className="countdown">⏱️ {minutesLeft}:{secondsLeft.toString().padStart(2, "0")} remaining</div>
        </div>
      )}

      <div className="hilo-stats-row three">
        <div className="hilo-stat-box">
          <div className="hilo-stat-value">{streak}</div>
          <div className="hilo-stat-label">Streak</div>
        </div>
        <div className="hilo-stat-box">
          <div className="hilo-stat-value">{bestStreak}</div>
          <div className="hilo-stat-label">Best {wallet.publicKey ? "(Saved)" : ""}</div>
        </div>
        <div className="hilo-stat-box">
          <div className="hilo-stat-value">{totalGames}</div>
          <div className="hilo-stat-label">Games Played</div>
        </div>
      </div>
    </div>
  );
}

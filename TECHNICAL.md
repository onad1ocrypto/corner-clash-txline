# Corner Clash ⚔️
### Technical Documentation — TxLINE Fan Engagement Track Submission

**Live App:** https://corner-clash-txline.vercel.app/
**GitHub Repo:** https://github.com/onad1ocrypto/corner-clash-txline

---

## 1. Core Idea

Corner Clash is a real-time, replayable guessing game built for football fans watching the FIFA World Cup 2026. Instead of a static prediction locked in before kickoff, players make short, low-stakes guesses throughout a live match: **"Which team will win the next corner — within the next 5 minutes?"**

Players pick **Home**, **Away**, or **Draw** (meaning no corner happens in that window). The moment TxLINE reports a new corner event, the round resolves instantly — correct guesses extend a streak, wrong guesses (or a timeout with no corner) reset it to zero. A new round can start immediately, so fans stay engaged for the length of the match rather than making one decision and walking away.

This directly targets the hackathon's **Hi-Lo Stats Game** idea — replayable across all 104 matches — while staying simple enough for a casual, non-technical fan to understand in seconds.

## 2. Business & Technical Highlights

- **True real-time responsiveness** — the app polls TxLINE's live score snapshot every 5 seconds. A round resolves the instant a new corner is detected for either team, not on a fixed schedule, so the game reacts to what's actually happening on the pitch.
- **Solved a subtle stat-design problem.** Our first iteration used *Total Corners* (Home + Away combined) with a classic Higher/Lower guess. We realized this stat is cumulative — it can only increase during a match, meaning "Lower" could mathematically never win. We redesigned the core mechanic around a *per-event* guess ("who gets the next corner") instead of a *cumulative-value* guess, which keeps all three outcomes (Home / Draw / Away) genuinely possible on every round.
- **Wallet-based progression, no backend required.** Connecting a Solana wallet (Phantom) ties a player's best streak and total games played to their public key, persisted client-side. This satisfies the "sign up through Solana" requirement without needing a custom backend or database for an MVP.
- **Zero admin, zero manual scoring** — every round is graded automatically against TxLINE's live corner counts; there is no human in the loop deciding who won a round.
- **Monetization path:** the 5-minute round window is a natural fit for sponsor-branded "power-up" mechanics (e.g., paid streak-freeze, cosmetic team skins), or a small SOL entry fee per round with a shared prize pool for the best streak of the match — both addable on top of the current pari-mutuel-free design without changing the core loop.

## 3. TxLINE Endpoints Used

| Endpoint | Purpose |
|---|---|
| `POST /auth/guest/start` | Obtain guest JWT |
| `subscribe` (on-chain instruction) | Register World Cup Free Tier subscription (Service Level 1) |
| `POST /api/token/activate` | Activate long-lived API token after on-chain subscription |
| `GET /api/fixtures/snapshot` | List all fixtures, filtered client-side to FIFA World Cup 2026 (CompetitionId 72) and grouped into Live / Upcoming / Finished |
| `GET /api/scores/snapshot/{fixtureId}` | Polled every 5 seconds during an active round to read live corner counts (stat keys 7 and 8) for both teams |

## 4. Architecture Summary
**Core game loop:**
1. Player picks Home / Draw / Away and a 5-minute countdown starts, capturing the current corner counts as a baseline.
2. Every 5 seconds, the app re-fetches the live snapshot and compares corner counts to the baseline.
3. The first team whose corner count increases wins the round immediately; if 5 minutes pass with no change, it resolves as a Draw.
4. Win → streak +1 (and best streak saved to `localStorage` under the connected wallet's address) and a new round can start immediately. Loss → streak resets to 0.

## 5. Feedback on the TxLINE API Experience

**What we liked:**
- `/api/scores/snapshot/{fixtureId}` returning a single clear JSON object with a flat `Stats` map (keyed by our now-familiar `period*1000+base_key` scheme) made it trivial to build a lightweight polling loop without needing SSE infrastructure for an MVP.
- Reusing the same fixture list and stat-key encoding we learned from TxLINE's Soccer Feed docs across two completely different app ideas (a settlement engine and this fan game) validated how consistent the schema is — nothing had to be re-learned.

**Where we hit friction:**
- The fixtures snapshot endpoint doesn't include a match-status field we could rely on directly (e.g. `NS`/`H1`/`F`), so we had to infer Live/Upcoming/Finished purely from `StartTime` plus an assumed ~2 hour match duration. A `StatusId` field directly on the fixtures list (mirroring what's available per-update in the scores feed) would remove this guesswork.
- Designing around *cumulative* stats (goals, corners, cards) required extra thought to avoid an unwinnable game state (see the Total-Corners issue above). A short docs note flagging which stats are cumulative-only vs. genuinely bidirectional per period would help future builders avoid the same pitfall.
- During devnet testing, some fixtures had no corner activity for long stretches — expected in real football, but it means a documented "test/demo fixture with guaranteed frequent updates" would make hackathon iteration faster.

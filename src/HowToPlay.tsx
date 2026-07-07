export default function HowToPlay() {
  return (
    <div className="howto-card">
      <div className="howto-title">🎮 How to Play</div>
      <ol className="howto-list">
        <li>Pick a live World Cup match</li>
        <li>Guess: which team gets the <strong>next corner within 5 minutes</strong>? Home, Away, or Draw (no corner at all)</li>
        <li>We track live corner counts from TxLINE — the moment a new corner happens, we check your guess instantly</li>
        <li>Guess right → streak grows, and a new round starts right away</li>
        <li>Guess wrong, or nobody gets a corner in 5 minutes → streak resets to 0</li>
        <li>Connect your wallet to save your best streak across matches</li>
      </ol>
    </div>
  );
}

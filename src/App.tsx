import { useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { RPC_URL } from "./constants";
import FixturePicker from "./FixturePicker";
import HiLoGame from "./HiLoGame";
import HowToPlay from "./HowToPlay";
import FloatingIcons from "./FloatingIcons";
import type { Fixture } from "./txlineApi";

import "@solana/wallet-adapter-react-ui/styles.css";
import "./App.css";

function App() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <FloatingIcons />
          <div className="hero">
            <div className="hero-wallet">
              <WalletMultiButton />
            </div>
            <h1 className="hero-title">⚔️ Corner Clash</h1>
            <p className="hero-subtitle">FIFA World Cup 2026 · Powered by TxLINE</p>
          </div>

          <div className="app-container">
            {selectedFixture ? (
              <HiLoGame fixture={selectedFixture} onBack={() => setSelectedFixture(null)} />
            ) : (
              <>
                <HowToPlay />
                <FixturePicker onSelect={setSelectedFixture} />
              </>
            )}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;

import React from "react";
import { useGame } from "@/contexts/GameContext";
import { WalletConnection } from "./WalletConnection";
import { SyncButton } from "./SyncButton";

const Header: React.FC = () => {
  const { gameState, removePet, isLoading } = useGame();

  return (
    <header className="w-full border-b-4 border-border bg-card pixel-shadow sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex-1">
            <h1 className="text-sm sm:text-xl md:text-2xl font-bold pixel-text-shadow">
              🎮 PIXEL PET
            </h1>
          </div>

          {/* Coins Display */}
          <div className="flex items-center gap-2 sm:gap-4 h-9">
            <div className="flex items-center gap-1 sm:gap-2 bg-accent px-2 sm:px-4 py-2 border-2 border-border pixel-shadow hover:translate-y-1 h-9">
              <span className="text-xs sm:text-sm animate-coin">💰</span>
              <span className="text-xs sm:text-sm font-bold text-accent-foreground">
                {gameState.coins}
              </span>
            </div>

            {/* Remove Pet Button - show if pet exists */}
            {/* {gameState.hasRealPet && (
              <button
                onClick={removePet}
                disabled={isLoading}
                className="flex items-center gap-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-2 sm:px-3 py-2 border-2 border-border pixel-shadow hover:translate-y-1 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed h-9 text-xs sm:text-sm"
                title="Remove pet from blockchain (alive or dead)"
              >
                <span>🗑️</span>
                <span className="hidden sm:inline">Remove Pet</span>
              </button>
            )} */}

            {/* Wallet Connection & Sync */}
            <div className="hidden sm:flex items-center gap-2 h-9">
              <SyncButton />
              <WalletConnection />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

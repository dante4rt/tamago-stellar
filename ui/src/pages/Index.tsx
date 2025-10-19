import React from "react";
import { GameProvider } from "@/contexts/GameContext";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";
import PetDisplay from "@/components/PetDisplay";
import StatsBar from "@/components/StatsBar";
import ActionButtons from "@/components/ActionButtons";
import Wardrobe from "@/components/Wardrobe";
import { useGame } from "@/contexts/GameContext";

const GameContent: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
          {/* Pet Display */}
          <div className="bg-card border-4 border-border pixel-shadow p-4 sm:p-8">
            <PetDisplay />
          </div>

          {/* Stats Section */}
          <div className="bg-card border-4 border-border pixel-shadow p-4 sm:p-6 space-y-3 sm:space-y-4">
            <h2 className="text-sm sm:text-base font-bold uppercase text-center pixel-text-shadow mb-4">
              Pet Stats
            </h2>
            <StatsBar label="Hunger" value={gameState.stats.hunger} icon="🍖" color="hunger" />
            <StatsBar label="Happy" value={gameState.stats.happy} icon="😊" color="happy" />
            <StatsBar label="Energy" value={gameState.stats.energy} icon="⚡" color="energy" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3">
            <ActionButtons />
            <Wardrobe />
          </div>

          {/* Instructions */}
          <div className="bg-muted border-2 border-border p-4 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
              💡 <strong>Tip:</strong> Feed, play, work, and rest to keep your pet happy! Stats
              decay over time. Earn coins from work to unlock cool items. 🎮
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-border bg-card py-4 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          🕹️ A Retro Pixel Pet Game • Made with ❤️ by Rama
        </p>
      </footer>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <GameProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            fontFamily: '"Press Start 2P", cursive',
            fontSize: "10px",
            padding: "12px",
            border: "3px solid hsl(var(--border))",
            boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.25)",
          },
          success: {
            style: {
              background: "hsl(var(--success))",
              color: "hsl(var(--success-foreground))",
            },
          },
          error: {
            style: {
              background: "hsl(var(--destructive))",
              color: "hsl(var(--destructive-foreground))",
            },
          },
        }}
      />
      <GameContent />
    </GameProvider>
  );
};

export default Index;

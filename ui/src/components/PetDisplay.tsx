import React from "react";
import { useGame } from "@/contexts/GameContext";
import { useWallet } from "@/contexts/WalletContext";
import { CreatePetDialog } from "./CreatePetDialog";

const PetDisplay: React.FC = () => {
  const { gameState } = useGame();
  const { walletState } = useWallet();
  const { petMood, equippedItems, isSleeping, petName, hasRealPet } = gameState;

  // Determine pet appearance based on mood
  const getPetColor = () => {
    switch (petMood) {
      case "happy":
        return "fill-success";
      case "sad":
        return "fill-destructive";
      case "sleeping":
        return "fill-secondary";
      default:
        return "fill-accent";
    }
  };

  const hasGlasses = equippedItems.includes("cool-glasses");

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Pet Container */}
      <div
        className={`relative ${isSleeping ? "" : "animate-bounce"}`}
        style={{ animationDuration: "2s" }}
      >
        {/* Pixel Pet SVG - Cute 8-bit creature */}
        <svg
          width="180"
          height="180"
          viewBox="0 0 24 24"
          className="drop-shadow-lg"
          style={{ imageRendering: "pixelated" }}
        >
          {/* Body - Rounded blob shape */}
          <rect x="6" y="8" width="12" height="10" className={getPetColor()} />
          <rect x="5" y="10" width="2" height="6" className={getPetColor()} />
          <rect x="17" y="10" width="2" height="6" className={getPetColor()} />
          <rect x="7" y="7" width="10" height="1" className={getPetColor()} />
          <rect x="7" y="18" width="10" height="1" className={getPetColor()} />

          {/* Ears */}
          <rect x="5" y="6" width="2" height="3" className={getPetColor()} />
          <rect x="17" y="6" width="2" height="3" className={getPetColor()} />

          {/* Eyes */}
          {petMood === "sleeping" ? (
            <>
              <rect x="9" y="11" width="2" height="1" className="fill-foreground" />
              <rect x="13" y="11" width="2" height="1" className="fill-foreground" />
            </>
          ) : (
            <>
              <rect x="9" y="11" width="2" height="2" className="fill-foreground" />
              <rect x="13" y="11" width="2" height="2" className="fill-foreground" />
            </>
          )}

          {/* Mouth - changes based on mood */}
          {petMood === "happy" && (
            <>
              <rect x="9" y="15" width="1" height="1" className="fill-foreground" />
              <rect x="10" y="16" width="4" height="1" className="fill-foreground" />
              <rect x="14" y="15" width="1" height="1" className="fill-foreground" />
            </>
          )}
          {petMood === "sad" && (
            <>
              <rect x="9" y="16" width="1" height="1" className="fill-foreground" />
              <rect x="10" y="15" width="4" height="1" className="fill-foreground" />
              <rect x="14" y="16" width="1" height="1" className="fill-foreground" />
            </>
          )}
          {petMood === "neutral" && (
            <rect x="10" y="15" width="4" height="1" className="fill-foreground" />
          )}
          {petMood === "sleeping" && (
            <rect x="10" y="15" width="4" height="1" className="fill-foreground" />
          )}

          {/* Cool Glasses overlay */}
          {hasGlasses && (
            <g>
              <rect x="8" y="10" width="3" height="3" className="fill-foreground opacity-80" />
              <rect x="13" y="10" width="3" height="3" className="fill-foreground opacity-80" />
              <rect x="11" y="11" width="2" height="1" className="fill-foreground" />
            </g>
          )}

          {/* Feet */}
          <rect x="8" y="19" width="2" height="2" className={getPetColor()} />
          <rect x="14" y="19" width="2" height="2" className={getPetColor()} />
        </svg>

        {/* Sleep Z's */}
        {isSleeping && (
          <div className="absolute -top-4 right-0 text-2xl animate-pulse">
            <div className="pixel-text-shadow">💤</div>
          </div>
        )}
      </div>

      {/* Pet Status Text */}
      <div className="mt-4 text-center">
        {petName && (
          <h3 className="text-lg font-bold pixel-text-shadow mb-1">
            {petName}
          </h3>
        )}
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {isSleeping
            ? "💤 Sleeping"
            : petMood === "happy"
            ? "😊 Happy"
            : petMood === "sad"
            ? "😢 Sad"
            : "😐 Okay"}
        </p>
        {walletState.isConnected && hasRealPet && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-300">
              ⭐ On Stellar
            </span>
          </div>
        )}
        {walletState.isConnected && !hasRealPet && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 mb-3">
              🏠 Local Pet
            </span>
            <div>
              <CreatePetDialog />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetDisplay;

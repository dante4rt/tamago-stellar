import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { stellarService } from "../lib/stellar";
import { Pet } from "../contracts/src/index";
import { useWallet } from "./WalletContext";

export interface PetStats {
  hunger: number; // 0-100
  happy: number; // 0-100
  energy: number; // 0-100
}

export interface GameState {
  stats: PetStats;
  coins: number;
  inventory: string[];
  equippedItems: string[];
  isSleeping: boolean;
  lastUpdate: number;
  petMood: "happy" | "neutral" | "sad" | "sleeping";
  petName?: string;
  hasRealPet: boolean; // Track if user has created a pet on-chain
}

interface GameContextType {
  gameState: GameState;
  feedPet: () => void;
  playWithPet: () => void;
  workWithPet: () => void;
  putPetToSleep: () => void;
  equipItem: (item: string) => void;
  unequipItem: (item: string) => void;
  mintCoolGlasses: () => void;
  removePet: () => void;
  resetGame: () => void;
  createRealPet: (name: string) => void;
  syncWithBlockchain: () => void;
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATE: GameState = {
  stats: {
    hunger: 0,
    happy: 0,
    energy: 0,
  },
  coins: 0,
  inventory: [],
  equippedItems: [],
  isSleeping: false,
  lastUpdate: Date.now(),
  petMood: "neutral",
  petName: undefined,
  hasRealPet: false,
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { walletState } = useWallet();
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem("pixelPetGame");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, lastUpdate: Date.now() };
    }
    return INITIAL_STATE;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("pixelPetGame", JSON.stringify(gameState));
  }, [gameState]);

  // Helper to convert blockchain Pet to our PetStats
  const convertPetToStats = (pet: Pet): { stats: PetStats; petName: string } => {
    return {
      stats: {
        hunger: Number(pet.hunger),
        happy: Number(pet.happiness),
        energy: Number(pet.energy),
      },
      petName: pet.name,
    };
  };

  // Calculate pet mood based on stats
  const calculateMood = (stats: PetStats, isSleeping: boolean): GameState["petMood"] => {
    if (isSleeping) return "sleeping";
    const avgStat = (stats.hunger + stats.happy + stats.energy) / 3;
    if (avgStat > 60) return "happy";
    if (avgStat > 30) return "neutral";
    return "sad";
  };

  // Sync with blockchain data
  const syncWithBlockchain = useCallback(async () => {
    const walletState = stellarService.getWalletState();
    if (!walletState.isConnected) return;

    try {
      setIsLoading(true);
      const [pet, coins] = await Promise.all([stellarService.getPet(), stellarService.getCoins()]);

      if (pet && pet.is_alive) {
        const { stats, petName } = convertPetToStats(pet);
        setGameState((prev) => ({
          ...prev,
          stats,
          coins,
          petName,
          hasRealPet: true,
          petMood: calculateMood(stats, false),
          equippedItems: pet.has_glasses
            ? [...prev.equippedItems.filter((item) => item !== "cool-glasses"), "cool-glasses"]
            : prev.equippedItems.filter((item) => item !== "cool-glasses"),
          inventory: pet.has_glasses
            ? [...prev.inventory.filter((item) => item !== "cool-glasses"), "cool-glasses"]
            : prev.inventory.filter((item) => item !== "cool-glasses"),
        }));
      } else {
        // Pet doesn't exist or is dead
        setGameState((prev) => ({ ...prev, hasRealPet: false, coins }));
      }
    } catch (error) {
      toast.error("Failed to sync with blockchain");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-sync when wallet connects
  useEffect(() => {
    if (walletState.isConnected) {
      syncWithBlockchain();
    }
  }, [walletState.isConnected, syncWithBlockchain]);

  // Reset game state when wallet disconnects
  useEffect(() => {
    if (!walletState.isConnected) {
      setGameState(INITIAL_STATE);
    }
  }, [walletState.isConnected]);

  // Create real pet on blockchain
  const createRealPet = async (name: string) => {
    const walletState = stellarService.getWalletState();
    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Creating pet on Stellar...", { duration: 4000 });

      const pet = await stellarService.createPet(name);
      const { stats, petName } = convertPetToStats(pet);

      setGameState((prev) => ({
        ...prev,
        stats,
        petName,
        hasRealPet: true,
        petMood: calculateMood(stats, false),
        lastUpdate: Date.now(),
      }));

      toast.success(`🎉 ${name} created on Stellar!`);

      // Auto-sync after successful creation to get the latest state
      setTimeout(() => {
        syncWithBlockchain();
      }, 2000);
    } catch (error) {
      console.error("Create pet error:", error);

      // Only show error for genuine failures, not XDR parsing issues
      toast.error("Pet creation may be processing. Please refresh in a moment to check status.");

      // Try to sync after a delay in case transaction is pending
      setTimeout(() => {
        syncWithBlockchain();
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const feedPet = async () => {
    const walletState = stellarService.getWalletState();

    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!gameState.hasRealPet) {
      toast.error("Please create a pet on Stellar first");
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Feeding pet on Stellar...", { duration: 3000 });
      await stellarService.feedPet();
      await syncWithBlockchain();
      toast.success("🍖 Yum! Pet fed on-chain!");
    } catch (error) {
      console.error("Feed pet error:", error);
      toast.error("Feeding may be processing. Check pet status in a moment.");

      // Auto-sync after delay in case transaction is pending
      setTimeout(() => {
        syncWithBlockchain();
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const playWithPet = async () => {
    const walletState = stellarService.getWalletState();

    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!gameState.hasRealPet) {
      toast.error("Please create a pet on Stellar first");
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Playing with pet on Stellar...", { duration: 3000 });
      await stellarService.playWithPet();
      await syncWithBlockchain();
      toast.success("🎮 Wheee! So fun on-chain!");
    } catch (error) {
      console.error("Play pet error:", error);
      toast.error("Playing may be processing. Check pet status in a moment.");

      setTimeout(() => {
        syncWithBlockchain();
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const workWithPet = async () => {
    const walletState = stellarService.getWalletState();

    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!gameState.hasRealPet) {
      toast.error("Please create a pet on Stellar first");
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Working with pet on Stellar...", { duration: 3000 });
      await stellarService.workWithPet();
      await syncWithBlockchain();
      toast.success("💰 Work completed on-chain!");
    } catch (error) {
      console.error("Work pet error:", error);
      toast.error("Work may be processing. Check coins in a moment.");

      setTimeout(() => {
        syncWithBlockchain();
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const putPetToSleep = async () => {
    const walletState = stellarService.getWalletState();

    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!gameState.hasRealPet) {
      toast.error("Please create a pet on Stellar first");
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("Putting pet to sleep on Stellar...", { duration: 3000 });
      await stellarService.putPetToSleep();
      await syncWithBlockchain();
      toast.success("💤 Pet is sleeping on-chain!");
    } catch (error) {
      console.error("Sleep pet error:", error);
      toast.error("Sleep action may be processing. Check pet status in a moment.");

      setTimeout(() => {
        syncWithBlockchain();
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const equipItem = (item: string) => {
    const walletState = stellarService.getWalletState();

    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!gameState.hasRealPet) {
      toast.error("Please create a pet on Stellar first");
      return;
    }

    setGameState((prev) => {
      if (prev.equippedItems.includes(item)) {
        toast("👔 Already equipped!", { icon: "ℹ️" });
        return prev;
      }

      toast.success(`✨ Equipped ${item}!`, { duration: 2000 });

      return {
        ...prev,
        equippedItems: [...prev.equippedItems, item],
      };
    });
  };

  const unequipItem = (item: string) => {
    const walletState = stellarService.getWalletState();

    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!gameState.hasRealPet) {
      toast.error("Please create a pet on Stellar first");
      return;
    }

    setGameState((prev) => ({
      ...prev,
      equippedItems: prev.equippedItems.filter((i) => i !== item),
    }));
    toast("👔 Item unequipped", { duration: 2000 });
  };

  const mintCoolGlasses = async () => {
    const walletState = stellarService.getWalletState();

    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!gameState.hasRealPet) {
      toast.error("Please create a pet on Stellar first");
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("🌟 Minting on Stellar...", { duration: 4000 });
      await stellarService.mintGlasses();
      await syncWithBlockchain();
      toast.success("🕶️ Cool Glasses minted on-chain!");
    } catch (error) {
      console.error("Mint glasses error:", error);
      toast.error("Minting may be processing. Check inventory in a moment.");

      setTimeout(() => {
        syncWithBlockchain();
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const removePet = async () => {
    const walletState = stellarService.getWalletState();

    if (!walletState.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);
      toast.loading("🗑️ Removing pet...", { duration: 4000 });
      await stellarService.removePet();

      // Reset local state immediately for better UX
      setGameState((prev) => ({
        ...prev,
        hasRealPet: false,
        stats: { hunger: 0, happy: 0, energy: 0 },
        coins: 0,
        petName: undefined,
      }));

      toast.success("🗑️ Pet removed from blockchain!");
    } catch (error) {
      console.error("Remove pet error:", error);
      toast.error("Pet removal may be processing. Please refresh to check status.");

      // Still sync after delay in case removal succeeded
      setTimeout(() => {
        syncWithBlockchain();
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    if (window.confirm("Reset your pet? All progress will be lost!")) {
      setGameState(INITIAL_STATE);
      toast("🔄 Game reset!", { duration: 2000 });
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        feedPet,
        playWithPet,
        workWithPet,
        putPetToSleep,
        equipItem,
        unequipItem,
        mintCoolGlasses,
        removePet,
        resetGame,
        createRealPet,
        syncWithBlockchain,
        isLoading,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
};

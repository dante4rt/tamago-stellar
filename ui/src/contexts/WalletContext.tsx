import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { stellarService, WalletState } from "../lib/stellar";
import toast from "react-hot-toast";

interface WalletContextType {
  walletState: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    selectedWallet: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize wallet state on mount
  useEffect(() => {
    const currentState = stellarService.getWalletState();
    setWalletState(currentState);
  }, []);

  const connectWallet = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const state = await stellarService.connectWallet();
      setWalletState(state);
      toast.success(`Connected to ${state.selectedWallet?.name}!`, {
        duration: 3000,
        icon: "🔗",
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet", {
        duration: 3000,
        icon: "❌",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    stellarService.disconnectWallet();
    setWalletState({
      isConnected: false,
      address: null,
      selectedWallet: null,
    });
    // Clear persisted game data from localStorage
    localStorage.removeItem("pixelPetGame");
    toast.success("Wallet disconnected", {
      duration: 2000,
      icon: "👋",
    });
  };

  return (
    <WalletContext.Provider
      value={{
        walletState,
        connectWallet,
        disconnectWallet,
        isLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

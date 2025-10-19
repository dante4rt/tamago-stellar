import React from 'react';
import { Button } from './ui/button';
import { useGame } from '../contexts/GameContext';
import { useWallet } from '../contexts/WalletContext';
import { RefreshCw, Loader2 } from 'lucide-react';

export const SyncButton: React.FC = () => {
  const { syncWithBlockchain, isLoading } = useGame();
  const { walletState } = useWallet();

  if (!walletState.isConnected) {
    return null;
  }

  return (
    <Button
      onClick={syncWithBlockchain}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 h-9"
      title="Sync with Stellar blockchain"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
    </Button>
  );
};
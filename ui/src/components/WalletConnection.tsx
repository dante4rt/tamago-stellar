import React from 'react';
import { Button } from './ui/button';
import { useWallet } from '../contexts/WalletContext';
import { Wallet, LogOut, Loader2 } from 'lucide-react';

export const WalletConnection: React.FC = () => {
  const { walletState, connectWallet, disconnectWallet, isLoading } = useWallet();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (walletState.isConnected && walletState.address) {
    return (
      <div className="flex items-center gap-2 h-9">
        <div className="text-xs font-mono text-green-400 bg-green-900/20 px-2 py-2 rounded border border-green-500/30 h-9 flex items-center">
          {truncateAddress(walletState.address)}
        </div>
        <Button
          onClick={disconnectWallet}
          variant="outline"
          size="sm"
          className="border-red-500/50 hover:border-red-400 hover:bg-red-500/10 h-9"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isLoading}
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white font-pixel h-9"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  );
};
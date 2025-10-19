import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useGame } from '../contexts/GameContext';
import { useWallet } from '../contexts/WalletContext';
import { Sparkles, Loader2 } from 'lucide-react';

export const CreatePetDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [petName, setPetName] = useState('');
  const { createRealPet, isLoading } = useGame();
  const { walletState } = useWallet();

  const handleCreate = async () => {
    if (!petName.trim()) return;

    await createRealPet(petName.trim());
    setOpen(false);
    setPetName('');
  };

  if (!walletState.isConnected) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white font-pixel"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Create Pet on Stellar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-4 border-border">
        <DialogHeader>
          <DialogTitle className="font-pixel text-xl">Create Your Stellar Pet</DialogTitle>
          <DialogDescription>
            This will create a real pet on the Stellar blockchain that you own!
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right font-pixel">
              Name
            </Label>
            <Input
              id="name"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Enter pet name..."
              className="col-span-3 border-2 border-border"
              maxLength={20}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleCreate}
            disabled={!petName.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Pet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
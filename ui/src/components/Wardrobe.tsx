import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGame } from "@/contexts/GameContext";
import { Shirt, Sparkles } from "lucide-react";

const Wardrobe: React.FC = () => {
  const { gameState, equipItem, unequipItem, mintCoolGlasses } = useGame();

  const items = [
    {
      id: "cool-glasses",
      name: "Cool Glasses",
      icon: "🕶️",
      cost: 50,
      isNFT: true,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="h-16 sm:h-20 w-full max-w-md flex flex-col items-center justify-center gap-1 pixel-shadow hover:translate-y-1 transition-transform text-xs sm:text-sm"
        >
          <Shirt className="h-5 w-5 sm:h-6 sm:w-6" />
          <span>Wardrobe</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md pixel-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl pixel-text-shadow">🎨 Wardrobe</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Equip items to customize your pet!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Inventory Items */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold mb-2 uppercase">Your Items</h3>
            <div className="space-y-2">
              {gameState.inventory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No items yet. Mint some below!</p>
              ) : (
                gameState.inventory.map((itemId) => {
                  const item = items.find((i) => i.id === itemId);
                  if (!item) return null;

                  const isEquipped = gameState.equippedItems.includes(itemId);

                  return (
                    <div
                      key={itemId}
                      className="flex items-center justify-between p-3 border-2 border-border bg-background"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-xs sm:text-sm font-bold">{item.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={isEquipped ? "destructive" : "default"}
                        onClick={() => (isEquipped ? unequipItem(itemId) : equipItem(itemId))}
                        className="text-xs"
                      >
                        {isEquipped ? "Unequip" : "Equip"}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Shop Section */}
          <div>
            <h3 className="text-xs sm:text-sm font-bold mb-2 uppercase flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Web3 Shop
            </h3>
            <div className="space-y-2">
              {items.map((item) => {
                const isOwned = gameState.inventory.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border-2 border-border bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-xs sm:text-sm font-bold">{item.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {item.cost} coins
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isOwned ? "outline" : "default"}
                      onClick={mintCoolGlasses}
                      disabled={isOwned}
                      className="text-xs"
                    >
                      {isOwned ? "Owned" : "Mint NFT"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Wardrobe;

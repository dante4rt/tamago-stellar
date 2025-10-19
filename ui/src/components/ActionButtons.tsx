import React from "react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/contexts/GameContext";
import { Utensils, Gamepad2, Briefcase, Moon } from "lucide-react";

const ActionButtons: React.FC = () => {
  const { feedPet, playWithPet, workWithPet, putPetToSleep, gameState } = useGame();

  const buttons = [
    {
      label: "Feed",
      icon: Utensils,
      action: feedPet,
      variant: "default" as const,
      disabled: gameState.isSleeping,
    },
    {
      label: "Play",
      icon: Gamepad2,
      action: playWithPet,
      variant: "secondary" as const,
      disabled: gameState.isSleeping,
    },
    {
      label: "Work",
      icon: Briefcase,
      action: workWithPet,
      variant: "outline" as const,
      disabled: gameState.isSleeping,
    },
    {
      label: "Sleep",
      icon: Moon,
      action: putPetToSleep,
      variant: "outline" as const,
      disabled: gameState.isSleeping,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
      {buttons.map((btn) => (
        <Button
          key={btn.label}
          onClick={btn.action}
          disabled={btn.disabled}
          variant={btn.variant}
          size="lg"
          className="h-16 sm:h-20 flex flex-col items-center justify-center gap-1 pixel-shadow hover:translate-y-1 transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
        >
          <btn.icon className="h-5 w-5 sm:h-6 sm:w-6" />
          <span>{btn.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default ActionButtons;

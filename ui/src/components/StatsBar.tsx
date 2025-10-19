import React from "react";

interface StatsBarProps {
  label: string;
  value: number;
  icon: string;
  color: "hunger" | "happy" | "energy";
}

const StatsBar: React.FC<StatsBarProps> = ({ label, value, icon, color }) => {
  const getBarColor = () => {
    if (value > 60) {
      return color === "hunger" ? "bg-success" : color === "happy" ? "bg-accent" : "bg-secondary";
    }
    if (value > 30) {
      return "bg-accent";
    }
    return "bg-destructive";
  };

  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs uppercase tracking-wide flex items-center gap-1">
          <span>{icon}</span>
          <span className="hidden sm:inline">{label}</span>
        </span>
        <span className="text-[10px] sm:text-xs font-bold">{Math.round(value)}%</span>
      </div>
      <div className="relative h-4 sm:h-6 bg-muted border-2 border-border overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${getBarColor()} transition-all duration-500 ease-out`}
          style={{ width: `${value}%` }}
        >
          {/* Pixel pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <pattern
                id={`dots-${label}`}
                x="0"
                y="0"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="4" height="4" fill="currentColor" />
              </pattern>
              <rect width="100%" height="100%" fill={`url(#dots-${label})`} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;

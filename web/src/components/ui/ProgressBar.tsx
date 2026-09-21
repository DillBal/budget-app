interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  over?: boolean;
  className?: string;
}

export function ProgressBar({ value, max, color, over, className = "h-2" }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={`w-full overflow-hidden rounded-full bg-white/[0.07] ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${pct}%`,
          background: over
            ? "linear-gradient(90deg, #f43f5e, #fb7185)"
            : `linear-gradient(90deg, ${color ?? "#6366f1"}aa, ${color ?? "#6366f1"})`,
        }}
      />
    </div>
  );
}

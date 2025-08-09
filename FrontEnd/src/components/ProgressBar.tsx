interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <div className="px-4 pt-3 pb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{current}/{total} Coffees</span>
        <span className="text-xs font-medium text-primary">{pct}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
    </div>
  );
}

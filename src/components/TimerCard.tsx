import { XIcon } from "lucide-react";

export const TimerCard = ({
  value,
  progress,
  isRunning,
  onStart,
  onStop,
  ariaLabel,
}: {
  value: string;
  progress: number;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  ariaLabel: string;
}) => {
  const progressDegrees = Math.round(Math.max(0, Math.min(progress, 1)) * 360);

  return (
    <div className="rounded-xl bg-surface-raised text-center flex-1 flex flex-col items-center justify-center h-17.5 relative w-full">
      {isRunning && (
        <button
          type="button"
          className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-surface-muted text-text-muted transition-colors hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onStop}
          aria-label="Stop rest timer"
        >
          <XIcon className="size-3" />
        </button>
      )}

      <button
        type="button"
        className="rounded-full transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={onStart}
        aria-label={ariaLabel}
      >
        <div
          className="grid size-12 place-items-center rounded-full"
          style={{
            background: `conic-gradient(rgb(var(--color-primary)) ${progressDegrees}deg, rgb(var(--color-surface-muted)) 0deg)`,
          }}
          aria-hidden="true"
        >
          <div className="grid size-10 place-items-center rounded-full bg-surface-raised">
            <span className="w-full text-center text-sm leading-none font-bold tabular-nums text-text">
              {value}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

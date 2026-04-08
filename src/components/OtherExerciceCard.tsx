import { ChevronRight } from "lucide-react";
import type { Exercise } from "../types";

export const OtherExerciseCard = ({
  exercise,
  index,
  onSelectExercise,
}: {
  exercise: Exercise;
  index: number;
  onSelectExercise: (exerciseIndex: number) => void;
}) => (
  <button
    key={exercise.name}
    type="button"
    onClick={() => onSelectExercise(index)}
    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-all active:scale-[0.98]"
  >
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-text-subtle">
        {index + 1}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{exercise.name}</div>
        <div className="text-xs text-text-subtle">
          {exercise.sets}×{exercise.reps} · RPE {exercise.rpe}
        </div>
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <ChevronRight className="size-4 text-text-faint" />
    </div>
  </button>
);

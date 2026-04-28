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
    className="border-border bg-surface flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.98]"
  >
    <div className="flex min-w-0 items-center gap-3">
      <div className="bg-surface-muted text-text-subtle flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        {index + 1}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{exercise.name}</div>
        <div className="text-text-subtle text-xs">
          {exercise.sets}×{exercise.reps} · RPE {exercise.rpe}
        </div>
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      <ChevronRight className="text-text-faint size-4" />
    </div>
  </button>
);

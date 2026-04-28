import { cva } from "class-variance-authority";
import type { Exercise } from "@/types";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";
import { ExerciseMetaBadges } from "./ExerciseMetaBadges";

const exerciseCardVariants = cva(
  "w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.98]",
  {
    variants: {
      state: {
        complete: "bg-success/5 border-success/15",
        default: "bg-surface-raised border-border",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

const CardStatusIndicator = ({
  isComplete,
  index,
}: {
  isComplete: boolean;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        isComplete
          ? "bg-success text-white"
          : "bg-surface-muted text-text-subtle",
      )}
    >
      {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
    </div>
  );
};

const Badges = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="ml-8 flex flex-wrap items-center gap-2">{children}</div>
  );
};

export const ExerciseCard = ({
  exercise,
  index,
  isComplete,
  onClick,
  lastLoad,
}: {
  exercise: Exercise;
  index: number;
  isComplete: boolean;
  lastLoad: string | null;
  onClick: () => void;
}) => {
  const state = isComplete ? "complete" : "default";

  return (
    <button onClick={onClick} className={cn(exerciseCardVariants({ state }))}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <CardStatusIndicator isComplete={isComplete} index={index} />
            <div className="text-sm leading-tight font-semibold">
              {exercise.name}
            </div>
          </div>
          <ExerciseMetaBadges exercise={exercise} lastLoad={lastLoad} />
        </div>

        <ChevronRight className="text-text-faint size-4 shrink-0" />
      </div>
    </button>
  );
};

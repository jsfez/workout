import { cva } from "class-variance-authority";
import type { Exercise } from "@/types";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, Clock } from "lucide-react";
import { Badge } from "./ui/badge";

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
        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
        isComplete
          ? "bg-success text-white"
          : "bg-surface-muted text-text-subtle",
      )}
    >
      {isComplete ? <Check className="w-3.5 h-3.5" /> : index + 1}
    </div>
  );
};

const Badges = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center gap-2 flex-wrap ml-8">{children}</div>
  );
};

export const ExerciseCard = ({
  exercise,
  index,
  isComplete,
  onClick,
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <CardStatusIndicator isComplete={isComplete} index={index} />
            <div className="text-sm font-semibold leading-tight">
              {exercise.name}
            </div>
          </div>

          <Badges>
            <Badge variant="secondary">
              {exercise.sets}×{exercise.reps}
            </Badge>
            <Badge variant="success">RPE {exercise.rpe}</Badge>
            <Badge variant="warning">
              <Clock className="w-3 h-3" />
              {exercise.rest}
            </Badge>
          </Badges>
        </div>

        <ChevronRight className="shrink-0 size-4 text-text-faint" />
      </div>
    </button>
  );
};

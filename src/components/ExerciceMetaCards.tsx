import { Clock3Icon, DumbbellIcon, FlameIcon } from "lucide-react";
import type { Exercise } from "../types";
import { StatCard } from "./StatCard";

export const ExerciseMetaCards = ({
  exercise,
  lastLoad,
}: {
  exercise: Exercise;
  lastLoad: string | null;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <StatCard variant="secondary">
        {exercise.sets}×{exercise.reps} reps
      </StatCard>

      {lastLoad && (
        <StatCard variant="outline" className="bg-surface">
          <DumbbellIcon className="size-3" />
          {lastLoad} kg
        </StatCard>
      )}

      <StatCard variant="success">
        <FlameIcon className="size-3" />
        RPE {exercise.rpe}
      </StatCard>

      <StatCard variant="warning">
        <Clock3Icon className="size-3" />
        {exercise.rest.split(" ")[0]} m
      </StatCard>
    </div>
  );
};

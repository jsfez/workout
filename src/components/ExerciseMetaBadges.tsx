import { Clock3Icon, DumbbellIcon, FlameIcon } from "lucide-react";
import type { Exercise } from "../types";
import { Badge } from "./ui/badge";

export const ExerciseMetaBadges = ({
  exercise,
  lastLoad,
}: {
  exercise: Exercise;
  lastLoad: string | null;
}) => {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Badge variant="secondary">
        {exercise.sets}×{exercise.reps}
      </Badge>

      {lastLoad && (
        <Badge variant="outline">
          <DumbbellIcon className="size-3" />
          {lastLoad} kg
        </Badge>
      )}

      <Badge variant="success">
        <FlameIcon className="size-3" />
        RPE {exercise.rpe}
      </Badge>

      <Badge variant="warning">
        <Clock3Icon className="size-3" />
        {exercise.rest}
      </Badge>
    </div>
  );
};

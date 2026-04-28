import { useMemo } from "react";
import { getLastLoadForExercise } from "@/api/workoutProgress";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/BackButton";
import { Heading } from "@/components/Heading";
import type { Exercise, Session, WorkoutProgress } from "@/types";
import { Page } from "@/components/Page";
import { FixedPageHeader } from "@/components/PageHeader";
import { ColoredEmphase } from "@/components/ColoredEmphase";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompletedSwitch } from "@/components/CompletedSwitch";
import { OtherExerciseCard } from "@/components/OtherExerciceCard";
import { ExerciseMetaCards } from "../components/ExerciceMetaCards";
import { ExternalLinkIcon } from "lucide-react";

interface ExerciseViewProps {
  sessions: Session[];
  sessionId: string;
  exerciseIndex: number;
  onBack: () => void;
  onSelectExercise: (exerciseIndex: number) => void;
  progress: WorkoutProgress;
  onUpdateLoad: (
    sessionId: string,
    exerciseName: string,
    load: string,
  ) => Promise<void>;
  onSetExerciseCompleted: (
    sessionId: string,
    exerciseName: string,
    completed: boolean,
  ) => Promise<void>;
}

const BASE_LOAD_OPTIONS = Array.from({ length: 81 }, (_, index) =>
  String(index * 2.5),
);

function isLoadValue(value: string | null | undefined): value is string {
  return (
    value !== undefined &&
    value !== null &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  );
}

const LoadSelector = ({
  value,
  options,
  onValueChange,
}: {
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <Label>Weight used (kg)</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a weight" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((load) => (
              <SelectItem key={load} value={load}>
                {load} kg
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

const SessionExerciseList = ({
  exercises,
  currentIndex,
  completedExercises,
  onSelectExercise,
}: {
  exercises: Exercise[];
  currentIndex: number;
  completedExercises: Record<string, boolean>;
  onSelectExercise: (exerciseIndex: number) => void;
}) => {
  const incompleteExercises = exercises.filter(
    (exercise, index) =>
      index !== currentIndex && !completedExercises[exercise.name],
  );

  if (incompleteExercises.length === 0) return null;

  return (
    <div>
      <div className="text-text-muted font-medium">
        Still to do ({incompleteExercises.length})
      </div>
      <Card className="mt-2 mb-24">
        <CardContent className="flex flex-col gap-2">
          {exercises.map((exercise, index) => {
            if (index === currentIndex || completedExercises[exercise.name]) {
              return null;
            }

            return (
              <OtherExerciseCard
                key={exercise.name}
                exercise={exercise}
                index={index}
                onSelectExercise={onSelectExercise}
              />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export const ExerciseView = ({
  sessions,
  sessionId,
  exerciseIndex,
  onBack,
  onSelectExercise,
  progress,
  onUpdateLoad,
  onSetExerciseCompleted,
}: ExerciseViewProps) => {
  const session = sessions.find((s) => s.id === sessionId)!;
  const selectedExercise =
    session.exercises[exerciseIndex] ?? session.exercises[0];
  const sessionProgress = progress.sessions.find(
    (item) => item.sessionId === sessionId,
  );
  const allSessionIds = sessions.map((s) => s.id);
  const savedLoad = sessionProgress?.loads[selectedExercise.name] ?? "";
  const completedExercises = sessionProgress?.completedExercises ?? {};
  const isExerciseCompleted =
    completedExercises[selectedExercise.name] ?? false;

  const lastLoad = getLastLoadForExercise(
    progress,
    selectedExercise.name,
    sessionId,
    allSessionIds,
  );

  const loadOptions = useMemo(() => {
    const options = new Set(BASE_LOAD_OPTIONS);

    [
      savedLoad,
      selectedExercise.programLoad,
      lastLoad,
      selectedExercise.maxLoad,
    ].forEach((value) => {
      if (isLoadValue(value)) options.add(value);
    });

    return Array.from(options).sort((a, b) => Number(a) - Number(b));
  }, [
    lastLoad,
    savedLoad,
    selectedExercise.maxLoad,
    selectedExercise.programLoad,
  ]);

  async function handleCompletedChange(checked: boolean) {
    await onSetExerciseCompleted(sessionId, selectedExercise.name, checked);
  }

  function handleLoadChange(load: string) {
    if (load === savedLoad) return;
    void onUpdateLoad(sessionId, selectedExercise.name, load);
  }

  function goToExercise(index: number) {
    onSelectExercise(index);
  }

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: () => {
      onBack();
    },
  });

  return (
    <Page {...swipeHandlers}>
      <FixedPageHeader>
        <BackButton label="Session" onClick={onBack} />

        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <ColoredEmphase>
              Exercise {`${exerciseIndex + 1}/${session.exercises.length}`}
            </ColoredEmphase>
            <Heading>{selectedExercise.name}</Heading>
          </div>

          <CompletedSwitch
            checked={isExerciseCompleted}
            onCheckedChange={(checked) => void handleCompletedChange(checked)}
          />
        </div>
        <ExerciseMetaCards exercise={selectedExercise} lastLoad={lastLoad} />
      </FixedPageHeader>

      {selectedExercise.notes && (
        <div className="text-text-muted text-lg">
          {selectedExercise.notes} •{" "}
          <a
            href={`https://chat.openai.com/?q=comment+faire+un+bon+${selectedExercise.name}+en+musculation`}
            className="text-text-subtle text-sm font-medium"
          >
            See more <ExternalLinkIcon className="inline size-3" />
          </a>
        </div>
      )}

      <LoadSelector
        value={savedLoad}
        options={loadOptions}
        onValueChange={handleLoadChange}
      />

      <SessionExerciseList
        exercises={session.exercises}
        currentIndex={exerciseIndex}
        completedExercises={completedExercises}
        onSelectExercise={goToExercise}
      />
    </Page>
  );
};

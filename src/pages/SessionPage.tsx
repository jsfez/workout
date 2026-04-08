import { sessions } from "@/data/workouts";
import {
  completeSession,
  getLastLoadForExercise,
  setSessionCompleted,
} from "@/store/workoutStore";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Progress } from "@/components/ui/progress";
import { BackButton } from "@/components/BackButton";
import { Heading } from "@/components/Heading";
import { Subtitle } from "@/components/Subtitle";
import type { WorkoutStore } from "@/types";
import { ExerciseCard } from "../components/ExerciceCard";
import { FixedPageHeader } from "../components/PageHeader";
import { Page } from "../components/Page";
import { CompletedSwitch } from "../components/CompletedSwitch";

interface SessionViewProps {
  sessionId: string;
  onBack: () => void;
  onSelectExercise: (exerciseIndex: number) => void;
  store: WorkoutStore;
  onStoreChange: () => void;
}

const SessionProgress = ({
  completedExercises,
  totalExercises,
}: {
  completedExercises: number;
  totalExercises: number;
}) => {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between text-xs text-text-subtle">
        <div>Progression</div>
        <div>
          {completedExercises}/{totalExercises}
        </div>
      </div>
      <Progress value={(completedExercises / totalExercises) * 100} />
    </div>
  );
};

export const SessionView = ({
  sessionId,
  onBack,
  onSelectExercise,
  store,
  onStoreChange,
}: SessionViewProps) => {
  const session = sessions.find((s) => s.id === sessionId)!;
  const log = store.logs.find((l) => l.sessionId === sessionId);
  const isCompleted = log?.completed ?? false;
  const allSessionIds = sessions.map((s) => s.id);
  const completedExerciseMap = log?.completedExercises ?? {};

  function handleComplete() {
    completeSession(sessionId);
    onStoreChange();
    onBack();
  }

  function handleSessionCompletedChange(checked: boolean) {
    setSessionCompleted(sessionId, checked);
    onStoreChange();
  }

  const completedExercises = session.exercises.filter(
    (ex) => completedExerciseMap[ex.name],
  ).length;

  const firstIncompleteIndex = session.exercises.findIndex(
    (ex) => !completedExerciseMap[ex.name],
  );

  const swipeHandlers = useSwipeNavigation({
    onSwipeRight: onBack,
    onSwipeLeft: () =>
      onSelectExercise(firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex),
  });

  return (
    <Page {...swipeHandlers}>
      <FixedPageHeader>
        <BackButton label="Retour" onClick={onBack} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <Heading>{session.label}</Heading>
            <Subtitle>{session.exercises.length} exercices</Subtitle>
          </div>
          <CompletedSwitch
            checked={isCompleted}
            onCheckedChange={handleSessionCompletedChange}
          />
        </div>
        {!isCompleted && (
          <SessionProgress
            completedExercises={completedExercises}
            totalExercises={session.exercises.length}
          />
        )}
      </FixedPageHeader>

      <div className="flex flex-col gap-2.5 pb-8 mt-44">
        {session.exercises.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            index={index}
            isComplete={completedExerciseMap[exercise.name] ?? false}
            lastLoad={getLastLoadForExercise(
              exercise.name,
              sessionId,
              allSessionIds,
            )}
            onClick={() => onSelectExercise(index)}
          />
        ))}
      </div>
    </Page>
  );
};

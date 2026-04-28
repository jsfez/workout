import { getLastLoadForExercise } from "@/api/workoutProgress";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Progress } from "@/components/ui/progress";
import { BackButton } from "@/components/BackButton";
import { Heading } from "@/components/Heading";
import { Subtitle } from "@/components/Subtitle";
import type { Session, WorkoutProgress } from "@/types";
import { ExerciseCard } from "@/components/ExerciceCard";
import { FixedPageHeader } from "@/components/PageHeader";
import { Page } from "@/components/Page";
import { CompletedSwitch } from "@/components/CompletedSwitch";

interface SessionViewProps {
  sessions: Session[];
  sessionId: string;
  onBack: () => void;
  onSelectExercise: (exerciseIndex: number) => void;
  progress: WorkoutProgress;
  onSetSessionCompleted: (
    sessionId: string,
    completed: boolean,
  ) => Promise<void>;
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
      <div className="text-text-subtle mb-1.5 flex items-center justify-between text-xs">
        <div>Progress</div>
        <div>
          {completedExercises}/{totalExercises}
        </div>
      </div>
      <Progress value={(completedExercises / totalExercises) * 100} />
    </div>
  );
};

export const SessionView = ({
  sessions,
  sessionId,
  onBack,
  onSelectExercise,
  progress,
  onSetSessionCompleted,
}: SessionViewProps) => {
  const session = sessions.find((s) => s.id === sessionId)!;
  const sessionProgress = progress.sessions.find(
    (item) => item.sessionId === sessionId,
  );
  const isCompleted = sessionProgress?.completed ?? false;
  const allSessionIds = sessions.map((s) => s.id);
  const completedExerciseMap = sessionProgress?.completedExercises ?? {};

  async function handleSessionCompletedChange(checked: boolean) {
    await onSetSessionCompleted(sessionId, checked);
  }

  const completedExercises = session.exercises.filter(
    (ex) => completedExerciseMap[ex.name],
  ).length;

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: onBack,
  });

  return (
    <Page {...swipeHandlers}>
      <FixedPageHeader>
        <BackButton label="Back" onClick={onBack} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <Heading>{session.label}</Heading>
            <Subtitle>{session.exercises.length} exercises</Subtitle>
          </div>
          <CompletedSwitch
            checked={isCompleted}
            onCheckedChange={(checked) =>
              void handleSessionCompletedChange(checked)
            }
          />
        </div>
        {!isCompleted && (
          <SessionProgress
            completedExercises={completedExercises}
            totalExercises={session.exercises.length}
          />
        )}
      </FixedPageHeader>

      <div className="flex flex-col gap-2.5 pb-8">
        {session.exercises.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            index={index}
            isComplete={completedExerciseMap[exercise.name] ?? false}
            lastLoad={getLastLoadForExercise(
              progress,
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

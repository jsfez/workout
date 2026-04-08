import { CheckCircle2 } from "lucide-react";
import { sessions } from "@/data/workouts";
import { completeSession, getLastLoadForExercise } from "@/store/workoutStore";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BackButton } from "@/components/BackButton";
import { Heading } from "@/components/Heading";
import { Subtitle } from "@/components/Subtitle";
import type { WorkoutStore } from "@/types";
import { ExerciseCard } from "../components/ExerciceCard";
import { FixedPageHeader, PageHeader } from "../components/PageHeader";
import { Page } from "../components/Page";
import { PageFooter } from "../components/PageFooter";
import { Container } from "../components/Container";

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

const CompletedBadge = () => (
  <Badge variant="success" className="flex items-center gap-1">
    <CheckCircle2 className="w-4 h-4" />
    Terminée
  </Badge>
);

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
  const savedLoads = log?.loads ?? {};

  function handleComplete() {
    completeSession(sessionId);
    onStoreChange();
    onBack();
  }

  const completedExercises = session.exercises.filter(
    (ex) => savedLoads[ex.name] !== undefined && savedLoads[ex.name] !== "",
  ).length;

  const firstIncompleteIndex = session.exercises.findIndex(
    (ex) => savedLoads[ex.name] === undefined || savedLoads[ex.name] === "",
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
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <Heading>{session.label}</Heading>
            <Subtitle>{session.exercises.length} exercices</Subtitle>
          </div>
          {isCompleted && <CompletedBadge />}
        </div>
        {!isCompleted && (
          <SessionProgress
            completedExercises={completedExercises}
            totalExercises={session.exercises.length}
          />
        )}
      </FixedPageHeader>

      <div className="flex flex-col gap-2.5 pb-32 mt-44">
        {session.exercises.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            index={index}
            currentLoad={savedLoads[exercise.name]}
            lastLoad={getLastLoadForExercise(
              exercise.name,
              sessionId,
              allSessionIds,
            )}
            onClick={() => onSelectExercise(index)}
          />
        ))}
      </div>

      {!isCompleted && (
        <PageFooter>
          <Container className="mx-auto">
            <Button
              variant="success"
              size="lg"
              className="w-full"
              onClick={handleComplete}
              disabled={completedExercises === 0}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Terminer la séance
            </Button>
          </Container>
        </PageFooter>
      )}
    </Page>
  );
};

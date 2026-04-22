import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLastLoadForExercise } from "@/api/workoutProgress";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/PageHeader";
import { ColoredEmphase } from "@/components/ColoredEmphase";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageFooter } from "@/components/PageFooter";
import { CompletedSwitch } from "@/components/CompletedSwitch";
import { OtherExerciseCard } from "@/components/OtherExerciceCard";
import { TimerCard } from "../components/TimerCard";

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
  onUpdateCompletedSets: (
    sessionId: string,
    exerciseName: string,
    completedSets: number,
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

function getMedianRestDurationMs(rest: string) {
  const restDurations = rest
    .match(/\d+(?:[.,]\d+)?/g)
    ?.map((duration) => Number(duration.replace(",", ".")))
    .filter(Number.isFinite);

  if (!restDurations?.length) return 0;

  const shortestRest = Math.min(...restDurations);
  const longestRest = Math.max(...restDurations);
  const medianRest = (shortestRest + longestRest) / 2;

  return Math.round(medianRest * 60 * 1000);
}

function formatTimerDuration(durationMs: number) {
  const totalSeconds = Math.ceil(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

const StatCardLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-0.5 text-xs text-text-subtle">{children}</p>
);

const StatCardValue = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-xl font-bold text-text", className)}>{children}</p>
);

const StatCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="rounded-xl bg-surface-raised py-3 text-center flex-1 relative">
      {children}
    </div>
  );
};

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
    <Card className="mb-24">
      <CardHeader>
        <CardTitle>Still to do</CardTitle>
      </CardHeader>
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
  );
};

const PreviousButton = ({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) => (
  <Button
    variant="secondary"
    size="lg"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-2 flex-1"
  >
    <ChevronLeft className="h-4 w-4" />
    Previous
  </Button>
);

const NextButton = ({
  onClick,
  hasNext,
}: {
  onClick: () => void;
  hasNext: boolean;
}) => (
  <Button
    variant="primary"
    size="lg"
    onClick={onClick}
    className="flex items-center gap-2 flex-1"
  >
    {hasNext ? (
      <>
        <>Next</>
        <ChevronRight className="ml-2 h-4 w-4" />
      </>
    ) : (
      "Save"
    )}
  </Button>
);

export const ExerciseView = ({
  sessions,
  sessionId,
  exerciseIndex,
  onBack,
  onSelectExercise,
  progress,
  onUpdateLoad,
  onUpdateCompletedSets,
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
  const completedSets =
    sessionProgress?.completedSets[selectedExercise.name] ?? 0;
  const completedExercises = sessionProgress?.completedExercises ?? {};
  const isExerciseCompleted =
    completedExercises[selectedExercise.name] ?? false;
  const selectedExerciseKey = `${sessionId}:${selectedExercise.name}`;
  const restDurationMs = useMemo(
    () => getMedianRestDurationMs(selectedExercise.rest),
    [selectedExercise.rest],
  );
  const lastLoad = getLastLoadForExercise(
    progress,
    selectedExercise.name,
    sessionId,
    allSessionIds,
  );

  const [loadInput, setLoadInput] = useState(savedLoad);
  const [restTimer, setRestTimer] = useState<{
    exerciseKey: string;
    endAt: number;
  } | null>(null);
  const [restTimerRemainingMs, setRestTimerRemainingMs] = useState(0);

  const previousIndex = exerciseIndex > 0 ? exerciseIndex - 1 : null;
  const nextIndex =
    exerciseIndex < session.exercises.length - 1 ? exerciseIndex + 1 : null;

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

  async function saveLoad() {
    await onUpdateLoad(sessionId, selectedExercise.name, loadInput);
  }

  async function handleCompletedChange(checked: boolean) {
    await onSetExerciseCompleted(sessionId, selectedExercise.name, checked);
  }

  function handleCompletedSetsClick() {
    const nextCompletedSets =
      completedSets < selectedExercise.sets ? completedSets + 1 : 0;

    void onUpdateCompletedSets(
      sessionId,
      selectedExercise.name,
      nextCompletedSets,
    );
  }

  function handleRestTimerClick() {
    if (restDurationMs <= 0) return;

    setRestTimerRemainingMs(restDurationMs);
    setRestTimer({
      exerciseKey: selectedExerciseKey,
      endAt: Date.now() + restDurationMs,
    });
  }

  function handleStopRestTimerClick() {
    setRestTimer(null);
    setRestTimerRemainingMs(0);
  }

  function goToExercise(index: number) {
    void saveLoad();
    onSelectExercise(index);
  }

  const swipeHandlers = useSwipeNavigation({
    onSwipeRight: () => {
      if (previousIndex === null) {
        onBack();
      } else {
        goToExercise(previousIndex);
      }
    },
    onSwipeLeft: () => {
      if (nextIndex !== null) goToExercise(nextIndex);
    },
  });

  const hasNext = nextIndex !== null;

  const handlePrevious = () => {
    if (previousIndex === null) {
      onBack();
    } else {
      goToExercise(previousIndex);
    }
  };

  const handleNext = () => {
    if (nextIndex !== null) {
      goToExercise(nextIndex);
    } else {
      void saveLoad();
      onBack();
    }
  };

  const activeRestTimerEndAt =
    restTimer?.exerciseKey === selectedExerciseKey ? restTimer.endAt : null;

  useEffect(() => {
    if (activeRestTimerEndAt === null) return;

    const timerEndAt = activeRestTimerEndAt;

    function updateTimer() {
      const nextRemainingMs = Math.max(0, timerEndAt - Date.now());

      setRestTimerRemainingMs(nextRemainingMs);
    }

    updateTimer();

    const timerInterval = window.setInterval(updateTimer, 250);
    const timerTimeout = window.setTimeout(
      () => {
        setRestTimerRemainingMs(0);
        setRestTimer((currentRestTimer) =>
          currentRestTimer?.exerciseKey === selectedExerciseKey &&
          currentRestTimer.endAt === timerEndAt
            ? null
            : currentRestTimer,
        );

        if ("vibrate" in navigator) {
          navigator.vibrate([300, 100, 300]);
        }
      },
      Math.max(0, timerEndAt - Date.now()),
    );

    return () => {
      window.clearInterval(timerInterval);
      window.clearTimeout(timerTimeout);
    };
  }, [activeRestTimerEndAt, selectedExerciseKey]);

  const restTimerValue =
    activeRestTimerEndAt === null
      ? formatTimerDuration(restDurationMs)
      : formatTimerDuration(restTimerRemainingMs);
  const restTimerProgress =
    activeRestTimerEndAt === null || restDurationMs <= 0
      ? 1
      : restTimerRemainingMs / restDurationMs;

  return (
    <Page {...swipeHandlers}>
      <PageHeader>
        <BackButton label="Session" onClick={onBack} />

        <div className="mb-5 flex items-start justify-between gap-4">
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

        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={handleCompletedSetsClick}
            aria-label={`Update completed sets for ${selectedExercise.name}`}
            className="flex-1"
          >
            <StatCard>
              <StatCardValue>{`${completedSets}/${selectedExercise.sets}`}</StatCardValue>
              <StatCardLabel>{`${selectedExercise.reps} reps × ${selectedExercise.sets}`}</StatCardLabel>
            </StatCard>
          </button>
          <StatCard>
            <StatCardValue className="text-success-foreground">
              {selectedExercise.rpe}
            </StatCardValue>
            <StatCardLabel>RPE</StatCardLabel>
          </StatCard>
          <TimerCard
            value={restTimerValue}
            progress={restTimerProgress}
            isRunning={activeRestTimerEndAt !== null}
            onStart={handleRestTimerClick}
            onStop={handleStopRestTimerClick}
            ariaLabel={`Start rest timer for ${selectedExercise.name}`}
          />
          {lastLoad && (
            <StatCard>
              <StatCardValue className="text-primary">
                {`${lastLoad} kg`}
              </StatCardValue>
              <StatCardLabel>Last weight</StatCardLabel>
            </StatCard>
          )}
        </div>
      </PageHeader>

      {selectedExercise.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Tips</CardTitle>
            <CardDescription>{selectedExercise.notes}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <LoadSelector
        value={loadInput}
        options={loadOptions}
        onValueChange={setLoadInput}
      />

      <SessionExerciseList
        exercises={session.exercises}
        currentIndex={exerciseIndex}
        completedExercises={completedExercises}
        onSelectExercise={goToExercise}
      />

      <PageFooter>
        <div className="flex items-center justify-between gap-2">
          <PreviousButton
            onClick={handlePrevious}
            disabled={previousIndex === null}
          />
          <NextButton onClick={handleNext} hasNext={hasNext} />
        </div>
      </PageFooter>
    </Page>
  );
};

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { sessions } from "@/data/workouts";
import {
  getLastLoadForExercise,
  setExerciseCompleted,
  updateLoad,
} from "@/store/workoutStore";
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
import type { Exercise, WorkoutStore } from "@/types";
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

interface ExerciseViewProps {
  sessionId: string;
  exerciseIndex: number;
  onBack: () => void;
  onSelectExercise: (exerciseIndex: number) => void;
  store: WorkoutStore;
  onStoreChange: () => void;
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
    <div className="rounded-xl bg-surface-raised p-3 text-center flex-1">
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
      <Label>Charge utilisée (kg)</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir une charge" />
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
        <CardTitle>Encore à faire</CardTitle>
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
    Précédent
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
        <>Suivant</>
        <ChevronRight className="ml-2 h-4 w-4" />
      </>
    ) : (
      "Enregistrer"
    )}
  </Button>
);

export const ExerciseView = ({
  sessionId,
  exerciseIndex,
  onBack,
  onSelectExercise,
  store,
  onStoreChange,
}: ExerciseViewProps) => {
  const session = sessions.find((s) => s.id === sessionId)!;
  const selectedExercise =
    session.exercises[exerciseIndex] ?? session.exercises[0];
  const log = store.logs.find((l) => l.sessionId === sessionId);
  const allSessionIds = sessions.map((s) => s.id);
  const savedLoad = log?.loads[selectedExercise.name] ?? "";
  const completedExercises = log?.completedExercises ?? {};
  const isExerciseCompleted =
    completedExercises[selectedExercise.name] ?? false;
  const lastLoad = getLastLoadForExercise(
    selectedExercise.name,
    sessionId,
    allSessionIds,
  );

  const [loadInput, setLoadInput] = useState(savedLoad);

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

  function saveLoad() {
    updateLoad(sessionId, selectedExercise.name, loadInput);
    onStoreChange();
  }

  function handleCompletedChange(checked: boolean) {
    setExerciseCompleted(
      sessionId,
      selectedExercise.name,
      checked,
      session.exercises.map((exercise) => exercise.name),
    );
    onStoreChange();
  }

  function goToExercise(index: number) {
    saveLoad();
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
      saveLoad();
      onBack();
    }
  };

  return (
    <Page {...swipeHandlers}>
      <PageHeader>
        <BackButton label="Séance" onClick={onBack} />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <ColoredEmphase>
              Exercice {`${exerciseIndex + 1}/${session.exercises.length}`}
            </ColoredEmphase>
            <Heading>{selectedExercise.name}</Heading>
          </div>

          <CompletedSwitch
            checked={isExerciseCompleted}
            onCheckedChange={handleCompletedChange}
          />
        </div>

        <div className="flex gap-2">
          <StatCard>
            <StatCardValue>{`${selectedExercise.sets}×${selectedExercise.reps}`}</StatCardValue>
            <StatCardLabel>Séries × Reps</StatCardLabel>
          </StatCard>
          <StatCard>
            <StatCardValue className="text-success-foreground">
              {selectedExercise.rpe}
            </StatCardValue>
            <StatCardLabel>RPE</StatCardLabel>
          </StatCard>
          <StatCard>
            <StatCardValue>
              {selectedExercise.rest.replace(" min", "")}
            </StatCardValue>
            <StatCardLabel>Repos (min)</StatCardLabel>
          </StatCard>
        </div>
      </PageHeader>

      {selectedExercise.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Conseils</CardTitle>
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

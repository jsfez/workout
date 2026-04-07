import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sessions } from "@/data/workouts";
import { getLastLoadForExercise, updateLoad } from "@/store/workoutStore";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import type { WorkoutStore } from "@/types";

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

export function ExerciseView({
  sessionId,
  exerciseIndex,
  onBack,
  onSelectExercise,
  store,
  onStoreChange,
}: ExerciseViewProps) {
  const session = sessions.find((s) => s.id === sessionId)!;
  const selectedExercise = session.exercises[exerciseIndex] ?? session.exercises[0];
  const log = store.logs.find((l) => l.sessionId === sessionId);
  const allSessionIds = sessions.map((s) => s.id);
  const savedLoad = log?.loads[selectedExercise.name] ?? "";
  const lastLoad = getLastLoadForExercise(
    selectedExercise.name,
    sessionId,
    allSessionIds,
  );

  const [loadInput, setLoadInput] = useState(savedLoad);

  const progressLabel = `${exerciseIndex + 1}/${session.exercises.length}`;
  const previousIndex = exerciseIndex > 0 ? exerciseIndex - 1 : null;
  const nextIndex =
    exerciseIndex < session.exercises.length - 1 ? exerciseIndex + 1 : null;

  const placeholder = useMemo(
    () => selectedExercise.programLoad || lastLoad || "0",
    [lastLoad, selectedExercise.programLoad],
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

  function saveLoad() {
    updateLoad(sessionId, selectedExercise.name, loadInput);
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

  const rpeTextColor =
    selectedExercise.rpe >= 9
      ? "text-danger-foreground"
      : selectedExercise.rpe >= 8
        ? "text-warning-foreground"
        : "text-success-foreground";

  return (
    <div className="flex min-h-svh flex-col bg-background" {...swipeHandlers}>
      <div className="px-5 pt-12 pb-6">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Séance</span>
        </button>

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-primary-light uppercase tracking-widest">
              Exercice {progressLabel}
            </p>
            <h1 className="text-2xl font-bold text-text">
              {selectedExercise.name}
            </h1>
          </div>
          {savedLoad && (
            <span className="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success-foreground">
              <Check className="h-3.5 w-3.5" />
              {savedLoad} kg
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-surface-raised p-3 text-center">
            <p className="text-xl font-bold text-text">
              {selectedExercise.sets}×{selectedExercise.reps}
            </p>
            <p className="mt-0.5 text-xs text-text-subtle">Séries × Reps</p>
          </div>
          <div className="rounded-xl bg-surface-raised p-3 text-center">
            <p className={`text-xl font-bold ${rpeTextColor}`}>
              {selectedExercise.rpe}
            </p>
            <p className="mt-0.5 text-xs text-text-subtle">RPE</p>
          </div>
          <div className="rounded-xl bg-surface-raised p-3 text-center">
            <p className="text-xl font-bold text-text">
              {selectedExercise.rest.replace(" min", "")}
            </p>
            <p className="mt-0.5 text-xs text-text-subtle">Repos (min)</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 pb-32">
        {selectedExercise.maxLoad && selectedExercise.maxLoad !== "0" && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/10 p-3.5">
            <Trophy className="h-5 w-5 flex-shrink-0 text-warning-foreground" />
            <div>
              <p className="text-xs font-medium text-warning-emphasis">
                Charge max
              </p>
              <p className="text-base font-bold text-warning-foreground">
                {selectedExercise.maxLoad} kg
              </p>
            </div>
            {lastLoad && (
              <div className="ml-auto text-right">
                <p className="text-xs font-medium text-primary">
                  Dernière fois
                </p>
                <p className="text-base font-bold text-primary-light">
                  {lastLoad} kg
                </p>
              </div>
            )}
          </div>
        )}

        {selectedExercise.notes && (
          <div className="mb-5 rounded-xl border border-border bg-surface-raised p-3.5">
            <p className="mb-1.5 text-xs font-semibold text-text-subtle uppercase tracking-wider">
              Conseils
            </p>
            <p className="text-sm leading-relaxed text-text">
              {selectedExercise.notes}
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold text-text-subtle uppercase tracking-wider">
            Charge utilisée (kg)
          </label>
          <div className="flex gap-2">
            <Select
              value={loadInput}
              onValueChange={(value) => setLoadInput(value)}
            >
              <SelectTrigger className="min-w-0 flex-1">
                <SelectValue placeholder={`Choisir une charge (${placeholder} kg)`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {loadOptions.map((load) => (
                    <SelectItem key={load} value={load}>
                      {load} kg
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLoadInput("")}
              className="flex-shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pt-4 pb-8">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() =>
              previousIndex === null ? onBack() : goToExercise(previousIndex)
            }
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => (nextIndex === null ? saveLoad() : goToExercise(nextIndex))}
          >
            {nextIndex === null ? "Enregistrer" : "Suivant"}
            {nextIndex !== null && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

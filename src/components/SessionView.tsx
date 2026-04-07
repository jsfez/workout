import { ArrowLeft, CheckCircle2, ChevronRight, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sessions } from "@/data/workouts";
import {
  completeSession,
  getLastLoadForExercise,
} from "@/store/workoutStore";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import type { WorkoutStore } from "@/types";

interface SessionViewProps {
  sessionId: string;
  onBack: () => void;
  onSelectExercise: (exerciseIndex: number) => void;
  store: WorkoutStore;
  onStoreChange: () => void;
}

export function SessionView({
  sessionId,
  onBack,
  onSelectExercise,
  store,
  onStoreChange,
}: SessionViewProps) {
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
    onSwipeLeft: () => onSelectExercise(firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex),
  });

  const rpeColor = (rpe: number) => {
    if (rpe >= 9) return "text-danger-foreground bg-danger/10";
    if (rpe >= 8) return "text-warning-foreground bg-warning/10";
    return "text-success-foreground bg-success/10";
  };

  return (
    <div className="flex min-h-svh flex-col bg-background" {...swipeHandlers}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={onBack}
          className="mb-5 flex items-center gap-2 text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour</span>
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-text">{session.label}</h1>
            <p className="mt-0.5 text-sm text-text-muted">
              {session.exercises.length} exercices
            </p>
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success-foreground">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Terminée
            </span>
          )}
        </div>

        {/* Progress */}
        {!isCompleted && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-text-subtle">
              <span>Charges renseignées</span>
              <span>
                {completedExercises}/{session.exercises.length}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${(completedExercises / session.exercises.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Exercises list */}
      <div className="px-5 flex-1 pb-32">
        <div className="flex flex-col gap-2.5">
          {session.exercises.map((ex, idx) => {
            const hasLoad =
              savedLoads[ex.name] !== undefined && savedLoads[ex.name] !== "";
            const lastLoad = getLastLoadForExercise(
              ex.name,
              sessionId,
              allSessionIds,
            );

            return (
              <button
                key={idx}
                onClick={() => onSelectExercise(idx)}
                className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  hasLoad
                    ? "bg-success/5 border-success/15"
                    : "bg-surface-raised border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          hasLoad
                            ? "bg-success text-white"
                            : "bg-surface-muted text-text-subtle"
                        }`}
                      >
                        {hasLoad ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <h3
                        className={`text-sm font-semibold leading-tight ${
                          hasLoad ? "text-text-muted" : "text-text"
                        }`}
                      >
                        {ex.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap ml-8">
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                        {ex.sets}×{ex.reps}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${rpeColor(ex.rpe)}`}
                      >
                        RPE {ex.rpe}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-text-subtle">
                        <Clock className="w-3 h-3" />
                        {ex.rest}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {hasLoad ? (
                      <span className="text-base font-bold text-success-foreground">
                        {savedLoads[ex.name]} kg
                      </span>
                    ) : lastLoad ? (
                      <span className="text-sm font-semibold text-primary-light">
                        {lastLoad} kg
                      </span>
                    ) : ex.programLoad ? (
                      <span className="text-sm font-semibold text-text-muted">
                        {ex.programLoad} kg
                      </span>
                    ) : null}
                    {hasLoad ? (
                      <span className="text-xs text-success-emphasis">Actuel</span>
                    ) : lastLoad ? (
                      <span className="text-xs text-text-faint">Dernière</span>
                    ) : ex.programLoad ? (
                      <span className="text-xs text-text-faint">Programme</span>
                    ) : null}
                    {!hasLoad && (
                      <ChevronRight className="mt-1 h-4 w-4 text-text-faint" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Complete session button */}
      {!isCompleted && (
        <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 bg-gradient-to-t from-background via-background/95 to-transparent px-5 pt-4 pb-8">
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
        </div>
      )}

    </div>
  );
}

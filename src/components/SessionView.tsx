import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Trophy,
  Clock,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sessions } from "@/data/workouts";
import {
  updateLoad,
  completeSession,
  getLastLoadForExercise,
} from "@/store/workoutStore";
import type { Exercise, WorkoutStore } from "@/types";

interface SessionViewProps {
  sessionId: string;
  onBack: () => void;
  store: WorkoutStore;
  onStoreChange: () => void;
}

export function SessionView({
  sessionId,
  onBack,
  store,
  onStoreChange,
}: SessionViewProps) {
  const session = sessions.find((s) => s.id === sessionId)!;
  const log = store.logs.find((l) => l.sessionId === sessionId);
  const isCompleted = log?.completed ?? false;
  const allSessionIds = sessions.map((s) => s.id);
  const savedLoads = log?.loads ?? {};

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [loadInput, setLoadInput] = useState("");

  function openExercise(ex: Exercise) {
    setSelectedExercise(ex);
    setLoadInput(savedLoads[ex.name] ?? "");
  }

  function saveLoad() {
    if (!selectedExercise) return;
    updateLoad(sessionId, selectedExercise.name, loadInput);
    onStoreChange();
    setSelectedExercise(null);
  }

  function handleComplete() {
    completeSession(sessionId);
    onStoreChange();
    onBack();
  }

  const completedExercises = session.exercises.filter(
    (ex) => savedLoads[ex.name] !== undefined && savedLoads[ex.name] !== "",
  ).length;

  const rpeColor = (rpe: number) => {
    if (rpe >= 9) return "text-red-400 bg-red-500/10";
    if (rpe >= 8) return "text-amber-400 bg-amber-500/10";
    return "text-emerald-400 bg-emerald-500/10";
  };

  return (
    <div className="flex flex-col min-h-svh bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour</span>
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">{session.label}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {session.exercises.length} exercices
            </p>
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Terminée
            </span>
          )}
        </div>

        {/* Progress */}
        {!isCompleted && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Charges renseignées</span>
              <span>
                {completedExercises}/{session.exercises.length}
              </span>
            </div>
            <div className="h-1.5 bg-[#2a2a38] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
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
                onClick={() => openExercise(ex)}
                className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  hasLoad
                    ? "bg-emerald-500/5 border-emerald-500/15"
                    : "bg-[#1c1c26] border-[#2a2a38]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          hasLoad
                            ? "bg-emerald-500 text-white"
                            : "bg-[#2a2a38] text-slate-500"
                        }`}
                      >
                        {hasLoad ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <h3
                        className={`text-sm font-semibold leading-tight ${
                          hasLoad ? "text-slate-300" : "text-white"
                        }`}
                      >
                        {ex.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap ml-8">
                      <span className="text-xs text-slate-400 bg-[#2a2a38] px-2 py-0.5 rounded-full">
                        {ex.sets}×{ex.reps}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${rpeColor(ex.rpe)}`}
                      >
                        RPE {ex.rpe}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ex.rest}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {hasLoad ? (
                      <span className="text-base font-bold text-emerald-400">
                        {savedLoads[ex.name]} kg
                      </span>
                    ) : lastLoad ? (
                      <span className="text-sm font-semibold text-indigo-400">
                        {lastLoad} kg
                      </span>
                    ) : ex.programLoad ? (
                      <span className="text-sm font-semibold text-slate-400">
                        {ex.programLoad} kg
                      </span>
                    ) : null}
                    {hasLoad ? (
                      <span className="text-xs text-emerald-600">Actuel</span>
                    ) : lastLoad ? (
                      <span className="text-xs text-slate-600">Dernière</span>
                    ) : ex.programLoad ? (
                      <span className="text-xs text-slate-600">Programme</span>
                    ) : null}
                    {!hasLoad && (
                      <ChevronRight className="w-4 h-4 text-slate-600 mt-1" />
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
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-8 pt-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent">
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

      {/* Exercise detail dialog */}
      <Dialog
        open={!!selectedExercise}
        onOpenChange={(open) => !open && setSelectedExercise(null)}
      >
        <DialogContent>
          {selectedExercise && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedExercise.name}</DialogTitle>
              </DialogHeader>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <div className="bg-[#1c1c26] rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">
                    {selectedExercise.sets}×{selectedExercise.reps}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Séries × Reps</p>
                </div>
                <div className="bg-[#1c1c26] rounded-xl p-3 text-center">
                  <p
                    className={`text-xl font-bold ${
                      selectedExercise.rpe >= 9
                        ? "text-red-400"
                        : selectedExercise.rpe >= 8
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {selectedExercise.rpe}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">RPE</p>
                </div>
                <div className="bg-[#1c1c26] rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">
                    {selectedExercise.rest.replace(" min", "")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Repos (min)</p>
                </div>
              </div>

              {/* Max load */}
              {selectedExercise.maxLoad && selectedExercise.maxLoad !== "0" && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-4">
                  <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-600 font-medium">
                      Charge max
                    </p>
                    <p className="text-base font-bold text-amber-400">
                      {selectedExercise.maxLoad} kg
                    </p>
                  </div>
                  {(() => {
                    const lastLoad = getLastLoadForExercise(
                      selectedExercise.name,
                      sessionId,
                      allSessionIds,
                    );
                    return lastLoad ? (
                      <div className="ml-auto text-right">
                        <p className="text-xs text-indigo-500 font-medium">
                          Dernière fois
                        </p>
                        <p className="text-base font-bold text-indigo-400">
                          {lastLoad} kg
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Notes */}
              {selectedExercise.notes && (
                <div className="bg-[#1c1c26] border border-[#2a2a38] rounded-xl p-3.5 mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Conseils
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedExercise.notes}
                  </p>
                </div>
              )}

              {/* Load input */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Charge utilisée (kg)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={
                      selectedExercise.programLoad ||
                      getLastLoadForExercise(
                        selectedExercise.name,
                        sessionId,
                        allSessionIds,
                      ) ||
                      "0"
                    }
                    value={loadInput}
                    onChange={(e) => setLoadInput(e.target.value)}
                    className="flex-1 bg-[#1c1c26] border border-[#2a2a38] rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLoadInput("")}
                    className="flex-shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={saveLoad}
              >
                Enregistrer
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

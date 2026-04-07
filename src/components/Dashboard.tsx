import {
  Dumbbell,
  CheckCircle2,
  Clock,
  ChevronRight,
  Zap,
  Moon,
  Sun,
} from "lucide-react";
import { sessions } from "@/data/workouts";
import { startSession } from "@/store/workoutStore";
import { formatDate } from "@/lib/utils";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import type { WorkoutStore } from "@/types";

interface DashboardProps {
  onSelectSession: (sessionId: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  store: WorkoutStore;
}

export function Dashboard({
  onSelectSession,
  isDarkMode,
  onToggleTheme,
  store,
}: DashboardProps) {
  const completedIds = new Set(
    store.logs.filter((l) => l.completed).map((l) => l.sessionId),
  );

  const lastCompleted = store.logs
    .filter((l) => l.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const nextIdx = sessions.findIndex((s) => !completedIds.has(s.id));
  const nextSession = nextIdx !== -1 ? sessions[nextIdx] : null;

  const completedCount = completedIds.size;
  const totalCount = sessions.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  function handleStart(sessionId: string) {
    startSession(sessionId);
    onSelectSession(sessionId);
  }

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: () => nextSession && handleStart(nextSession.id),
  });

  // Group sessions by week
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="flex min-h-svh flex-col bg-background" {...swipeHandlers}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="mb-1 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary-light" />
            <span className="text-xs font-semibold text-primary-light uppercase tracking-widest">
              Workout Tracker
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-raised text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            aria-label={isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
        <h1 className="mb-1 text-2xl font-bold text-text">Mon programme</h1>
        <p className="text-sm text-text-muted">
          8 semaines · 3 séances/semaine
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="rounded-2xl border border-border bg-surface-raised p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text">Progression</span>
            <span className="text-sm font-bold text-primary-light">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {lastCompleted && (
            <p className="mt-2 text-xs text-text-subtle">
              Dernière séance : {formatDate(lastCompleted.date)}
            </p>
          )}
        </div>
      </div>

      {/* Next session CTA */}
      {nextSession && (
        <div className="px-5 mb-6">
          <button
            onClick={() => handleStart(nextSession.id)}
            className="w-full rounded-2xl bg-primary p-5 text-left shadow-lg shadow-primary/25 transition-all hover:bg-primary-light active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                  <span className="text-xs font-semibold text-primary-foreground uppercase tracking-wider">
                    Prochaine séance
                  </span>
                </div>
                <p className="text-xl font-bold text-white">
                  {nextSession.label}
                </p>
                <p className="mt-0.5 text-sm text-primary-foreground">
                  {nextSession.exercises.length} exercices
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <ChevronRight className="w-6 h-6 text-white" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Sessions list */}
      <div className="px-5 pb-8 flex-1">
        <h2 className="mb-4 text-xs font-semibold text-text-subtle uppercase tracking-widest">
          Toutes les séances
        </h2>

        <div className="flex flex-col gap-3">
          {weeks.map((week) => {
            const weekSessions = sessions.filter((s) => s.week === week);
            return (
              <div key={week}>
                <p className="mb-2 text-xs font-semibold text-text-faint uppercase tracking-widest">
                  Semaine {week}
                </p>
                <div className="flex flex-col gap-2">
                  {weekSessions.map((session) => {
                    const log = store.logs.find(
                      (l) => l.sessionId === session.id,
                    );
                    const isCompleted = completedIds.has(session.id);
                    const isNext = session.id === nextSession?.id;
                    const isCurrent =
                      store.currentSessionId === session.id && !isCompleted;

                    return (
                      <button
                        key={session.id}
                        onClick={() => handleStart(session.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] text-left ${
                          isCompleted
                            ? "bg-success/5 border-success/20"
                            : isCurrent
                              ? "bg-primary/10 border-primary/30"
                              : isNext
                                ? "bg-surface-raised border-primary/30"
                                : "bg-surface-raised border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? "bg-success/20"
                                : isCurrent
                                  ? "bg-primary/20"
                                  : "bg-surface-muted"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-success-foreground" />
                            ) : isCurrent ? (
                              <Clock className="w-5 h-5 text-primary-light" />
                            ) : (
                              <span className="text-sm font-bold text-text-subtle">
                                #{session.day}
                              </span>
                            )}
                          </div>
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isCompleted ? "text-text-muted" : "text-text"
                              }`}
                            >
                              {session.label}
                            </p>
                            <p className="text-xs text-text-subtle">
                              {log?.date
                                ? formatDate(log.date)
                                : `${session.exercises.length} exercices`}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 ${
                            isCompleted ? "text-text-faint" : "text-text-subtle"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

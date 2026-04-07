import { Dumbbell, CheckCircle2, Clock, ChevronRight, Zap } from "lucide-react";
import { sessions } from "@/data/workouts";
import { startSession } from "@/store/workoutStore";
import { formatDate } from "@/lib/utils";
import type { WorkoutStore } from "@/types";

interface DashboardProps {
  onSelectSession: (sessionId: string) => void;
  store: WorkoutStore;
}

export function Dashboard({ onSelectSession, store }: DashboardProps) {
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

  // Group sessions by week
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col min-h-svh bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
            Workout Tracker
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Mon programme</h1>
        <p className="text-slate-400 text-sm">8 semaines · 3 séances/semaine</p>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="bg-[#1c1c26] rounded-2xl p-4 border border-[#2a2a38]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">
              Progression
            </span>
            <span className="text-sm font-bold text-indigo-400">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="h-2 bg-[#2a2a38] rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {lastCompleted && (
            <p className="text-xs text-slate-500 mt-2">
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
            className="w-full bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] transition-all rounded-2xl p-5 text-left shadow-lg shadow-indigo-500/25"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-4 h-4 text-indigo-200" />
                  <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                    Prochaine séance
                  </span>
                </div>
                <p className="text-xl font-bold text-white">
                  {nextSession.label}
                </p>
                <p className="text-indigo-200 text-sm mt-0.5">
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
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
          Toutes les séances
        </h2>

        <div className="flex flex-col gap-3">
          {weeks.map((week) => {
            const weekSessions = sessions.filter((s) => s.week === week);
            return (
              <div key={week}>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2">
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
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : isCurrent
                              ? "bg-indigo-500/10 border-indigo-500/30"
                              : isNext
                                ? "bg-[#1c1c26] border-indigo-500/30"
                                : "bg-[#1c1c26] border-[#2a2a38]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? "bg-emerald-500/20"
                                : isCurrent
                                  ? "bg-indigo-500/20"
                                  : "bg-[#2a2a38]"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : isCurrent ? (
                              <Clock className="w-5 h-5 text-indigo-400" />
                            ) : (
                              <span className="text-sm font-bold text-slate-500">
                                #{session.day}
                              </span>
                            )}
                          </div>
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isCompleted ? "text-slate-400" : "text-white"
                              }`}
                            >
                              {session.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {log?.date
                                ? formatDate(log.date)
                                : `${session.exercises.length} exercices`}
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 ${
                            isCompleted ? "text-slate-600" : "text-slate-500"
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

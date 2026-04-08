import { Dumbbell } from "lucide-react";
import { sessions } from "@/data/workouts";
import { startSession } from "@/store/workoutStore";
import { formatDate } from "@/lib/utils";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

import { Heading } from "@/components/Heading";
import { SectionHeading } from "@/components/SectionHeading";
import { Subtitle } from "@/components/Subtitle";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { WorkoutStore } from "@/types";
import { ProgressSummary } from "@/components/ProgressSummary";
import { SessionCard, type SessionCardStatus } from "@/components/SessionCard";
import { NextSessionCard } from "@/components/NextSessionCard";
import { FixedPageHeader } from "@/components/PageHeader";
import { Page } from "@/components/Page";

interface DashboardProps {
  onSelectSession: (sessionId: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  store: WorkoutStore;
}

function getSessionStatus(
  sessionId: string,
  completedIds: Set<string>,
  currentSessionId: string | null,
  nextSessionId?: string,
): SessionCardStatus {
  if (completedIds.has(sessionId)) return "completed";
  if (currentSessionId === sessionId) return "current";
  if (nextSessionId === sessionId) return "next";
  return "default";
}

const Brand = () => (
  <div className="flex items-center gap-2">
    <Dumbbell className="h-5 w-5 text-primary-light" />
    <div className="text-xs font-semibold text-primary-light uppercase tracking-widest">
      Workout Tracker
    </div>
  </div>
);

export const Dashboard = ({
  onSelectSession,
  isDarkMode,
  onToggleTheme,
  store,
}: DashboardProps) => {
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
    <Page {...swipeHandlers}>
      <FixedPageHeader>
        <div className="mb-1 flex items-center justify-between gap-4">
          <Brand />
          <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
        </div>
        <Heading className="mb-1">Mon programme</Heading>
        <Subtitle>8 semaines · 3 séances/semaine</Subtitle>
      </FixedPageHeader>

      <ProgressSummary
        completedCount={completedCount}
        totalCount={totalCount}
        progressPct={progressPct}
        lastCompletedLabel={
          lastCompleted ? formatDate(lastCompleted.date) : undefined
        }
        className="mt-36"
      />

      {nextSession && (
        <NextSessionCard session={nextSession} onStart={handleStart} />
      )}

      <div className="pb-8 flex-1">
        <SectionHeading className="mb-4">Toutes les séances</SectionHeading>

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
                      (item) => item.sessionId === session.id,
                    );
                    const status = getSessionStatus(
                      session.id,
                      completedIds,
                      store.currentSessionId,
                      nextSession?.id,
                    );

                    return (
                      <SessionCard
                        key={session.id}
                        day={session.day}
                        label={session.label}
                        meta={
                          log?.date
                            ? formatDate(log.date)
                            : `${session.exercises.length} exercices`
                        }
                        status={status}
                        onClick={() => handleStart(session.id)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Page>
  );
};

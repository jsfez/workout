import { useMemo, useState } from "react";
import { Dumbbell, UserRound } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

import { Heading } from "@/components/Heading";
import { SectionHeading } from "@/components/SectionHeading";
import { Subtitle } from "@/components/Subtitle";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Session, UserProfile, WorkoutProgress } from "@/types";
import { ProgressSummary } from "@/components/ProgressSummary";
import { SessionCard, type SessionCardStatus } from "@/components/SessionCard";
import { NextSessionCard } from "@/components/NextSessionCard";
import { FixedPageHeader } from "@/components/PageHeader";
import { Page } from "@/components/Page";

interface DashboardProps {
  sessions: Session[];
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  progress: WorkoutProgress;
  currentUser: UserProfile;
  onChangeUser: () => void;
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

type SessionFilter = "all" | "completed" | "remaining";

const SESSION_FILTERS: {
  value: SessionFilter;
  label: string;
  getCount: (counts: {
    completedCount: number;
    remainingCount: number;
    totalCount: number;
  }) => number;
}[] = [
  {
    value: "all",
    label: "Toutes",
    getCount: ({ totalCount }) => totalCount,
  },
  {
    value: "completed",
    label: "Terminées",
    getCount: ({ completedCount }) => completedCount,
  },
  {
    value: "remaining",
    label: "Restantes",
    getCount: ({ remainingCount }) => remainingCount,
  },
];

const sessionFilterLabels: Record<SessionFilter, string> = {
  all: "Toutes les séances",
  completed: "Séances terminées",
  remaining: "Séances restantes",
};

function getFilteredSessions(
  sessions: Session[],
  completedIds: Set<string>,
  activeFilter: SessionFilter,
) {
  if (activeFilter === "completed") {
    return sessions.filter((session) => completedIds.has(session.id));
  }

  if (activeFilter === "remaining") {
    return sessions.filter((session) => !completedIds.has(session.id));
  }

  return sessions;
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
  sessions,
  isLoading,
  onSelectSession,
  isDarkMode,
  onToggleTheme,
  progress,
  currentUser,
  onChangeUser,
}: DashboardProps) => {
  const [activeFilter, setActiveFilter] = useState<SessionFilter>("all");
  const completedIds = useMemo(
    () =>
      new Set(
        progress.sessions
          .filter((item) => item.completed)
          .map((item) => item.sessionId),
      ),
    [progress.sessions],
  );

  const lastCompleted = progress.sessions
    .filter((item) => item.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const nextIdx = sessions.findIndex((s) => !completedIds.has(s.id));
  const nextSession = nextIdx !== -1 ? sessions[nextIdx] : null;

  const completedCount = completedIds.size;
  const totalCount = sessions.length;
  const remainingCount = totalCount - completedCount;
  const progressPct =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const filteredSessions = useMemo(
    () => getFilteredSessions(sessions, completedIds, activeFilter),
    [activeFilter, completedIds, sessions],
  );

  function handleStart(sessionId: string) {
    onSelectSession(sessionId);
  }

  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: () => {
      if (nextSession) handleStart(nextSession.id);
    },
  });

  // Group sessions by week
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <>
      <FixedPageHeader>
        <div className="mb-1 flex items-center justify-between gap-4">
          <Brand />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 text-sm font-semibold text-text transition hover:bg-surface-hover"
              onClick={onChangeUser}
            >
              <UserRound className="h-4 w-4 text-primary-light" />
              {currentUser.name}
            </button>
            <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
          </div>
        </div>
        <Heading className="mb-1">Mon programme</Heading>
        <Subtitle>8 semaines · 3 séances/semaine</Subtitle>
      </FixedPageHeader>

      <Page {...swipeHandlers}>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : (
          <>
            <ProgressSummary
              completedCount={completedCount}
              totalCount={totalCount}
              progressPct={progressPct}
              lastCompletedLabel={
                lastCompleted ? formatDate(lastCompleted.date) : undefined
              }
            />

            {nextSession && (
              <NextSessionCard session={nextSession} onStart={handleStart} />
            )}

            <div className="pb-8 flex-1">
              <div className="mb-3 flex items-center justify-between gap-3">
                <SectionHeading>
                  {sessionFilterLabels[activeFilter]}
                </SectionHeading>
                <span className="text-xs font-medium text-text-faint">
                  {filteredSessions.length}/{totalCount}
                </span>
              </div>

              <div
                className="mb-4 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-muted p-1"
                aria-label="Filtrer les séances"
              >
                {SESSION_FILTERS.map((filter) => {
                  const isActive = activeFilter === filter.value;
                  const count = filter.getCount({
                    completedCount,
                    remainingCount,
                    totalCount,
                  });

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      className={cn(
                        "rounded-lg px-2 py-2 text-xs font-semibold transition",
                        isActive
                          ? "bg-surface-raised text-text shadow-sm"
                          : "text-text-subtle hover:bg-surface-hover hover:text-text",
                      )}
                      aria-pressed={isActive}
                      onClick={() => setActiveFilter(filter.value)}
                    >
                      <span>{filter.label}</span>
                      <span className="ml-1 text-text-faint">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-6">
                {weeks.map((week) => {
                  const weekSessions = filteredSessions.filter(
                    (s) => s.week === week,
                  );

                  if (weekSessions.length === 0) return null;

                  return (
                    <div key={week}>
                      <p className="mb-2 text-xs font-semibold text-text-faint uppercase tracking-widest">
                        Semaine {week}
                      </p>

                      <div className="flex flex-col gap-2">
                        {weekSessions.map((session) => {
                          const sessionProgress = progress.sessions.find(
                            (item) => item.sessionId === session.id,
                          );
                          const status = getSessionStatus(
                            session.id,
                            completedIds,
                            progress.currentSessionId,
                            nextSession?.id,
                          );

                          return (
                            <SessionCard
                              key={session.id}
                              day={session.day}
                              label={session.label}
                              meta={
                                sessionProgress?.date
                                  ? formatDate(sessionProgress.date)
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

              {filteredSessions.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-surface-raised px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-text">
                    Aucune séance ici
                  </p>
                  <p className="mt-1 text-sm text-text-subtle">
                    Change de filtre pour retrouver ton programme.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </Page>
    </>
  );
};

import { Dumbbell, UserRound } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
import { Loader } from "@/components/Loader";

function hasStartedSession(
  sessionProgress?: WorkoutProgress["sessions"][number],
): sessionProgress is WorkoutProgress["sessions"][number] {
  return (
    sessionProgress !== undefined &&
    Object.values(sessionProgress.completedExercises).some(Boolean)
  );
}

function getSessionMeta(
  session: Session,
  sessionProgress?: WorkoutProgress["sessions"][number],
): string {
  if (sessionProgress?.completed) {
    return `Completed on ${formatDate(sessionProgress.date)}`;
  }

  if (hasStartedSession(sessionProgress)) {
    return `Started on ${formatDate(sessionProgress.date)}`;
  }

  return `${session.exercises.length} exercises`;
}

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
  sessionProgress: WorkoutProgress["sessions"][number] | undefined,
  sessionId: string,
  completedIds: Set<string>,
  nextSessionId?: string,
): SessionCardStatus {
  if (completedIds.has(sessionId)) return "completed";
  if (hasStartedSession(sessionProgress)) return "current";
  if (nextSessionId === sessionId) return "next";
  return "default";
}

const Brand = () => (
  <div className="flex items-center gap-2">
    <Dumbbell className="text-primary-light h-5 w-5" />
    <div className="text-primary-light text-xs font-semibold tracking-widest uppercase">
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
  const completedIds = new Set(
    progress.sessions
      .filter((item) => item.completed)
      .map((item) => item.sessionId),
  );

  const lastCompleted = progress.sessions
    .filter((item) => item.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const nextIdx = sessions.findIndex((session) => {
    const sessionProgress = progress.sessions.find(
      (item) => item.sessionId === session.id,
    );

    return !completedIds.has(session.id) && !hasStartedSession(sessionProgress);
  });
  const nextSession = nextIdx !== -1 ? sessions[nextIdx] : null;

  const completedCount = completedIds.size;
  const totalCount = sessions.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  function handleStart(sessionId: string) {
    onSelectSession(sessionId);
  }

  // Group sessions by week
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <Page>
      <FixedPageHeader>
        <div className="mb-1 flex items-center justify-between gap-4">
          <Brand />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="border-border bg-surface-raised text-text hover:bg-surface-hover inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition"
              onClick={onChangeUser}
            >
              <UserRound className="text-primary-light h-4 w-4" />
              {currentUser.name}
            </button>
            <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
          </div>
        </div>
        <Heading className="mb-1">My program</Heading>
        <Subtitle>8 weeks · 3 sessions/week</Subtitle>
      </FixedPageHeader>
      {isLoading ? (
        <Loader centered label="Loading your program" />
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

          <div className="flex-1 pb-8">
            <SectionHeading className="mb-3">All sessions</SectionHeading>

            <div className="flex flex-col gap-6">
              {weeks.map((week) => {
                const weekSessions = sessions.filter((s) => s.week === week);

                return (
                  <div key={week}>
                    <p className="text-text-faint mb-2 text-xs font-semibold tracking-widest uppercase">
                      Week {week}
                    </p>

                    <div className="flex flex-col gap-2">
                      {weekSessions.map((session) => {
                        const sessionProgress = progress.sessions.find(
                          (item) => item.sessionId === session.id,
                        );
                        const status = getSessionStatus(
                          sessionProgress,
                          session.id,
                          completedIds,
                          nextSession?.id,
                        );

                        return (
                          <SessionCard
                            key={session.id}
                            day={session.day}
                            label={session.label}
                            meta={getSessionMeta(session, sessionProgress)}
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
        </>
      )}
    </Page>
  );
};

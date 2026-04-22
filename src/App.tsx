import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "@/pages/DashboardPage";
import { ExerciseView } from "@/pages/ExercisePage";
import { ProfileSelectionPage } from "@/pages/ProfileSelectionPage";
import { SessionView } from "@/pages/SessionPage";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/Heading";
import { useWorkoutMutations } from "@/hooks/useWorkoutMutations";
import { useUsersQuery, useWorkoutQueries } from "@/hooks/useWorkoutQueries";
import { Page } from "@/components/Page";
import { PageHeader } from "@/components/PageHeader";
import { Subtitle } from "@/components/Subtitle";
import type { Session, UserProfile } from "@/types";

type AppRoute = {
  sessionId: string | null;
  exerciseIndex: number | null;
};

const dashboardRoute: AppRoute = {
  sessionId: null,
  exerciseIndex: null,
};

const LAST_USER_ID_STORAGE_KEY = "workout-last-user-id";

function parseRoute(pathname: string, sessions: Session[]): AppRoute {
  const [, resource, sessionId, nestedResource, exerciseIndex] =
    pathname.split("/");

  if (resource !== "sessions" || !sessionId) return dashboardRoute;

  const session = sessions.find((item) => item.id === sessionId);

  if (!session) return dashboardRoute;

  if (nestedResource === "exercises") {
    const parsedExerciseIndex = Number(exerciseIndex) - 1;

    return {
      sessionId,
      exerciseIndex:
        Number.isInteger(parsedExerciseIndex) &&
        parsedExerciseIndex >= 0 &&
        parsedExerciseIndex < session.exercises.length
          ? parsedExerciseIndex
          : 0,
    };
  }

  return {
    sessionId,
    exerciseIndex: null,
  };
}

function getRoutePath(route: AppRoute) {
  if (!route.sessionId) return "/";

  if (route.exerciseIndex !== null) {
    return `/sessions/${route.sessionId}/exercises/${route.exerciseIndex + 1}`;
  }

  return `/sessions/${route.sessionId}`;
}

const ErrorState = ({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <Page>
    <PageHeader>
      <Heading className="mb-1">{title}</Heading>
      <Subtitle>{message}</Subtitle>
    </PageHeader>
    <Button type="button" onClick={onAction}>
      {actionLabel}
    </Button>
  </Page>
);

const App = () => {
  const [selectedUserIdState, setSelectedUserIdState] = useState<string | null>(
    () => localStorage.getItem(LAST_USER_ID_STORAGE_KEY),
  );
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem("workout-theme");
    if (storedTheme) return storedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const usersQuery = useUsersQuery();
  const users = usersQuery.data ?? [];
  const selectedUser =
    users.find((user) => user.id === selectedUserIdState) ?? null;
  const selectedUserId = selectedUser?.id ?? null;

  const { sessionsQuery, progressQuery, sessions, progress, isWorkoutLoading } =
    useWorkoutQueries(selectedUserId);

  const {
    createUser,
    startSession,
    updateLoad,
    updateCompletedSets,
    setExerciseCompleted,
    setSessionCompleted,
  } = useWorkoutMutations({
    selectedUserId,
    sessions,
  });

  const navigate = useCallback((nextRoute: AppRoute) => {
    const nextPath = getRoutePath(nextRoute);

    if (nextPath !== window.location.pathname) {
      window.history.pushState(null, "", nextPath);
    }

    setPathname(nextPath);
  }, []);

  const route =
    selectedUserId && sessionsQuery.isSuccess && progressQuery.isSuccess
      ? parseRoute(pathname, sessions)
      : dashboardRoute;

  const handleCreateUser = useCallback(
    (name: string) => createUser(name),
    [createUser],
  );

  const handleStartSession = useCallback(
    (sessionId: string) => {
      if (!selectedUserId) return;

      navigate({ sessionId, exerciseIndex: null });
      void startSession(sessionId);
    },
    [navigate, selectedUserId, startSession],
  );

  const handleUpdateLoad = useCallback(
    (sessionId: string, exerciseName: string, load: string) => {
      return updateLoad(sessionId, exerciseName, load);
    },
    [updateLoad],
  );

  const handleUpdateCompletedSets = useCallback(
    (sessionId: string, exerciseName: string, completedSets: number) => {
      return updateCompletedSets(sessionId, exerciseName, completedSets);
    },
    [updateCompletedSets],
  );

  const handleSetExerciseCompleted = useCallback(
    (sessionId: string, exerciseName: string, completed: boolean) => {
      return setExerciseCompleted(sessionId, exerciseName, completed);
    },
    [setExerciseCompleted],
  );

  const handleSetSessionCompleted = useCallback(
    (sessionId: string, completed: boolean) => {
      return setSessionCompleted(sessionId, completed);
    },
    [setSessionCompleted],
  );

  const handleSelectUser = useCallback((user: UserProfile) => {
    localStorage.setItem(LAST_USER_ID_STORAGE_KEY, user.id);
    setSelectedUserIdState(user.id);
    setPathname("/");
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  }, []);

  const handleChangeUser = useCallback(() => {
    localStorage.removeItem(LAST_USER_ID_STORAGE_KEY);
    setSelectedUserIdState(null);
    setPathname("/");
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("workout-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  if (!selectedUser) {
    if (usersQuery.isError) {
      return (
        <ErrorState
          title="Unable to load profiles"
          message={
            usersQuery.error instanceof Error
              ? usersQuery.error.message
              : "Please try again."
          }
          actionLabel="Retry"
          onAction={() => {
            void usersQuery.refetch();
          }}
        />
      );
    }

    return (
      <ProfileSelectionPage
        users={users}
        isLoading={usersQuery.isPending}
        onCreateUser={handleCreateUser}
        onSelectUser={handleSelectUser}
      />
    );
  }

  if (sessionsQuery.isError || progressQuery.isError) {
    const error =
      sessionsQuery.error instanceof Error
        ? sessionsQuery.error
        : progressQuery.error instanceof Error
          ? progressQuery.error
          : null;

    return (
      <ErrorState
        title="Unable to load your training data"
        message={error?.message ?? "Please try again."}
        actionLabel="Retry"
        onAction={() => {
          void Promise.all([sessionsQuery.refetch(), progressQuery.refetch()]);
        }}
      />
    );
  }

  if (isWorkoutLoading) {
    return (
      <Dashboard
        sessions={sessions}
        isLoading
        onSelectSession={handleStartSession}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((current) => !current)}
        progress={progress}
        currentUser={selectedUser}
        onChangeUser={handleChangeUser}
      />
    );
  }

  if (route.sessionId && route.exerciseIndex !== null) {
    return (
      <ExerciseView
        key={`${route.sessionId}-${route.exerciseIndex}`}
        sessions={sessions}
        sessionId={route.sessionId}
        exerciseIndex={route.exerciseIndex}
        onBack={() => {
          navigate({ sessionId: route.sessionId, exerciseIndex: null });
        }}
        onSelectExercise={(index) => {
          navigate({ sessionId: route.sessionId, exerciseIndex: index });
        }}
        progress={progress}
        onUpdateLoad={handleUpdateLoad}
        onUpdateCompletedSets={handleUpdateCompletedSets}
        onSetExerciseCompleted={handleSetExerciseCompleted}
      />
    );
  }

  if (route.sessionId) {
    return (
      <SessionView
        sessions={sessions}
        sessionId={route.sessionId}
        onBack={() => {
          navigate(dashboardRoute);
        }}
        onSelectExercise={(index) => {
          navigate({ sessionId: route.sessionId, exerciseIndex: index });
        }}
        progress={progress}
        onSetSessionCompleted={handleSetSessionCompleted}
      />
    );
  }

  return (
    <Dashboard
      sessions={sessions}
      isLoading={false}
      onSelectSession={handleStartSession}
      isDarkMode={isDarkMode}
      onToggleTheme={() => setIsDarkMode((current) => !current)}
      progress={progress}
      currentUser={selectedUser}
      onChangeUser={handleChangeUser}
    />
  );
};

export default App;

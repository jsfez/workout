import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dashboard } from "@/pages/DashboardPage";
import { ExerciseView } from "@/pages/ExercisePage";
import { ProfileSelectionPage } from "@/pages/ProfileSelectionPage";
import { SessionView } from "@/pages/SessionPage";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/Heading";
import { Page } from "@/components/Page";
import { PageHeader } from "@/components/PageHeader";
import { Subtitle } from "@/components/Subtitle";
import { queryKeys } from "@/lib/queryKeys";
import {
  emptyProgress,
  getSessions,
  getWorkoutProgress,
  setExerciseCompleted,
  setSessionCompleted,
  startSession,
  updateCompletedSets,
  updateLoad,
} from "./api/workoutProgress";
import { createUser, getUsers } from "./api/users";
import type { Session, UserProfile, WorkoutProgress } from "@/types";

type AppRoute = {
  sessionId: string | null;
  exerciseIndex: number | null;
};

const dashboardRoute: AppRoute = {
  sessionId: null,
  exerciseIndex: null,
};

const LAST_USER_ID_STORAGE_KEY = "workout-last-user-id";

function parseRoute(sessions: Session[]): AppRoute {
  const [, resource, sessionId, nestedResource, exerciseIndex] =
    window.location.pathname.split("/");

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

function nowIso() {
  return new Date().toISOString();
}

function updateSessionProgress(
  progress: WorkoutProgress,
  sessionId: string,
  update: (
    sessionProgress: WorkoutProgress["sessions"][number],
  ) => WorkoutProgress["sessions"][number],
) {
  const currentSessionProgress = progress.sessions.find(
    (item) => item.sessionId === sessionId,
  ) ?? {
    sessionId,
    date: nowIso(),
    loads: {},
    completedSets: {},
    completedExercises: {},
    completed: false,
  };

  const nextSessionProgress = update(currentSessionProgress);
  const hasSessionProgress = progress.sessions.some(
    (item) => item.sessionId === sessionId,
  );

  return {
    ...progress,
    sessions: hasSessionProgress
      ? progress.sessions.map((item) =>
          item.sessionId === sessionId ? nextSessionProgress : item,
        )
      : [...progress.sessions, nextSessionProgress],
  };
}

type ProgressMutationContext = {
  previousProgress: WorkoutProgress;
  queryKey: ReturnType<typeof queryKeys.progress>;
};

type StartSessionVariables = {
  sessionId: string;
};

type UpdateLoadVariables = {
  sessionId: string;
  exerciseName: string;
  load: string;
};

type UpdateCompletedSetsVariables = {
  sessionId: string;
  exerciseName: string;
  completedSets: number;
};

type SetExerciseCompletedVariables = {
  sessionId: string;
  exerciseName: string;
  completed: boolean;
};

type SetSessionCompletedVariables = {
  sessionId: string;
  completed: boolean;
};

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
  const queryClient = useQueryClient();
  const sessionsRef = useRef<Session[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [route, setRoute] = useState<AppRoute>(dashboardRoute);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem("workout-theme");
    if (storedTheme) return storedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const selectedUserId = selectedUser?.id ?? null;

  const usersQuery = useQuery({
    queryKey: queryKeys.users,
    queryFn: getUsers,
  });
  const sessionsQuery = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: getSessions,
    enabled: selectedUserId !== null,
  });
  const progressQuery = useQuery({
    queryKey: selectedUserId
      ? queryKeys.progress(selectedUserId)
      : (["progress", "no-user"] as const),
    queryFn: () => getWorkoutProgress(selectedUserId ?? ""),
    enabled: selectedUserId !== null,
  });

  const users = usersQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];
  const progress = progressQuery.data ?? emptyProgress;
  const isWorkoutLoading =
    selectedUserId !== null &&
    (sessionsQuery.isPending || progressQuery.isPending);

  const navigate = useCallback((nextRoute: AppRoute) => {
    const nextPath = getRoutePath(nextRoute);

    if (nextPath !== window.location.pathname) {
      window.history.pushState(null, "", nextPath);
    }

    setRoute(nextRoute);
  }, []);

  const applyProgressOptimisticUpdate = useCallback(
    async (
      update: (current: WorkoutProgress) => WorkoutProgress,
    ): Promise<ProgressMutationContext | undefined> => {
      if (!selectedUserId) return undefined;

      const queryKey = queryKeys.progress(selectedUserId);
      await queryClient.cancelQueries({ queryKey });

      const previousProgress =
        queryClient.getQueryData<WorkoutProgress>(queryKey) ?? emptyProgress;

      queryClient.setQueryData(queryKey, update(previousProgress));

      return {
        previousProgress,
        queryKey,
      };
    },
    [queryClient, selectedUserId],
  );

  const restoreProgress = useCallback(
    (context?: ProgressMutationContext) => {
      if (!context) return;
      queryClient.setQueryData(context.queryKey, context.previousProgress);
    },
    [queryClient],
  );

  const invalidateProgress = useCallback(() => {
    if (!selectedUserId) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.progress(selectedUserId),
    });
  }, [queryClient, selectedUserId]);

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      queryClient.setQueryData<UserProfile[]>(queryKeys.users, (current = []) =>
        current.some((item) => item.id === user.id) ? current : [...current, user],
      );
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async ({ sessionId }: StartSessionVariables) => {
      if (!selectedUserId) return;
      await startSession(selectedUserId, sessionId);
    },
    onMutate: ({ sessionId }) =>
      applyProgressOptimisticUpdate((current) =>
        updateSessionProgress(
          { ...current, currentSessionId: sessionId },
          sessionId,
          (sessionProgress) => sessionProgress,
        ),
      ),
    onError: (error, _variables, context) => {
      console.warn("Workout progress mutation failed.", error);
      restoreProgress(context);
    },
    onSettled: invalidateProgress,
  });

  const updateLoadMutation = useMutation({
    mutationFn: async ({
      sessionId,
      exerciseName,
      load,
    }: UpdateLoadVariables) => {
      if (!selectedUserId) return;
      await updateLoad(selectedUserId, sessionId, exerciseName, load);
    },
    onMutate: ({ sessionId, exerciseName, load }) =>
      applyProgressOptimisticUpdate((current) =>
        updateSessionProgress(current, sessionId, (sessionProgress) => ({
          ...sessionProgress,
          loads: {
            ...sessionProgress.loads,
            [exerciseName]: load,
          },
        })),
      ),
    onError: (error, _variables, context) => {
      console.warn("Workout progress mutation failed.", error);
      restoreProgress(context);
    },
    onSettled: invalidateProgress,
  });

  const updateCompletedSetsMutation = useMutation({
    mutationFn: async ({
      sessionId,
      exerciseName,
      completedSets,
    }: UpdateCompletedSetsVariables) => {
      if (!selectedUserId) return;
      await updateCompletedSets(
        selectedUserId,
        sessionId,
        exerciseName,
        completedSets,
      );
    },
    onMutate: ({ sessionId, exerciseName, completedSets }) =>
      applyProgressOptimisticUpdate((current) =>
        updateSessionProgress(current, sessionId, (sessionProgress) => ({
          ...sessionProgress,
          completedSets: {
            ...sessionProgress.completedSets,
            [exerciseName]: completedSets,
          },
        })),
      ),
    onError: (error, _variables, context) => {
      console.warn("Workout progress mutation failed.", error);
      restoreProgress(context);
    },
    onSettled: invalidateProgress,
  });

  const setExerciseCompletedMutation = useMutation({
    mutationFn: async ({
      sessionId,
      exerciseName,
      completed,
    }: SetExerciseCompletedVariables) => {
      if (!selectedUserId) return;
      await setExerciseCompleted(
        selectedUserId,
        sessionId,
        exerciseName,
        completed,
      );
    },
    onMutate: ({ sessionId, exerciseName, completed }) =>
      applyProgressOptimisticUpdate((current) =>
        updateSessionProgress(current, sessionId, (sessionProgress) => {
          const session = sessions.find((item) => item.id === sessionId);
          const completedExercises = {
            ...sessionProgress.completedExercises,
            [exerciseName]: completed,
          };
          const allCompleted =
            session?.exercises.every(
              (exercise) => completedExercises[exercise.name],
            ) ?? false;

          return {
            ...sessionProgress,
            date: allCompleted ? nowIso() : sessionProgress.date,
            completed: allCompleted,
            completedExercises,
          };
        }),
      ),
    onError: (error, _variables, context) => {
      console.warn("Workout progress mutation failed.", error);
      restoreProgress(context);
    },
    onSettled: invalidateProgress,
  });

  const setSessionCompletedMutation = useMutation({
    mutationFn: async ({
      sessionId,
      completed,
    }: SetSessionCompletedVariables) => {
      if (!selectedUserId) return;
      await setSessionCompleted(selectedUserId, sessionId, completed);
    },
    onMutate: ({ sessionId, completed }) =>
      applyProgressOptimisticUpdate((current) =>
        updateSessionProgress(current, sessionId, (sessionProgress) => ({
          ...sessionProgress,
          date: completed ? nowIso() : sessionProgress.date,
          completed,
        })),
      ),
    onError: (error, _variables, context) => {
      console.warn("Workout progress mutation failed.", error);
      restoreProgress(context);
    },
    onSettled: invalidateProgress,
  });

  const handleCreateUser = useCallback(
    (name: string) => createUserMutation.mutateAsync(name),
    [createUserMutation],
  );

  const handleStartSession = useCallback(
    (sessionId: string) => {
      if (!selectedUserId) return;

      navigate({ sessionId, exerciseIndex: null });
      void startSessionMutation.mutateAsync({ sessionId });
    },
    [navigate, selectedUserId, startSessionMutation],
  );

  const handleUpdateLoad = useCallback(
    (sessionId: string, exerciseName: string, load: string) => {
      if (!selectedUserId) return Promise.resolve();

      return updateLoadMutation.mutateAsync({ sessionId, exerciseName, load });
    },
    [selectedUserId, updateLoadMutation],
  );

  const handleUpdateCompletedSets = useCallback(
    (sessionId: string, exerciseName: string, completedSets: number) => {
      if (!selectedUserId) return Promise.resolve();

      return updateCompletedSetsMutation.mutateAsync({
        sessionId,
        exerciseName,
        completedSets,
      });
    },
    [selectedUserId, updateCompletedSetsMutation],
  );

  const handleSetExerciseCompleted = useCallback(
    (sessionId: string, exerciseName: string, completed: boolean) => {
      if (!selectedUserId) return Promise.resolve();

      return setExerciseCompletedMutation.mutateAsync({
        sessionId,
        exerciseName,
        completed,
      });
    },
    [selectedUserId, setExerciseCompletedMutation],
  );

  const handleSetSessionCompleted = useCallback(
    (sessionId: string, completed: boolean) => {
      if (!selectedUserId) return Promise.resolve();

      return setSessionCompletedMutation.mutateAsync({
        sessionId,
        completed,
      });
    },
    [selectedUserId, setSessionCompletedMutation],
  );

  const handleSelectUser = useCallback((user: UserProfile) => {
    localStorage.setItem(LAST_USER_ID_STORAGE_KEY, user.id);
    setRoute(dashboardRoute);
    setSelectedUser(user);
  }, []);

  const handleChangeUser = useCallback(() => {
    localStorage.removeItem(LAST_USER_ID_STORAGE_KEY);
    setSelectedUser(null);
    setRoute(dashboardRoute);
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute(sessionsRef.current));

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("workout-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    if (selectedUser || !usersQuery.isSuccess) return;

    const storedUserId = localStorage.getItem(LAST_USER_ID_STORAGE_KEY);

    if (!storedUserId) return;

    const storedUser = users.find((user) => user.id === storedUserId);

    if (storedUser) {
      setSelectedUser(storedUser);
    }
  }, [selectedUser, users, usersQuery.isSuccess]);

  useEffect(() => {
    if (
      !selectedUserId ||
      !sessionsQuery.isSuccess ||
      !progressQuery.isSuccess
    ) {
      return;
    }

    setRoute(parseRoute(sessions));
  }, [
    progressQuery.isSuccess,
    selectedUserId,
    sessions,
    sessionsQuery.isSuccess,
  ]);

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

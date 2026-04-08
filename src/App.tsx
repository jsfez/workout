import { useEffect, useRef, useState, useCallback } from "react";
import { Dashboard } from "@/pages/DashboardPage";
import { ExerciseView } from "@/pages/ExercisePage";
import { SessionView } from "@/pages/SessionPage";
import {
  emptyProgress,
  getWorkoutProgress,
  setExerciseCompleted,
  setSessionCompleted,
  startSession,
  updateCompletedSets,
  updateLoad,
} from "./api/workoutProgress";
import type { WorkoutProgress } from "@/types";
import { sessions } from "@/data/workouts";

type AppRoute = {
  sessionId: string | null;
  exerciseIndex: number | null;
};

const dashboardRoute: AppRoute = {
  sessionId: null,
  exerciseIndex: null,
};

function parseRoute(): AppRoute {
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

const App = () => {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const [progress, setProgress] = useState<WorkoutProgress>(emptyProgress);
  const progressRef = useRef(progress);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem("workout-theme");
    if (storedTheme) return storedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const navigate = useCallback((nextRoute: AppRoute) => {
    const nextPath = getRoutePath(nextRoute);

    if (nextPath !== window.location.pathname) {
      window.history.pushState(null, "", nextPath);
    }

    setRoute(nextRoute);
  }, []);

  const mutateProgress = useCallback(
    async (
      optimisticUpdate: (current: WorkoutProgress) => WorkoutProgress,
      mutation: () => Promise<void>,
    ) => {
      const previousProgress = progressRef.current;
      const nextProgress = optimisticUpdate(previousProgress);

      progressRef.current = nextProgress;
      setProgress(nextProgress);

      try {
        await mutation();
      } catch (error) {
        console.warn("Workout progress mutation failed.", error);
        progressRef.current = previousProgress;
        setProgress(previousProgress);
      }
    },
    [],
  );

  const handleStartSession = useCallback(
    (sessionId: string) => {
      navigate({ sessionId, exerciseIndex: null });
      void mutateProgress(
        (current) =>
          updateSessionProgress(
            { ...current, currentSessionId: sessionId },
            sessionId,
            (sessionProgress) => sessionProgress,
          ),
        () => startSession(sessionId),
      );
    },
    [mutateProgress, navigate],
  );

  const handleUpdateLoad = useCallback(
    (sessionId: string, exerciseName: string, load: string) =>
      mutateProgress(
        (current) =>
          updateSessionProgress(current, sessionId, (sessionProgress) => ({
            ...sessionProgress,
            loads: {
              ...sessionProgress.loads,
              [exerciseName]: load,
            },
          })),
        () => updateLoad(sessionId, exerciseName, load),
      ),
    [mutateProgress],
  );

  const handleUpdateCompletedSets = useCallback(
    (sessionId: string, exerciseName: string, completedSets: number) =>
      mutateProgress(
        (current) =>
          updateSessionProgress(current, sessionId, (sessionProgress) => ({
            ...sessionProgress,
            completedSets: {
              ...sessionProgress.completedSets,
              [exerciseName]: completedSets,
            },
          })),
        () => updateCompletedSets(sessionId, exerciseName, completedSets),
      ),
    [mutateProgress],
  );

  const handleSetExerciseCompleted = useCallback(
    (sessionId: string, exerciseName: string, completed: boolean) =>
      mutateProgress(
        (current) =>
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
        () => setExerciseCompleted(sessionId, exerciseName, completed),
      ),
    [mutateProgress],
  );

  const handleSetSessionCompleted = useCallback(
    (sessionId: string, completed: boolean) =>
      mutateProgress(
        (current) =>
          updateSessionProgress(current, sessionId, (sessionProgress) => ({
            ...sessionProgress,
            date: completed ? nowIso() : sessionProgress.date,
            completed,
          })),
        () => setSessionCompleted(sessionId, completed),
      ),
    [mutateProgress],
  );

  useEffect(() => {
    let isMounted = true;

    void getWorkoutProgress().then((nextProgress) => {
      if (isMounted) {
        progressRef.current = nextProgress;
        setProgress(nextProgress);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute());

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("workout-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  if (route.sessionId && route.exerciseIndex !== null) {
    return (
      <ExerciseView
        key={`${route.sessionId}-${route.exerciseIndex}`}
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
      onSelectSession={handleStartSession}
      isDarkMode={isDarkMode}
      onToggleTheme={() => setIsDarkMode((current) => !current)}
      progress={progress}
    />
  );
};

export default App;

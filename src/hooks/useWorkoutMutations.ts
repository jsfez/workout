import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser as createUserRequest } from "@/api/users";
import {
  emptyProgress,
  setExerciseCompleted as setExerciseCompletedRequest,
  setSessionCompleted as setSessionCompletedRequest,
  startSession as startSessionRequest,
  updateCompletedSets as updateCompletedSetsRequest,
  updateLoad as updateLoadRequest,
} from "@/api/workoutProgress";
import { queryKeys } from "@/lib/queryKeys";
import type { Session, UserProfile, WorkoutProgress } from "@/types";

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

export function useWorkoutMutations({
  selectedUserId,
  sessions,
}: {
  selectedUserId: string | null;
  sessions: Session[];
}) {
  const queryClient = useQueryClient();

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
    mutationFn: createUserRequest,
    onSuccess: (user) => {
      queryClient.setQueryData<UserProfile[]>(
        queryKeys.users,
        (current = []) =>
          current.some((item) => item.id === user.id)
            ? current
            : [...current, user],
      );
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async ({ sessionId }: StartSessionVariables) => {
      if (!selectedUserId) return;
      await startSessionRequest(selectedUserId, sessionId);
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
      await updateLoadRequest(selectedUserId, sessionId, exerciseName, load);
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
      await updateCompletedSetsRequest(
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
      await setExerciseCompletedRequest(
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
      await setSessionCompletedRequest(selectedUserId, sessionId, completed);
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

  const createUser = useCallback(
    (name: string) => createUserMutation.mutateAsync(name),
    [createUserMutation],
  );

  const startSession = useCallback(
    (sessionId: string) => {
      if (!selectedUserId) return Promise.resolve();

      return startSessionMutation.mutateAsync({ sessionId });
    },
    [selectedUserId, startSessionMutation],
  );

  const updateLoad = useCallback(
    (sessionId: string, exerciseName: string, load: string) => {
      if (!selectedUserId) return Promise.resolve();

      return updateLoadMutation.mutateAsync({ sessionId, exerciseName, load });
    },
    [selectedUserId, updateLoadMutation],
  );

  const updateCompletedSets = useCallback(
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

  const setExerciseCompleted = useCallback(
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

  const setSessionCompleted = useCallback(
    (sessionId: string, completed: boolean) => {
      if (!selectedUserId) return Promise.resolve();

      return setSessionCompletedMutation.mutateAsync({
        sessionId,
        completed,
      });
    },
    [selectedUserId, setSessionCompletedMutation],
  );

  return {
    createUser,
    startSession,
    updateLoad,
    updateCompletedSets,
    setExerciseCompleted,
    setSessionCompleted,
  };
}

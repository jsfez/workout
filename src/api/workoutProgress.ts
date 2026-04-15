import type { Session, WorkoutProgress } from "../types";

type ProgressAction =
  | { type: "startSession"; userId: string; sessionId: string }
  | {
      type: "updateLoad";
      userId: string;
      sessionId: string;
      exerciseName: string;
      load: string;
    }
  | {
      type: "updateCompletedSets";
      userId: string;
      sessionId: string;
      exerciseName: string;
      completedSets: number;
    }
  | {
      type: "setExerciseCompleted";
      userId: string;
      sessionId: string;
      exerciseName: string;
      completed: boolean;
    }
  | {
      type: "setSessionCompleted";
      userId: string;
      sessionId: string;
      completed: boolean;
    };

export async function getSessions(): Promise<Session[]> {
  try {
    const response = await fetch("/api/sessions");

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Sessions request failed with status ${response.status}: ${errorBody}`,
      );
    }

    return response.json() as Promise<Session[]>;
  } catch (error) {
    console.warn("Sessions request failed.", error);
    return [];
  }
}

export const emptyProgress: WorkoutProgress = {
  sessions: [],
  currentSessionId: null,
};

export async function getWorkoutProgress(
  userId: string,
): Promise<WorkoutProgress> {
  try {
    const response = await fetch(
      `/api/progress?userId=${encodeURIComponent(userId)}`,
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Progress request failed with status ${response.status}: ${errorBody}`,
      );
    }

    return response.json() as Promise<WorkoutProgress>;
  } catch (error) {
    console.warn("Workout progress request failed.", error);
    return emptyProgress;
  }
}

async function sendProgressAction(action: ProgressAction): Promise<void> {
  const response = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Progress request failed with status ${response.status}: ${errorBody}`,
    );
  }
}

export function startSession(userId: string, sessionId: string): Promise<void> {
  return sendProgressAction({ type: "startSession", userId, sessionId });
}

export function updateLoad(
  userId: string,
  sessionId: string,
  exerciseName: string,
  load: string,
): Promise<void> {
  return sendProgressAction({
    type: "updateLoad",
    userId,
    sessionId,
    exerciseName,
    load,
  });
}

export function updateCompletedSets(
  userId: string,
  sessionId: string,
  exerciseName: string,
  completedSets: number,
): Promise<void> {
  return sendProgressAction({
    type: "updateCompletedSets",
    userId,
    sessionId,
    exerciseName,
    completedSets,
  });
}

export function setExerciseCompleted(
  userId: string,
  sessionId: string,
  exerciseName: string,
  completed: boolean,
): Promise<void> {
  return sendProgressAction({
    type: "setExerciseCompleted",
    userId,
    sessionId,
    exerciseName,
    completed,
  });
}

export function setSessionCompleted(
  userId: string,
  sessionId: string,
  completed: boolean,
): Promise<void> {
  return sendProgressAction({
    type: "setSessionCompleted",
    userId,
    sessionId,
    completed,
  });
}

export function getLastLoadForExercise(
  progress: WorkoutProgress,
  exerciseName: string,
  beforeSessionId: string,
  allSessionIds: string[],
): string | null {
  const idx = allSessionIds.indexOf(beforeSessionId);

  for (let i = idx - 1; i >= 0; i--) {
    const sessionProgress = progress.sessions.find(
      (item) => item.sessionId === allSessionIds[i],
    );

    if (sessionProgress?.loads[exerciseName]) {
      return sessionProgress.loads[exerciseName];
    }
  }

  return null;
}

import type { IncomingMessage, ServerResponse } from "node:http";
import { prisma } from "./_prisma.ts";
import type {
  SessionProgressSnapshot,
  WorkoutProgress,
} from "../src/types/index.ts";

type ProgressAction =
  | { type: "startSession"; sessionId: string }
  | { type: "updateLoad"; sessionId: string; exerciseName: string; load: string }
  | {
      type: "updateCompletedSets";
      sessionId: string;
      exerciseName: string;
      completedSets: number;
    }
  | {
      type: "setExerciseCompleted";
      sessionId: string;
      exerciseName: string;
      completed: boolean;
    }
  | { type: "setSessionCompleted"; sessionId: string; completed: boolean };

type SessionProgressRow = {
  session: {
    sourceId: string;
  };
  startedAt: Date;
  completedAt: Date | null;
  completed: boolean;
  exercises: Array<{
    load: { toString(): string } | null;
    completedSets: number;
    completed: boolean;
    sessionExercise: {
      exercise: {
        name: string;
      };
    };
  }>;
};

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function sendNoContent(res: ServerResponse) {
  res.statusCode = 204;
  res.end();
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function toSessionProgressSnapshot(
  progress: SessionProgressRow,
): SessionProgressSnapshot {
  return progress.exercises.reduce<SessionProgressSnapshot>(
    (snapshot, exerciseProgress) => {
      const exerciseName = exerciseProgress.sessionExercise.exercise.name;

      if (exerciseProgress.load !== null) {
        snapshot.loads[exerciseName] = exerciseProgress.load.toString();
      }

      snapshot.completedSets[exerciseName] = exerciseProgress.completedSets;
      snapshot.completedExercises[exerciseName] = exerciseProgress.completed;

      return snapshot;
    },
    {
      sessionId: progress.session.sourceId,
      date: (progress.completedAt ?? progress.startedAt).toISOString(),
      loads: {},
      completedSets: {},
      completedExercises: {},
      completed: progress.completed,
    },
  );
}

async function getWorkoutProgress(): Promise<WorkoutProgress> {
  const [state, progressRows] = await Promise.all([
    prisma.workoutState.findUnique({
      where: { id: "default" },
      include: { currentSession: true },
    }),
    prisma.sessionProgress.findMany({
      include: {
        session: true,
        exercises: {
          include: {
            sessionExercise: {
              include: {
                exercise: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  return {
    currentSessionId: state?.currentSession?.sourceId ?? null,
    sessions: progressRows.map(toSessionProgressSnapshot),
  };
}

async function getSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { sourceId: sessionId },
    include: { exercises: { orderBy: { position: "asc" } } },
  });

  if (!session) {
    throw new Error(`Session ${sessionId} was not found. Did you run the seed?`);
  }

  return session;
}

async function getSessionExercise(sessionId: string, exerciseName: string) {
  const sessionExercise = await prisma.sessionExercise.findFirst({
    where: {
      session: { sourceId: sessionId },
      exercise: { name: exerciseName },
    },
    include: {
      session: { include: { exercises: true } },
      exercise: true,
    },
  });

  if (!sessionExercise) {
    throw new Error(
      `Exercise ${exerciseName} was not found in session ${sessionId}.`,
    );
  }

  return sessionExercise;
}

async function ensureSessionProgress(sessionId: string) {
  const session = await getSession(sessionId);

  return prisma.sessionProgress.upsert({
    where: { sessionId: session.id },
    create: { sessionId: session.id },
    update: {},
  });
}

async function startSession(sessionId: string) {
  const session = await getSession(sessionId);

  await prisma.$transaction([
    prisma.sessionProgress.upsert({
      where: { sessionId: session.id },
      create: { sessionId: session.id },
      update: {},
    }),
    prisma.workoutState.upsert({
      where: { id: "default" },
      create: { id: "default", currentSessionId: session.id },
      update: { currentSessionId: session.id },
    }),
  ]);
}

async function updateLoad(
  sessionId: string,
  exerciseName: string,
  load: string,
) {
  const [sessionProgress, sessionExercise] = await Promise.all([
    ensureSessionProgress(sessionId),
    getSessionExercise(sessionId, exerciseName),
  ]);

  await prisma.exerciseProgress.upsert({
    where: { sessionExerciseId: sessionExercise.id },
    create: {
      sessionExerciseId: sessionExercise.id,
      sessionProgressId: sessionProgress.sessionId,
      load: load.trim() === "" ? null : load,
    },
    update: {
      load: load.trim() === "" ? null : load,
    },
  });
}

async function updateCompletedSets(
  sessionId: string,
  exerciseName: string,
  completedSets: number,
) {
  const [sessionProgress, sessionExercise] = await Promise.all([
    ensureSessionProgress(sessionId),
    getSessionExercise(sessionId, exerciseName),
  ]);

  await prisma.exerciseProgress.upsert({
    where: { sessionExerciseId: sessionExercise.id },
    create: {
      sessionExerciseId: sessionExercise.id,
      sessionProgressId: sessionProgress.sessionId,
      completedSets,
    },
    update: {
      completedSets,
    },
  });
}

async function setSessionCompleted(sessionId: string, completed: boolean) {
  const session = await getSession(sessionId);

  await prisma.sessionProgress.upsert({
    where: { sessionId: session.id },
    create: {
      sessionId: session.id,
      completed,
      completedAt: completed ? new Date() : null,
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });
}

async function setExerciseCompleted(
  sessionId: string,
  exerciseName: string,
  completed: boolean,
) {
  const [sessionProgress, sessionExercise] = await Promise.all([
    ensureSessionProgress(sessionId),
    getSessionExercise(sessionId, exerciseName),
  ]);

  const completedAt = completed ? new Date() : null;

  await prisma.exerciseProgress.upsert({
    where: { sessionExerciseId: sessionExercise.id },
    create: {
      sessionExerciseId: sessionExercise.id,
      sessionProgressId: sessionProgress.sessionId,
      completed,
      completedAt,
    },
    update: {
      completed,
      completedAt,
    },
  });

  const completedCount = await prisma.exerciseProgress.count({
    where: {
      sessionProgressId: sessionProgress.sessionId,
      completed: true,
    },
  });

  const allCompleted =
    completedCount === sessionExercise.session.exercises.length;

  await prisma.sessionProgress.update({
    where: { sessionId: sessionProgress.sessionId },
    data: {
      completed: allCompleted,
      completedAt: allCompleted ? new Date() : null,
    },
  });
}

async function runAction(action: ProgressAction) {
  switch (action.type) {
    case "startSession":
      await startSession(action.sessionId);
      return;
    case "updateLoad":
      await updateLoad(action.sessionId, action.exerciseName, action.load);
      return;
    case "updateCompletedSets":
      await updateCompletedSets(
        action.sessionId,
        action.exerciseName,
        action.completedSets,
      );
      return;
    case "setExerciseCompleted":
      await setExerciseCompleted(
        action.sessionId,
        action.exerciseName,
        action.completed,
      );
      return;
    case "setSessionCompleted":
      await setSessionCompleted(action.sessionId, action.completed);
      return;
    default:
      throw new Error("Unsupported progress action.");
  }
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    if (req.method === "GET") {
      sendJson(res, 200, await getWorkoutProgress());
      return;
    }

    if (req.method === "POST") {
      const body = (await readJsonBody(req)) as ProgressAction;
      await runAction(body);
      sendNoContent(res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

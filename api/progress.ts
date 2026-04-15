import type { IncomingMessage, ServerResponse } from "node:http";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type {
  SessionProgressSnapshot,
  WorkoutProgress,
} from "../src/types/index";

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

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

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

function getUserIdFromRequest(req: IncomingMessage) {
  const url = new URL(req.url ?? "", "http://localhost");
  const userId = url.searchParams.get("userId");

  if (!userId) {
    throw new Error("userId is required.");
  }

  return userId;
}

async function ensureUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error(`User ${userId} was not found.`);
  }

  return user;
}

async function getWorkoutProgress(userId: string): Promise<WorkoutProgress> {
  await ensureUser(userId);

  const [state, progressRows] = await Promise.all([
    prisma.workoutState.findUnique({
      where: { userId },
      include: { currentSession: true },
    }),
    prisma.sessionProgress.findMany({
      where: { userId },
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
    throw new Error(
      `Session ${sessionId} was not found. Did you run the seed?`,
    );
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

async function ensureSessionProgress(userId: string, sessionId: string) {
  const session = await getSession(sessionId);

  return prisma.sessionProgress.upsert({
    where: {
      userId_sessionId: {
        userId,
        sessionId: session.id,
      },
    },
    create: { userId, sessionId: session.id },
    update: {},
  });
}

async function startSession(userId: string, sessionId: string) {
  await ensureUser(userId);
  const session = await getSession(sessionId);

  await prisma.$transaction([
    prisma.sessionProgress.upsert({
      where: {
        userId_sessionId: {
          userId,
          sessionId: session.id,
        },
      },
      create: { userId, sessionId: session.id },
      update: {},
    }),
    prisma.workoutState.upsert({
      where: { userId },
      create: {
        id: `state_${userId}`,
        userId,
        currentSessionId: session.id,
      },
      update: { currentSessionId: session.id },
    }),
  ]);
}

async function updateLoad(
  userId: string,
  sessionId: string,
  exerciseName: string,
  load: string,
) {
  const [sessionProgress, sessionExercise] = await Promise.all([
    ensureSessionProgress(userId, sessionId),
    getSessionExercise(sessionId, exerciseName),
  ]);

  await prisma.exerciseProgress.upsert({
    where: {
      sessionProgressId_sessionExerciseId: {
        sessionProgressId: sessionProgress.id,
        sessionExerciseId: sessionExercise.id,
      },
    },
    create: {
      sessionExerciseId: sessionExercise.id,
      sessionProgressId: sessionProgress.id,
      load: load.trim() === "" ? null : load,
    },
    update: {
      load: load.trim() === "" ? null : load,
    },
  });
}

async function updateCompletedSets(
  userId: string,
  sessionId: string,
  exerciseName: string,
  completedSets: number,
) {
  const [sessionProgress, sessionExercise] = await Promise.all([
    ensureSessionProgress(userId, sessionId),
    getSessionExercise(sessionId, exerciseName),
  ]);

  await prisma.exerciseProgress.upsert({
    where: {
      sessionProgressId_sessionExerciseId: {
        sessionProgressId: sessionProgress.id,
        sessionExerciseId: sessionExercise.id,
      },
    },
    create: {
      sessionExerciseId: sessionExercise.id,
      sessionProgressId: sessionProgress.id,
      completedSets,
    },
    update: {
      completedSets,
    },
  });
}

async function setSessionCompleted(
  userId: string,
  sessionId: string,
  completed: boolean,
) {
  await ensureUser(userId);
  const session = await getSession(sessionId);

  await prisma.sessionProgress.upsert({
    where: {
      userId_sessionId: {
        userId,
        sessionId: session.id,
      },
    },
    create: {
      userId,
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
  userId: string,
  sessionId: string,
  exerciseName: string,
  completed: boolean,
) {
  const [sessionProgress, sessionExercise] = await Promise.all([
    ensureSessionProgress(userId, sessionId),
    getSessionExercise(sessionId, exerciseName),
  ]);

  const completedAt = completed ? new Date() : null;

  await prisma.exerciseProgress.upsert({
    where: {
      sessionProgressId_sessionExerciseId: {
        sessionProgressId: sessionProgress.id,
        sessionExerciseId: sessionExercise.id,
      },
    },
    create: {
      sessionExerciseId: sessionExercise.id,
      sessionProgressId: sessionProgress.id,
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
      sessionProgressId: sessionProgress.id,
      completed: true,
    },
  });

  const allCompleted =
    completedCount === sessionExercise.session.exercises.length;

  await prisma.sessionProgress.update({
    where: { id: sessionProgress.id },
    data: {
      completed: allCompleted,
      completedAt: allCompleted ? new Date() : null,
    },
  });
}

async function runAction(action: ProgressAction) {
  switch (action.type) {
    case "startSession":
      await startSession(action.userId, action.sessionId);
      return;
    case "updateLoad":
      await updateLoad(
        action.userId,
        action.sessionId,
        action.exerciseName,
        action.load,
      );
      return;
    case "updateCompletedSets":
      await updateCompletedSets(
        action.userId,
        action.sessionId,
        action.exerciseName,
        action.completedSets,
      );
      return;
    case "setExerciseCompleted":
      await setExerciseCompleted(
        action.userId,
        action.sessionId,
        action.exerciseName,
        action.completed,
      );
      return;
    case "setSessionCompleted":
      await setSessionCompleted(
        action.userId,
        action.sessionId,
        action.completed,
      );
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
      sendJson(res, 200, await getWorkoutProgress(getUserIdFromRequest(req)));
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

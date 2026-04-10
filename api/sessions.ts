import type { IncomingMessage, ServerResponse } from "node:http";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { Session } from "../src/types/index";

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

async function getSessions(): Promise<Session[]> {
  const dbSessions = await prisma.session.findMany({
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { position: "asc" },
      },
    },
    orderBy: [{ week: "asc" }, { day: "asc" }],
  });

  return dbSessions.map((s) => ({
    id: s.sourceId,
    label: s.label,
    week: s.week,
    day: s.day,
    exercises: s.exercises.map((se) => ({
      name: se.exercise.name,
      sets: se.sets,
      reps: se.reps,
      rpe: Number(se.rpe),
      rest: se.rest,
      programLoad: se.programLoad?.toString() ?? "",
      maxLoad: se.exercise.maxLoad.toString(),
      notes: se.notes,
    })),
  }));
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    if (req.method === "GET") {
      sendJson(res, 200, await getSessions());
      return;
    }
    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

import type { IncomingMessage, ServerResponse } from "node:http";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import type { UserProfile } from "../src/types/index";

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

function toUserProfile(user: { id: string; name: string }): UserProfile {
  return {
    id: user.id,
    name: user.name,
  };
}

function createUserId(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `user_${slug || Date.now()}`;
}

async function getUsers(): Promise<UserProfile[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return users.map(toUserProfile);
}

async function createUser(name: string): Promise<UserProfile> {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("User name is required.");
  }

  const user = await prisma.user.create({
    data: {
      id: createUserId(normalizedName),
      name: normalizedName,
    },
  });

  return toUserProfile(user);
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    if (req.method === "GET") {
      sendJson(res, 200, await getUsers());
      return;
    }

    if (req.method === "POST") {
      const body = (await readJsonBody(req)) as { name?: string };
      sendJson(res, 201, await createUser(body.name ?? ""));
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { sessions } from "../src/data/workouts-initial.ts";

const PROGRAM_SLUG = "initial-workout";
const PROGRAM_NAME = "Initial Workout";
const INITIAL_USERS = [
  { id: "user_jeremy", name: "Jeremy" },
  { id: "user_solal", name: "Solal" },
];

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function decimalOrNull(value: string) {
  return value.trim() === "" ? null : value;
}

async function main() {
  for (const user of INITIAL_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: { name: user.name },
    });
  }

  const program = await prisma.program.upsert({
    where: { slug: PROGRAM_SLUG },
    create: {
      slug: PROGRAM_SLUG,
      name: PROGRAM_NAME,
    },
    update: {
      name: PROGRAM_NAME,
    },
  });

  for (const session of sessions) {
    const savedSession = await prisma.session.upsert({
      where: { sourceId: session.id },
      create: {
        sourceId: session.id,
        label: session.label,
        week: session.week,
        day: session.day,
        programId: program.id,
      },
      update: {
        label: session.label,
        week: session.week,
        day: session.day,
        programId: program.id,
      },
    });

    for (const [index, exercise] of session.exercises.entries()) {
      const savedExercise = await prisma.exercise.upsert({
        where: { name: exercise.name },
        create: {
          name: exercise.name,
          maxLoad: exercise.maxLoad,
        },
        update: {
          maxLoad: exercise.maxLoad,
        },
      });

      await prisma.sessionExercise.upsert({
        where: {
          sessionId_position: {
            sessionId: savedSession.id,
            position: index + 1,
          },
        },
        create: {
          sessionId: savedSession.id,
          exerciseId: savedExercise.id,
          position: index + 1,
          sets: exercise.sets,
          reps: String(exercise.reps),
          rpe: exercise.rpe,
          rest: exercise.rest,
          programLoad: decimalOrNull(exercise.programLoad),
          notes: exercise.notes,
        },
        update: {
          exerciseId: savedExercise.id,
          sets: exercise.sets,
          reps: String(exercise.reps),
          rpe: exercise.rpe,
          rest: exercise.rest,
          programLoad: decimalOrNull(exercise.programLoad),
          notes: exercise.notes,
        },
      });
    }
  }

  console.log(
    `Seeded ${sessions.length} sessions and ${sessions.reduce(
      (count, session) => count + session.exercises.length,
      0,
    )} session exercises.`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}

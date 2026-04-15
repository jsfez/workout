-- Create users first so existing workout progress can be assigned to Jeremy.
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

INSERT INTO "users" ("id", "name")
VALUES ('user_jeremy', 'Jeremy'), ('user_solal', 'Solal')
ON CONFLICT ("id") DO NOTHING;

-- Workout state is now scoped to a user.
ALTER TABLE "WorkoutState" ADD COLUMN "userId" TEXT;

UPDATE "WorkoutState"
SET "userId" = 'user_jeremy'
WHERE "userId" IS NULL;

ALTER TABLE "WorkoutState" ALTER COLUMN "userId" SET NOT NULL;

CREATE UNIQUE INDEX "WorkoutState_userId_key" ON "WorkoutState"("userId");

ALTER TABLE "WorkoutState"
ADD CONSTRAINT "WorkoutState_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Session progress used sessionId as the primary key, so replace it with a
-- generated row id and make the user/session pair unique.
ALTER TABLE "SessionProgress" ADD COLUMN "id" TEXT;
ALTER TABLE "SessionProgress" ADD COLUMN "userId" TEXT;

UPDATE "SessionProgress"
SET
  "id" = 'session_progress_' || "sessionId",
  "userId" = 'user_jeremy'
WHERE "id" IS NULL OR "userId" IS NULL;

ALTER TABLE "ExerciseProgress" DROP CONSTRAINT "ExerciseProgress_sessionProgressId_fkey";
ALTER TABLE "SessionProgress" DROP CONSTRAINT "SessionProgress_pkey";

ALTER TABLE "SessionProgress" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "SessionProgress" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "SessionProgress" ADD CONSTRAINT "SessionProgress_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "SessionProgress_userId_sessionId_key" ON "SessionProgress"("userId", "sessionId");
CREATE INDEX "SessionProgress_sessionId_idx" ON "SessionProgress"("sessionId");

ALTER TABLE "SessionProgress"
ADD CONSTRAINT "SessionProgress_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Exercise progress also needs to be per session-progress row instead of per
-- exercise globally.
ALTER TABLE "ExerciseProgress" ADD COLUMN "id" TEXT;

UPDATE "ExerciseProgress" AS ep
SET
  "id" = 'exercise_progress_' || ep."sessionExerciseId",
  "sessionProgressId" = sp."id"
FROM "SessionProgress" AS sp
WHERE ep."sessionProgressId" = sp."sessionId";

ALTER TABLE "ExerciseProgress" DROP CONSTRAINT "ExerciseProgress_pkey";
ALTER TABLE "ExerciseProgress" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "ExerciseProgress_sessionProgressId_sessionExerciseId_key"
ON "ExerciseProgress"("sessionProgressId", "sessionExerciseId");

CREATE INDEX "ExerciseProgress_sessionExerciseId_idx" ON "ExerciseProgress"("sessionExerciseId");

ALTER TABLE "ExerciseProgress"
ADD CONSTRAINT "ExerciseProgress_sessionProgressId_fkey"
FOREIGN KEY ("sessionProgressId") REFERENCES "SessionProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

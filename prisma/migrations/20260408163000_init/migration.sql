-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxLoad" DECIMAL(6,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionExercise" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "rpe" DECIMAL(3,1) NOT NULL,
    "rest" TEXT NOT NULL,
    "programLoad" DECIMAL(6,2),
    "notes" TEXT NOT NULL,

    CONSTRAINT "SessionExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutState" (
    "id" TEXT NOT NULL,
    "currentSessionId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionProgress" (
    "sessionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionProgress_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "ExerciseProgress" (
    "sessionExerciseId" TEXT NOT NULL,
    "sessionProgressId" TEXT NOT NULL,
    "load" DECIMAL(6,2),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseProgress_pkey" PRIMARY KEY ("sessionExerciseId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sourceId_key" ON "Session"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_programId_week_day_key" ON "Session"("programId", "week", "day");

-- CreateIndex
CREATE INDEX "Session_week_day_idx" ON "Session"("week", "day");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SessionExercise_sessionId_position_key" ON "SessionExercise"("sessionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "SessionExercise_sessionId_exerciseId_key" ON "SessionExercise"("sessionId", "exerciseId");

-- CreateIndex
CREATE INDEX "SessionExercise_exerciseId_idx" ON "SessionExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "SessionProgress_completed_idx" ON "SessionProgress"("completed");

-- CreateIndex
CREATE INDEX "ExerciseProgress_sessionProgressId_idx" ON "ExerciseProgress"("sessionProgressId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutState" ADD CONSTRAINT "WorkoutState_currentSessionId_fkey" FOREIGN KEY ("currentSessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionProgress" ADD CONSTRAINT "SessionProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "SessionExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseProgress" ADD CONSTRAINT "ExerciseProgress_sessionProgressId_fkey" FOREIGN KEY ("sessionProgressId") REFERENCES "SessionProgress"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

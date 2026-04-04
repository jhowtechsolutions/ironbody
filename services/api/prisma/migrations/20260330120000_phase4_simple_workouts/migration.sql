-- CreateTable
CREATE TABLE "SimpleWorkout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimpleWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimpleWorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "rest" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SimpleWorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentWorkout" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SimpleWorkout_personalId_idx" ON "SimpleWorkout"("personalId");

-- CreateIndex
CREATE INDEX "SimpleWorkoutExercise_workoutId_idx" ON "SimpleWorkoutExercise"("workoutId");

-- CreateIndex
CREATE INDEX "StudentWorkout_studentId_idx" ON "StudentWorkout"("studentId");

-- CreateIndex
CREATE INDEX "StudentWorkout_workoutId_idx" ON "StudentWorkout"("workoutId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentWorkout_studentId_workoutId_key" ON "StudentWorkout"("studentId", "workoutId");

-- AddForeignKey
ALTER TABLE "SimpleWorkout" ADD CONSTRAINT "SimpleWorkout_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimpleWorkoutExercise" ADD CONSTRAINT "SimpleWorkoutExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "SimpleWorkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentWorkout" ADD CONSTRAINT "StudentWorkout_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentWorkout" ADD CONSTRAINT "StudentWorkout_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "SimpleWorkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

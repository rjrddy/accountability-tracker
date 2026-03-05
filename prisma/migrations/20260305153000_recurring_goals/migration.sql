-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "GoalSeries" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "recurrenceType" "RecurrenceType" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "dayOfMonth" INTEGER,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalOccurrenceOverride" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "overrideText" TEXT,
    "isSkipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalOccurrenceOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalCompletion" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "seriesId" TEXT,
    "goalId" TEXT,
    "date" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GoalCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalSeries_uid_startDate_idx" ON "GoalSeries"("uid", "startDate");

-- CreateIndex
CREATE INDEX "GoalSeries_uid_recurrenceType_idx" ON "GoalSeries"("uid", "recurrenceType");

-- CreateIndex
CREATE UNIQUE INDEX "GoalOccurrenceOverride_seriesId_date_key" ON "GoalOccurrenceOverride"("seriesId", "date");

-- CreateIndex
CREATE INDEX "GoalOccurrenceOverride_uid_date_idx" ON "GoalOccurrenceOverride"("uid", "date");

-- CreateIndex
CREATE UNIQUE INDEX "GoalCompletion_uid_date_seriesId_key" ON "GoalCompletion"("uid", "date", "seriesId");

-- CreateIndex
CREATE INDEX "GoalCompletion_uid_date_idx" ON "GoalCompletion"("uid", "date");

-- AddForeignKey
ALTER TABLE "GoalSeries" ADD CONSTRAINT "GoalSeries_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalOccurrenceOverride" ADD CONSTRAINT "GoalOccurrenceOverride_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "GoalSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalOccurrenceOverride" ADD CONSTRAINT "GoalOccurrenceOverride_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalCompletion" ADD CONSTRAINT "GoalCompletion_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalCompletion" ADD CONSTRAINT "GoalCompletion_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "GoalSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalCompletion" ADD CONSTRAINT "GoalCompletion_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

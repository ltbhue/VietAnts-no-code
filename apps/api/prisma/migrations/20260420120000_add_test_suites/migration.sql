-- CreateTable
CREATE TABLE "TestSuite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestSuite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSuiteItem" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "testCaseVersionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TestSuiteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuiteRun" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "environment" TEXT,
    "results" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "trigger" TEXT,
    "buildId" TEXT,
    "commitSha" TEXT,

    CONSTRAINT "SuiteRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestSuite_projectId_idx" ON "TestSuite"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "TestSuiteItem_suiteId_testCaseVersionId_key" ON "TestSuiteItem"("suiteId", "testCaseVersionId");

-- CreateIndex
CREATE INDEX "TestSuiteItem_suiteId_idx" ON "TestSuiteItem"("suiteId");

-- CreateIndex
CREATE INDEX "SuiteRun_suiteId_idx" ON "SuiteRun"("suiteId");

-- AddForeignKey
ALTER TABLE "TestSuite" ADD CONSTRAINT "TestSuite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestSuiteItem" ADD CONSTRAINT "TestSuiteItem_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "TestSuite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TestSuiteItem" ADD CONSTRAINT "TestSuiteItem_testCaseVersionId_fkey" FOREIGN KEY ("testCaseVersionId") REFERENCES "TestCaseVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SuiteRun" ADD CONSTRAINT "SuiteRun_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "TestSuite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

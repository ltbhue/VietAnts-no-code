import type { PrismaClient } from "../generated/prisma/client";

/**
 * Executes a suite run (stub: marks cases passed with minimal step logs; extend with Playwright later).
 */
export async function executeSuiteRun(prisma: PrismaClient, runId: string): Promise<void> {
  const run = await prisma.suiteRun.findUnique({
    where: { id: runId },
    include: {
      suite: {
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { version: { include: { testCase: true } } },
          },
        },
      },
    },
  });

  if (!run) {
    throw new Error("Không tìm thấy lần chạy suite");
  }

  const results: Array<{
    testCaseId: string;
    testCaseVersionId: string;
    status: string;
    stepLog: Array<{ step: number; message: string }>;
    screenshotUrl?: string;
  }> = [];

  for (const item of run.suite.items) {
    const content = item.version.content as { steps?: unknown[] } | null;
    const steps = Array.isArray(content?.steps) ? content!.steps! : [];
    const stepLog = steps.map((_, i) => ({
      step: i + 1,
      message: "Thành công",
    }));

    results.push({
      testCaseId: item.version.testCaseId,
      testCaseVersionId: item.testCaseVersionId,
      status: "passed",
      stepLog,
    });
  }

  await prisma.suiteRun.update({
    where: { id: runId },
    data: {
      status: "completed",
      finishedAt: new Date(),
      results: results as object,
    },
  });
}

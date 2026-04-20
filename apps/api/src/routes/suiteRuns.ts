import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";
import { executeSuiteRun } from "../services/suite-runner";

const startRunSchema = z.object({
  environment: z.string().optional(),
  buildId: z.string().optional(),
  commitSha: z.string().optional(),
});

export default function suiteRunsRouter(prisma: PrismaClient) {
  const router = Router();

  router.post("/:suiteId/runs", authMiddleware, requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parsed = startRunSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const suite = await prisma.testSuite.findFirst({
      where: {
        id: req.params.suiteId as string,
        project: { ownerId: req.user!.id },
      },
    });
    if (!suite) {
      return res.status(404).json({ error: "Suite not found" });
    }

    const run = await prisma.suiteRun.create({
      data: {
        suiteId: suite.id,
        status: "running",
        environment: parsed.data.environment ?? null,
        trigger: "ui",
        buildId: parsed.data.buildId ?? null,
        commitSha: parsed.data.commitSha ?? null,
      },
    });

    try {
      await executeSuiteRun(prisma, run.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : "run failed";
      await prisma.suiteRun.update({
        where: { id: run.id },
        data: { status: "failed", finishedAt: new Date(), results: { error: message } as object },
      });
      return res.status(500).json({ error: message, runId: run.id });
    }

    const finished = await prisma.suiteRun.findUnique({ where: { id: run.id } });
    return res.status(202).json({
      runId: run.id,
      status: finished?.status ?? "completed",
      results: finished?.results ?? null,
    });
  });

  router.get("/:suiteId/runs/:runId", authMiddleware, async (req, res) => {
    const run = await prisma.suiteRun.findFirst({
      where: {
        id: req.params.runId as string,
        suiteId: req.params.suiteId as string,
        suite: { project: { ownerId: req.user!.id } },
      },
    });
    if (!run) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(run);
  });

  return router;
}

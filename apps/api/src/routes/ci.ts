import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { executeSuiteRun } from "../services/suite-runner";

const triggerSchema = z.object({
  suiteId: z.string().min(1),
  buildId: z.string().optional(),
  commitSha: z.string().optional(),
  environment: z.string().optional(),
});

export default function ciRouter(prisma: PrismaClient) {
  const router = Router();

  router.post("/trigger-suite", async (req, res) => {
    const expected = process.env.CI_API_TOKEN;
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
    if (!expected || token !== expected) {
      return res.status(403).json({ error: "forbidden_scope" });
    }

    const parsed = triggerSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const suite = await prisma.testSuite.findUnique({
      where: { id: parsed.data.suiteId },
    });
    if (!suite) {
      return res.status(404).json({ error: "Suite not found" });
    }

    const run = await prisma.suiteRun.create({
      data: {
        suiteId: suite.id,
        status: "running",
        environment: parsed.data.environment ?? null,
        trigger: "ci",
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

  return router;
}

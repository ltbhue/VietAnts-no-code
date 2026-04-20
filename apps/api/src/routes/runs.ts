import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";
import { executeScriptRun } from "../services/executor";
import { generateRunPdf } from "../services/reportPdf";

const startRunSchema = z.object({
  scriptId: z.string().cuid(),
  dataSetId: z.string().cuid().optional(),
  browser: z.enum(["chromium", "firefox", "webkit"]).optional(),
});

export default function runsRouter(prisma: PrismaClient) {
  const router = Router();
  router.use(authMiddleware);

  router.get("/", async (req, res) => {
    const runs = await prisma.testRun.findMany({
      where: { userId: req.user!.id },
      orderBy: { startedAt: "desc" },
      include: { script: true },
    });
    res.json(runs);
  });

  router.get("/analytics", async (req, res) => {
    const runs = await prisma.testRun.findMany({
      where: { userId: req.user!.id },
      include: { results: true },
    });

    const total = runs.length;
    const passed = runs.filter((r) => r.status === "passed").length;
    const failed = runs.filter((r) => r.status === "failed").length;

    const errorCount = new Map<string, number>();
    for (const run of runs) {
      for (const result of run.results) {
        if (result.status !== "failed") continue;
        const key = (result.message ?? "Unknown error").slice(0, 120);
        errorCount.set(key, (errorCount.get(key) ?? 0) + 1);
      }
    }

    const commonErrors = [...errorCount.entries()]
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      total,
      passed,
      failed,
      passRate: total === 0 ? 0 : Number(((passed / total) * 100).toFixed(2)),
      commonErrors,
    });
  });

  router.post("/", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parse = startRunSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });
    }
    const { scriptId, dataSetId, browser } = parse.data;

    const result = await executeScriptRun({
      prisma,
      scriptId,
      userId: req.user!.id,
      dataSetId: dataSetId ?? null,
      browserName: browser ?? "chromium",
    });

    res.status(201).json(result);
  });

  router.get("/:id/results", async (req, res) => {
    const run = await prisma.testRun.findFirst({
      where: { id: req.params.id as any, userId: req.user!.id },
      include: { results: true, script: true },
    });
    if (!run) return res.status(404).json({ error: "Not found" });
    res.json(run);
  });

  router.get("/:id/report.pdf", requireRole(["ADMIN", "TESTER", "VIEWER"]), async (req, res) => {
    const out = await generateRunPdf({
      prisma,
      runId: req.params.id as any,
      userId: req.user!.id,
    });
    if (!out) return res.status(404).json({ error: "Not found" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="testrun-${out.run.id}.pdf"`);
    res.status(200).send(out.pdf);
  });

  return router;
}


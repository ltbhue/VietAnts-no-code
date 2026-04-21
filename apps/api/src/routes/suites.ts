import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";

const createSuiteSchema = z.object({
  name: z.string().min(1),
  items: z
    .array(
      z.object({
        testCaseVersionId: z.string().min(1),
        sortOrder: z.number().int().optional(),
      }),
    )
    .min(1),
});

export default function suitesRouter(prisma: PrismaClient) {
  const router = Router();
  router.use(authMiddleware);

  router.get("/:projectId/suites", async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId as string, ownerId: req.user!.id },
    });
    if (!project) {
      return res.status(404).json({ error: "Không tìm thấy project" });
    }
    const suites = await prisma.testSuite.findMany({
      where: { projectId: project.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { items: true } } },
    });
    res.json(suites);
  });

  router.post("/:projectId/suites", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parsed = createSuiteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() });
    }

    const projectId = req.params.projectId as string;
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.user!.id },
    });
    if (!project) {
      return res.status(404).json({ error: "Không tìm thấy project" });
    }

    for (const item of parsed.data.items) {
      const ver = await prisma.testCaseVersion.findFirst({
        where: {
          id: item.testCaseVersionId,
          testCase: { projectId },
        },
      });
      if (!ver) {
        return res.status(400).json({ error: `testCaseVersionId không hợp lệ: ${item.testCaseVersionId}` });
      }
    }

    const suite = await prisma.testSuite.create({
      data: {
        name: parsed.data.name,
        projectId,
        items: {
          create: parsed.data.items.map((it, index) => ({
            testCaseVersionId: it.testCaseVersionId,
            sortOrder: it.sortOrder ?? index,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(suite);
  });

  return router;
}

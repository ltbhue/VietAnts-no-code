import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";
import { projectAccessibleWhere } from "../lib/projectAccess";

const suiteItemsSchema = z
  .array(
    z.object({
      testCaseVersionId: z.string().min(1),
      sortOrder: z.number().int().optional(),
    }),
  )
  .min(1);

const createSuiteSchema = z.object({
  name: z.string().min(1),
  items: suiteItemsSchema,
});

const updateSuiteSchema = z.object({
  name: z.string().min(1),
  items: suiteItemsSchema,
});

async function validateSuiteItems(
  prisma: PrismaClient,
  projectId: string,
  items: z.infer<typeof suiteItemsSchema>,
) {
  for (const item of items) {
    const ver = await prisma.testCaseVersion.findFirst({
      where: {
        id: item.testCaseVersionId,
        testCase: { projectId },
      },
    });
    if (!ver) {
      return `testCaseVersionId không hợp lệ: ${item.testCaseVersionId}`;
    }
    const lifecycle = (ver.content as { lifecycle?: string }).lifecycle;
    if (lifecycle !== "Published") {
      return `Chỉ test case Published mới đưa vào suite (version: ${item.testCaseVersionId})`;
    }
  }
  return null;
}

export default function suitesRouter(prisma: PrismaClient) {
  const router = Router();
  router.use(authMiddleware);

  router.get("/:projectId/suites", async (req, res) => {
    const project = await prisma.project.findFirst({
      where: projectAccessibleWhere(req.user!.id, req.params.projectId as string),
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

  router.get("/:projectId/suites/:suiteId", async (req, res) => {
    const projectId = req.params.projectId as string;
    const suiteId = req.params.suiteId as string;
    const project = await prisma.project.findFirst({
      where: projectAccessibleWhere(req.user!.id, projectId),
    });
    if (!project) {
      return res.status(404).json({ error: "Không tìm thấy project" });
    }
    const suite = await prisma.testSuite.findFirst({
      where: { id: suiteId, projectId: project.id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            version: {
              include: {
                testCase: { select: { id: true, title: true } },
              },
            },
          },
        },
        _count: { select: { items: true } },
      },
    });
    if (!suite) {
      return res.status(404).json({ error: "Không tìm thấy suite" });
    }
    res.json(suite);
  });

  router.post("/:projectId/suites", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parsed = createSuiteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() });
    }

    const projectId = req.params.projectId as string;
    const project = await prisma.project.findFirst({
      where: projectAccessibleWhere(req.user!.id, projectId),
    });
    if (!project) {
      return res.status(404).json({ error: "Không tìm thấy project" });
    }

    const itemError = await validateSuiteItems(prisma, projectId, parsed.data.items);
    if (itemError) {
      return res.status(400).json({ error: itemError });
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

  router.put("/:projectId/suites/:suiteId", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parsed = updateSuiteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() });
    }

    const projectId = req.params.projectId as string;
    const suiteId = req.params.suiteId as string;
    const project = await prisma.project.findFirst({
      where: projectAccessibleWhere(req.user!.id, projectId),
    });
    if (!project) {
      return res.status(404).json({ error: "Không tìm thấy project" });
    }

    const existing = await prisma.testSuite.findFirst({
      where: { id: suiteId, projectId: project.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Không tìm thấy suite" });
    }

    const itemError = await validateSuiteItems(prisma, projectId, parsed.data.items);
    if (itemError) {
      return res.status(400).json({ error: itemError });
    }

    const suite = await prisma.$transaction(async (tx) => {
      await tx.testSuiteItem.deleteMany({ where: { suiteId } });
      return tx.testSuite.update({
        where: { id: suiteId },
        data: {
          name: parsed.data.name,
          items: {
            create: parsed.data.items.map((it, index) => ({
              testCaseVersionId: it.testCaseVersionId,
              sortOrder: it.sortOrder ?? index,
            })),
          },
        },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: {
              version: {
                include: {
                  testCase: { select: { id: true, title: true } },
                },
              },
            },
          },
          _count: { select: { items: true } },
        },
      });
    });

    res.json(suite);
  });

  router.delete("/:projectId/suites/:suiteId", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const projectId = req.params.projectId as string;
    const suiteId = req.params.suiteId as string;
    const project = await prisma.project.findFirst({
      where: projectAccessibleWhere(req.user!.id, projectId),
    });
    if (!project) {
      return res.status(404).json({ error: "Không tìm thấy project" });
    }

    const existing = await prisma.testSuite.findFirst({
      where: { id: suiteId, projectId: project.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Không tìm thấy suite" });
    }

    await prisma.testSuite.delete({ where: { id: suiteId } });
    res.json({ ok: true, id: suiteId });
  });

  return router;
}

import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";

const dataSetSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  rows: z.array(z.record(z.string(), z.any())),
});

export default function datasetsRouter(prisma: PrismaClient) {
  const router = Router();
  router.use(authMiddleware);

  router.get("/", async (req, res) => {
    const projectId = req.query.projectId as string | undefined;
    const owned = await prisma.project.findMany({
      where: { ownerId: req.user!.id },
      select: { id: true },
    });
    const ownedIds = owned.map((p) => p.id);
    if (ownedIds.length === 0) {
      return res.json([]);
    }
    if (projectId && !ownedIds.includes(projectId)) {
      return res.status(403).json({ error: "No access to this project" });
    }

    const ds = await prisma.dataSet.findMany({
      where: projectId ? { projectId } : { projectId: { in: ownedIds } },
      orderBy: { id: "desc" },
    });
    res.json(ds);
  });

  router.post("/", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parse = dataSetSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });
    }
    const project = await prisma.project.findFirst({
      where: { id: parse.data.projectId, ownerId: req.user!.id },
    });
    if (!project) return res.status(403).json({ error: "No access to project" });

    const created = await prisma.dataSet.create({ data: parse.data as any });
    res.status(201).json(created);
  });

  router.put("/:id", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const existing = await prisma.dataSet.findFirst({
      where: { id: req.params.id as string },
      include: { project: true },
    });
    if (!existing || existing.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: "Not found" });
    }
    const parse = dataSetSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });
    }
    if (parse.data.projectId && parse.data.projectId !== existing.projectId) {
      const p = await prisma.project.findFirst({
        where: { id: parse.data.projectId, ownerId: req.user!.id },
      });
      if (!p) return res.status(403).json({ error: "No access to project" });
    }
    const updated = await prisma.dataSet.update({
      where: { id: existing.id },
      data: parse.data as any,
    });
    res.json(updated);
  });

  router.delete("/:id", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const existing = await prisma.dataSet.findFirst({
      where: { id: req.params.id as string },
      include: { project: true },
    });
    if (!existing || existing.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: "Not found" });
    }
    await prisma.dataSet.delete({ where: { id: existing.id } });
    res.status(204).end();
  });

  return router;
}

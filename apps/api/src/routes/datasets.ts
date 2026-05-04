import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";
import { projectAccessibleWhere } from "../lib/projectAccess";

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
    const accessible = await prisma.project.findMany({
      where: projectAccessibleWhere(req.user!.id),
      select: { id: true },
    });
    const accessibleIds = accessible.map((p) => p.id);
    if (accessibleIds.length === 0) {
      return res.json([]);
    }
    if (projectId && !accessibleIds.includes(projectId)) {
      return res.status(403).json({ error: "Không có quyền truy cập project này" });
    }

    const ds = await prisma.dataSet.findMany({
      where: projectId ? { projectId } : { projectId: { in: accessibleIds } },
      orderBy: { id: "desc" },
    });
    res.json(ds);
  });

  router.post("/", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parse = dataSetSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const project = await prisma.project.findFirst({
      where: projectAccessibleWhere(req.user!.id, parse.data.projectId),
    });
    if (!project) return res.status(403).json({ error: "Không có quyền truy cập project" });

    const created = await prisma.dataSet.create({ data: parse.data as any });
    res.status(201).json(created);
  });

  router.put("/:id", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const existing = await prisma.dataSet.findFirst({
      where: { id: req.params.id as string },
      include: { project: true },
    });
    const canAccessExisting = !!(existing && (existing.project.ownerId === req.user!.id || (await prisma.projectMember.findFirst({
      where: { projectId: existing.projectId, userId: req.user!.id },
      select: { id: true },
    }))));
    if (!canAccessExisting) {
      return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    }
    const parse = dataSetSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    if (parse.data.projectId && parse.data.projectId !== existing.projectId) {
      const p = await prisma.project.findFirst({
        where: projectAccessibleWhere(req.user!.id, parse.data.projectId),
      });
      if (!p) return res.status(403).json({ error: "Không có quyền truy cập project" });
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
    const canAccessExisting = !!(existing && (existing.project.ownerId === req.user!.id || (await prisma.projectMember.findFirst({
      where: { projectId: existing.projectId, userId: req.user!.id },
      select: { id: true },
    }))));
    if (!canAccessExisting) {
      return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    }
    await prisma.dataSet.delete({ where: { id: existing.id } });
    res.status(204).end();
  });

  return router;
}

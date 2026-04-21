import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";

const objectSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  locator: z.string().min(1),
});

export default function objectsRouter(prisma: PrismaClient) {
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
      return res.status(403).json({ error: "Không có quyền truy cập project này" });
    }

    const objects = await prisma.uiObject.findMany({
      where: projectId ? { projectId } : { projectId: { in: ownedIds } },
      orderBy: { createdAt: "desc" },
    });
    res.json(objects);
  });

  router.post("/", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parse = objectSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const project = await prisma.project.findFirst({
      where: { id: parse.data.projectId, ownerId: req.user!.id },
    });
    if (!project) return res.status(403).json({ error: "Không có quyền truy cập project" });

    const obj = await prisma.uiObject.create({ data: parse.data });
    res.status(201).json(obj);
  });

  router.put("/:id", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const existing = await prisma.uiObject.findFirst({
      where: { id: req.params.id as string },
      include: { project: true },
    });
    if (!existing || existing.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    }
    const parse = objectSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    if (parse.data.projectId && parse.data.projectId !== existing.projectId) {
      const p = await prisma.project.findFirst({
        where: { id: parse.data.projectId, ownerId: req.user!.id },
      });
      if (!p) return res.status(403).json({ error: "Không có quyền truy cập project" });
    }
    const updated = await prisma.uiObject.update({
      where: { id: existing.id },
      data: parse.data,
    });
    res.json(updated);
  });

  router.delete("/:id", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const existing = await prisma.uiObject.findFirst({
      where: { id: req.params.id as string },
      include: { project: true },
    });
    if (!existing || existing.project.ownerId !== req.user!.id) {
      return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    }
    await prisma.uiObject.delete({ where: { id: existing.id } });
    res.status(204).end();
  });

  return router;
}

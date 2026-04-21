import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export default function projectsRouter(prisma: PrismaClient) {
  const router = Router();

  router.use(authMiddleware);

  router.get("/", async (req, res) => {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(projects);
  });

  router.post("/", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parse = projectSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const project = await prisma.project.create({
      data: {
        ...parse.data,
        ownerId: req.user!.id,
      },
    });
    res.status(201).json(project);
  });

  router.get("/:id", async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id as any, ownerId: req.user!.id },
    });
    if (!project) return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    res.json(project);
  });

  router.put("/:id", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parse = projectSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const updated = await prisma.project.updateMany({
      where: { id: req.params.id as any, ownerId: req.user!.id },
      data: parse.data,
    });
    if (updated.count === 0) return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    const project = await prisma.project.findUnique({ where: { id: req.params.id as any } });
    res.json(project);
  });

  router.delete("/:id", requireRole(["ADMIN"]), async (req, res) => {
    await prisma.project.deleteMany({
      where: { id: req.params.id as any, ownerId: req.user!.id },
    });
    res.status(204).end();
  });

  return router;
}


import { Router } from "express";
import type { PrismaClient } from "../generated/prisma/client";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth";
import { projectAccessibleWhere } from "../lib/projectAccess";

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  memberIds: z.array(z.string().cuid()).optional(),
});

export default function projectsRouter(prisma: PrismaClient) {
  const router = Router();

  router.use(authMiddleware);

  router.get("/", async (req, res) => {
    const projects = await prisma.project.findMany({
      where: projectAccessibleWhere(req.user!.id),
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
      },
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
        name: parse.data.name,
        description: parse.data.description,
        ownerId: req.user!.id,
        members: parse.data.memberIds?.length
          ? {
              createMany: {
                data: parse.data.memberIds
                  .filter((id) => id !== req.user!.id)
                  .map((userId) => ({ userId })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
      },
    });
    res.status(201).json(project);
  });

  router.get("/:id", async (req, res) => {
    const project = await prisma.project.findFirst({
      where: projectAccessibleWhere(req.user!.id, req.params.id as any),
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
      },
    });
    if (!project) return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    res.json(project);
  });

  router.put("/:id", requireRole(["ADMIN", "TESTER"]), async (req, res) => {
    const parse = projectSchema.partial().safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: parse.error.flatten() });
    }
    const existing = await prisma.project.findFirst({
      where: projectAccessibleWhere(req.user!.id, req.params.id as any),
    });
    if (!existing) return res.status(404).json({ error: "Không tìm thấy dữ liệu" });
    const memberIds = parse.data.memberIds;
    const project = await prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id: req.params.id as any },
        data: {
          name: parse.data.name,
          description: parse.data.description,
        },
      });
      if (memberIds) {
        await tx.projectMember.deleteMany({ where: { projectId: updated.id } });
        if (memberIds.length > 0) {
          await tx.projectMember.createMany({
            data: memberIds.filter((id) => id !== updated.ownerId).map((userId) => ({ projectId: updated.id, userId })),
            skipDuplicates: true,
          });
        }
      }
      return tx.project.findUnique({
        where: { id: updated.id },
        include: {
          members: {
            include: {
              user: { select: { id: true, fullName: true, email: true, role: true } },
            },
          },
        },
      });
    });
    res.json(project);
  });

  router.delete("/:id", requireRole(["ADMIN"]), async (req, res) => {
    await prisma.project.deleteMany({
      where: projectAccessibleWhere(req.user!.id, req.params.id as any),
    });
    res.status(204).end();
  });

  return router;
}

